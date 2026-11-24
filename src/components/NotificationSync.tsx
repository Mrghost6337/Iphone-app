import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { syncNotifications } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { nowMs } from '@/lib/nutrition';

/**
 * Keeps the scheduled notifications in step with the data: 1.5 s after anything changes (a meal,
 * a glass of water, a setting) and whenever the app comes back to the foreground, every Bord
 * notification is rebuilt from the current state. A tap on a notification opens the screen it is about.
 */
export function NotificationSync() {
  const { state, ready } = useStore();
  const [tick, setTick] = useState(0);
  const handled = useRef<string | null>(null);
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setTick(nowMs()); });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const id = setTimeout(() => { syncNotifications(state).catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, [ready, state, tick]);

  useEffect(() => {
    if (!ready || !state.onboarded || !last) return;
    const id = last.notification.request.identifier + last.notification.date;
    if (handled.current === id) return;
    handled.current = id;
    const url = last.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as never);
  }, [last, ready, state.onboarded]);

  return null;
}
