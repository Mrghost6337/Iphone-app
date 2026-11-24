import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Icon, Press, T, haptic, hexA, squircle } from '@/components/ui';
import { Meal, mealTitle, nowMs } from '@/lib/nutrition';
import { setAmountFood, setPickFor, setScanMeal } from '@/lib/session';
import { radius, space, useColors } from '@/lib/theme';

type Way = 'photo' | 'barcode' | 'describe' | 'search';
const WAYS: { id: Way; title: string; detail: string; icon: string }[] = [
  { id: 'photo', title: 'Eten scannen', detail: 'AI herkent je bord', icon: 'camera.viewfinder' },
  { id: 'barcode', title: 'Barcode', detail: 'Van de verpakking', icon: 'barcode.viewfinder' },
  { id: 'search', title: 'Zoeken', detail: 'Producten en merken', icon: 'magnifyingglass' },
  { id: 'describe', title: 'Beschrijven', detail: 'Typ wat je at', icon: 'text.bubble' },
];

/** The + sheet: four ways to log, as a 2 × 2 grid. Scanning is the primary one and is drawn solid. */
export default function Add() {
  const c = useColors();
  const { meal } = useLocalSearchParams<{ meal: Meal }>();
  const go = (mode: Way) => {
    haptic.tap();
    setScanMeal(meal ?? null);
    router.back();
    if (mode === 'search') { setPickFor('log'); setAmountFood(null, meal ?? null); router.push('/search'); }
    else router.push({ pathname: '/scan', params: { mode, t: String(nowMs()) } });
  };
  const rows = [WAYS.slice(0, 2), WAYS.slice(2)];
  return (
    <View style={{ padding: space.l, gap: space.m, paddingTop: space.xl }}>
      <T variant="h2" style={{ marginBottom: 4, paddingHorizontal: 4 }} accessibilityRole="header">{meal ? `${mealTitle(meal)} toevoegen` : 'Eten toevoegen'}</T>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.m }}>
          {row.map(w => {
            const primary = w.id === 'photo';
            return (
              <Press key={w.id} accessibilityRole="button" accessibilityLabel={`${w.title}, ${w.detail}`} onPress={() => go(w.id)}
                style={{ flex: 1, height: 124, borderRadius: radius.l, padding: 16, justifyContent: 'space-between', ...squircle,
                  backgroundColor: primary ? c.accent : c.card, boxShadow: primary ? undefined : c.shadow }}>
                <Icon name={w.icon} size={28} color={primary ? c.onAccent : c.label} weight="medium" />
                <View style={{ gap: 1 }}>
                  <T variant="h3" color={primary ? c.onAccent : c.label}>{w.title}</T>
                  <T variant="cap" color={primary ? hexA(c.onAccent, 0.64) : c.label2}>{w.detail}</T>
                </View>
              </Press>
            );
          })}
        </View>
      ))}
    </View>
  );
}
