import { Profile, Targets } from './nutrition';
import type { Friend } from './store';

/**
 * Offline friend codes: your QR encodes your name, points and plan. A friend scans it with Bord and
 * you appear in their leaderboard. No server, nothing leaves the two phones. Re-scan to refresh.
 */
const PREFIX = 'BORD1:';

export function myCode(id: string, p: Profile, t: Targets, pts: { week: number; total: number; streak: number }) {
  return PREFIX + JSON.stringify({ i: id, n: p.name.slice(0, 30), w: pts.week, t: pts.total, s: pts.streak, k: t.calories, p: t.protein, c: t.carbs, f: t.fat, g: p.goal, d: Date.now() });
}

export function parseCode(data: string): Friend | null {
  if (!data.startsWith(PREFIX)) return null;
  try {
    const o = JSON.parse(data.slice(PREFIX.length));
    if (typeof o.i !== 'string' || typeof o.n !== 'string') return null;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    return { id: o.i.slice(0, 40), name: o.n.slice(0, 30) || 'Vriend', week: num(o.w), total: num(o.t), streak: num(o.s),
      plan: { k: num(o.k), p: num(o.p), c: num(o.c), f: num(o.f), g: String(o.g ?? '') }, updatedAt: num(o.d) || Date.now() };
  } catch { return null; }
}
