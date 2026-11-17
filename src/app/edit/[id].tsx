import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Card, Chip, Divider, PillButton, Row, Stepper, T } from '@/components/ui';
import { MEALS, fmt, scaled } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

/** Edit a logged entry: portion, meal, nutrition breakdown; repeat or delete. */
export default function EditEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update } = useStore();
  const c = useColors();
  const e = state.entries.find(x => x.id === id);
  if (!e) return null;
  const n = scaled(e.per100, e.grams);
  const set = (patch: Partial<typeof e>) => update(s => { const x = s.entries.find(y => y.id === id); if (x) Object.assign(x, patch); });
  const del = () => Alert.alert(`${e.name} verwijderen?`, undefined, [
    { text: 'Annuleer', style: 'cancel' },
    { text: 'Verwijder', style: 'destructive', onPress: () => { router.back(); setTimeout(() => update(s => { s.entries = s.entries.filter(x => x.id !== id); }), 300); } },
  ]);
  const again = () => { update(s => { s.entries.push({ ...e, id: String(Date.now()), date: new Date().toISOString() }); }); router.back(); };
  const row = (label: string, v: number, unit: string, color?: string) => (
    <Row><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>{color ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} /> : null}<T variant="body">{label}</T></View><T variant="bodyB">{fmt(v)} {unit}</T></Row>
  );
  return (
    <ScrollView contentContainerStyle={{ padding: space.l, gap: space.l, paddingTop: space.xl }}>
      {e.photo ? <Image source={{ uri: e.photo }} style={{ height: 180, borderRadius: radius.l }} contentFit="cover" accessibilityLabel="Je foto" /> : null}
      <View style={{ alignItems: 'center' }}>
        <T variant="h2" style={{ textAlign: 'center' }}>{e.name}</T>
        <Text style={{ fontSize: 48, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(n.kcal)}</Text>
        <T variant="bodyB" color={c.label2}>kcal</T>
      </View>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T variant="h3">Hoeveelheid {fmt(e.grams)} g</T>
          <Stepper onMinus={() => set({ grams: Math.max(5, e.grams - 10) })} onPlus={() => set({ grams: Math.min(3000, e.grams + 10) })} />
        </View>
        <Slider minimumValue={5} maximumValue={Math.max(e.grams * 3, 400)} step={5} value={e.grams} onSlidingComplete={v => set({ grams: v })} minimumTrackTintColor={c.accent} accessibilityLabel="Gram" />
      </Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {MEALS.map(m => <Chip key={m.id} title={m.title} on={e.meal === m.id} onPress={() => set({ meal: m.id })} />)}
      </ScrollView>
      <Card pad={false}>
        {row('Eiwit', n.protein, 'g', c.protein)}<Divider />{row('Koolhydraten', n.carbs, 'g', c.carbs)}<Divider />{row('waarvan suikers', n.sugar, 'g')}<Divider />{row('Vet', n.fat, 'g', c.fat)}<Divider />{row('Vezels', n.fiber, 'g')}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PillButton title="Nog een keer eten" icon="arrow.clockwise" onPress={again} style={{ flex: 1 }} />
        <PillButton title="Verwijder" icon="trash" tone="danger" onPress={del} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
