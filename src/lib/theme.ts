import { DynamicColorIOS, Platform, useColorScheme } from 'react-native';

/**
 * Bord design tokens: monochrome. Black on white in light mode, white on black in dark mode.
 * The accent IS the label colour: primary buttons, rings and selections are solid black (or white).
 * Colour is reserved for data: protein, carbs, fat and water. Cards are white on a soft grey ground,
 * lifted by one quiet shadow; in dark mode they sit on pure black without shadow.
 */
export const palette = {
  light: {
    accent: '#0A0A0A', onAccent: '#FFFFFF', protein: '#F0525C', carbs: '#F59E0B', fat: '#3B82F6', water: '#38BDF8',
    good: '#0A0A0A', warn: '#E5484D',
    bg: '#F4F4F5', card: '#FFFFFF', card2: '#F4F4F5', label: '#0A0A0A', label2: 'rgba(10,10,10,0.56)', label3: 'rgba(10,10,10,0.26)',
    sep: 'rgba(10,10,10,0.08)', fill: 'rgba(10,10,10,0.06)', glass: 'rgba(255,255,255,0.72)',
    shadow: '0px 1px 2px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.05)',
  },
  dark: {
    accent: '#FFFFFF', onAccent: '#000000', protein: '#FF6B73', carbs: '#FBBF24', fat: '#60A5FA', water: '#7DD3FC',
    good: '#FFFFFF', warn: '#FF6369',
    bg: '#000000', card: '#141414', card2: '#1F1F1F', label: '#FFFFFF', label2: 'rgba(255,255,255,0.58)', label3: 'rgba(255,255,255,0.28)',
    sep: 'rgba(255,255,255,0.09)', fill: 'rgba(255,255,255,0.08)', glass: 'rgba(28,28,28,0.66)',
    shadow: '0px 0px 0px rgba(0,0,0,0)',
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
export const radius = { s: 12, m: 16, l: 24, xl: 32 };

/** Emil Kowalski's UI curves (cubic-bezier control points). Never ease-in for UI. */
export const curve = { out: [0.23, 1, 0.32, 1] as const, inOut: [0.77, 0, 0.175, 1] as const, drawer: [0.32, 0.72, 0, 1] as const };
