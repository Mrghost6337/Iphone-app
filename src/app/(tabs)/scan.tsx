import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsland } from '@/components/Island';
import { Button, Icon, haptic } from '@/components/ui';
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

/** The camera tab: photo (AI), live barcode scanning (Open Food Facts) or a typed description. */
export default function Scan() {
  const params = useLocalSearchParams<{ mode?: Mode; t?: string }>();
  const [mode, setMode] = useState<Mode>('photo');
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [active, setActive] = useState(true);
  const cam = useRef<CameraView>(null);
  const scanned = useRef(false);
  const insets = useSafeAreaInsets();
  const island = useIsland();

  useFocusEffect(useCallback(() => {
    setActive(true); scanned.current = false;
    if (params.mode) setMode(params.mode);
    return () => setActive(false);
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
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {needsCamera && permission?.granted && active ? (
        <CameraView ref={cam} style={{ position: 'absolute', inset: 0 }} facing="back"
          barcodeScannerSettings={mode === 'barcode' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
          onBarcodeScanned={mode === 'barcode' ? onBarcode : undefined} />
      ) : null}

      {needsCamera && permission && !permission.granted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <Icon name="camera.fill" size={48} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Camera nodig om te scannen</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center' }}>Bord gebruikt de camera alleen als jij scant.</Text>
          <Button title={permission.canAskAgain ? 'Geef toegang' : 'Open Instellingen'} onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())} style={{ alignSelf: 'stretch' }} />
        </View>
      ) : null}

      {mode === 'photo' && permission?.granted ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 32, right: 32, top: '22%', aspectRatio: 1 }}>
          {[{ top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 26 }, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 26 },
            { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 26 }, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 26 }]
            .map((s, i) => <View key={i} style={[{ position: 'absolute', width: 46, height: 46, borderColor: '#fff' }, s]} />)}
        </View>
      ) : null}
      {mode === 'barcode' && permission?.granted ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 40, right: 40, top: '34%', height: 150, borderRadius: 20, borderWidth: 3, borderColor: '#fff' }} />
      ) : null}

      {mode === 'describe' ? (
        <View style={{ flex: 1, paddingTop: insets.top + 70, paddingHorizontal: 24, gap: 16, backgroundColor: '#0b0908' }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '700' }}>Wat heb je gegeten?</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15.5 }}>Typ het gewoon. Bord splitst het op in producten en hoeveelheden.</Text>
          <TextInput value={text} onChangeText={setText} multiline placeholder="Bijv. 2 boterhammen met kaas en een appel" placeholderTextColor="rgba(255,255,255,0.4)"
            style={{ minHeight: 120, borderRadius: 18, padding: 16, fontSize: 17, color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLES.map(e => <Pressable accessibilityRole="button" key={e} onPress={() => setText(e)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' }}><Text style={{ color: '#fff', fontSize: 13.5 }}>{e}</Text></Pressable>)}
          </View>
          <Button title="Analyseer" icon="sparkles" onPress={describe} disabled={text.trim().length < 2} />
        </View>
      ) : null}

      <View style={{ position: 'absolute', top: insets.top + 10, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{mode === 'photo' ? 'Hele bord in beeld' : mode === 'barcode' ? 'Richt op de barcode' : 'Beschrijf'}</Text>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 92, alignItems: 'center', gap: 18 }}>
        {mode === 'photo' && permission?.granted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 40 }}>
            <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Kies uit foto's" style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="photo.on.rectangle" size={22} color="#fff" />
            </Pressable>
            <Pressable onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Maak foto" style={({ pressed }) => ({ width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.92 : 1 }] })}>
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff' }} />
            </Pressable>
            <View style={{ width: 50 }} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
          {([['photo', 'Foto', 'camera'], ['barcode', 'Barcode', 'barcode.viewfinder'], ['describe', 'Beschrijf', 'text.bubble']] as const).map(([m, t, i]) => (
            <Pressable key={m} onPress={() => { haptic.tap(); scanned.current = false; setMode(m); }} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}
              style={{ height: 42, paddingHorizontal: 15, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: mode === m ? 'rgba(255,255,255,0.28)' : 'transparent' }}>
              <Icon name={i} size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {busy ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{busy}</Text>
        </View>
      ) : null}
    </View>
  );
}
