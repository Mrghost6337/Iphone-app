import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ruler } from '@/components/Ruler';
import { Avatar, Card, Chip, ChoiceRow, Button, Icon, IconBadge, IconButton, T, Tile, haptic } from '@/components/ui';
import { ACTIVITIES, ALLERGENS, DIETS, GOALS, MEALS, MOTIVES, OBSTACLES, Profile, age, changesWeight, energyGoal, fmt, kg1, suggestedActivity, targets, weeksToGoal, nowMs } from '@/lib/nutrition';
import { scheduleMealReminders } from '@/lib/notifications';
import { Field } from '@/components/Field';
import { useStore } from '@/lib/store';
import { curve, space, useColors } from '@/lib/theme';

const STEPS = ['welcome', 'name', 'goal', 'sex', 'birthday', 'height', 'weight', 'target', 'workouts', 'activity', 'diet', 'allergies',
  'meals', 'cook', 'motives', 'obstacles', 'reminders', 'privacy', 'calc', 'plan'] as const;
type Step = (typeof STEPS)[number];
const QUESTIONS = STEPS.filter(s => !['welcome', 'calc', 'plan'].includes(s));
const SKIPPABLE = (s: Step) => !['welcome', 'name', 'privacy', 'calc', 'plan'].includes(s);

export default function Onboarding() {
  const { state, update } = useStore();
  const [p, setP] = useState<Profile>(state.profile);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const insets = useSafeAreaInsets();
  const c = useColors();
  const step = STEPS[i];
  const set = (patch: Partial<Profile>) => setP(prev => ({ ...prev, ...patch }));

  const go = (d: 1 | -1) => {
    haptic.tap();
    let n = i + d;
    if (step === 'workouts' && d > 0) set({ activity: suggestedActivity(p.workouts) });
    while (STEPS[n] === 'target' && !changesWeight(p.goal)) n += d;
    setDir(d); setI(Math.max(0, Math.min(STEPS.length - 1, n)));
  };
  const finish = () => {
    haptic.success();
    const final = { ...p, target: changesWeight(p.goal) ? p.target : p.weight };
    update(s => { s.profile = final; s.onboarded = true; s.weights.push({ id: String(Date.now()), date: new Date().toISOString(), kg: final.weight }); });
    scheduleMealReminders(final).catch(() => {});
  };

  const qi = QUESTIONS.indexOf(step as never);
  // A short directional fade (24pt, 240 ms, ease-out) instead of a full-screen spring: the step changes, the eye stays put.
  // Reanimated drops the movement automatically when Reduce Motion is on.
  const ease = Easing.bezier(...curve.out);
  const entering = (dir > 0 ? FadeInRight : FadeInLeft).duration(240).easing(ease);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 6 }}>
        {step !== 'welcome' && step !== 'calc' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.l, height: 48 }}>
            <IconButton icon="chevron.left" label="Terug" onPress={() => go(-1)} />
            {qi >= 0 ? (
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.fill, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityLabel={`Vraag ${qi + 1} van ${QUESTIONS.length}`} accessibilityValue={{ min: 0, max: QUESTIONS.length, now: qi + 1 }}>
                <View style={{ width: `${((qi + 1) / QUESTIONS.length) * 100}%`, height: 4, borderRadius: 2, backgroundColor: c.accent }} />
              </View>
            ) : <View style={{ flex: 1 }} />}
            {SKIPPABLE(step) ? <Pressable accessibilityRole="button" onPress={() => go(1)} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}><T variant="body" color={c.label2}>Sla over</T></Pressable> : null}
          </View>
        ) : null}
      </View>
      <Animated.View key={step} entering={entering} style={{ flex: 1 }}>
        <StepView step={step} p={p} set={set} next={() => go(1)} finish={finish} bottom={insets.bottom} />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function Page({ title, sub, children, button = 'Ga verder', onNext, disabled, bottom }: { title: string; sub?: string; children?: React.ReactNode; button?: string; onNext: () => void; disabled?: boolean; bottom: number }) {
  const c = useColors();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={{ gap: 8 }}>
          <T variant="large" accessibilityRole="header">{title}</T>
          {sub ? <T variant="body" color={c.label2}>{sub}</T> : null}
        </View>
        {children}
      </ScrollView>
      <View style={{ paddingHorizontal: space.xl, paddingBottom: Math.max(bottom, 16) + 8, paddingTop: 8 }}>
        <Button title={button} onPress={onNext} disabled={disabled} />
      </View>
    </View>
  );
}

