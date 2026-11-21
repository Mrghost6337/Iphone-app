import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View, Alert } from 'react-native';
import { useIsland } from '@/components/Island';
import { Avatar, Bar, Card, Divider, Button, Icon, IconButton, PillButton, Stepper, T, haptic, hexA } from '@/components/ui';
import { cancelTimer, scheduleTimer } from '@/lib/notifications';
import { fmt, mealTitle, nowMs, suggestedMeal } from '@/lib/nutrition';
import { RECIPES, allergenHits, postToRecipe, scaleText } from '@/lib/recipes';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

/** Step-by-step recipe with ingredient/step checklists, servings scaler, timers, like/save/repost, comments, log one portion. */
export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, logEntries } = useStore();
  const c = useColors();
  const island = useIsland();
  const r = RECIPES.find(x => x.id === id) ?? state.posts.map(postToRecipe).find(x => x.id === id);
  const [draft, setDraft] = useState('');
  const [timer, setTimer] = useState<{ step: number; until: number } | null>(null);
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    if (!timer) return;
    const i = setInterval(() => {
      const t = nowMs(); setNow(t);
      if (t >= timer.until) { haptic.success(); island.show({ icon: 'bell.fill', title: 'Timer klaar!', detail: `Stap ${timer.step + 1}` }, 6000); setTimer(null); }
    }, 500);
    return () => clearInterval(i);
  }, [timer, island]);
  if (!r) return null;

  const s = state.recipes[r.id] ?? {};
  const servings = s.servings ?? r.servings;
  const ing = s.ing ?? [], steps = s.steps ?? [];
  const hits = allergenHits(r, state.profile.allergies);
  const comments = state.comments.filter(x => x.recipeId === r.id);
  const patch = (fn: (x: typeof s) => void) => update(st => { const cur = { ...(st.recipes[r.id] ?? {}) }; fn(cur); st.recipes[r.id] = cur; });
  const toggleIn = (arr: number[], i: number) => (arr.includes(i) ? arr.filter(x => x !== i) : [...arr, i]);

  const startTimer = (step: number, min: number) => {
    const until = nowMs() + min * 60e3;
    setTimer({ step, until });
    island.show({ icon: 'frying.pan.fill', title: r.title, detail: `Stap ${step + 1}`, until }, min * 60e3);
    scheduleTimer(r.title, step, min * 60).catch(() => {});
  };
  const stopTimer = () => { setTimer(null); island.hide(); cancelTimer(); };
  const log = () => {
    const meal = suggestedMeal();
    logEntries([{ name: r.title, ref: null, meal, grams: 100, per100: r.per, date: new Date().toISOString(), source: 'recipe' }]);
    haptic.success();
    island.show({ icon: 'checkmark', title: `1 portie bij ${mealTitle(meal).toLowerCase()}`, trailing: `+${fmt(r.per.kcal)}` }, 3500);
  };
  const send = () => {
    const text = draft.trim(); if (!text) return;
    update(st => { st.comments.push({ id: String(Date.now()), recipeId: r.id, author: st.profile.name || 'Jij', text, at: Date.now() }); });
    setDraft('');
  };
  const left = timer ? Math.max(0, Math.ceil((timer.until - now) / 1000)) : 0;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 60 }} keyboardDismissMode="interactive">
      <Image source={r.image} style={{ height: 340 }} contentFit="cover" accessibilityLabel={r.title} />
      <View style={{ padding: space.l, gap: space.l }}>
        <View style={{ gap: 6 }}>
          <T variant="large" accessibilityRole="header">{r.title}</T>
          <T variant="body" color={c.label2}>{r.subtitle}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Avatar name={r.author} size={28} /><T variant="bodyB">{r.author}</T>
          </View>
        </View>
        {hits.length ? (
          <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: hexA(c.warn, 0.12) }}>
            <Icon name="exclamationmark.shield.fill" size={22} color={c.warn} /><T variant="bodyB" color={c.warn} style={{ flex: 1 }}>Bevat {hits.join(', ')}, waar je allergisch voor bent</T>
          </Card>
        ) : null}
        <T variant="body" color={c.label2}>
          <Text style={{ color: c.label, fontWeight: '600' }}>{r.minutes} minuten</Text> · {fmt(r.per.kcal)} kcal per portie{r.per.protein ? ` · ${fmt(r.per.protein)} g eiwit` : ''} · {r.difficulty.toLowerCase()}
        </T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PillButton style={{ flex: 1 }} tone={s.liked ? 'soft' : 'plain'} icon={s.liked ? 'heart.fill' : 'heart'} title={s.liked ? 'Leuk' : 'Like'} onPress={() => patch(x => { x.liked = !x.liked; })} />
          <PillButton style={{ flex: 1 }} tone={s.fav ? 'soft' : 'plain'} icon={s.fav ? 'bookmark.fill' : 'bookmark'} title="Bewaar" onPress={() => patch(x => { x.fav = !x.fav; })} />
          <PillButton style={{ flex: 1 }} tone="plain" icon="square.and.arrow.up" title="Deel" onPress={() => Share.share({ message: `${r.title}: ${r.subtitle}. ${fmt(r.per.kcal)} kcal per portie, recept in Bord.` })} />
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T variant="title">Ingrediënten</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Stepper onMinus={() => patch(x => { x.servings = Math.max(1, servings - 1); })} onPlus={() => patch(x => { x.servings = Math.min(12, servings + 1); })} labels={['Minder personen', 'Meer personen']} />
              <T variant="bodyB">{servings} pers.</T>
            </View>
          </View>
          <Card pad={false}>
            {r.ingredients.map((t, i) => (
              <View key={i}>
                {i ? <Divider inset={56} /> : null}
                <Check on={ing.includes(i)} text={scaleText(t, r.servings, servings)} onPress={() => patch(x => { x.ing = toggleIn(ing, i); })} />
              </View>
            ))}
          </Card>
          <T variant="sub" color={c.label2}>{ing.length}/{r.ingredients.length} in huis · tik om af te vinken</T>
        </View>

        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T variant="title">Bereiding</T><T variant="bodyB" color={c.label2}>{steps.length}/{r.steps.length} klaar</T>
          </View>
          <Bar value={steps.length / Math.max(1, r.steps.length)} color={c.accent} />
          <Card pad={false}>
            {r.steps.map((st, i) => {
              const done = steps.includes(i), active = timer?.step === i;
              return (
                <View key={i}>
                  {i ? <Divider inset={60} /> : null}
                  <View style={{ flexDirection: 'row', gap: 14, padding: 16 }}>
                    <Pressable onPress={() => { haptic.light(); patch(x => { x.steps = toggleIn(steps, i); }); }} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`Stap ${i + 1}`}
                      style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.good : hexA(c.accent, 0.14) }}>
                      {done ? <Icon name="checkmark" size={15} color="#fff" /> : <Text style={{ color: c.accent, fontWeight: '700' }}>{i + 1}</Text>}
                    </Pressable>
                    <View style={{ flex: 1, gap: 8 }}>
                      <T variant="body" color={done ? c.label2 : c.label} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{st.text}</T>
                      {st.minutes ? (
                        <PillButton style={{ alignSelf: 'flex-start' }} icon="timer" title={active ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} · stop` : `Timer ${st.minutes} min`}
                          onPress={() => (active ? stopTimer() : startTimer(i, st.minutes!))} />
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        <Button title="Log 1 portie" icon="plus.circle.fill" right={`${fmt(r.per.kcal)} kcal`} onPress={log} />

        <View style={{ gap: 10 }}>
          <T variant="title">Reacties</T>
          <Card pad={false}>
            {comments.length ? comments.map((cm, i) => (
              <View key={cm.id}>
                {i ? <Divider inset={60} /> : null}
                <View style={{ flexDirection: 'row', gap: 10, padding: 14 }}>
                  <Avatar name={cm.author} photo={state.profile.photo} size={34} />
                  <View style={{ flex: 1 }}>
                    <T variant="sub"><Text style={{ fontWeight: '700' }}>{cm.author}</Text> {cm.text}</T>
                    <Pressable accessibilityRole="button" accessibilityLabel="Reactie verwijderen" hitSlop={8} onPress={() => Alert.alert('Reactie verwijderen?', undefined, [{ text: 'Annuleer', style: 'cancel' }, { text: 'Verwijder', style: 'destructive', onPress: () => update(st => { st.comments = st.comments.filter(x => x.id !== cm.id); }) }])}><T variant="cap" color={c.label2}>{new Date(cm.at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · Verwijder</T></Pressable>
                  </View>
                </View>
              </View>
            )) : <T variant="sub" color={c.label2} style={{ padding: 16 }}>Nog geen reacties. Heb je het gemaakt? Schrijf hoe het smaakte.</T>}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderTopWidth: 0.5, borderTopColor: c.sep }}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Schrijf een reactie…" placeholderTextColor={c.label3} onSubmitEditing={send} returnKeyType="send"
                style={{ flex: 1, backgroundColor: c.fill, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, color: c.label }} accessibilityLabel="Reactie" />
              <IconButton icon="paperplane.fill" label="Plaats reactie" color={c.accent} onPress={send} />
            </View>
          </Card>
        </View>
      </View>
    {r.credit ? <T variant="cap" color={c.label3} style={{ fontWeight: '400', paddingHorizontal: 20, paddingBottom: 24 }}>Foto: {r.credit.artist}, {r.credit.license}, via Wikimedia Commons</T> : null}
    </ScrollView>
  );
}

function Check({ on, text, onPress }: { on: boolean; text: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { haptic.tap(); onPress(); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: pressed ? c.fill : 'transparent' })}>
      <View style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: on ? c.good : c.label3, backgroundColor: on ? c.good : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Icon name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <T variant="body" color={on ? c.label2 : c.label} style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>{text}</T>
    </Pressable>
  );
}
