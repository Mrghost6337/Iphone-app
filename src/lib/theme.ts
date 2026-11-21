import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

/**
 * Bord design tokens. One warm accent, used solid (no gradients). Light accent is darkened to 4.6:1 on white;
 * in dark mode the accent carries dark text (onAccent) for 7.4:1. Macro colors are data colors only.
 */
export const palette = {
  light: {
    accent: '#D24410', onAccent: '#FFFFFF', protein: '#7C5CFF', carbs: '#0FB5A3', fat: '#F2B300', water: '#2F8CFF',
    good: '#D24410', warn: '#F04438',
    bg: '#F6F3F1', card: '#FFFFFF', card2: '#FBF8F6', label: '#1A1310', label2: 'rgba(70,52,44,0.70)', label3: 'rgba(70,52,44,0.36)',
    sep: 'rgba(80,58,48,0.12)', fill: 'rgba(120,96,86,0.13)',
  },
  dark: {
    accent: '#FF7A50', onAccent: '#1A0B05', protein: '#9D86FF', carbs: '#2DD4BF', fat: '#FFC93A', water: '#5AA8FF',
    good: '#FF7A50', warn: '#FF6B5E',
    bg: '#0C0A09', card: '#1D1A18', card2: '#24201E', label: '#F7F2EF', label2: 'rgba(240,228,222,0.64)', label3: 'rgba(240,228,222,0.32)',
    sep: 'rgba(255,255,255,0.10)', fill: 'rgba(160,140,130,0.22)',
  },
};
export type Colors = typeof palette.light;

export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}

export const accentDynamic = Platform.OS === 'ios'
  ? DynamicColorIOS({ light: palette.light.accent, dark: palette.dark.accent })
  : palette.light.accent;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const radius = { s: 10, m: 14, l: 20, xl: 28 };

/** Emil Kowalski's UI curves (cubic-bezier control points). Never ease-in for UI. */
export const curve = { out: [0.23, 1, 0.32, 1] as const, inOut: [0.77, 0, 0.175, 1] as const, drawer: [0.32, 0.72, 0, 1] as const };
