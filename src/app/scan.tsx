import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsland } from '@/components/Island';
import { Glass, Icon, Press, haptic } from '@/components/ui';
import { AIError, recognizeMeal } from '@/lib/ai';
import { fmt, parseDescription, scaled, suggestedMeal } from '@/lib/nutrition';
import { productByBarcode } from '@/lib/openfoodfacts';
import { scanSession } from '@/lib/session';

type Mode = 'photo' | 'barcode' | 'describe';

async function jpeg(uri: string, width: number, compress: number) {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width });
  const img = await ctx.renderAsync();
  return img.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
}
const EXAMPLES = ['2 boterhammen met kaas en een appel', '150 gram kwark met 40g granola', 'kipfilet met rijst en broccoli', 'cappuccino en een croissant'];

/** The scanner (full-screen): photo (AI), live barcode scanning (Open Food Facts), a typed description, or a photo from the library. */
export default function Scan() {
  const params = useLocalSearchParams<{ mode?: Mode; t?: string }>();
  const [mode, setMode] = useState<Mode>('photo');
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [active, setActive] = useState(true);
  const [torch, setTorch] = useState(false);
  const cam = useRef<CameraView>(null);
  const scanned = useRef(false);
  const insets = useSafeAreaInsets();
  const island = useIsland();

  useFocusEffect(useCallback(() => {
    setActive(true); scanned.current = false;
    if (params.mode) setMode(params.mode);
    return () => { setActive(false); setTorch(false); };
  // params.t changes on every navigation from the add sheet so the mode is re-applied
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.mode, params.t]));

  const finish = (source: Mode, message: string | null) => {
    scanSession.source = source;
    scanSession.message = message;
    scanSession.meal = scanSession.meal ?? suggestedMeal();
    const kcal = scanSession.foods.reduce((a, f) => a + scaled(f.item.per100, f.grams).kcal, 0);
    if (scanSession.foods.length) island.show({ icon: 'checkmark', title: `${scanSession.foods.length} herkend`, trailing: `${fmt(kcal)} kcal` }, 3000);
    else island.hide();
    haptic.success();
    setBusy(null);
    router.push('/review');
  };

  const analyzePhoto = async (uri: string) => {
    setBusy('Je maaltijd herkennen…');
    island.show({ icon: 'camera.viewfinder', title: 'Maaltijd herkennen…', detail: 'AI bekijkt je foto', spinner: true });
    try {
      const small = await jpeg(uri, 1024, 0.75);
      const thumb = await jpeg(uri, 480, 0.6);
      scanSession.photo = `data:image/jpeg;base64,${thumb.base64}`;
      scanSession.ai = true;
      const r = await recognizeMeal(small.base64!);
      scanSession.foods = r.foods;
      finish('photo', r.notFood ? 'Op deze foto zien we geen eten.' : null);
    } catch (e) {
      scanSession.foods = [];
      finish('photo', e instanceof AIError ? e.message : 'Herkennen lukte niet. Zoek het product op.');
    }
  };

  const takePhoto = async () => {
    if (!cam.current || busy) return;
    haptic.light();
    const pic = await cam.current.takePictureAsync({ quality: 0.8 });
    if (pic?.uri) analyzePhoto(pic.uri);
  };
  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled && r.assets[0]) analyzePhoto(r.assets[0].uri);
  };
  const onBarcode = async ({ data }: { data: string }) => {
    if (scanned.current || busy) return;
    scanned.current = true;
    haptic.success();
    setBusy('Product opzoeken…');
    island.show({ icon: 'barcode.viewfinder', title: 'Product opzoeken…', detail: data });
    scanSession.photo = null; scanSession.ai = false;
    try {
      const item = await productByBarcode(data);
      scanSession.foods = [{ uid: String(Date.now()), item, grams: item.portionGrams, conf: 1, alts: [] }];
      finish('barcode', null);
    } catch (e) {
      scanSession.foods = [];
      finish('barcode', e instanceof Error ? e.message : 'Product niet gevonden.');
    }
  };
  const describe = () => {
    if (text.trim().length < 2) return;
    scanSession.photo = null; scanSession.ai = false;
    scanSession.foods = parseDescription(text);
    finish('describe', scanSession.foods.length ? null : 'Hier konden we geen producten in vinden.');
  };

  const needsCamera = mode !== 'describe';
  const granted = !!permission?.granted;
  const demo = Platform.OS === 'web';           // the web preview has no camera: show a still in its place
  const close = () => { if (router.canGoBack()) router.back(); else router.navigate('/'); };
  const switchMode = (m: Mode) => { haptic.tap(); scanned.current = false; setTorch(false); setMode(m); };
  const hint = mode === 'photo' ? 'Hele bord in beeld, van bovenaf' : mode === 'barcode' ? 'Houd de barcode binnen het kader' : '';
  const MODES = [
    { id: 'photo', title: 'Eten', icon: 'camera.viewfinder' },
    { id: 'barcode', title: 'Barcode', icon: 'barcode.viewfinder' },
    { id: 'describe', title: 'Beschrijf', icon: 'text.bubble' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {needsCamera && granted && active ? (
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch}
          barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
          onBarcodeScanned={mode === 'barcode' ? onBarcode : undefined} />
      ) : null}
      {needsCamera && demo && !granted ? (
        <Image source={require('../../assets/recipes/poke.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Voorbeeldbeeld: een pokébowl" />
      ) : null}

      {needsCamera && !demo && permission && !granted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Icon name="camera.fill" size={30} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' }}>Camera nodig om te scannen</Text>
          <Text style={{ color: 'rgba(255,255,255,0.64)', fontSize: 16, lineHeight: 22, textAlign: 'center' }}>Bord gebruikt de camera alleen terwijl je scant. Foto’s blijven op je iPhone tot jij ze laat herkennen.</Text>
          <Pressable accessibilityRole="button" onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
            style={({ pressed }) => ({ marginTop: 10, height: 56, alignSelf: 'stretch', borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600' }}>{permission.canAskAgain ? 'Geef toegang' : 'Open Instellingen'}</Text>
          </Pressable>
        </View>
      ) : null}

      {needsCamera && (granted || demo) ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
          <Viewfinder wide={mode === 'barcode'} />
          {hint ? (
            <View style={{ marginTop: 22, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{hint}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {mode === 'describe' ? (
        <View style={{ flex: 1, paddingTop: insets.top + 80, paddingHorizontal: 24, gap: 16 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700', letterSpacing: -1 }}>Wat heb je gegeten?</Text>
          <Text style={{ color: 'rgba(255,255,255,0.64)', fontSize: 16, lineHeight: 22 }}>Typ het zoals je het zou zeggen. Bord splitst het op in producten en hoeveelheden.</Text>
          <TextInput value={text} onChangeText={setText} multiline autoFocus placeholder="Bijv. 2 boterhammen met kaas en een appel…" placeholderTextColor="rgba(255,255,255,0.36)"
            accessibilityLabel="Wat heb je gegeten" style={{ minHeight: 120, borderRadius: 20, padding: 16, fontSize: 17, color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLES.map(e => (
              <Pressable accessibilityRole="button" key={e} onPress={() => { haptic.tap(); setText(e); }}
                style={({ pressed }) => ({ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' })}>
                <Text style={{ color: '#fff', fontSize: 14 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" disabled={text.trim().length < 2} onPress={describe}
            style={({ pressed }) => ({ height: 56, borderRadius: 28, backgroundColor: '#fff', opacity: text.trim().length < 2 ? 0.35 : pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 })}>
            <Icon name="sparkles" size={18} color="#000" />
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600' }}>Analyseer</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Top bar: close, title, tips */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <GlassButton icon="xmark" label="Sluit scanner" onPress={close} />
        <Text accessibilityRole="header" style={{ color: '#fff', fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>Scanner</Text>
        <GlassButton icon="questionmark" label="Tips voor een goede scan" onPress={() => island.show({ icon: 'lightbulb', title: 'Tip', detail: mode === 'barcode' ? 'Goed licht en de streepjes recht in beeld' : 'Fotografeer van bovenaf, met het hele bord in beeld' }, 3500)} />
      </View>

      {/* Bottom: mode tiles, then flash · shutter · library */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 16, gap: 22, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="tablist">
          {MODES.map(m => {
            const on = mode === m.id;
            return (
              <Press key={m.id} onPress={() => switchMode(m.id)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={m.title} style={{ flex: 1 }}>
                {on ? (
                  <View style={tile(true)}><Icon name={m.icon} size={22} color="#000" /><Text style={tileText(true)}>{m.title}</Text></View>
                ) : (
                  <Glass dark style={tile(false)}><Icon name={m.icon} size={22} color="#fff" /><Text style={tileText(false)}>{m.title}</Text></Glass>
                )}
              </Press>
            );
          })}
          <Press onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Kies een foto uit je bibliotheek" style={{ flex: 1 }}>
            <Glass dark style={tile(false)}><Icon name="photo.on.rectangle" size={22} color="#fff" /><Text style={tileText(false)}>Galerij</Text></Glass>
          </Press>
        </View>

        {needsCamera ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
            <GlassButton icon={torch ? 'bolt.fill' : 'bolt.slash.fill'} label={torch ? 'Zaklamp uit' : 'Zaklamp aan'} size={52}
              onPress={() => setTorch(v => !v)} active={torch} />
            {mode === 'photo' ? (
              <Press onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Maak foto" scaleTo={0.92}
                style={{ width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: '#fff' }} />
              </Press>
            ) : (
              <View style={{ height: 82, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>Zoekt barcode…</Text>
                </View>
              </View>
            )}
            <View style={{ width: 52 }} />
          </View>
        ) : null}
      </View>

      {busy ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', gap: 16 }} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{busy}</Text>
        </View>
      ) : null}
    </View>
  );
}

const tile = (on: boolean): ViewStyle => ({ height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: on ? '#fff' : undefined, borderCurve: 'continuous' });
const tileText = (on: boolean): TextStyle => ({ color: on ? '#000' : '#fff', fontSize: 12.5, fontWeight: '600' });

/** Four rounded white corner brackets; a square for a plate, a wide frame for a barcode. */
function Viewfinder({ wide }: { wide: boolean }) {
  const w = wide ? 300 : 270, h = wide ? 170 : 270, len = 44, t = 4, r = 26;
  const corner = (pos: ViewStyle): ViewStyle => ({ position: 'absolute', width: len, height: len, borderColor: '#fff', ...pos });
  return (
    <View style={{ width: w, height: h }}>
      <View style={corner({ top: 0, left: 0, borderTopWidth: t, borderLeftWidth: t, borderTopLeftRadius: r })} />
      <View style={corner({ top: 0, right: 0, borderTopWidth: t, borderRightWidth: t, borderTopRightRadius: r })} />
      <View style={corner({ bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t, borderBottomLeftRadius: r })} />
      <View style={corner({ bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t, borderBottomRightRadius: r })} />
    </View>
  );
}

function GlassButton({ icon, label, onPress, size = 44, active }: { icon: string; label: string; onPress: () => void; size?: number; active?: boolean }) {
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptic.tap(); onPress(); }} scaleTo={0.92} hitSlop={6}>
      {active
        ? <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={size * 0.4} color="#000" /></View>
        : <Glass dark interactive style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={size * 0.4} color="#fff" /></Glass>}
    </Press>
  );
}
