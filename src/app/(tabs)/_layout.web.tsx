import { Tabs } from 'expo-router';
import { useColors } from '@/lib/theme';

/** Web preview only: a bottom tab bar in the same order as the native iOS tabs (NativeTabs renders on top on web). */
export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.label2,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.sep }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarIconStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" options={{ title: 'Vandaag' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recepten' }} />
      <Tabs.Screen name="friends" options={{ title: 'Vrienden' }} />
      <Tabs.Screen name="progress" options={{ title: 'Voortgang' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
    </Tabs>
  );
}
