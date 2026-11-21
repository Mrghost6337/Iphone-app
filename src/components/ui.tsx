import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { curve, radius, space, useColors } from '@/lib/theme';

export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

const easeOut = Easing.bezier(...curve.out);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The one press interaction in the app: scale to 0.97 in 120 ms, back in 200 ms, ease-out.
 * With Reduce Motion on, movement is dropped and only opacity changes.
 */
export function Press({ style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const reduce = useReducedMotion();
  const v = useSharedValue(1);
  const anim = useAnimatedStyle(() => (reduce ? { opacity: v.get() } : { transform: [{ scale: v.get() }] }));
  return (
    <AnimatedPressable {...rest}
      onPressIn={e => { v.set(withTiming(reduce ? 0.6 : scaleTo, { duration: 120, easing: easeOut })); onPressIn?.(e); }}
      onPressOut={e => { v.set(withTiming(1, { duration: 200, easing: easeOut })); onPressOut?.(e); }}
      style={[style, anim]} />
  );
}

/** Continuous (squircle) corners, as iOS draws them. */
export const squircle = { borderCurve: 'continuous' } as const;

export function Icon({ name, size = 22, color, weight = 'semibold', style }: { name: string; size?: number; color?: string; weight?: SymbolViewProps['weight']; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <SymbolView name={name as SymbolViewProps['name']} size={size} tintColor={color ?? c.label} weight={weight} style={[{ width: size, height: size }, style]} resizeMode="scaleAspectFit" />;
}

export function T({ style, variant = 'body', color, ...rest }: TextProps & { variant?: keyof typeof typo; color?: string }) {
  const c = useColors();
  return <Text {...rest} style={[typo[variant], { color: color ?? c.label }, style]} />;
}
/** Apple text styles (Large Title 34 → Caption 12). Bold for structure, numbers always tabular. */
export const typo = StyleSheet.create({
  hero: { fontSize: 54, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1.4 },
  large: { fontSize: 34, fontWeight: '700', letterSpacing: -0.7, lineHeight: 40 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 23, letterSpacing: -0.2 },
  bodyB: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  sub: { fontSize: 15, fontWeight: '400', lineHeight: 20, letterSpacing: -0.1 },
  cap: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  num: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
}) as Record<string, TextStyle>;

export function Card({ children, style, pad = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: boolean }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.l, padding: pad ? space.l : 0, overflow: 'hidden', ...squircle }, style]}>{children}</View>;
}

/** Liquid Glass on iOS 26 (expo-glass-effect, works in Expo Go); plain view elsewhere. */
export function Glass({ children, style, interactive, tint }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; interactive?: boolean; tint?: string }) {
  return <GlassView style={style} isInteractive={interactive} tintColor={tint}>{children}</GlassView>;
}

/** Primary action. Solid accent, one per screen. */
export function Button({ title, icon, onPress, disabled, right, style }: { title: string; icon?: string; onPress: () => void; disabled?: boolean; right?: string; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Press accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => { haptic.light(); onPress(); }}
      style={[{ height: 54, borderRadius: 27, backgroundColor: c.accent, opacity: disabled ? 0.35 : 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: right ? 'space-between' : 'center', paddingHorizontal: 22, gap: 8, ...squircle }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Icon name={icon} size={19} color={c.onAccent} /> : null}
        <Text style={{ color: c.onAccent, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>{title}</Text>
      </View>
      {right ? <Text style={{ color: c.onAccent, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{right}</Text> : null}
    </Press>
  );
}

export function PillButton({ title, icon, onPress, tone = 'soft', style }: { title: string; icon?: string; onPress: () => void; tone?: 'soft' | 'plain' | 'danger'; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const bg = tone === 'soft' ? hexA(c.accent, 0.12) : tone === 'danger' ? hexA(c.warn, 0.14) : c.fill;
  const fg = tone === 'soft' ? c.accent : tone === 'danger' ? c.warn : c.label;
  return (
    <Press accessibilityRole="button" onPress={() => { haptic.tap(); onPress(); }}
      style={[{ minHeight: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, style]}>
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{title}</Text>
    </Press>
  );
}

export function IconButton({ icon, onPress, label, size = 44, glass = true, color }: { icon: string; onPress: () => void; label: string; size?: number; glass?: boolean; color?: string }) {
  const c = useColors();
  const inner = <Icon name={icon} size={size * 0.4} color={color ?? c.label} />;
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptic.tap(); onPress(); }} hitSlop={6} scaleTo={0.92}>
      {glass
        ? <Glass interactive style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>{inner}</Glass>
        : <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fill }}>{inner}</View>}
    </Press>
  );
}

export function Chip({ title, on, onPress }: { title: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Press accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}
      style={{ paddingHorizontal: 14, minHeight: 38, justifyContent: 'center', borderRadius: 19, backgroundColor: on ? c.label : c.fill }}>
      <Text style={{ fontSize: 15, fontWeight: on ? '600' : '500', color: on ? c.bg : c.label }}>{title}</Text>
    </Press>
  );
}