function Big({ value, unit }: { value: string; unit: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
      <Text style={{ fontSize: 64, fontWeight: '700', letterSpacing: -1.8, color: c.label, fontVariant: ['tabular-nums'] }} accessibilityLabel={`${value} ${unit}`}>{value}</Text>
      <Text style={{ fontSize: 22, fontWeight: '600', color: c.label2 }}>{unit}</Text>
    </View>
  );
}

function StepView({ step, p, set, next, finish, bottom }: { step: Step; p: Profile; set: (x: Partial<Profile>) => void; next: () => void; finish: () => void; bottom: number }) {
  const c = useColors();
  const t = useMemo(() => targets(p), [p]);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  switch (step) {
    case 'welcome':
      return (
        <View style={{ flex: 1 }}>
          <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
            <Image source={require('../../assets/recipes/poke.jpg')} style={{ flex: 1 }} contentFit="cover" accessibilityIgnoresInvertColors
              accessible accessibilityLabel="Een pokébowl met zalm, rijst, avocado en edamame" />
          </Animated.View>
          <View style={{ paddingHorizontal: space.xl, paddingTop: 28, gap: 12, paddingBottom: Math.max(bottom, 16) + 8, backgroundColor: c.bg }}>
            <T variant="large" accessibilityRole="header">Maak een foto en zie wat je eet</T>
            <T variant="body" color={c.label2}>Bord herkent je maaltijd, zoekt elk onderdeel op in de voedingsdatabase en telt kcal, eiwit, koolhydraten en vet. Klopt iets niet, dan pas je het met één tik aan.</T>
            <Button title="Maak je plan" onPress={next} style={{ marginTop: 16 }} />
            <T variant="sub" color={c.label2} style={{ textAlign: 'center' }}>Hooguit 17 korte vragen, ongeveer 2 minuten</T>
          </View>
        </View>
      );
    case 'name': {
      const pick = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
        if (!r.canceled && r.assets[0]?.base64) set({ photo: `data:image/jpeg;base64,${r.assets[0].base64}` });
      };
      return (
        <Page title="Hoe mogen we je noemen?" sub="Je account staat op je iPhone. Een foto is optioneel en zien alleen je vrienden." onNext={next} disabled={!p.name.trim()} bottom={bottom}>
          <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel="Kies profielfoto" style={{ alignSelf: 'center' }}>
            <Avatar name={p.name} photo={p.photo} size={120} />
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.bg }}>
              <Icon name="camera.fill" size={15} color={c.onAccent} />
            </View>
          </Pressable>
          {p.photo ? <Pressable accessibilityRole="button" hitSlop={8} onPress={() => set({ photo: null })} style={{ alignSelf: 'center' }}><T variant="bodyB" color={c.warn}>Foto verwijderen</T></Pressable> : null}
          <Field value={p.name} onChange={v => set({ name: v })} placeholder="Voornaam" textContentType="givenName" autoFocus />
          <Field value={p.email} onChange={v => set({ email: v.trim() })} placeholder="E-mail (optioneel)" keyboardType="email-address" textContentType="emailAddress" />
        </Page>
      );
    }
    case 'goal':
      return (
        <Page title="Wat wil je bereiken?" sub="Hier stemmen we je calorieën en eiwit op af." onNext={next} bottom={bottom}>
          <View style={{ gap: 10 }}>
            {GOALS.map(g => <ChoiceRow key={g.id} title={g.title} detail={g.detail} icon={g.icon} on={p.goal === g.id}
              onPress={() => set({ goal: g.id, target: g.id === 'lose' ? Math.round(p.weight - 5) : g.id === 'gain' ? Math.round(p.weight + 3) : p.weight, rate: g.id === 'gain' ? 0.25 : 0.5 })} />)}
          </View>
        </Page>
      );
    case 'sex':
      return (
        <Page title="Wat is je geslacht?" sub="Je energieverbruik in rust verschilt licht tussen mannen en vrouwen." onNext={next} bottom={bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile title="Vrouw" icon="figure.stand.dress" on={p.sex === 'female'} onPress={() => set({ sex: 'female' })} />
            <Tile title="Man" icon="figure.stand" on={p.sex === 'male'} onPress={() => set({ sex: 'male' })} />
          </View>
        </Page>
      );
    case 'birthday': {
      const max = new Date(new Date().getFullYear() - 13, 11, 31), min = new Date(new Date().getFullYear() - 100, 0, 1);
      return (
        <Page title="Wanneer ben je jarig?" sub="Swipe de wieltjes. Je stofwisseling verandert met je leeftijd." onNext={next} bottom={bottom}>
          <Big value={String(age(p))} unit="jaar" />
          <Card pad={false} style={{ alignItems: 'center' }}>
            <DateTimePicker value={new Date(p.birth)} mode="date" display="spinner" locale="nl-NL" maximumDate={max} minimumDate={min}
              onChange={(_, d) => d && set({ birth: d.toISOString() })} />
          </Card>
        </Page>
      );
    }
    case 'height':
      return (
        <Page title="Hoe lang ben je?" sub="Sleep de liniaal." onNext={next} bottom={bottom}>
          <Big value={fmt(p.height)} unit="cm" />
          <Ruler value={p.height} min={120} max={220} step={1} labelEvery={10} label="Lengte in centimeter" onChange={v => set({ height: v })} />
        </Page>
      );
    case 'weight':
      return (
        <Page title="Hoeveel weeg je nu?" sub="Een schatting is prima. Je kunt je gewicht later bijhouden." onNext={next} bottom={bottom}>
          <Big value={kg1(p.weight)} unit="kg" />
          <Ruler value={p.weight} min={35} max={200} step={0.5} labelEvery={5} label="Gewicht in kilogram"
            onChange={v => set({ weight: v, target: changesWeight(p.goal) ? p.target : v })} />
          <T variant="bodyB" color={c.label2} style={{ textAlign: 'center' }}>BMI {(p.weight / (p.height / 100) ** 2).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}</T>
        </Page>
      );
    case 'target': {
      const lose = energyGoal(p.goal) === 'lose', weeks = weeksToGoal(p) ?? 0, when = new Date(nowMs() + weeks * 7 * 864e5);
      return (
        <Page title="Wat is je streefgewicht?" onNext={next} bottom={bottom}>
          <Big value={kg1(p.target)} unit="kg" />
          <Ruler value={p.target} min={35} max={200} step={0.5} labelEvery={5} label="Streefgewicht in kilogram" onChange={v => set({ target: v })} />
          <T variant="bodyB" color={c.label2} style={{ textAlign: 'center' }}>{lose ? '−' : '+'}{kg1(Math.abs(p.weight - p.target))} kg</T>
          <T variant="h3">Hoe snel?</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([[0.25, 'Rustig', 'figure.walk'], [0.5, 'Aanbevolen', 'figure.run'], ...(lose ? [[0.75, 'Snel', 'flame']] : [])] as [number, string, string][]).map(([v, title, icon]) =>
              <Tile key={v} title={title} detail={`${String(v).replace('.', ',')} kg/week`} icon={icon} on={p.rate === v} onPress={() => set({ rate: v })} />)}
          </View>
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Icon name="flag.checkered" size={24} color={c.accent} />
            <View style={{ flex: 1 }}>
              <T variant="h3">Doel rond {when.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</T>
              <T variant="sub" color={c.label2}>{weeks} weken bij {String(p.rate).replace('.', ',')} kg per week</T>
            </View>
          </Card>
        </Page>
      );
    }
    case 'workouts':
      return (
        <Page title="Hoe vaak sport je per week?" sub="Wandelen telt mee als je er echt voor gaat." onNext={next} bottom={bottom}>
          <Big value={String(p.workouts)} unit="keer" />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28 }}>
            <IconButton icon="minus" size={72} label="Minder" onPress={() => set({ workouts: Math.max(0, p.workouts - 1) })} />
            <IconButton icon="plus" size={72} label="Meer" onPress={() => set({ workouts: Math.min(7, p.workouts + 1) })} />
          </View>
        </Page>
      );
    case 'activity':
      return (
        <Page title="En buiten het sporten?" sub="We hebben er alvast één gekozen op basis van je trainingen." onNext={next} bottom={bottom}>
          <View style={{ gap: 10 }}>{ACTIVITIES.map(a => <ChoiceRow key={a.id} title={a.title} detail={a.detail} icon={a.icon} on={p.activity === a.id} onPress={() => set({ activity: a.id })} />)}</View>
        </Page>
      );
    case 'diet':
      return (
        <Page title="Hoe eet je?" sub="Recepten worden hierop gefilterd." onNext={next} bottom={bottom}>
          <Grid>{DIETS.map(d => <Tile key={d.id} title={d.title} icon={d.icon} on={p.diet === d.id} onPress={() => set({ diet: d.id })} style={{ flexBasis: '47%' }} />)}</Grid>
        </Page>
      );
    case 'allergies':
      return (
        <Page title="Allergieën of dingen die je niet eet?" sub="Kies alles wat geldt. Recepten met deze ingrediënten krijgen een waarschuwing." onNext={next} bottom={bottom}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ALLERGENS.map(a => <Chip key={a} title={a[0].toUpperCase() + a.slice(1)} on={p.allergies.includes(a)} onPress={() => set({ allergies: toggle(p.allergies, a) })} />)}
          </View>
        </Page>
      );
    case 'meals':
      return (
        <Page title="Hoeveel maaltijden eet je per dag?" sub="We verdelen je calorieën over je eetmomenten." onNext={next} bottom={bottom}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[2, 3, 4].map(n => <Tile key={n} title={String(n)} detail="maaltijden" icon="fork.knife" on={p.meals === n} onPress={() => set({ meals: n })} />)}
          </View>
          <ChoiceRow title="Ik neem ook tussendoortjes" detail="Krijgen een eigen budget" icon="carrot" on={p.snacks} onPress={() => set({ snacks: !p.snacks })} />
        </Page>
      );
    case 'cook':
      return (
        <Page title="Hoeveel tijd heb je om te koken?" sub="Bepaalt welke recepten bovenaan staan." onNext={next} bottom={bottom}>
          <View style={{ gap: 10 }}>
            <ChoiceRow title="Snel" detail="Max. 20 minuten" icon="timer" on={p.cook === 'quick'} onPress={() => set({ cook: 'quick' })} />
            <ChoiceRow title="Gemiddeld" detail="20–40 minuten" icon="clock" on={p.cook === 'normal'} onPress={() => set({ cook: 'normal' })} />
            <ChoiceRow title="Ik kook graag" detail="Mag uitgebreid" icon="frying.pan" on={p.cook === 'chef'} onPress={() => set({ cook: 'chef' })} />
          </View>
        </Page>
      );
    case 'motives':
      return (
        <Page title="Waarom doe je dit?" sub="Kies er zoveel je wilt. We gebruiken dit om je aan te moedigen." onNext={next} bottom={bottom}>
          <View style={{ gap: 10 }}>{MOTIVES.map(m => <ChoiceRow key={m} title={m} on={p.motives.includes(m)} onPress={() => set({ motives: toggle(p.motives, m) })} />)}</View>
        </Page>
      );
    case 'obstacles':
      return (
        <Page title="Wat maakt het lastig?" sub="Eerlijk is fijn. Bord geeft je tips die hierbij passen." onNext={next} bottom={bottom}>
          <View style={{ gap: 10 }}>{OBSTACLES.map(m => <ChoiceRow key={m} title={m} on={p.obstacles.includes(m)} onPress={() => set({ obstacles: toggle(p.obstacles, m) })} />)}</View>
        </Page>
      );
    case 'reminders':
      return (
        <Page title="Zullen we je herinneren?" sub="Een zacht seintje rond je eetmomenten. Altijd uit te zetten." onNext={next} bottom={bottom}>
          <Card pad={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
              <IconBadge icon="bell" />
              <T variant="bodyB" style={{ flex: 1 }}>Herinneringen</T>
              <Switch value={p.remindersOn} onValueChange={v => set({ remindersOn: v })} trackColor={{ true: c.good }} />
            </View>
            {p.remindersOn ? MEALS.slice(0, 3).map(m => {
              const [h, mi] = p.reminders[m.id as 'breakfast'].split(':').map(Number);
              const d = new Date(); d.setHours(h, mi, 0, 0);
              return (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12, borderTopWidth: 0.5, borderTopColor: c.sep }}>
                  <Icon name={m.icon} size={20} color={c.label2} />
                  <T variant="body" style={{ flex: 1 }}>{m.title}</T>
                  <DateTimePicker value={d} mode="time" display="compact" locale="nl-NL"
                    onChange={(_, nd) => nd && set({ reminders: { ...p.reminders, [m.id]: `${String(nd.getHours()).padStart(2, '0')}:${String(nd.getMinutes()).padStart(2, '0')}` } })} />
                </View>
              );
            }) : null}
          </Card>
        </Page>
      );
    case 'privacy':
      return (
        <Page title="Jouw data blijft van jou" sub="Zo werkt Bord." button="Akkoord" onNext={next} bottom={bottom}>
          {[['lock.shield', 'Op je iPhone', 'Je maaltijden, gewicht en antwoorden worden alleen op dit toestel bewaard.'],
            ['sparkles', 'AI alleen als jij het vraagt', 'Een foto gaat pas naar de AI-herkenning als jij een sleutel instelt en op de sluiter drukt.'],
            ['hand.raised', 'Geen reclame, geen tracking', 'Exporteer of verwijder je gegevens wanneer je wilt.'],
            ['stethoscope', 'Geen medisch advies', 'Bord geeft schattingen. Bij een aandoening, zwangerschap of eetstoornis: overleg met een arts of diëtist.']].map(([icon, title, text]) => (
            <View key={title} style={{ flexDirection: 'row', gap: 16 }}>
              <IconBadge icon={icon} on size={30} />
              <View style={{ flex: 1, gap: 2 }}><T variant="h3">{title}</T><T variant="sub" color={c.label2}>{text}</T></View>
            </View>
          ))}
        </Page>
      );
    case 'calc':
      return <Calculating onDone={next} />;
    case 'plan': {
      const weeks = weeksToGoal(p);
      return (
        <Page title={`Je plan, ${p.name || 'jij'}`} sub="Berekend met de Mifflin-St Jeor-formule op basis van je antwoorden." button="Start met Bord" onNext={finish} bottom={bottom}>
          <Card style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 60, fontWeight: '700', letterSpacing: -1.6, color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(t.calories)}</Text>
            <T variant="bodyB" color={c.label2}>kcal per dag</T>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: c.sep, alignSelf: 'stretch' }}>
              {([['Eiwit', t.protein, c.protein], ['Koolhydraten', t.carbs, c.carbs], ['Vet', t.fat, c.fat]] as const).map(([n, v, col]) => (
                <View key={n} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} /><T variant="cap" numberOfLines={1} adjustsFontSizeToFit>{n === 'Koolhydraten' ? 'Koolh.' : n}</T></View>
                  <T variant="num" style={{ marginTop: 4 }}>{v} g</T>
                </View>
              ))}
            </View>
          </Card>
          <Card pad={false}>
            {[['drop.fill', 'Water', `${t.water} glazen per dag`], ['fork.knife', 'Eetmomenten', `${p.meals} maaltijden${p.snacks ? ' + tussendoor' : ''}`],
              ['leaf.fill', 'Voeding', DIETS.find(d => d.id === p.diet)!.title + (p.allergies.length ? ` · zonder ${p.allergies.join(', ')}` : '')],
              ['flame.fill', 'Verbruik (TDEE)', `${fmt(t.tdee)} kcal`], ...(weeks ? [['flag.checkered', 'Streefgewicht', `${kg1(p.target)} kg in ${weeks} weken`]] : [])].map(([icon, a, b], idx) => (
              <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: idx ? 0.5 : 0, borderTopColor: c.sep }}>
                <IconBadge icon={icon} />
                <T variant="bodyB" style={{ flex: 1 }}>{a}</T>
                <T variant="sub" color={c.label2} style={{ textAlign: 'right', flexShrink: 1 }}>{b}</T>
              </View>
            ))}
          </Card>
          {t.clamped ? <T variant="sub" color={c.warn}>We houden een veilig minimum aan, daardoor gaat het iets langzamer.</T> : null}
        </Page>
      );
    }
  }
}

/** The plan is computed instantly; this short checklist (about 1.4 s) shows what was taken into account. No fake percentage. */
function Calculating({ onDone }: { onDone: () => void }) {
  const c = useColors();
  const [n, setN] = useState(0);
  const lines = ['Energieverbruik uit lengte, gewicht, leeftijd en activiteit', 'Calorieën afgestemd op je doel en tempo', 'Eiwit, koolhydraten en vet verdeeld', 'Recepten gefilterd op je dieet en allergieën'];
  useEffect(() => {
    const ts = lines.map((_, k) => setTimeout(() => { setN(k + 1); haptic.tap(); }, 260 * (k + 1)));
    const done = setTimeout(onDone, 260 * lines.length + 500);
    return () => { ts.forEach(clearTimeout); clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: space.xl, gap: 24 }}>
      <T variant="title" accessibilityRole="header">Je plan wordt berekend</T>
      <View style={{ gap: 16 }} accessibilityLiveRegion="polite">
        {lines.map((l, k) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: k < n ? 1 : 0.3 }}>
            <Icon name={k < n ? 'checkmark.circle.fill' : 'circle'} size={22} color={k < n ? c.accent : c.label3} weight="regular" />
            <T variant="body" style={{ flex: 1 }}>{l}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}

