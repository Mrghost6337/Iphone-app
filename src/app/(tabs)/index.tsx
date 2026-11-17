import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Avatar, Bar, Card, Divider, Icon, IconBadge, IconButton, PillButton, Ring, Row, Section, T, haptic, hexA } from '@/components/ui';
import { insights } from '@/lib/insights';
import { MEALS, dayKey, lastNDays, fmt, mealBudgets, sameDay, scaled, sumEntries, targets } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';
import { router, useLocalSearchParams } from 'expo-router';

const SRC_ICON: Record<string, string> = { photo: 'camera.fill', barcode: 'barcode.viewfinder', describe: 'text.bubble', search: 'magnifyingglass', recipe: 'frying.pan', manual: 'square.and.pencil' };

export default function Today() {
  const { state, update } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string }>();
  const [dayIso, setDayIso] = React.useState<string>(params.day ?? new Date().toISOString());
  const day = new Date(dayIso);
  const isToday = sameDay(day, new Date());
  const p = state.profile, t = useMemo(() => targets(p), [p]);
  const list = state.entries.filter(e => sameDay(e.date, day)).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const tot = sumEntries(list), left = t.calories - tot.kcal, over = left < 0;
  const budgets = mealBudgets(p, t.calories);
  const water = state.water[dayKey(day)] ?? 0;
  const tip = isToday ? insights(state.entries, t, p)[0] : undefined;
  const kj = state.prefs.unit === 'kJ', E = (v: number) => fmt(kj ? v * 4.184 : v), U = kj ? 'kJ' : 'kcal';

  const week = lastNDays(7);
  const setWater = (d: number) => { haptic.light(); update(s => { const k = dayKey(day); s.water[k] = Math.max(0, Math.min(30, (s.water[k] ?? 0) + d)); }); };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.l, marginBottom: 6 }}>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Profiel"><Avatar name={p.name} photo={p.photo} size={40} /></Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {!isToday ? <PillButton title="Vandaag" onPress={() => setDayIso(new Date().toISOString())} /> : null}
          <IconButton icon="gearshape" label="Instellingen" onPress={() => router.push('/settings')} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <T variant="large" style={{ textTransform: 'capitalize' }}>{isToday ? 'Vandaag' : day.toLocaleDateString('nl-NL', { weekday: 'long' })}</T>
        <T variant="bodyB" color={c.label2}>{day.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}{isToday && p.name ? ` · Hoi ${p.name}` : ''}</T>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 14 }}>
        {week.map(d => {
          const k = sumEntries(state.entries.filter(e => sameDay(e.date, d))).kcal, sel = sameDay(d, day);
          return (
            <Pressable key={d.toISOString()} onPress={() => { haptic.tap(); setDayIso(d.toISOString()); }} style={{ flex: 1, alignItems: 'center', gap: 6 }}
              accessibilityRole="button" accessibilityLabel={`${d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric' })}, ${fmt(k)} kcal`} accessibilityState={{ selected: sel }}>
              <T variant="cap" color={sel ? c.accent : c.label2}>{d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '')}</T>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: sel ? hexA(c.accent, 0.14) : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Ring size={38} stroke={3.5} progress={k / t.calories}><T variant="cap" style={{ fontWeight: sel ? '900' : '600' }}>{d.getDate()}</T></Ring>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Section>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Ring size={160} stroke={17} progress={tot.kcal / t.calories}>
              <View style={{ alignItems: 'center' }} accessible accessibilityLabel={over ? `${fmt(-left)} kilocalorieën te veel` : `${fmt(left)} kilocalorieën over`}>
                <Text style={{ fontSize: 38, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{E(Math.abs(left))}</Text>
                <T variant="sub" color={c.label2}>{U} {over ? 'te veel' : 'over'}</T>
              </View>
            </Ring>
            <View style={{ flex: 1, gap: 12 }}>
              {[['Doel', E(t.calories), U], ['Gegeten', E(tot.kcal), U], ['Vezels', fmt(tot.fiber), `/ ${t.fiber} g`]].map(([k, v, u]) => (
                <View key={k}><T variant="cap" color={c.label2}>{k}</T><Text style={{ fontSize: 22, fontWeight: '800', color: c.label, fontVariant: ['tabular-nums'] }}>{v} <Text style={{ fontSize: 13, color: c.label2 }}>{u}</Text></Text></View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {([['Eiwit', 'protein', c.protein], ['Koolh.', 'carbs', c.carbs], ['Vet', 'fat', c.fat]] as const).map(([n, k, col]) => {
              const v = tot[k], target = t[k], l = Math.round(target - v);
              return (
                <View key={k} style={{ flex: 1, backgroundColor: c.card2, borderRadius: radius.m, padding: 12, gap: 6 }} accessible accessibilityLabel={`${n} ${fmt(v)} van ${target} gram`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} /><T variant="cap">{n}</T></View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(v)}<Text style={{ fontSize: 12, color: c.label2 }}> / {target} g</Text></Text>
                  <Bar value={v / target} color={col} />
                  <T variant="cap" color={c.label2} style={{ fontWeight: '500' }}>{l > 0 ? `nog ${l} g` : 'gehaald'}</T>
                </View>
              );
            })}
          </View>
        </Card>
      </Section>

      <Section>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBadge icon="drop.fill" color={c.water} />
          <View style={{ flex: 1, gap: 8 }}>
            <T variant="h3">Water <Text style={{ color: c.label2, fontWeight: '600' }}>{water} / {t.water} glazen</Text></T>
            <View style={{ flexDirection: 'row', gap: 4 }}>{Array.from({ length: t.water }, (_, i) => <View key={i} style={{ flex: 1, height: 8, borderRadius: 3, backgroundColor: i < water ? c.water : hexA(c.water, 0.18) }} />)}</View>
          </View>
          <IconButton icon="minus" size={38} label="Glas eraf" onPress={() => setWater(-1)} />
          <IconButton icon="plus" size={38} label="Glas water erbij" color={c.water} onPress={() => setWater(1)} />
        </Card>
      </Section>

      {tip ? (
        <Section>
          <Card style={{ flexDirection: 'row', gap: 14 }}>
            <IconBadge icon={tip.icon} size={40} color={tip.tone === 'positive' ? c.good : tip.tone === 'attention' ? c.warn : c.accent} />
            <View style={{ flex: 1, gap: 3 }}><T variant="h3">{tip.title}</T><T variant="sub" color={c.label2}>{tip.message}</T></View>
          </Card>
        </Section>
      ) : null}

      {MEALS.filter(m => budgets[m.id] > 0 || list.some(e => e.meal === m.id)).map(m => {
        const items = list.filter(e => e.meal === m.id), k = sumEntries(items).kcal;
        return (
          <Section key={m.id} title={m.title} right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 15, color: c.label2, fontVariant: ['tabular-nums'] }}><Text style={{ color: c.label, fontWeight: '800' }}>{E(k)}</Text> / {E(budgets[m.id])}</Text>
              <IconButton icon="plus" size={36} label={`Voeg toe aan ${m.title}`} onPress={() => router.push({ pathname: '/add', params: { meal: m.id, day: dayIso } })} />
            </View>}>
            <Card pad={false}>
              {items.length ? items.map((e, idx) => {
                const n = scaled(e.per100, e.grams);
                return (
                  <View key={e.id}>
                    {idx ? <Divider inset={74} /> : null}
                    <Row onPress={() => router.push(`/edit/${e.id}`)} label={`${e.name}, ${fmt(n.kcal)} kilocalorieën`}>
                      {e.photo
                        ? <Image source={{ uri: e.photo }} style={{ width: 46, height: 46, borderRadius: 13 }} />
                        : <IconBadge icon={SRC_ICON[e.source] ?? 'fork.knife'} size={46} />}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T variant="bodyB" numberOfLines={2}>{e.name}</T>
                        <T variant="sub" color={c.label2}>{fmt(e.grams)} g · E {fmt(n.protein)} · K {fmt(n.carbs)} · V {fmt(n.fat)}</T>
                      </View>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: c.label, fontVariant: ['tabular-nums'] }}>{E(n.kcal)}<Text style={{ fontSize: 12, color: c.label2 }}> {U}</Text></Text>
                    </Row>
                  </View>
                );
              }) : (
                <Row onPress={() => router.push({ pathname: '/add', params: { meal: m.id, day: dayIso } })} label={`${m.title} toevoegen`}>
                  <Icon name="plus.circle" size={22} color={c.accent} />
                  <T variant="bodyB" color={c.accent}>{m.title} toevoegen</T>
                </Row>
              )}
            </Card>
          </Section>
        );
      })}
    </ScrollView>
  );
}
