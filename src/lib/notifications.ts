import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { points } from './points';
import { DAY, Profile, changesWeight, dayKey, fmt, kg1, mealTitle, sameDay, startOfDay, sumEntries, targets } from './nutrition';
import { NotifyPrefs, defaultNotify, type State } from './store';

/**
 * Local notifications, all computed from the user's own logged data. Nothing is invented: a message
 * is only scheduled when there is something true to say (a meal not yet logged, a streak that exists,
 * a protein gap that is real), and every number in it comes from the store at the moment of scheduling.
 * They are rescheduled whenever the data changes (see NotificationSync), so they stay current.
 * Local only: works in Expo Go, no server, nothing leaves the phone.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});


/** What each kind does, in the user's words. Shown in Settings next to its switch. */
export const NOTIFY_KINDS: { key: keyof NotifyPrefs; title: string; detail: string; icon: string }[] = [
  { key: 'water', title: 'Water', detail: 'Om de twee uur tussen 10:00 en 20:00, tot je doel gehaald is', icon: 'drop.fill' },
  { key: 'protein', title: 'Eiwit', detail: 'Om 16:00 als je nog minder dan de helft van je eiwit hebt', icon: 'fish' },
  { key: 'streak', title: 'Reeks', detail: 'Om 19:00 als je vandaag nog niets gelogd hebt', icon: 'flame.fill' },
  { key: 'evening', title: 'Dagoverzicht', detail: 'Om 20:30 je echte totaal van vandaag', icon: 'moon.stars' },
  { key: 'weighIn', title: 'Weegmoment', detail: 'Maandag 08:00, als je doel afvallen of aankomen is', icon: 'scalemass.fill' },
  { key: 'weekly', title: 'Weekoverzicht', detail: 'Zondag 19:00, met je gemiddelde van de week', icon: 'chart.bar' },
];

const native = Platform.OS !== 'web';

export async function ensurePermission() {
  if (!native) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}
const hasPermission = async () => native && (await Notifications.getPermissionsAsync()).granted;

const at = (base: Date, hhmm: string | [number, number]) => {
  const [h, m] = typeof hhmm === 'string' ? hhmm.split(':').map(Number) : hhmm;
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
};
const schedule = (id: string, date: Date, title: string, body: string, url: string) =>
  Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, data: { url }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });

