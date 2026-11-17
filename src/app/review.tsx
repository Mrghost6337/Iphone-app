import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsland } from '@/components/Island';
import { Card, Chip, GradientButton, Icon, IconButton, PillButton, Row, Stepper, T, hexA } from '@/components/ui';
import { MEALS, Recognized, fmt, mealTitle, scaled, sumEntries, targets, sameDay, ZERO, add } from '@/lib/nutrition';
import { clearScan, scanSession, setPickFor, setScanFoods, setScanMeal } from '@/lib/session';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

/** "Klopt dit?" — confirm or fix what was recognised: swap, portion, remove, add missing. */
export default function Review() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state, logEntries } = useStore();
  const island = useIsland();
  const [foods, setFoods] = useState<Recognized[]>(scanSession.foods);
  const [meal, setMeal] = useState(scanSession.meal ?? 'snack');
  useFocusEffect(useCallback(() => { setFoods([...scanSession.foods]); }, []));

  const tot = foods.reduce((a, f) => add(a, scaled(f.item.per100, f.grams)), ZERO);
  const setF = (uid: string, patch: Partial<Recognized>) => { const n = foods.map(f => (f.uid === uid ? { ...f, ...patch } : f)); setScanFoods(n); setFoods(n); };
  const remove = (uid: string) => { const n = foods.filter(f => f.uid !== uid); setScanFoods(n); setFoods(n); };

  const save = () => {
    const now = new Date().toISOString();
    logEntries(foods.map((f, i) => ({ name: f.item.name, brand: f.item.brand, ref: f.item.ai ? null : f.item.id, meal, grams: f.grams, per100: f.item.per100,
      date: now, source: scanSession.source, photo: i === 0 ? scanSession.photo : null })));
    const t = targets(state.profile);
    const eaten = sumEntries(state.entries.filter(e => sameDay(e.date, new Date()))).kcal + tot.kcal;
    island.show({ icon: 'checkmark', title: 'Toegevoegd', detail: `nog ${fmt(Math.max(0, t.calories - eaten))} kcal over vandaag`, trailing: `+${fmt(tot.kcal)}` }, 4500);
    clearScan();
    router.dismissAll();
    router.navigate('/');
  };

  const badge = (conf: number) => conf >= 0.7 ? ['Zeker', c.good, 'checkmark'] : conf >= 0.4 ? ['Waarschijnlijk', c.fat, 'circle.lefthalf.filled'] : ['Controleer', c.warn, 'questionmark.circle'];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + 6, paddingHorizontal: space.l, paddingBottom: 8 }}>
        <PillButton title="Opnieuw" tone="plain" onPress={() => router.back()} />
        <T variant="h3">{foods.length ? 'Klopt dit?' : 'Niet herkend'}</T>
        <IconButton icon="xmark" label="Sluit" onPress={() => { clearScan(); router.dismissAll(); }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: 140 }}>
        {scanSession.photo ? <Image source={{ uri: scanSession.photo }} style={{ height: 200, borderRadius: radius.l }} contentFit="cover" accessibilityLabel="Je foto" /> : null}
        {foods.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <View>
              <T variant="sub" color={c.label2}>{foods.length} {foods.length > 1 ? 'onderdelen' : 'onderdeel'} herkend</T>
              <Text style={{ fontSize: 44, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(tot.kcal)} <Text style={{ fontSize: 16, color: c.label2 }}>kcal</Text></Text>
            </View>
            <T variant="sub" color={c.label2}>E {fmt(tot.protein)} · K {fmt(tot.carbs)} · V {fmt(tot.fat)}</T>
          </View>
        ) : (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
            <Icon name="questionmark.circle" size={40} color={c.accent} />
            <T variant="h3" style={{ textAlign: 'center' }}>{scanSession.message ?? 'We konden dit niet met zekerheid herkennen.'}</T>
            <PillButton title="Zoek het op" icon="magnifyingglass" onPress={() => { setPickFor('review'); router.push('/search'); }} />
          </Card>
        )}
        {foods.map(f => {
          const n = scaled(f.item.per100, f.grams), portion = f.item.portionGrams || 100, [bt, bc, bi] = badge(f.conf);
          return (
            <Card key={f.uid} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <T variant="h2">{f.item.name}</T>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {f.conf < 1 ? <Pill icon={bi} text={bt} color={bc} /> : null}
                    <Pill icon={f.item.ai ? 'sparkles' : 'checkmark.seal'} text={f.item.ai ? 'AI-schatting' : f.item.brand ? f.item.brand : 'Database'} color={c.label2} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(n.kcal)}</Text>
                  <T variant="cap" color={c.label2}>kcal</T>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T variant="h3">Portie {fmt(f.grams)} g</T>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Stepper onMinus={() => setF(f.uid, { grams: Math.max(5, f.grams - 10) })} onPlus={() => setF(f.uid, { grams: Math.min(2000, f.grams + 10) })} />
                  <IconButton icon="trash" size={36} glass={false} label={`Verwijder ${f.item.name}`} onPress={() => remove(f.uid)} />
                </View>
              </View>
              <Slider minimumValue={5} maximumValue={Math.max(portion * 3, 300)} step={5} value={f.grams} onValueChange={v => setF(f.uid, { grams: v })}
                minimumTrackTintColor={c.accent} accessibilityLabel={`Gram ${f.item.name}`} />
              {f.item.portionLabel ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {[0.5, 1, 1.5, 2].map(k => { const g = Math.round(portion * k); return <Chip key={k} title={k === 1 ? f.item.portionLabel! : `${String(k).replace('.', ',')} × ${f.item.portionLabel}`} on={Math.abs(f.grams - g) < 1} onPress={() => setF(f.uid, { grams: g })} />; })}
                </ScrollView>
              ) : null}
              <T variant="sub" color={c.label2}>Eiwit {fmt(n.protein)} g · Koolhydraten {fmt(n.carbs)} g · Vet {fmt(n.fat)} g</T>
              {f.alts.length ? (
                <View style={{ gap: 7 }}>
                  <T variant="cap" color={c.label2}>Klopt niet? Is het…</T>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {f.alts.map(a => (
                      <Pressable key={a.id} onPress={() => setF(f.uid, { item: a, grams: a.portionGrams, conf: 1, alts: [f.item, ...f.alts.filter(x => x.id !== a.id)].filter(x => !x.ai) })}
                        style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5, borderColor: c.sep }}>
                        <T variant="sub">{a.name}</T>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </Card>
          );
        })}
        <Card pad={false}>
          <Row onPress={() => { setPickFor('review'); router.push('/search'); }} label="Iets toevoegen dat ontbreekt">
            <Icon name="plus.circle" size={22} color={c.accent} /><T variant="bodyB" color={c.accent}>Iets toevoegen dat ontbreekt</T>
          </Row>
        </Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {MEALS.map(m => <Chip key={m.id} title={m.title} on={meal === m.id} onPress={() => { setMeal(m.id); setScanMeal(m.id); }} />)}
        </ScrollView>
        {scanSession.ai && foods.length ? <T variant="sub" color={c.label2}>Herkend door AI. Portiegroottes zijn een schatting; schuif om aan te passen.</T> : null}
      </ScrollView>
      {foods.length ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.l, paddingBottom: insets.bottom + 10, backgroundColor: hexA(c.bg, 0.92) }}>
          <GradientButton title={`Voeg toe aan ${mealTitle(meal).toLowerCase()}`} right={`${fmt(tot.kcal)} kcal`} onPress={save} />
        </View>
      ) : null}
    </View>
  );
}

function Pill({ icon, text, color }: { icon: string; text: string; color: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: c.fill }}>
      <Icon name={icon} size={12} color={color} /><Text style={{ fontSize: 12, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}
