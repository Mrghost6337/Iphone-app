import { DAY, Meal, Profile, Targets, fmt, sameDay, startOfDay, sumEntries } from './nutrition';
import type { Entry } from './store';

export type Insight = { id: string; icon: string; tone: 'positive' | 'neutral' | 'attention'; title: string; message: string };

export function insights(entries: Entry[], t: Targets, p: Profile, now = new Date()): Insight[] {
  const days = Array.from({ length: 8 }, (_, i) => startOfDay(now.getTime() - (7 - i) * DAY)).map(d => {
    const list = entries.filter(e => sameDay(e.date, d));
    const meals: Partial<Record<Meal, number>> = {};
    return { d, tot: sumEntries(list), n: list.length, meals };
  });
  const today = days[days.length - 1], hist = days.slice(0, -1), out: Insight[] = [];
  const h = now.getHours(), pLeft = t.protein - today.tot.protein;
  if (today.n && h >= 14 && pLeft > t.protein * 0.4)
    out.push({ id: 'protein', icon: 'fish', tone: 'attention', title: `Nog ${fmt(pLeft)} g eiwit te gaan`, message: 'Een portie kwark, kip of linzen helpt je vandaag op koers.' });
  if (today.tot.kcal > t.calories * 1.1)
    out.push({ id: 'over', icon: 'exclamationmark.circle', tone: 'neutral', title: `Vandaag ${fmt(today.tot.kcal - t.calories)} kcal boven je doel`, message: 'Geen probleem. Eén dag zegt weinig; kijk naar je weekgemiddelde.' });
  if (!today.n && p.obstacles.includes('Geen tijd om te koken'))
    out.push({ id: 'time', icon: 'timer', tone: 'neutral', title: 'Weinig tijd vandaag?', message: 'Avocadotoast of een Griekse salade staat in 10 minuten op tafel. Kijk bij Recepten.' });
  if (!today.n && p.obstacles.includes('Honger in de avond') && h >= 15)
    out.push({ id: 'evening', icon: 'moon.stars', tone: 'neutral', title: 'Tegen trek in de avond', message: 'Eet bij de lunch genoeg eiwit en vezels; dat houdt je langer verzadigd.' });
  const logged = hist.filter(x => x.n);
  if (logged.length < 3) {
    if (!out.length && !today.n) out.push({ id: 'start', icon: 'camera', tone: 'neutral', title: 'Begin met één foto', message: 'Tik op de camera en fotografeer je volgende maaltijd. Na een paar dagen zie je hier persoonlijke inzichten.' });
    return out;
  }
  const avg = logged.reduce((a, x) => a + x.tot.kcal, 0) / logged.length, diff = avg - t.calories;
  if (Math.abs(diff) <= t.calories * 0.05) out.push({ id: 'avg', icon: 'checkmark.seal', tone: 'positive', title: 'Mooi in balans', message: `Je zat de afgelopen ${logged.length} dagen gemiddeld op ${fmt(avg)} kcal, precies rond je doel.` });
  else out.push({ id: 'avg', icon: diff > 0 ? 'arrow.up.right' : 'arrow.down.right', tone: 'neutral', title: `Gemiddeld ${fmt(avg)} kcal per dag`,
    message: diff > 0 ? `Dat is ${fmt(diff)} kcal boven je doel. Kleine wissels bij je grootste maaltijd maken het verschil.` : `Dat is ${fmt(-diff)} kcal onder je doel. Te weinig eten kan je energie en spiermassa kosten.` });
  const pd = logged.filter(x => x.tot.protein >= t.protein * 0.9).length;
  if (pd === logged.length) out.push({ id: 'pstreak', icon: 'bolt.heart', tone: 'positive', title: 'Eiwitdoel elke dag gehaald', message: 'Sterk! Dat helpt je spieren te behouden en voorkomt honger.' });
  else if (pd * 2 < logged.length) out.push({ id: 'plow', icon: 'fish', tone: 'attention', title: 'Eiwit blijft vaak achter', message: `Op ${logged.length - pd} van de ${logged.length} dagen haalde je je eiwitdoel niet. Begin de dag met yoghurt, kwark of eieren.` });
  const fib = logged.reduce((a, x) => a + x.tot.fiber, 0) / logged.length;
  if (fib < t.fiber * 0.6) out.push({ id: 'fiber', icon: 'leaf', tone: 'attention', title: `Weinig vezels (${fmt(fib)} g per dag)`, message: `Richtlijn: ${t.fiber} g. Volkoren, peulvruchten en groente vullen langer.` });
  return out.slice(0, 4);
}
