import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { T, Tile } from '@/components/ui';
import { Meal, mealTitle } from '@/lib/nutrition';
import { setAmountFood, setPickFor, setScanMeal } from '@/lib/session';
import { space } from '@/lib/theme';

/** "Wat wil je toevoegen?" — four ways to log. */
export default function Add() {
  const { meal } = useLocalSearchParams<{ meal: Meal }>();
  const go = (mode: 'photo' | 'barcode' | 'describe' | 'search') => {
    setScanMeal(meal ?? null);
    router.back();
    if (mode === 'search') { setPickFor('log'); setAmountFood(null, meal ?? null); router.push('/search'); }
    else router.navigate({ pathname: '/scan', params: { mode, t: String(Date.now()) } });
  };
  return (
    <View style={{ padding: space.l, gap: space.m, paddingTop: space.xl }}>
      <T variant="title" style={{ textAlign: 'center', marginBottom: 6 }}>{mealTitle(meal ?? 'snack')} toevoegen</T>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        <Tile title="Foto" detail="AI herkent je bord" icon="camera.fill" on={false} onPress={() => go('photo')} />
        <Tile title="Barcode" detail="Scan een verpakking" icon="barcode.viewfinder" on={false} onPress={() => go('barcode')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        <Tile title="Beschrijf" detail="Typ wat je at" icon="text.bubble" on={false} onPress={() => go('describe')} />
        <Tile title="Zoeken" detail="134 producten + merken" icon="magnifyingglass" on={false} onPress={() => go('search')} />
      </View>
    </View>
  );
}
