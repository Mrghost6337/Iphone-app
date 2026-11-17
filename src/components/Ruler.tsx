import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { haptic } from './ui';
import { useColors } from '@/lib/theme';

const TICK = 12;

/** Horizontal ruler you drag with a finger. Snaps per step, haptic tick per value, VoiceOver adjustable. */
export function Ruler({ value, min, max, step, labelEvery, onChange, label }: { value: number; min: number; max: number; step: number; labelEvery: number; onChange: (v: number) => void; label: string }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const list = useRef<FlatList<number>>(null);
  const last = useRef(value);
  const data = useMemo(() => Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => +(min + i * step).toFixed(2)), [min, max, step]);
  const indexOf = (v: number) => Math.max(0, Math.min(data.length - 1, Math.round((v - min) / step)));

  useEffect(() => {
    if (width) list.current?.scrollToOffset({ offset: indexOf(value) * TICK, animated: false });
    // only on layout; later value changes come from the user's own scrolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = data[indexOf(min + Math.round(e.nativeEvent.contentOffset.x / TICK) * step)];
    if (v !== undefined && v !== last.current) { last.current = v; haptic.tap(); onChange(v); }
  };
  const adjust = (dir: 1 | -1) => {
    const i = Math.max(0, Math.min(data.length - 1, indexOf(value) + dir));
    onChange(data[i]); list.current?.scrollToOffset({ offset: i * TICK, animated: true });
  };

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => adjust(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ height: 100, borderRadius: 26, backgroundColor: c.card, overflow: 'hidden' }}>
      {width > 0 && (
        <FlatList
          ref={list}
          horizontal
          data={data}
          keyExtractor={v => String(v)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: TICK, offset: TICK * i, index: i })}
          initialNumToRender={80}
          windowSize={7}
          contentContainerStyle={{ paddingHorizontal: width / 2 - TICK / 2 }}
          renderItem={({ item }) => {
            const major = Math.abs(item / labelEvery - Math.round(item / labelEvery)) < 1e-6;
            const half = Math.abs((item * 2) / labelEvery - Math.round((item * 2) / labelEvery)) < 1e-6;
            return (
              <View style={{ width: TICK, alignItems: 'center', paddingTop: 14, overflow: 'visible' }}>
                <View style={{ width: 2, borderRadius: 1, height: major ? 40 : half ? 28 : 18, backgroundColor: major ? c.label : half ? c.label2 : c.label3 }} />
                {major ? <Text numberOfLines={1} style={{ position: 'absolute', top: 60, left: (TICK - 40) / 2, width: 40, textAlign: 'center', fontSize: 12, fontWeight: '700', color: c.label2 }}>{Math.round(item)}</Text> : null}
              </View>
            );
          }}
        />
      )}
      <LinearGradient pointerEvents="none" colors={[c.accent, c.accent2]} style={{ position: 'absolute', left: width / 2 - 2, top: 8, width: 4, height: 54, borderRadius: 2 }} />
      <LinearGradient pointerEvents="none" colors={[c.card, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60 }} />
      <LinearGradient pointerEvents="none" colors={['transparent', c.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60 }} />
    </View>
  );
}