export function Tile({ title, detail, icon, on, onPress, style }: { title: string; detail?: string; icon: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Press accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}
      style={[{ flex: 1, minHeight: 104, borderRadius: radius.l, padding: 14, gap: 6, backgroundColor: c.card, ...squircle,
        borderWidth: 1.5, borderColor: on ? c.accent : c.sep }, style]}>
      <IconBadge icon={icon} on={on} />
      <T variant="h3" style={{ marginTop: 4 }}>{title}</T>
      {detail ? <T variant="sub" color={c.label2}>{detail}</T> : null}
    </Press>
  );
}

/** A plain SF Symbol in a fixed slot. No tinted squares behind icons. */
export function IconBadge({ icon, on, size = 28, color }: { icon: string; on?: boolean; size?: number; color?: string }) {
  const c = useColors();
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} importantForAccessibility="no"><Icon name={icon} size={size * 0.78} color={color ?? (on ? c.accent : c.label2)} /></View>;
}

export function ChoiceRow({ title, detail, icon, on, onPress }: { title: string; detail?: string; icon?: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Press accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }} scaleTo={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.l, backgroundColor: c.card, ...squircle,
        borderWidth: 1.5, borderColor: on ? c.accent : c.sep }}>
      {icon ? <IconBadge icon={icon} on={on} /> : null}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T variant="h3">{title}</T>
        {detail ? <T variant="sub" color={c.label2}>{detail}</T> : null}
      </View>
      <Icon name={on ? 'checkmark.circle.fill' : 'circle'} size={24} color={on ? c.accent : c.label3} weight="regular" />
    </Press>
  );
}

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string | null; size?: number }) {
  const c = useColors();
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: hexA(c.accent, 0.16) }}>
      {name ? <Text style={{ color: c.accent, fontWeight: '600', fontSize: size * 0.42 }}>{name[0].toUpperCase()}</Text> : <Icon name="person.fill" size={size * 0.5} color={c.accent} />}
    </View>
  );
}

/** Progress ring, solid accent; red overflow arc when over target. */
export function Ring({ size, stroke, progress, children }: { size: number; stroke: number; progress: number; children?: React.ReactNode }) {
  const c = useColors();
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, p = Math.max(0, Math.min(progress, 1)), over = progress > 1;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.fill} strokeOpacity={1} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={over ? c.warn : c.accent} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - p)} />
        {over ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.warn} strokeOpacity={0.55} strokeWidth={stroke * 0.42} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - Math.min(progress - 1, 1))} /> : null}
      </Svg>
      {children}
    </View>
  );
}

export function Bar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.fill, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(3, Math.min(100, value * 100))}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function Stepper({ onMinus, onPlus, labels = ['Minder', 'Meer'] }: { onMinus: () => void; onPlus: () => void; labels?: [string, string] }) {
  const c = useColors();
  const b = (t: string, f: () => void, l: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={l} onPress={() => { haptic.tap(); f(); }} style={({ pressed }) => ({ width: 46, height: 36, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: c.label }}>{t}</Text>
    </Pressable>
  );
  return <View style={{ flexDirection: 'row', backgroundColor: c.fill, borderRadius: 12, overflow: 'hidden' }}>{b('−', onMinus, labels[0])}<View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.sep }} />{b('+', onPlus, labels[1])}</View>;
}

export function Section({ title, right, children, style }: { title?: string; right?: React.ReactNode; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginHorizontal: space.l, marginBottom: space.xl }, style]}>
      {title ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 10 }}><T variant="h2">{title}</T>{right}</View> : null}
      {children}
    </View>
  );
}

export function Row({ children, onPress, style, label }: { children: React.ReactNode; onPress?: PressableProps['onPress']; style?: StyleProp<ViewStyle>; label?: string }) {
  const c = useColors();
  const s: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 54 };
  if (!onPress) return <View style={[s, style]}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s, { backgroundColor: pressed ? c.fill : 'transparent' }, style]}>{children}</Pressable>;
}
export function Divider({ inset = 16 }: { inset?: number }) {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.sep, marginLeft: inset }} />;
}

export function hexA(hex: string, a: number) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
