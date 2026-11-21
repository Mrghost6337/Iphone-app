import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui';
import { useColors } from '@/lib/theme';

/** Web preview only: a bottom tab bar in the same order as the native iOS tabs (NativeTabs renders on top on web). */
export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.label2,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.sep }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color }) => <Icon name="fork.knife" size={24} color={String(color)} />, title: 'Vandaag' }} />
      <Tabs.Screen name="recipes" options={{ tabBarIcon: ({ color }) => <Icon name="book.pages" size={24} color={String(color)} />, title: 'Recepten' }} />
      <Tabs.Screen name="friends" options={{ tabBarIcon: ({ color }) => <Icon name="person.2" size={24} color={String(color)} />, title: 'Vrienden' }} />
      <Tabs.Screen name="progress" options={{ tabBarIcon: ({ color }) => <Icon name="chart.bar" size={24} color={String(color)} />, title: 'Voortgang' }} />
      <Tabs.Screen name="scan" options={{ tabBarIcon: ({ color }) => <Icon name="camera.fill" size={24} color={String(color)} />, title: 'Scan' }} />
    </Tabs>
  );
}
