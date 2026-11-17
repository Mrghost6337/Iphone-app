import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultProfile, Meal, Nutrients, Profile, dayKey, uid } from './nutrition';

export type Entry = {
  id: string; name: string; ref: string | null; meal: Meal; grams: number; per100: Nutrients; date: string;
  source: 'photo' | 'barcode' | 'describe' | 'search' | 'recipe' | 'manual'; photo?: string | null; brand?: string;
};
export type Weight = { id: string; date: string; kg: number };
export type Post = {
  id: string; title: string; subtitle: string; photo: string; minutes: number; servings: number; kcal: number;
  ingredients: string[]; steps: string[]; tags: string[]; author: string; createdAt: number;
};
export type Comment = { id: string; recipeId: string; author: string; text: string; at: number };
export type RecipeState = { fav?: boolean; liked?: boolean; reposted?: boolean; ing?: number[]; steps?: number[]; servings?: number };
export type Friend = { id: string; name: string; week: number; total: number; streak: number; plan: { k: number; p: number; c: number; f: number; g: string }; updatedAt: number };
export type Prefs = { appearance: 'system' | 'light' | 'dark'; unit: 'kcal' | 'kJ'; haptics: boolean; leaderboard: boolean };

export type State = {
  v: 1; userId: string; onboarded: boolean; profile: Profile; entries: Entry[]; weights: Weight[]; water: Record<string, number>;
  recipes: Record<string, RecipeState>; posts: Post[]; comments: Comment[]; friends: Friend[]; prefs: Prefs;
};

const fresh = (): State => ({
  v: 1, userId: uid(), onboarded: false, profile: defaultProfile(), entries: [], weights: [], water: {}, recipes: {}, posts: [], comments: [], friends: [],
  prefs: { appearance: 'system', unit: 'kcal', haptics: true, leaderboard: true },
});

const KEY = 'bord-state-v1';

type Ctx = {
  state: State; ready: boolean;
  update: (fn: (s: State) => void) => void;
  logEntries: (items: Omit<Entry, 'id'>[]) => void;
  reset: () => void;
};
const StoreContext = createContext<Ctx | null>(null);

/** Single persisted app state (AsyncStorage). Everything stays on the device. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(fresh);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) { const s = JSON.parse(raw) as State; if (s.v === 1) setState({ ...fresh(), ...s, prefs: { ...fresh().prefs, ...s.prefs } }); } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}); }, 250);
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => void) => {
    setState(prev => { const next: State = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
  }, []);
  const logEntries = useCallback((items: Omit<Entry, 'id'>[]) => {
    update(s => { for (const i of items) s.entries.push({ ...i, id: uid() }); });
  }, [update]);
  const reset = useCallback(() => { setState(fresh()); AsyncStorage.removeItem(KEY).catch(() => {}); }, []);

  const value = useMemo(() => ({ state, ready, update, logEntries, reset }), [state, ready, update, logEntries, reset]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

export const waterFor = (s: State, d: Date | string) => s.water[dayKey(d)] ?? 0;