const PREFIX = 'bord-';
async function cancelOurs() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter(n => n.identifier.startsWith(PREFIX)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

const MEAL_TITLES = { breakfast: 'Ontbijt gehad?', lunch: 'Lunch gehad?', dinner: 'Avondeten gehad?' } as const;

/**
 * Rebuilds every Bord notification from the current state. Covers the next 7 days for meals and
 * today plus tomorrow for the rest; opening the app (or logging anything) extends the window again.
 * iOS keeps at most 64 pending notifications; this schedules at most about 40.
 */
export async function syncNotifications(state: State, now = new Date()) {
  if (!native || !state.onboarded) return;
  if (!(await hasPermission())) return;
  await cancelOurs();

  const p = state.profile, t = targets(p, now), n = { ...defaultNotify, ...state.prefs.notify };
  const today = startOfDay(now.getTime());
  const todays = state.entries.filter(e => sameDay(e.date, now));
  const tot = sumEntries(todays);
  const future = (d: Date) => d.getTime() > now.getTime() + 60_000;
  const jobs: Promise<unknown>[] = [];

  // 1. Meals: the next 7 days at the chosen times. Today's are skipped once that meal is logged.
  if (p.remindersOn) {
    for (let i = 0; i < 7; i++) {
      const day = new Date(today.getTime() + i * DAY);
      for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
        if (meal === 'breakfast' && p.meals <= 2) continue;
        if (i === 0 && todays.some(e => e.meal === meal)) continue;
        const when = at(day, p.reminders[meal]);
        if (future(when)) jobs.push(schedule(`${PREFIX}meal-${meal}-${i}`, when, MEAL_TITLES[meal], `Maak een foto van je ${mealTitle(meal).toLowerCase()}, dan staat het erin.`, '/scan'));
      }
    }
  }

  // 2. Water: every two hours, today with the real count, and tomorrow. Stops once today's goal is reached.
  if (n.water) {
    const drunk = state.water[dayKey(now)] ?? 0;
    for (const [i, day] of [today, new Date(today.getTime() + DAY)].entries()) {
      if (i === 0 && drunk >= t.water) continue;
      for (const h of [10, 12, 14, 16, 18, 20]) {
        const when = at(day, [h, 0]);
        if (!future(when)) continue;
        const body = i === 0 ? `Je staat op ${drunk} van ${t.water} glazen vandaag.` : `Je doel is ${t.water} glazen per dag.`;
        jobs.push(schedule(`${PREFIX}water-${i}-${h}`, when, 'Tijd voor een glas water', body, '/'));
      }
    }
  }

  // 3. Protein: today 16:00, only if something is logged and less than half the protein goal is reached.
  if (n.protein && todays.length && tot.protein < t.protein * 0.5) {
    const when = at(today, [16, 0]);
    if (future(when)) jobs.push(schedule(`${PREFIX}protein`, when, 'Nog wat eiwit nodig',
      `Je hebt ${fmt(tot.protein)} van ${t.protein} g eiwit gelogd. Nog ${fmt(t.protein - tot.protein)} g te gaan.`, '/recipes'));
  }

  // 4. Streak: today 19:00, only if a streak exists and nothing has been logged today.
  const streak = points(state.entries, t, now).streak;
  if (n.streak && streak > 0 && !todays.length) {
    const when = at(today, [19, 0]);
    if (future(when)) jobs.push(schedule(`${PREFIX}streak`, when, `${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij`,
      'Je hebt vandaag nog niets gelogd. Eén maaltijd houdt je reeks in stand.', '/scan'));
  }

  // 5. Evening summary: today 20:30 with the real totals, only on days with entries.
  if (n.evening && todays.length) {
    const when = at(today, [20, 30]);
    const left = t.calories - tot.kcal;
    if (future(when)) jobs.push(schedule(`${PREFIX}evening`, when, 'Je dag tot nu toe',
      `${fmt(tot.kcal)} van ${fmt(t.calories)} kcal (${left >= 0 ? `${fmt(left)} over` : `${fmt(-left)} te veel`}) · eiwit ${fmt(tot.protein)} van ${t.protein} g · ${todays.length} ${todays.length === 1 ? 'item' : 'items'} gelogd.`, '/'));
  }

  // 6. Weigh-in: next Monday 08:00, only when the goal changes weight. Mentions the last real weigh-in.
  if (n.weighIn && changesWeight(p.goal)) {
    const monday = new Date(today); monday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
    const last = [...state.weights].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
    const body = last ? `Laatst gewogen: ${kg1(last.kg)} kg op ${new Date(last.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}. Streefgewicht ${kg1(p.target)} kg.` : `Streefgewicht ${kg1(p.target)} kg.`;
    jobs.push(schedule(`${PREFIX}weigh`, at(monday, [8, 0]), 'Weegmoment', body, '/weight'));
  }

  // 7. Weekly summary: the coming Sunday 19:00, from the real entries of that week so far.
  if (n.weekly) {
    const sunday = new Date(today); sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
    const when = at(sunday, [19, 0]);
    const from = new Date(sunday.getTime() - 6 * DAY);
    const days = Array.from({ length: 7 }, (_, i) => new Date(from.getTime() + i * DAY)).filter(d => d.getTime() <= now.getTime());
    const logged = days.map(d => sumEntries(state.entries.filter(e => sameDay(e.date, d)))).filter(x => x.kcal > 0);
    if (future(when) && logged.length) {
      const avg = logged.reduce((a, x) => a + x.kcal, 0) / logged.length;
      const onTrack = logged.filter(x => Math.abs(x.kcal - t.calories) <= t.calories * 0.1).length;
      jobs.push(schedule(`${PREFIX}weekly`, when, 'Je week',
        `${logged.length} van 7 dagen gelogd, gemiddeld ${fmt(avg)} kcal per gelogde dag. ${onTrack} ${onTrack === 1 ? 'dag' : 'dagen'} binnen 10% van je doel.`, '/progress'));
    }
  }

  await Promise.all(jobs);
}

/** Kept for onboarding/settings: asks permission and rebuilds everything. */
export async function scheduleMealReminders(p: Profile) {
  if (!p.remindersOn) return true;
  return ensurePermission();
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
