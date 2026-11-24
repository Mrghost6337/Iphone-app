import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ruler } from '@/components/Ruler';
import { Avatar, Card, Chip, Divider, Icon, PillButton, Row, Stepper, T, hexA } from '@/components/ui';
import { getApiKey } from '@/lib/ai';
import { scheduleMealReminders } from '@/lib/notifications';
import { ACTIVITIES, ALLERGENS, DIETS, GOALS, Profile, age, changesWeight, fmt, kg1, scaled, targets } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

/** Settings label: a quiet SF Symbol in a fixed 28pt slot, so titles align. Red only for destructive rows. */
function Label({ icon, title, danger }: { icon: string; title: string; danger?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
      <View style={{ width: 28, alignItems: 'center' }}><Icon name={icon} size={19} color={danger ? c.warn : c.label2} weight="regular" /></View>
      <T variant="body" color={danger ? c.warn : undefined} style={{ flexShrink: 0 }}>{title}</T>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ gap: 8 }}><T variant="h3" style={{ paddingHorizontal: 4 }}>{title}</T><Card pad={false}>{children}</Card></View>;
}

export default function Settings() {
  const { state, update, reset } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const p = state.profile, t = targets(p);
  const [hasKey, setHasKey] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { getApiKey().then(k => setHasKey(!!k)); }, []);
  const setP = (patch: Partial<Profile>) => update(s => { s.profile = { ...s.profile, ...patch }; });
  const chev = <Icon name="chevron.right" size={14} color={c.label3} />;

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
    if (!r.canceled && r.assets[0]?.base64) setP({ photo: `data:image/jpeg;base64,${r.assets[0].base64}` });
  };
  const exportCSV = async () => {
    const rows = [['datum', 'maaltijd', 'naam', 'gram', 'kcal', 'eiwit_g', 'koolhydraten_g', 'vet_g', 'bron'], ...state.entries.map(e => {
      const n = scaled(e.per100, e.grams); return [e.date, e.meal, e.name, String(e.grams), n.kcal.toFixed(0), n.protein.toFixed(1), n.carbs.toFixed(1), n.fat.toFixed(1), e.source];
    })].map(r => r.map(x => (/[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)).join(';')).join('\n');
    const file = new File(Paths.cache, 'bord-export.csv');
    if (file.exists) file.delete();
    await file.write(rows);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Bord-export' });
  };
  const toggleReminders = async (on: boolean) => {
    setP({ remindersOn: on });
    const ok = await scheduleMealReminders({ ...p, remindersOn: on });
    if (on && !ok) { setP({ remindersOn: false }); Alert.alert('Meldingen staan uit', 'Zet meldingen voor Expo Go / Bord aan in de iOS-instellingen.'); }
  };
  const wipe = () => Alert.alert('Alles verwijderen?', 'Je maaltijden, gewichten, recepten en profiel op dit toestel worden gewist.', [
    { text: 'Annuleer', style: 'cancel' }, { text: 'Verwijder alles', style: 'destructive', onPress: () => { router.dismissAll(); reset(); } },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.l }}>
        <View style={{ width: 70 }} /><T variant="h3">Instellingen</T><PillButton title="Klaar" onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.l, gap: space.xl, paddingBottom: insets.bottom + 40 }} keyboardDismissMode="interactive">
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Wijzig profielfoto">
            <Avatar name={p.name} photo={p.photo} size={104} />
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.bg }}><Icon name="camera.fill" size={14} color={c.onAccent} /></View>
          </Pressable>
          <T variant="title">{p.name || 'Jij'}</T>
          {p.photo ? <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setP({ photo: null })}><T variant="bodyB" color={c.warn}>Profielfoto verwijderen</T></Pressable> : <T variant="sub" color={c.label2}>Tik op de foto om er een te kiezen</T>}
        </View>

        <Section title="Account">
          <Row><Label icon="person.fill" title="Naam" /><TextInput value={p.name} onChangeText={v => setP({ name: v })} style={{ color: c.label2, fontSize: 16, minWidth: 120, textAlign: 'right' }} accessibilityLabel="Naam" /></Row>
          <Divider inset={60} />
          <Row><Label icon="envelope.fill" title="E-mail" /><TextInput value={p.email} onChangeText={v => setP({ email: v.trim() })} placeholder="Optioneel" placeholderTextColor={c.label3} keyboardType="email-address" autoCapitalize="none" style={{ color: c.label2, fontSize: 16, minWidth: 140, textAlign: 'right' }} accessibilityLabel="E-mail" /></Row>
        </Section>

        <Section title="Lichaam en doelen">
          <Row onPress={() => setOpen(open === 'goal' ? null : 'goal')} label="Doel"><Label icon="target" title="Doel" /><T variant="sub" color={c.label2}>{GOALS.find(g => g.id === p.goal)!.title}</T>{chev}</Row>
          {open === 'goal' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>{GOALS.map(g => <Chip key={g.id} title={g.title} on={p.goal === g.id} onPress={() => setP({ goal: g.id, target: changesWeight(g.id) ? p.target : p.weight })} />)}</View> : null}
          <Divider inset={60} />
          <Row onPress={() => router.push('/weight')} label="Gewicht"><Label icon="scalemass.fill" title="Gewicht" /><T variant="sub" color={c.label2}>{kg1(p.weight)} kg</T>{chev}</Row>
          <Divider inset={60} />
          <Row onPress={() => setOpen(open === 'height' ? null : 'height')} label="Lengte"><Label icon="ruler" title="Lengte" /><T variant="sub" color={c.label2}>{p.height} cm</T>{chev}</Row>
          {open === 'height' ? <View style={{ padding: 12 }}><Ruler value={p.height} min={120} max={220} step={1} labelEvery={10} label="Lengte" onChange={v => setP({ height: v })} /></View> : null}
          {changesWeight(p.goal) ? (<>
            <Divider inset={60} />
            <Row onPress={() => setOpen(open === 'target' ? null : 'target')} label="Streefgewicht"><Label icon="flag.checkered" title="Streefgewicht" /><T variant="sub" color={c.label2}>{kg1(p.target)} kg</T>{chev}</Row>
            {open === 'target' ? <View style={{ padding: 12 }}><Ruler value={p.target} min={35} max={200} step={0.5} labelEvery={5} label="Streefgewicht" onChange={v => setP({ target: v })} /></View> : null}
          </>) : null}
          <Divider inset={60} />
          <Row onPress={() => setOpen(open === 'act' ? null : 'act')} label="Activiteit"><Label icon="figure.run" title="Activiteit" /><T variant="sub" color={c.label2}>{ACTIVITIES.find(a => a.id === p.activity)!.title}</T>{chev}</Row>
          {open === 'act' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>{ACTIVITIES.map(a => <Chip key={a.id} title={a.title} on={p.activity === a.id} onPress={() => setP({ activity: a.id })} />)}</View> : null}
          <Divider inset={60} />
          <Row><Label icon="flame.fill" title="Dagelijks doel" /><T variant="bodyB">{fmt(t.calories)} kcal</T></Row>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
            <T variant="sub" color={c.label2} style={{ flex: 1 }}>{p.custom ? 'Handmatig ingesteld' : `Automatisch: Mifflin-St Jeor, leeftijd ${age(p)}`}</T>
            <Stepper onMinus={() => setP({ custom: Math.max(1000, (p.custom ?? t.calories) - 50) })} onPlus={() => setP({ custom: Math.min(5000, (p.custom ?? t.calories) + 50) })} />
            {p.custom ? <PillButton title="Auto" tone="plain" onPress={() => setP({ custom: null })} /> : null}
          </View>
        </Section>

        <Section title="Voeding">
          <View style={{ padding: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DIETS.map(d => <Chip key={d.id} title={d.title} on={p.diet === d.id} onPress={() => setP({ diet: d.id })} />)}</View>
            <T variant="cap" color={c.label2}>Allergieën</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{ALLERGENS.map(a => <Chip key={a} title={a} on={p.allergies.includes(a)} onPress={() => setP({ allergies: p.allergies.includes(a) ? p.allergies.filter(x => x !== a) : [...p.allergies, a] })} />)}</View>
          </View>
          <Divider />
          <Row><Label icon="fork.knife" title={`${p.meals} maaltijden per dag`} /><Stepper onMinus={() => setP({ meals: Math.max(2, p.meals - 1) })} onPlus={() => setP({ meals: Math.min(4, p.meals + 1) })} /></Row>
          <Divider inset={60} />
          <Row><Label icon="carrot.fill" title="Tussendoortjes" /><Switch value={p.snacks} onValueChange={v => setP({ snacks: v })} trackColor={{ true: c.good }} /></Row>
        </Section>

        <Section title="Meldingen">
          <Row><Label icon="bell.fill" title="Maaltijdherinneringen" /><Switch value={p.remindersOn} onValueChange={toggleReminders} trackColor={{ true: c.good }} /></Row>
          {p.remindersOn ? <T variant="sub" color={c.label2} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>Om {p.reminders.breakfast}, {p.reminders.lunch} en {p.reminders.dinner}. Pas de tijden aan via de vragenlijst.</T> : null}
        </Section>

        <Section title="App">
          <Row><Label icon="circle.lefthalf.filled" title="Weergave" /></Row>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
            {([['system', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']] as const).map(([v, l]) => <Chip key={v} title={l} on={state.prefs.appearance === v} onPress={() => update(s => { s.prefs.appearance = v; })} />)}
          </View>
          <Divider inset={60} />
          <Row><Label icon="bolt.fill" title="Energie-eenheid" /><View style={{ flexDirection: 'row', gap: 6 }}>{(['kcal', 'kJ'] as const).map(u => <Chip key={u} title={u} on={state.prefs.unit === u} onPress={() => update(s => { s.prefs.unit = u; })} />)}</View></Row>
          <Divider inset={60} />
          <Row onPress={() => router.push('/apikey')} label="AI-herkenning"><Label icon="sparkles" title="AI-herkenning (foto's)" /><T variant="sub" color={hasKey ? c.good : c.warn}>{hasKey ? 'Aan' : 'Sleutel nodig'}</T>{chev}</Row>
        </Section>

        <Section title="Privacy en gegevens">
          <Row onPress={exportCSV} label="Exporteer als CSV"><Label icon="square.and.arrow.up" title="Exporteer als CSV" />{chev}</Row>
          <Divider inset={60} />
          <Row onPress={() => { Clipboard.setStringAsync(JSON.stringify(state.profile)); Alert.alert('Gekopieerd', 'Je profiel staat op het klembord.'); }} label="Kopieer profiel"><Label icon="doc.on.doc" title="Kopieer mijn profiel" />{chev}</Row>
          <Divider inset={60} />
          <Row onPress={() => router.push('/onboarding')} label="Vragenlijst opnieuw"><Label icon="arrow.counterclockwise" title="Vragenlijst opnieuw doen" />{chev}</Row>
          <Divider inset={60} />
          <Row onPress={wipe} label="Alles verwijderen"><Label icon="trash" title="Alles verwijderen" danger /></Row>
        </Section>

        <Card style={{ gap: 6, backgroundColor: hexA(c.accent, 0.08) }}>
          <T variant="h3">Over Bord</T>
          <T variant="sub" color={c.label2}>Formule: Mifflin-St Jeor (1990) · Producten: USDA/NEVO-referentiewaarden · Merkproducten: Open Food Facts · Receptfoto’s: Wikimedia Commons (vrije licenties). Bord geeft schattingen en is geen medisch hulpmiddel.</T>
        </Card>
        <Text style={{ textAlign: 'center', color: c.label3, fontSize: 12, borderRadius: radius.s }}>Bord 2.0 · Expo SDK 58</Text>
      </ScrollView>
    </View>
  );
}
