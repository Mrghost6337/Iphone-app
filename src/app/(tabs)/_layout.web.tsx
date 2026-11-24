import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui';
import { useColors } from '@/lib/theme';

/** Web preview only: a bottom tab bar in the same order and with the same icons as the native iOS tabs. */
function TabIcon({ outline, filled, color, focused }: { outline: string; filled: string; color: unknown; focused: boolean }) {
  return <Icon name={focused ? filled : outline} size={24} color={String(color)} weight={focused ? 'semibold' : 'regular'} />;
}

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.label, tabBarInactiveTintColor: c.label3,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.sep, height: 64, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      <Tabs.Screen name="index" options={{ title: 'Vandaag', tabBarIcon: ({ color, focused }) => <TabIcon outline="house" filled="house.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Voortgang', tabBarIcon: ({ color, focused }) => <TabIcon outline="chart.bar" filled="chart.bar.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recepten', tabBarIcon: ({ color, focused }) => <TabIcon outline="book.closed" filled="book.closed.fill" color={color} focused={focused} /> }} />
      <Tabs.Screen name="friends" options={{ title: 'Vrienden', tabBarIcon: ({ color, focused }) => <TabIcon outline="person.2" filled="person.2.fill" color={color} focused={focused} /> }} />
    </Tabs>
  );
}
