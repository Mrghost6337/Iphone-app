import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Avatar, Card, Divider, Fab, Glass, Icon, IconBadge, IconButton, PillButton, Ring, Row, Section, T, haptic, squircle } from '@/components/ui';
import { points } from '@/lib/points';
import { insights } from '@/lib/insights';
import { MEALS, dayKey, lastNDays, fmt, mealBudgets, sameDay, scaled, sumEntries, targets } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';
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

  const streak = points(state.entries, t).streak;
  const macros = [
    { k: 'protein' as const, name: 'Eiwit', icon: 'fish', col: c.protein },
    { k: 'carbs' as const, name: 'Koolhydraten', icon: 'carrot', col: c.carbs },
    { k: 'fat' as const, name: 'Vet', icon: 'drop', col: c.fat },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 160 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', ...squircle }}>
            <Icon name="fork.knife" size={15} color={c.onAccent} weight="bold" />
          </View>
          <T variant="title" accessibilityRole="header">Bord</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!isToday ? <PillButton title="Vandaag" onPress={() => setDayIso(new Date().toISOString())} /> : null}
          <Glass style={{ height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View accessible accessibilityLabel={`${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij gelogd`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="flame.fill" size={16} color={streak ? c.carbs : c.label3} />
              <T variant="bodyB" style={{ fontVariant: ['tabular-nums'] }}>{streak}</T>
            </View>
          </Glass>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Profiel en instellingen" hitSlop={6}>
            <Avatar name={p.name} photo={p.photo} size={40} />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 18 }}>
        {week.map(d => {
          const k = sumEntries(state.entries.filter(e => sameDay(e.date, d))).kcal, sel = sameDay(d, day), logged = k > 0;
          return (
            <Pressable key={d.toISOString()} onPress={() => { haptic.tap(); setDayIso(d.toISOString()); }} style={{ flex: 1, alignItems: 'center' }}
              accessibilityRole="button" accessibilityLabel={`${d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric' })}, ${fmt(k)} kcal`} accessibilityState={{ selected: sel }}>
              <View style={{ width: 44, paddingVertical: 8, borderRadius: 22, alignItems: 'center', gap: 6, backgroundColor: sel ? c.card : 'transparent', boxShadow: sel ? c.shadow : undefined }}>
                <T variant="cap" color={sel ? c.label : c.label2}>{d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '').slice(0, 2)}</T>
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                  borderStyle: logged || sel ? 'solid' : 'dashed', borderColor: sel ? c.accent : logged ? c.label2 : c.label3, backgroundColor: sel ? c.accent : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? c.onAccent : c.label, fontVariant: ['tabular-nums'] }}>{d.getDate()}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Section>
        <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 22 }}>
          <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={over ? `${fmt(-left)} kilocalorieën te veel` : `${fmt(left)} kilocalorieën over van ${fmt(t.calories)}`}>
            <Text style={{ fontSize: 52, fontWeight: '700', letterSpacing: -2, color: c.label, fontVariant: ['tabular-nums'] }}>{E(Math.abs(left))}</Text>
            <T variant="bodyB" color={c.label2}>{U} {over ? 'te veel' : 'over'}</T>
            <T variant="cap" color={c.label3} style={{ marginTop: 6 }}>{E(tot.kcal)} gegeten · doel {E(t.calories)}</T>
          </View>
          <Ring size={112} stroke={10} progress={tot.kcal / t.calories}>
            <Icon name="flame.fill" size={26} color={c.label} />
          </Ring>
        </Card>
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: space.l, marginBottom: space.xl }}>
        {macros.map(m => {
          const v = tot[m.k], target = t[m.k], l = Math.round(target - v);
          return (
            <Card key={m.k} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 16, gap: 12 }}>
              <View accessible accessibilityLabel={`${m.name}: ${l > 0 ? `nog ${l} gram` : 'gehaald'}, ${fmt(v)} van ${target} gram`}>
                <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.6, color: c.label, fontVariant: ['tabular-nums'] }}>{Math.abs(l)}g</Text>
                <T variant="cap" color={c.label2}>{m.name} {l >= 0 ? 'over' : 'te veel'}</T>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Ring size={64} stroke={6} progress={v / target} color={m.col}>
                  <Icon name={m.icon} size={18} color={m.col} />
                </Ring>
              </View>
            </Card>
          );
        })}
      </View>

      <Section>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBadge icon="drop.fill" color={c.water} size={30} />
          <View style={{ flex: 1, gap: 8 }}>
            <T variant="h3">Water <Text style={{ color: c.label2, fontWeight: '500' }}>{water} / {t.water} glazen</Text></T>
            <View style={{ flexDirection: 'row', gap: 4 }}>{Array.from({ length: t.water }, (_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < water ? c.water : c.fill }} />)}</View>
          </View>
          <IconButton icon="minus" size={38} glass={false} label="Glas eraf" onPress={() => setWater(-1)} />
          <IconButton icon="plus" size={38} glass={false} label="Glas water erbij" onPress={() => setWater(1)} />
        </Card>
      </Section>

      {tip ? (
        <Section>
          <Card style={{ flexDirection: 'row', gap: 14 }}>
            <IconBadge icon={tip.icon} size={26} color={tip.tone === 'positive' ? c.good : tip.tone === 'attention' ? c.warn : c.accent} />
            <View style={{ flex: 1, gap: 3 }}><T variant="h3">{tip.title}</T><T variant="sub" color={c.label2}>{tip.message}</T></View>
          </Card>
        </Section>
      ) : null}

      {MEALS.filter(m => budgets[m.id] > 0 || list.some(e => e.meal === m.id)).map(m => {
        const items = list.filter(e => e.meal === m.id), k = sumEntries(items).kcal;
        return (
          <Section key={m.id} title={m.title} right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 15, color: c.label2, fontVariant: ['tabular-nums'] }}><Text style={{ color: c.label, fontWeight: '700' }}>{E(k)}</Text> / {E(budgets[m.id])}</Text>
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
                        : <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}><Icon name={SRC_ICON[e.source] ?? 'fork.knife'} size={20} color={c.label2} weight="regular" /></View>}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T variant="bodyB" numberOfLines={2}>{e.name}</T>
                        <T variant="sub" color={c.label2}>{fmt(e.grams)} g · E {fmt(n.protein)} · K {fmt(n.carbs)} · V {fmt(n.fat)}</T>
                      </View>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>{E(n.kcal)}<Text style={{ fontSize: 12, color: c.label2 }}> {U}</Text></Text>
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
    <Fab label="Eten toevoegen" onPress={() => router.push({ pathname: '/add', params: { day: dayIso } })}
      style={{ position: 'absolute', right: 20, bottom: Platform.OS === 'web' ? 20 : insets.bottom + 72 }} />
    </View>
  );
}
