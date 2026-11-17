import { DAY, Targets, dayKey, scaled, startOfDay, sumEntries } from './nutrition';
import type { Entry } from './store';

/** +10 per scan (photo/barcode/describe), +5 per other entry, +20 per day within 10 % of target, +15 per protein-goal day. */
export function points(entries: Entry[], t: Targets, now = new Date()) {
  const byDay: Record<string, Entry[]> = {};
  for (const e of entries) (byDay[dayKey(e.date)] ||= []).push(e);
  const weekStart = startOfDay(now.getTime() - 6 * DAY).getTime();
  let total = 0, week = 0, scans = 0;
  for (const e of entries) {
    const scan = e.source === 'photo' || e.source === 'barcode' || e.source === 'describe';
    const p = scan ? 10 : 5; if (scan) scans++;
    total += p; if (new Date(e.date).getTime() >= weekStart) week += p;
  }
  for (const list of Object.values(byDay)) {
    const n = sumEntries(list); let p = 0;
    if (Math.abs(n.kcal - t.calories) <= t.calories * 0.1) p += 20;
    if (n.protein >= t.protein * 0.9) p += 15;
    total += p; if (new Date(list[0].date).getTime() >= weekStart) week += p;
  }
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (byDay[dayKey(new Date(now.getTime() - i * DAY))]) streak++;
    else if (i === 0) continue; else break;
  }
  return { total, week, scans, streak };
}

export { scaled };
