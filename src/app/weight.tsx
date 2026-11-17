import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ruler } from '@/components/Ruler';
import { GradientButton, T, haptic } from '@/components/ui';
import { kg1 } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

export default function WeightSheet() {
  const { state, update } = useStore();
  const c = useColors();
  const last = [...state.weights].sort((a, b) => +new Date(a.date) - +new Date(b.date)).at(-1)?.kg ?? state.profile.weight;
  const [kg, setKg] = useState(last);
  const save = () => {
    haptic.success();
    update(s => { s.weights.push({ id: String(Date.now()), date: new Date().toISOString(), kg }); s.profile.weight = kg; });
    router.back();
  };
  return (
    <View style={{ padding: space.l, gap: space.l, paddingTop: space.xl }}>
      <T variant="h2" style={{ textAlign: 'center' }}>Gewicht invoeren</T>
      <Text style={{ textAlign: 'center', fontSize: 56, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{kg1(kg)} <Text style={{ fontSize: 20, color: c.label2 }}>kg</Text></Text>
      <Ruler value={kg} min={35} max={200} step={0.1} labelEvery={1} label="Gewicht in kilogram" onChange={setKg} />
      <T variant="sub" color={c.label2} style={{ textAlign: 'center' }}>Sleep de liniaal. Weeg jezelf het liefst ’s ochtends. Je doel wordt automatisch bijgewerkt.</T>
      <GradientButton title="Bewaar" onPress={save} />
    </View>
  );
}
