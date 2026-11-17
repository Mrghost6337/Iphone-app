import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Card, Divider, GradientButton, Icon, IconButton, PillButton, Row, T, haptic } from '@/components/ui';
import { myCode, parseCode } from '@/lib/friendcode';
import { fmt, targets } from '@/lib/nutrition';
import { points } from '@/lib/points';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';

export default function Friends() {
  const { state, update } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const p = state.profile, t = useMemo(() => targets(p), [p]);
  const pts = useMemo(() => points(state.entries, t), [state.entries, t]);
  const [showQR, setShowQR] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const myId = state.userId;
  const code = myCode(myId, p, t, pts);

  const board = [{ id: myId, name: p.name || 'Jij', week: pts.week, total: pts.total, streak: pts.streak, me: true, plan: null as null | { k: number; p: number; c: number; f: number } },
    ...state.friends.map(f => ({ ...f, me: false }))].sort((a, b) => b.week - a.week || b.total - a.total);

  const invite = () => Share.share({ message: `Doe je mee met Bord? We houden samen onze maaltijden bij en strijden om de meeste punten. Ik sta op ${pts.week} punten deze week. Scan mijn code in Bord › Vrienden.` });

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.l }}>
        <IconButton icon="gearshape" label="Instellingen" onPress={() => router.push('/settings')} />
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <T variant="large">Vrienden</T>
        <T variant="bodyB" color={c.label2}>Samen gezonder, met een beetje competitie</T>
      </View>

      <View style={{ marginHorizontal: space.l, marginBottom: space.l }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={p.name} photo={p.photo} size={60} />
          <View style={{ flex: 1 }}>
            <T variant="h2">{p.name || 'Jij'}</T>
            <T variant="sub" color={c.label2}>{fmt(pts.week)} punten deze week · {pts.streak} {pts.streak === 1 ? 'dag' : 'dagen'} op rij · {pts.scans} scans</T>
          </View>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: space.l, marginBottom: space.xl }}>
        <GradientButton title="Mijn code" icon="qrcode" onPress={() => setShowQR(true)} style={{ flex: 1 }} />
        <PillButton title="Scan vriend" icon="qrcode.viewfinder" tone="plain" onPress={() => setScanning(true)} style={{ flex: 1, height: 58, borderRadius: 29 }} />
      </View>

      <View style={{ marginHorizontal: space.l, marginBottom: space.xl, gap: 10 }}>
        <T variant="h2">Ranglijst deze week</T>
        <Card pad={false}>
          {board.map((f, i) => (
            <View key={f.id}>
              {i ? <Divider inset={60} /> : null}
              <Row onPress={f.me ? undefined : () => setOpen(open === f.id ? null : f.id)} label={`${i + 1}e ${f.name}, ${f.week} punten`}>
                <Text style={{ width: 26, textAlign: 'center', fontSize: 18, fontWeight: '900', color: i === 0 ? '#E0A800' : i === 1 ? '#9AA4AE' : i === 2 ? '#C77B3F' : c.label }}>{i + 1}</Text>
                <Avatar name={f.name} photo={f.me ? p.photo : null} size={40} />
                <View style={{ flex: 1 }}>
                  <T variant="bodyB">{f.name}{f.me ? ' (jij)' : ''}</T>
                  <T variant="sub" color={c.label2}>{f.streak} dagen reeks{f.me ? '' : ` · bijgewerkt ${new Date((f as { updatedAt?: number }).updatedAt ?? 0).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}</T>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: c.label, fontVariant: ['tabular-nums'] }}>{fmt(f.week)}<Text style={{ fontSize: 12, color: c.label2 }}> pnt</Text></Text>
              </Row>
              {open === f.id && !f.me ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
                  {([['Calorieën', 'k', t.calories], ['Eiwit (g)', 'p', t.protein], ['Koolhydraten (g)', 'c', t.carbs], ['Vet (g)', 'f', t.fat]] as const).map(([l, k, mine]) => (
                    <View key={k} style={{ flexDirection: 'row' }}>
                      <T variant="sub" style={{ flex: 1 }}>{l}</T>
                      <T variant="bodyB" style={{ width: 70, textAlign: 'right' }}>{(() => { const pl = state.friends.find(x => x.id === f.id)?.plan; return pl ? fmt(pl[k]) : '–'; })()}</T>
                      <T variant="bodyB" color={c.accent} style={{ width: 70, textAlign: 'right' }}>{fmt(mine)}</T>
                    </View>
                  ))}
                  <T variant="cap" color={c.label2}>Grijs: {f.name} · Oranje: jij</T>
                  <PillButton title="Verwijder vriend" icon="person.badge.minus" tone="danger" onPress={() => update(s => { s.friends = s.friends.filter(x => x.id !== f.id); })} />
                </View>
              ) : null}
            </View>
          ))}
        </Card>
        {state.friends.length === 0 ? <T variant="sub" color={c.label2}>Nog geen vrienden. Laat een vriend jouw code scannen en scan die van hem of haar terug.</T> : null}
      </View>

      <View style={{ marginHorizontal: space.l, gap: 10 }}>
        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="trophy.fill" size={18} color={c.fat} /><T variant="h3">Zo verdien je punten</T></View>
          <T variant="sub" color={c.label2}>+10 per gescande maaltijd · +5 per andere invoer · +20 per dag binnen 10% van je doel · +15 als je je eiwitdoel haalt</T>
        </Card>
        <PillButton title="Nodig iemand uit" icon="square.and.arrow.up" tone="plain" onPress={invite} />
      </View>

      <Modal visible={showQR} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowQR(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', padding: space.xl, gap: 18 }}>
          <View style={{ alignSelf: 'stretch', alignItems: 'flex-end' }}><IconButton icon="xmark" label="Sluit" onPress={() => setShowQR(false)} /></View>
          <T variant="title">Mijn Bord-code</T>
          <T variant="sub" color={c.label2} style={{ textAlign: 'center' }}>Laat je vriend deze code scannen via Vrienden › Scan vriend. Zo komen jullie in elkaars ranglijst en kun je plannen vergelijken.</T>
          <View style={{ backgroundColor: '#fff', padding: 18, borderRadius: 24 }}><QRCode value={code} size={240} /></View>
          <T variant="bodyB">{fmt(pts.week)} punten · {fmt(t.calories)} kcal-plan</T>
          <T variant="cap" color={c.label2} style={{ textAlign: 'center', fontWeight: '500' }}>De code bevat alleen je naam, punten, reeks en plan. Geen maaltijden.</T>
        </View>
      </Modal>

      <FriendScanner visible={scanning} onClose={() => setScanning(false)} onCode={data => {
        const f = parseCode(data);
        if (!f) { haptic.warn(); Alert.alert('Geen Bord-code', 'Deze QR-code komt niet uit Bord.'); return; }
        if (f.id === myId) { Alert.alert('Dat ben jij', 'Scan de code van een vriend.'); return; }
        haptic.success();
        update(s => { s.friends = [...s.friends.filter(x => x.id !== f.id), f]; });
        setScanning(false);
        Alert.alert(`${f.name} toegevoegd`, `${f.week} punten deze week. Scan later opnieuw om bij te werken.`);
      }} />
    </ScrollView>
  );
}

function FriendScanner({ visible, onClose, onCode }: { visible: boolean; onClose: () => void; onCode: (d: string) => void }) {
  const [perm, request] = useCameraPermissions();
  const busy = useRef(false);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} onShow={() => { busy.current = false; if (!perm?.granted) request(); }}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {perm?.granted ? (
          <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => { if (busy.current) return; busy.current = true; onCode(data); setTimeout(() => { busy.current = false; }, 1500); }} />
        ) : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 17 }}>Camera-toegang nodig om te scannen</Text></View>}
        <View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: '30%', width: 250, height: 250, borderRadius: 28, borderWidth: 4, borderColor: '#fff' }} />
        <View style={{ position: 'absolute', top: insets.top + 10, left: 16 }}><IconButton icon="xmark" label="Sluit" onPress={onClose} /></View>
        <Text style={{ position: 'absolute', bottom: insets.bottom + 40, alignSelf: 'center', color: '#fff', fontSize: 17, fontWeight: '700' }}>Richt op de Bord-code van je vriend</Text>
      </View>
    </Modal>
  );
}
