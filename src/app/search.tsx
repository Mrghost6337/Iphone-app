import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Divider, Icon, PillButton, Row, T } from '@/components/ui';
import { Food, fmt, searchFoods } from '@/lib/nutrition';
import { searchProducts } from '@/lib/openfoodfacts';
import { addScanFood, scanSession, setAmountFood } from '@/lib/session';
import { useStore } from '@/lib/store';
import { radius, space, useColors } from '@/lib/theme';

/** Search the offline database instantly; branded products from Open Food Facts stream in. */
export default function Search() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState<{ term: string; products: Food[]; error: string | null; done: boolean }>({ term: '', products: [], error: null, done: true });
  const term = q.trim();

  useEffect(() => {
    if (term.length < 3) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      setRemote({ term, products: [], error: null, done: false });
      try { const r = await searchProducts(term); if (!cancelled) setRemote({ term, products: r, error: null, done: true }); }
      catch (e) { if (!cancelled) setRemote({ term, products: [], error: e instanceof Error ? e.message : 'Zoeken lukte niet.', done: true }); }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [term]);
  const current = remote.term === term && term.length >= 3;
  const products = current ? remote.products : [];
  const error = current ? remote.error : null;
  const loading = term.length >= 3 && (!current || !remote.done);

  const recent: Food[] = [];
  const seen = new Set<string>();
  for (const e of [...state.entries].reverse()) {
    if (seen.has(e.name) || !e.ref) continue; seen.add(e.name);
    recent.push({ id: e.ref, key: e.ref, name: e.name, aliases: [], category: '', per100: e.per100, portionLabel: null, portionGrams: e.grams, vision: [], brand: e.brand });
    if (recent.length >= 8) break;
  }
  const local = searchFoods(q);
  const sections: { title: string; data: Food[] }[] = [];
  if (!q && recent.length) sections.push({ title: 'Recent gegeten', data: recent });
  if (local.length) sections.push({ title: 'Algemene producten', data: local });
  if (products.length) sections.push({ title: 'Merkproducten (Open Food Facts)', data: products });

  const pick = (f: Food) => {
    if (scanSession.pickFor === 'review') {
      addScanFood(f);
      router.back();
    } else {
      setAmountFood(f);
      router.back();
      router.push('/amount');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: space.l }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.l, paddingBottom: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.fill, borderRadius: 14, paddingHorizontal: 14, height: 48 }}>
          <Icon name="magnifyingglass" size={18} color={c.label2} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Bijv. kwark, banaan, pindakaas" placeholderTextColor={c.label3} returnKeyType="search"
            style={{ flex: 1, fontSize: 17, color: c.label }} accessibilityLabel="Zoek product" />
        </View>
        <PillButton title="Klaar" tone="plain" onPress={() => router.back()} />
      </View>
      <FlatList
        data={sections}
        keyExtractor={s => s.title}
        contentContainerStyle={{ padding: space.l, gap: space.l, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40, gap: 8 }}>
            {loading ? <ActivityIndicator /> : <Icon name="magnifyingglass" size={40} color={c.label3} />}
            <T variant="h3">{q ? (loading ? 'Merkproducten zoeken…' : `Niets gevonden voor "${q}"`) : 'Wat heb je gegeten?'}</T>
            <T variant="sub" color={c.label2} style={{ textAlign: 'center' }}>{error ?? (q ? 'Probeer een algemener woord of scan de barcode.' : 'Zoek in 134 algemene producten en miljoenen merkproducten.')}</T>
          </View>
        }
        ListFooterComponent={loading && sections.length ? <ActivityIndicator style={{ marginTop: 10 }} /> : error && sections.length ? <T variant="sub" color={c.label2}>{error}</T> : undefined}
        renderItem={({ item: s }) => (
          <View style={{ gap: 8 }}>
            <T variant="h3" style={{ paddingHorizontal: 4 }}>{s.title}</T>
            <Card pad={false}>
              {s.data.map((f, i) => (
                <View key={f.id + i}>
                  {i ? <Divider /> : null}
                  <Row onPress={() => pick(f)} label={f.name}>
                    <View style={{ flex: 1 }}>
                      <T variant="bodyB" numberOfLines={2}>{f.name}</T>
                      <T variant="sub" color={c.label2}>{[f.brand, f.portionLabel ? `${f.portionLabel} (${fmt(f.portionGrams)} g)` : null].filter(Boolean).join(' · ')}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <T variant="bodyB">{fmt(f.per100.kcal)}</T>
                      <T variant="cap" color={c.label2}>kcal/100 g</T>
                    </View>
                  </Row>
                </View>
              ))}
            </Card>
          </View>
        )}
        style={{ borderRadius: radius.l }}
      />
    </View>
  );
}
