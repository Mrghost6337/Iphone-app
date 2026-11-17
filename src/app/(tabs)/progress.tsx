import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Bar, Card, GradientButton, Icon, IconBadge, IconButton, T, haptic } from '@/components/ui';
import { insights } from '@/lib/insights';
import { changesWeight, energyGoal, fmt, kg1, lastNDays, sameDay, sumEntries, targets } from '@/lib/nutrition';
import { points } from '@/lib/points';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

/** Plain-language summary first, then big numbers and clear charts. */
export default function Progress() {
  const { state } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<7 | 30>(7);
  const [w, setW] = useState(340);
  const p = state.profile, t = useMemo(() => targets(p), [p]);
  const days = lastNDays(range).map(d => ({ d, tot: sumEntries(state.entries.filter(e => sameDay(e.date, d))) }));
  const logged = days.filter(x => x.tot.kcal > 0);
  const avg = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => (logged.length ? logged.reduce((a, x) => a + x.tot[k], 0) / logged.length : 0);
  const A = { kcal: avg('kcal'), protein: avg('protein'), carbs: avg('carbs'), fat: avg('fat') };
  const diff = A.kcal - t.calories, onTrack = logged.filter(x => Math.abs(x.tot.kcal - t.calories) <= t.calories * 0.1).length;
  const pts = points(state.entries, t);
  const goal = energyGoal(p.goal);
  const talk = !logged.length ? 'Nog niets gelogd in deze periode. Maak een foto van je volgende maaltijd om te beginnen.'
    : Math.abs(diff) <= t.calories * 0.05 ? `Je zit precies op koers: gemiddeld ${fmt(A.kcal)} kcal per dag.`
    : diff < 0 ? `Je eet gemiddeld ${fmt(-diff)} kcal minder dan je doel. ${goal === 'lose' ? 'Goed op weg, maar ga niet te ver onder je doel.' : 'Probeer iets meer te eten.'}`
    : `Je eet gemiddeld ${fmt(diff)} kcal meer dan je doel. ${goal === 'gain' ? 'Prima voor spieropbouw.' : 'Kleine wissels maken het verschil.'}`;

  // Bar chart
  const H = 210, pl = 40, pb = 26, pt = 16, maxY = Math.max(t.calories * 1.3, ...days.map(x => x.tot.kcal)) * 1.02;
  const bw = (w - pl - 6) / range, y = (v: number) => pt + (H - pt - pb) * (1 - v / maxY);
  // Weight chart
  const ws = [...state.weights].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const last = ws.at(-1), delta = ws.length > 1 ? ws[ws.length - 1].kg - ws[0].kg : 0;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.l }}>
        <IconButton icon="gearshape" label="Instellingen" onPress={() => router.push('/settings')} />
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <T variant="large">Voortgang</T>
        <T variant="bodyB" color={c.label2}>Zo gaat het met je doelen</T>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: space.l, backgroundColor: c.fill, borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {([[7, 'Deze week'], [30, '30 dagen']] as const).map(([v, l]) => (
          <Pressable key={v} onPress={() => { haptic.tap(); setRange(v); }} accessibilityRole="tab" accessibilityState={{ selected: range === v }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: range === v ? c.card : 'transparent' }}>
            <T variant="bodyB" style={{ fontSize: 14.5 }}>{l}</T>
          </Pressable>
        ))}
      </View>
      <View style={{ paddingHorizontal: space.l, gap: space.l }}>
        <Card><T variant="body" style={{ fontSize: 17, lineHeight: 24, fontWeight: '500' }}>{talk}</T></Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[['flame.fill', 'Gemiddeld', fmt(A.kcal), 'kcal', `doel ${fmt(t.calories)}`], ['target', 'Op koers', String(onTrack), `/ ${range} dagen`, 'binnen 10% van je doel'],
            ['trophy.fill', 'Punten', fmt(pts.week), '', `deze week · ${fmt(pts.total)} totaal`], ['calendar', 'Reeks', String(pts.streak), pts.streak === 1 ? 'dag' : 'dagen', 'op rij gelogd']].map(([icon, k, v, u, d]) => (
            <Card key={k} style={{ flexBasis: '48%', flexGrow: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name={icon} size={15} color={c.label2} /><T variant="cap" color={c.label2}>{k}</T></View>
              <Text style={{ fontSize: 30, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{v}<Text style={{ fontSize: 13, color: c.label2 }}> {u}</Text></Text>
              <T variant="cap" color={c.label2} style={{ fontWeight: '500' }}>{d}</T>
            </Card>
          ))}
        </View>

        <Card style={{ gap: 8 }}>
          <T variant="h2">Calorieën per dag</T>
          <View onLayout={e => { const lw = e.nativeEvent.layout.width; if (lw > 120) setW(lw); }} accessible accessibilityLabel={`Calorieën per dag, gemiddeld ${fmt(A.kcal)}, doel ${fmt(t.calories)}`}>
            <Svg width={w} height={H}>
              {[0, 1000, 2000, 3000, 4000].filter(v => v <= maxY).map(v => (
                <React.Fragment key={v}><Line x1={pl} x2={w} y1={y(v)} y2={y(v)} stroke={c.sep} /><SvgText x={pl - 8} y={y(v) + 4} fill={c.label2} fontSize={11} fontWeight="600" textAnchor="end">{v ? fmt(v) : '0'}</SvgText></React.Fragment>
              ))}
              {days.map((x, i) => {
                const h = (H - pt - pb) * (x.tot.kcal / maxY);
                return (
                  <React.Fragment key={i}>
                    <Rect x={pl + i * bw + bw * 0.16} y={H - pb - h} width={bw * 0.68} height={Math.max(h, 0)} rx={Math.min(6, bw * 0.25)} fill={x.tot.kcal > t.calories * 1.1 ? c.warn : c.accent} />
                    {range === 7 || (range - 1 - i) % 7 === 0 ? <SvgText x={pl + i * bw + bw / 2} y={H - 8} fill={c.label2} fontSize={12} fontWeight="600" textAnchor="middle">
                      {range === 7 ? x.d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '') : `${x.d.getDate()}/${x.d.getMonth() + 1}`}</SvgText> : null}
                  </React.Fragment>
                );
              })}
              <Line x1={pl} x2={w} y1={y(t.calories)} y2={y(t.calories)} stroke={c.label} strokeWidth={2} strokeDasharray="5 5" />
              <Rect x={w - 50} y={y(t.calories) - 20} width={50} height={18} rx={9} fill={c.label} />
              <SvgText x={w - 25} y={y(t.calories) - 7} fill={c.bg} fontSize={11} fontWeight="800" textAnchor="middle">doel</SvgText>
            </Svg>
          </View>
        </Card>

        <Card style={{ gap: 14 }}>
          <T variant="h2">Macro’s gemiddeld</T>
          {([['Eiwit', 'protein', c.protein], ['Koolhydraten', 'carbs', c.carbs], ['Vet', 'fat', c.fat]] as const).map(([n, k, col]) => {
            const pct = t[k] ? A[k] / t[k] : 0;
            return (
              <View key={k} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: col }} /><T variant="bodyB">{n}</T></View>
                  <T variant="bodyB">{fmt(A[k])} <Text style={{ color: c.label2, fontWeight: '500' }}>/ {t[k]} g</Text></T>
                </View>
                <Bar value={pct} color={col} height={10} />
                <T variant="sub" color={c.label2}>{!logged.length ? '—' : pct >= 0.9 && pct <= 1.15 ? 'Goed zo' : pct < 0.9 ? `${fmt(t[k] - A[k])} g per dag te weinig` : `${fmt(A[k] - t[k])} g per dag meer dan je doel`}</T>
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: 12 }}>
          <T variant="h2">Gewicht</T>
          {last ? (
            <View style={{ flexDirection: 'row' }}>
              {[['Nu', kg1(last.kg)], ['Verschil', `${delta > 0 ? '+' : ''}${kg1(delta)}`], ...(changesWeight(p.goal) ? [['Nog te gaan', kg1(Math.abs(last.kg - p.target))]] : [])].map(([k, v]) => (
                <View key={k} style={{ flex: 1 }}><T variant="cap" color={c.label2}>{k}</T><Text style={{ fontSize: 28, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{v}<Text style={{ fontSize: 13, color: c.label2 }}> kg</Text></Text></View>
              ))}
            </View>
          ) : null}
          {ws.length > 1 ? (() => {
            const wh = 160, mn = Math.min(...ws.map(x => x.kg), changesWeight(p.goal) ? p.target : 999) - 1, mx = Math.max(...ws.map(x => x.kg), changesWeight(p.goal) ? p.target : 0) + 1;
            const t0 = +new Date(ws[0].date), t1 = +new Date(ws[ws.length - 1].date);
            const px = (d: string) => 40 + (w - 50) * ((+new Date(d) - t0) / Math.max(t1 - t0, 1)), py = (v: number) => 12 + (wh - 30) * (1 - (v - mn) / (mx - mn));
            return (
              <Svg width={w} height={wh}>
                {[mn + 0.5, (mn + mx) / 2, mx - 0.5].map(v => <React.Fragment key={v}><Line x1={40} x2={w} y1={py(v)} y2={py(v)} stroke={c.sep} /><SvgText x={32} y={py(v) + 4} fill={c.label2} fontSize={11} textAnchor="end">{Math.round(v)}</SvgText></React.Fragment>)}
                {changesWeight(p.goal) ? <Line x1={40} x2={w} y1={py(p.target)} y2={py(p.target)} stroke={c.good} strokeWidth={2} strokeDasharray="5 5" /> : null}
                <Polyline points={ws.map(x => `${px(x.date)},${py(x.kg)}`).join(' ')} fill="none" stroke={c.accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                {ws.map((x, i) => <Circle key={x.id} cx={px(x.date)} cy={py(x.kg)} r={i === ws.length - 1 ? 6 : 4} fill={c.accent} stroke={c.card} strokeWidth={2} />)}
              </Svg>
            );
          })() : <T variant="sub" color={c.label2}>Weeg jezelf 1× per week, op hetzelfde moment, voor een betrouwbare trend.</T>}
          <GradientButton title="Gewicht invoeren" icon="scalemass" onPress={() => router.push('/weight')} />
        </Card>

        {insights(state.entries, t, p).map(x => (
          <Card key={x.id} style={{ flexDirection: 'row', gap: 14 }}>
            <IconBadge icon={x.icon} size={40} color={x.tone === 'positive' ? c.good : x.tone === 'attention' ? c.warn : c.accent} />
            <View style={{ flex: 1, gap: 3 }}><T variant="h3">{x.title}</T><T variant="sub" color={c.label2}>{x.message}</T></View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
