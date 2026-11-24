import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IslandProvider } from '@/components/Island';
import { StoreProvider, useStore } from '@/lib/store';
import { palette } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { ready, state } = useStore();
  const scheme = useColorScheme();
  useEffect(() => { if (ready) SplashScreen.hideAsync(); }, [ready]);
  useEffect(() => { if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(state.prefs.appearance === 'system' ? 'unspecified' : state.prefs.appearance); }, [state.prefs.appearance]);
  if (!ready) return null;
  const dark = scheme === 'dark';
  const c = dark ? palette.dark : palette.light;
  const theme = { ...(dark ? DarkTheme : DefaultTheme), colors: { ...(dark ? DarkTheme : DefaultTheme).colors, primary: c.accent, background: c.bg, card: c.card, text: c.label } };
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={state.onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recipe/[id]" options={{ headerShown: true, headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="review" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="post" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.5], sheetGrabberVisible: true }} />
          <Stack.Screen name="amount" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="weight" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.5], sheetGrabberVisible: true }} />
          <Stack.Screen name="edit/[id]" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.8, 1], sheetGrabberVisible: true }} />
          <Stack.Screen name="apikey" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6], sheetGrabberVisible: true }} />
        </Stack.Protected>
        <Stack.Protected guard={!state.onboarded}>
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <IslandProvider>
          <Root />
        </IslandProvider>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
