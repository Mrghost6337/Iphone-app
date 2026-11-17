import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './ui';
import { useColors } from '@/lib/theme';
import { nowMs } from '@/lib/nutrition';

/**
 * In-app "island" banner that grows out of the top of the screen (scan progress, logged meal,
 * cooking timer). Real Live Activities / Dynamic Island need a development build; Expo Go can't.
 */
type IslandMsg = { icon: string; title: string; detail?: string; trailing?: string; spinner?: boolean; until?: number };
const Ctx = createContext<{ show: (m: IslandMsg, ms?: number) => void; hide: () => void }>({ show: () => {}, hide: () => {} });
export const useIsland = () => useContext(Ctx);

export function IslandProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<IslandMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: IslandMsg, ms?: number) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(m);
    if (ms) timer.current = setTimeout(() => setMsg(null), ms);
  }, []);
  const hide = useCallback(() => { if (timer.current) clearTimeout(timer.current); setMsg(null); }, []);
  return (
    <Ctx.Provider value={{ show, hide }}>
      {children}
      {msg ? <IslandView msg={msg} /> : null}
    </Ctx.Provider>
  );
}

function IslandView({ msg }: { msg: IslandMsg }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    if (!msg.until) return;
    const i = setInterval(() => setNow(nowMs()), 500);
    return () => clearInterval(i);
  }, [msg.until]);
  const left = msg.until ? Math.max(0, Math.ceil((msg.until - now) / 1000)) : 0;
  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} layout={LinearTransition.springify().damping(16)}
      pointerEvents="none" accessibilityLiveRegion="polite"
      style={{ position: 'absolute', top: Math.max(insets.top - 44, 8), alignSelf: 'center', minWidth: 230, maxWidth: 380, borderRadius: 30,
        backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1000 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={msg.icon} size={18} color="#fff" />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{msg.title}</Text>
        {msg.detail ? <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }} numberOfLines={1}>{msg.detail}</Text> : null}
      </View>
      {msg.trailing || msg.until ? (
        <Text style={{ color: c.accent, fontWeight: '900', fontSize: msg.until ? 22 : 16, marginLeft: 'auto', fontVariant: ['tabular-nums'] }}>
          {msg.until ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : msg.trailing}
        </Text>
      ) : null}
    </Animated.View>
  );
}
