import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

/** Bord design tokens: warm papaya identity, macro data colors. */
export const palette = {
  light: {
    accent: '#FF6A3D', accent2: '#FF3D77', protein: '#7C5CFF', carbs: '#0FB5A3', fat: '#F2B300', water: '#2F8CFF',
    good: '#1FA463', warn: '#F04438',
    bg: '#F6F3F1', card: '#FFFFFF', card2: '#FBF8F6', label: '#1A1310', label2: 'rgba(70,52,44,0.70)', label3: 'rgba(70,52,44,0.36)',
    sep: 'rgba(80,58,48,0.12)', fill: 'rgba(120,96,86,0.13)',
  },
  dark: {
    accent: '#FF7A50', accent2: '#FF5A8A', protein: '#9D86FF', carbs: '#2DD4BF', fat: '#FFC93A', water: '#5AA8FF',
    good: '#3DD68C', warn: '#FF6B5E',
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
export const radius = { s: 12, m: 18, l: 26, xl: 32 };
