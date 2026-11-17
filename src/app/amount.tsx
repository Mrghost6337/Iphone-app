import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useIsland } from '@/components/Island';
import { Card, Chip, GradientButton, Stepper, T } from '@/components/ui';
import { MEALS, Meal, fmt, sameDay, scaled, suggestedMeal, sumEntries, targets } from '@/lib/nutrition';
import { scanSession } from '@/lib/session';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

/** Amount + meal for one searched product. */
export default function Amount() {
  const c = useColors();
  const { state, logEntries } = useStore();
  const island = useIsland();
  const f = scanSession.amountFood;
  const [grams, setGrams] = useState(f?.portionGrams ?? 100);
  const [meal, setMeal] = useState<Meal>(scanSession.amountMeal ?? suggestedMeal());
  if (!f) return null;
  const n = scaled(f.per100, grams);
  const add = () => {
    logEntries([{ name: f.name, brand: f.brand, ref: f.id, meal, grams, per100: f.per100, date: new Date().toISOString(), source: f.id.startsWith('off:') ? 'barcode' : 'search' }]);
    const t = targets(state.profile), eaten = sumEntries(state.entries.filter(e => sameDay(e.date, new Date()))).kcal + n.kcal;
    island.show({ icon: 'checkmark', title: `${f.name} toegevoegd`, detail: `nog ${fmt(Math.max(0, t.calories - eaten))} kcal over`, trailing: `+${fmt(n.kcal)}` }, 4000);
    router.dismissAll();
  };
  return (
    <ScrollView contentContainerStyle={{ padding: space.l, gap: space.l, paddingTop: space.xl }}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <T variant="h2" style={{ textAlign: 'center' }}>{f.name}</T>
        <Text style={{ fontSize: 52, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(n.kcal)}</Text>
        <T variant="bodyB" color={c.label2}>kcal · {fmt(grams)} g</T>
        <T variant="sub" color={c.label2}>Eiwit {fmt(n.protein)} g · Koolh. {fmt(n.carbs)} g · Vet {fmt(n.fat)} g</T>
      </View>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T variant="h3">Hoeveelheid</T>
          <Stepper onMinus={() => setGrams(g => Math.max(5, g - 10))} onPlus={() => setGrams(g => Math.min(2000, g + 10))} />
        </View>
        <Slider minimumValue={5} maximumValue={Math.max(f.portionGrams * 3, 300)} step={5} value={grams} onValueChange={setGrams} minimumTrackTintColor={c.accent} accessibilityLabel="Gram" />
        {f.portionLabel ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[0.5, 1, 1.5, 2].map(k => { const g = Math.round(f.portionGrams * k); return <Chip key={k} title={k === 1 ? f.portionLabel! : `${String(k).replace('.', ',')} × ${f.portionLabel}`} on={Math.abs(grams - g) < 1} onPress={() => setGrams(g)} />; })}
          </ScrollView>
        ) : null}
      </Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {MEALS.map(m => <Chip key={m.id} title={m.title} on={meal === m.id} onPress={() => setMeal(m.id)} />)}
      </ScrollView>
      <GradientButton title="Voeg toe" right={`${fmt(n.kcal)} kcal`} onPress={add} />
      <T variant="sub" color={c.label2}>Bron: {f.id.startsWith('off:') ? 'Open Food Facts' : 'referentiewaarden (USDA/NEVO)'} · {fmt(f.per100.kcal)} kcal per 100 g</T>
    </ScrollView>
  );
}
