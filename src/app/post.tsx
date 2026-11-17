import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { Card, Chip, GradientButton, Icon, PillButton, Row, Stepper, T, haptic } from '@/components/ui';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

const TAGS = ['vegetarisch', 'vegan', 'snel', 'hoog-eiwit', 'ontbijt', 'lunch'];

/** Share your own recipe with a real photo (camera or library). */
export default function PostEditor() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { update } = useStore();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(20);
  const [servings, setServings] = useState(2);
  const [kcal, setKcal] = useState(450);
  const [ing, setIng] = useState('');
  const [steps, setSteps] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
  const ok = title.trim().length >= 3 && !!photo && lines(ing).length > 0 && lines(steps).length > 0;

  const choose = async (camera: boolean) => {
    if (camera) { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return; }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]?.base64) setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
  };
  const publish = () => {
    haptic.success();
    update(s => { s.posts.unshift({ id: String(Date.now()), title: title.trim(), subtitle: subtitle.trim(), photo: photo!, minutes, servings, kcal, ingredients: lines(ing), steps: lines(steps), tags, author: s.profile.name || 'Jij', createdAt: Date.now() }); });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.l }}>
        <PillButton title="Annuleer" tone="plain" onPress={() => router.back()} />
        <T variant="h3">Deel recept</T>
        <PillButton title="Plaats" onPress={publish} style={{ opacity: ok ? 1 : 0.4 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: insets.bottom + 40 }} keyboardDismissMode="interactive">
        <Pressable onPress={() => choose(false)} accessibilityRole="button" accessibilityLabel="Kies foto">
          {photo ? <Image source={{ uri: photo }} style={{ aspectRatio: 4 / 3, borderRadius: radius.l }} contentFit="cover" />
            : <Card style={{ aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: c.label3 }}>
                <Icon name="photo.on.rectangle" size={36} color={c.label2} /><T variant="bodyB" color={c.label2}>Kies een echte foto</T>
              </Card>}
        </Pressable>
        <PillButton title="Of maak nu een foto" icon="camera.fill" tone="plain" onPress={() => choose(true)} />
        <Field value={title} onChange={setTitle} placeholder="Naam van je recept" />
        <Field value={subtitle} onChange={setSubtitle} placeholder="Korte beschrijving" />
        <Card pad={false}>
          {([['Bereidingstijd', `${minutes} min`, () => setMinutes(m => Math.max(5, m - 5)), () => setMinutes(m => Math.min(240, m + 5))],
            ['Personen', String(servings), () => setServings(v => Math.max(1, v - 1)), () => setServings(v => Math.min(12, v + 1))],
            ['Kcal per portie', String(kcal), () => setKcal(v => Math.max(25, v - 25)), () => setKcal(v => Math.min(2500, v + 25))]] as const).map(([l, v, minus, plus]) => (
            <Row key={l}><T variant="body" style={{ flex: 1 }}>{l}</T><T variant="bodyB">{v}</T><Stepper onMinus={minus} onPlus={plus} /></Row>
          ))}
        </Card>
        <T variant="h3">Ingrediënten <T variant="sub" color={c.label2}>(één per regel)</T></T>
        <Field value={ing} onChange={setIng} placeholder={'200 g spaghetti\n2 eieren'} multiline />
        <T variant="h3">Stappen <T variant="sub" color={c.label2}>(één per regel)</T></T>
        <Field value={steps} onChange={setSteps} placeholder={'Kook de pasta\nBak het spek'} multiline />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TAGS.map(t => <Chip key={t} title={t} on={tags.includes(t)} onPress={() => setTags(x => (x.includes(t) ? x.filter(y => y !== t) : [...x, t]))} />)}
        </View>
        <GradientButton title="Plaats recept" onPress={publish} disabled={!ok} />
        <T variant="sub" color={c.label2}>Je recept staat in “Mijn recepten” op dit toestel. Delen met vrienden vraagt een server (zie README). Deel alleen foto’s die je zelf hebt gemaakt.</T>
      </ScrollView>
    </View>
  );
}
