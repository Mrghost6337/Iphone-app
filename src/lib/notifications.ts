import * as Notifications from 'expo-notifications';
import type { Profile } from './nutrition';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const MEAL_IDS = { breakfast: 'meal-breakfast', lunch: 'meal-lunch', dinner: 'meal-dinner' } as const;
const TITLES = { breakfast: 'Ontbijt gehad?', lunch: 'Lunch gehad?', dinner: 'Avondeten gehad?' } as const;

/** Daily local reminders at the chosen times. Local only: works in Expo Go, no server. */
export async function scheduleMealReminders(p: Profile) {
  for (const id of Object.values(MEAL_IDS)) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  if (!p.remindersOn || !(await ensurePermission())) return false;
  for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
    if (meal === 'breakfast' && p.meals <= 2) continue;
    const [hour, minute] = p.reminders[meal].split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: MEAL_IDS[meal],
      content: { title: TITLES[meal], body: 'Eén foto en het staat erin.', data: { url: '/scan' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
  return true;
}

export async function scheduleTimer(title: string, step: number, seconds: number) {
  await Notifications.cancelScheduledNotificationAsync('cooking-timer').catch(() => {});
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'cooking-timer',
    content: { title: 'Timer klaar', body: `${title} · stap ${step + 1}`, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
  });
}
export const cancelTimer = () => Notifications.cancelScheduledNotificationAsync('cooking-timer').catch(() => {});
