import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Chip, Glass, Button, Icon, IconButton, T, haptic } from '@/components/ui';
import { energyGoal, fmt } from '@/lib/nutrition';
import { RECIPES, Recipe, allergenHits, fitsDiet, postToRecipe } from '@/lib/recipes';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

const FILTERS: [string, string][] = [['all', 'Alles'], ['snel', 'Snel'], ['hoog-eiwit', 'Veel eiwit'], ['vegetarisch', 'Vegetarisch'], ['ontbijt', 'Ontbijt'], ['lunch', 'Lunch']];

export default function Recipes() {
  const { state, update } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'discover' | 'mine' | 'saved'>('discover');
  const [filter, setFilter] = useState('all');
  const p = state.profile;
  const mine = state.posts.map(postToRecipe);

  const list = useMemo(() => {
    let base: Recipe[];
    if (tab === 'discover') {
      base = RECIPES.filter(r => fitsDiet(r, p.diet));
      if (p.cook === 'quick') base = [...base].sort((a, b) => a.minutes - b.minutes);
      if (energyGoal(p.goal) === 'gain') base = [...base].sort((a, b) => b.per.protein - a.per.protein);
    } else if (tab === 'mine') base = mine;
    else base = [...RECIPES, ...mine].filter(r => state.recipes[r.id]?.fav);
    return base.filter(r => filter === 'all' || (filter === 'snel' ? r.minutes <= 20 : r.tags.includes(filter)));
  }, [tab, filter, p, mine, state.recipes]);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: space.l }}>
        <IconButton icon="plus" label="Deel een recept" onPress={() => router.push('/post')} />
        <IconButton icon="gearshape" label="Instellingen" onPress={() => router.push('/settings')} />
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <T variant="large">Recepten</T>
        <T variant="bodyB" color={c.label2}>Stap voor stap, met voedingswaarden</T>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: space.l, backgroundColor: c.fill, borderRadius: 12, padding: 3, marginBottom: 12 }}>
        {([['discover', 'Ontdek'], ['mine', 'Mijn recepten'], ['saved', 'Opgeslagen']] as const).map(([id, t]) => (
          <Pressable key={id} onPress={() => { haptic.tap(); setTab(id); }} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: tab === id ? c.card : 'transparent' }}>
            <T variant="bodyB" style={{ fontSize: 14.5 }}>{t}</T>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.l, paddingBottom: 16 }}>
        {FILTERS.map(([id, t]) => <Chip key={id} title={t} on={filter === id} onPress={() => setFilter(id)} />)}
      </ScrollView>
      <View style={{ paddingHorizontal: space.l, gap: space.l }}>
        {list.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 32 }}>
            <Icon name={tab === 'saved' ? 'bookmark' : 'book.pages'} size={40} color={c.label3} />
            <T variant="h3">{tab === 'saved' ? 'Nog niets opgeslagen' : tab === 'mine' ? 'Nog geen eigen recepten' : 'Geen recepten met dit filter'}</T>
            <T variant="sub" color={c.label2} style={{ textAlign: 'center' }}>{tab === 'saved' ? 'Tik op de bladwijzer bij een recept om het hier te bewaren.' : tab === 'mine' ? 'Deel je favoriete recept met een echte foto.' : 'Kies een ander filter.'}</T>
            {tab === 'mine' ? <Button title="Deel een recept" icon="plus" onPress={() => router.push('/post')} style={{ alignSelf: 'stretch' }} /> : null}
          </Card>
        ) : list.map(r => {
          const s = state.recipes[r.id] ?? {}, hits = allergenHits(r, p.allergies);
          return (
            <Pressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} accessibilityRole="button" accessibilityLabel={`${r.title}, ${r.minutes} minuten, ${fmt(r.per.kcal)} kilocalorieën`}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
              <Card pad={false}>
                <View>
                  <Image source={r.image} style={{ aspectRatio: 4 / 3 }} contentFit="cover" transition={200} />
                  <View style={{ position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 6 }}>
                    <Badge text={`${r.minutes} min`} /><Badge text={`${fmt(r.per.kcal)} kcal`} />{hits.length ? <Badge text={`Bevat ${hits.join(', ')}`} bg="rgba(240,68,56,0.9)" /> : null}
                  </View>
                  <Pressable onPress={() => { haptic.light(); update(st => { st.recipes[r.id] = { ...st.recipes[r.id], fav: !s.fav }; }); }} hitSlop={8}
                    accessibilityRole="button" accessibilityLabel={s.fav ? 'Uit opgeslagen' : 'Bewaar recept'} style={{ position: 'absolute', right: 12, top: 12 }}>
                    <Glass interactive style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.fav ? 'bookmark.fill' : 'bookmark'} size={18} color={'#fff'} />
                    </Glass>
                  </Pressable>
                </View>
                <View style={{ padding: 16, gap: 4 }}>
                  <T variant="h2">{r.title}</T>
                  <T variant="sub" color={c.label2} numberOfLines={2}>{r.subtitle}</T>
                  <View style={{ flexDirection: 'row', gap: 14, marginTop: 8, alignItems: 'center' }}>
                    <Meta icon={s.liked ? 'heart.fill' : 'heart'} text={s.liked ? '1' : '0'} />
                    {r.per.protein ? <Text style={{ color: c.protein, fontWeight: '700', fontSize: 13.5 }}>{fmt(r.per.protein)} g eiwit</Text> : null}
                    <Meta icon="chart.bar" text={r.difficulty} />
                  </View>
                  <T variant="cap" color={c.label2} style={{ marginTop: 8 }}>{r.author}{r.credit ? ` · foto ${r.credit.artist}, ${r.credit.license}` : ''}</T>
                </View>
              </Card>
            </Pressable>
          );
        })}
        {tab === 'discover' ? <T variant="cap" color={c.label2} style={{ fontWeight: '500' }}>Foto’s: Wikimedia Commons, met vrije licentie.</T> : null}
      </View>
    </ScrollView>
  );
}

function Badge({ text, bg = 'rgba(0,0,0,0.5)' }: { text: string; bg?: string }) {
  return <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: bg }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{text}</Text></View>;
}
function Meta({ icon, text }: { icon: string; text: string }) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name={icon} size={15} color={c.label2} /><Text style={{ color: c.label2, fontWeight: '700', fontSize: 13.5 }}>{text}</Text></View>;
}
