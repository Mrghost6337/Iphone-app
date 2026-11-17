import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { radius, space, useColors } from '@/lib/theme';

export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

export function Icon({ name, size = 22, color, weight = 'semibold', style }: { name: string; size?: number; color?: string; weight?: SymbolViewProps['weight']; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <SymbolView name={name as SymbolViewProps['name']} size={size} tintColor={color ?? c.label} weight={weight} style={[{ width: size, height: size }, style]} resizeMode="scaleAspectFit" />;
}

export function T({ style, variant = 'body', color, ...rest }: TextProps & { variant?: keyof typeof typo; color?: string }) {
  const c = useColors();
  return <Text {...rest} style={[typo[variant], { color: color ?? c.label }, style]} />;
}
export const typo = StyleSheet.create({
  hero: { fontSize: 56, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  large: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '800' },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 16.5, fontWeight: '400', lineHeight: 22 },
  bodyB: { fontSize: 16.5, fontWeight: '600' },
  sub: { fontSize: 14.5, fontWeight: '500', lineHeight: 20 },
  cap: { fontSize: 12.5, fontWeight: '700' },
  num: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
}) as Record<string, TextStyle>;

export function Card({ children, style, pad = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: boolean }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.l, padding: pad ? space.l + 2 : 0, overflow: 'hidden' }, style]}>{children}</View>;
}

/** Liquid Glass on iOS 26 (expo-glass-effect, works in Expo Go); plain view elsewhere. */
export function Glass({ children, style, interactive, tint }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; interactive?: boolean; tint?: string }) {
  return <GlassView style={style} isInteractive={interactive} tintColor={tint}>{children}</GlassView>;
}

export function GradientButton({ title, icon, onPress, disabled, right, style }: { title: string; icon?: string; onPress: () => void; disabled?: boolean; right?: string; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={() => { haptic.light(); onPress(); }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <LinearGradient colors={[c.accent, c.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: right ? 'space-between' : 'center', paddingHorizontal: 24, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Icon name={icon} size={20} color="#fff" /> : null}
          <Text style={{ color: '#fff', fontSize: 17.5, fontWeight: '700' }}>{title}</Text>
        </View>
        {right ? <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{right}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function PillButton({ title, icon, onPress, tone = 'soft', style }: { title: string; icon?: string; onPress: () => void; tone?: 'soft' | 'plain' | 'danger'; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const bg = tone === 'soft' ? hexA(c.accent, 0.14) : tone === 'danger' ? hexA(c.warn, 0.14) : c.fill;
  const fg = tone === 'soft' ? c.accent : tone === 'danger' ? c.warn : c.label;
  return (
    <Pressable accessibilityRole="button" onPress={() => { haptic.tap(); onPress(); }}
      style={({ pressed }) => [{ minHeight: 44, borderRadius: 22, paddingHorizontal: 16, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.7 : 1 }, style]}>
      {icon ? <Icon name={icon} size={17} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 15.5, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, size = 44, glass = true, color }: { icon: string; onPress: () => void; label: string; size?: number; glass?: boolean; color?: string }) {
  const c = useColors();
  const inner = <Icon name={icon} size={size * 0.42} color={color ?? c.label} />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptic.tap(); onPress(); }} hitSlop={6}>
      {glass
        ? <Glass interactive style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>{inner}</Glass>
        : <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fill }}>{inner}</View>}
    </Pressable>
  );
}

export function Chip({ title, on, onPress }: { title: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}>
      {on
        ? <LinearGradient colors={[c.accent, c.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={chipStyle}><Text style={[chipText, { color: '#fff' }]}>{title}</Text></LinearGradient>
        : <View style={[chipStyle, { backgroundColor: c.fill }]}><Text style={[chipText, { color: c.label }]}>{title}</Text></View>}
    </Pressable>
  );
}
const chipStyle: ViewStyle = { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999 };
const chipText: TextStyle = { fontSize: 14.5, fontWeight: '700' };

export function Tile({ title, detail, icon, on, onPress, style }: { title: string; detail?: string; icon: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}
      style={({ pressed }) => [{ flex: 1, minHeight: 108, borderRadius: radius.l, padding: 14, gap: 8, backgroundColor: on ? hexA(c.accent, 0.08) : c.card,
        borderWidth: 2, borderColor: on ? c.accent : 'transparent', transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <IconBadge icon={icon} on={on} />
      <T variant="h3">{title}</T>
      {detail ? <T variant="sub" color={c.label2}>{detail}</T> : null}
    </Pressable>
  );
}

export function IconBadge({ icon, on, size = 44, color }: { icon: string; on?: boolean; size?: number; color?: string }) {
  const c = useColors();
  const col = color ?? c.accent;
  return on
    ? <LinearGradient colors={[c.accent, c.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={size * 0.48} color="#fff" /></LinearGradient>
    : <View style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center', backgroundColor: hexA(col, 0.14) }}><Icon name={icon} size={size * 0.48} color={col} /></View>;
}

export function ChoiceRow({ title, detail, icon, on, onPress }: { title: string; detail?: string; icon?: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.l, backgroundColor: on ? hexA(c.accent, 0.08) : c.card,
        borderWidth: 2, borderColor: on ? c.accent : 'transparent', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      {icon ? <IconBadge icon={icon} on={on} size={48} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="h3">{title}</T>
        {detail ? <T variant="sub" color={c.label2}>{detail}</T> : null}
      </View>
      <Icon name={on ? 'checkmark.circle.fill' : 'circle'} size={26} color={on ? c.accent : c.label3} />
    </Pressable>
  );
}

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string | null; size?: number }) {
  const c = useColors();
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return (
    <LinearGradient colors={[c.accent, c.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      {name ? <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{name[0].toUpperCase()}</Text> : <Icon name="person.fill" size={size * 0.5} color="#fff" />}
    </LinearGradient>
  );
}

/** Progress ring with the signature gradient; red overflow arc when over target. */
export function Ring({ size, stroke, progress, children }: { size: number; stroke: number; progress: number; children?: React.ReactNode }) {
  const c = useColors();
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, p = Math.max(0, Math.min(progress, 1)), over = progress > 1;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGradient id="g" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={c.accent} /><Stop offset="1" stopColor={c.accent2} /></SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.accent} strokeOpacity={0.14} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={over ? c.warn : 'url(#g)'} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - p)} />
        {over ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.warn} strokeOpacity={0.55} strokeWidth={stroke * 0.42} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - Math.min(progress - 1, 1))} /> : null}
      </Svg>
      {children}
    </View>
  );
}

export function Bar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: hexA(color, 0.18), overflow: 'hidden' }}>
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
