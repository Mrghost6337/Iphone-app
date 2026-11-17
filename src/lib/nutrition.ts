import foodsJson from '@/data/foods_nl.json';

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number };
export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };

export type Food = {
  id: string; key: string; name: string; aliases: string[]; category: string;
  per100: Nutrients; portionLabel: string | null; portionGrams: number; vision: string[];
  brand?: string; ai?: boolean;
};

type Raw = { id: string; name: string; aliases: string[]; category: string; per100: Nutrients; portionLabel: string; portionGrams: number; visionLabels: string[] };
export const FOODS: Food[] = (foodsJson as Raw[]).map(r => ({
  id: 'ref:' + r.id, key: r.id, name: r.name, aliases: r.aliases, category: r.category, per100: r.per100,
  portionLabel: r.portionLabel, portionGrams: r.portionGrams, vision: r.visionLabels,
}));
export const foodById: Record<string, Food> = Object.fromEntries(FOODS.map(f => [f.id, f]));
export const foodByKey: Record<string, Food> = Object.fromEntries(FOODS.map(f => [f.key, f]));

export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain' | 'health';
export type Diet = 'all' | 'vegetarisch' | 'vegan' | 'pescotarisch' | 'glutenvrij' | 'lactosevrij';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { id: Meal; title: string; icon: string }[] = [
  { id: 'breakfast', title: 'Ontbijt', icon: 'sunrise' }, { id: 'lunch', title: 'Lunch', icon: 'sun.max' },
  { id: 'dinner', title: 'Avondeten', icon: 'moon.stars' }, { id: 'snack', title: 'Tussendoor', icon: 'carrot' },
];
export const mealTitle = (m: Meal) => MEALS.find(x => x.id === m)!.title;

export const ACTIVITIES: { id: Activity; mult: number; title: string; detail: string; icon: string }[] = [
  { id: 'sedentary', mult: 1.2, title: 'Weinig actief', detail: 'Zittend werk, nauwelijks sport', icon: 'sofa' },
  { id: 'light', mult: 1.375, title: 'Licht actief', detail: 'Veel wandelen of 1–2× sporten per week', icon: 'figure.walk' },
  { id: 'moderate', mult: 1.55, title: 'Gemiddeld actief', detail: '3–4× per week sporten', icon: 'figure.run' },
  { id: 'active', mult: 1.725, title: 'Actief', detail: '5–6× per week intensief sporten', icon: 'figure.strengthtraining.traditional' },
  { id: 'veryActive', mult: 1.9, title: 'Zeer actief', detail: 'Fysiek zwaar werk én dagelijks training', icon: 'flame' },
];
export const GOALS: { id: Goal; title: string; detail: string; icon: string }[] = [
  { id: 'lose', title: 'Afvallen', detail: 'Gezond en blijvend gewicht verliezen', icon: 'arrow.down.right' },
  { id: 'maintain', title: 'Op gewicht blijven', detail: 'Bewuster eten zonder te diëten', icon: 'equal' },
  { id: 'gain', title: 'Spiermassa opbouwen', detail: 'Aankomen met genoeg eiwit', icon: 'dumbbell' },
  { id: 'health', title: 'Gezonder eten', detail: 'Meer groente, vezels en balans', icon: 'heart.text.square' },
];
export const DIETS: { id: Diet; title: string; icon: string; tags: string[] }[] = [
  { id: 'all', title: 'Alles', icon: 'fork.knife', tags: [] },
  { id: 'vegetarisch', title: 'Vegetarisch', icon: 'leaf', tags: ['vegetarisch', 'vegan'] },
  { id: 'vegan', title: 'Veganistisch', icon: 'carrot', tags: ['vegan'] },
  { id: 'pescotarisch', title: 'Pescotarisch', icon: 'fish', tags: ['pescotarisch', 'vegetarisch', 'vegan'] },
  { id: 'glutenvrij', title: 'Glutenvrij', icon: 'laurel.leading', tags: ['glutenvrij'] },
  { id: 'lactosevrij', title: 'Lactosevrij', icon: 'drop', tags: ['lactosevrij', 'vegan'] },
];
export const ALLERGENS = ['noten', 'pinda', 'gluten', 'lactose', 'ei', 'vis', 'schaaldieren', 'soja', 'sesam'];
export const MOTIVES = ['Meer energie', 'Er goed uitzien', 'Betere sportprestaties', 'Gezondheid', 'Zelfvertrouwen', 'Vaste routine'];
export const OBSTACLES = ['Geen tijd om te koken', 'Snaaien', 'Honger in de avond', 'Uit eten en feestjes', 'Weet niet wat gezond is', 'Volhouden'];

export type Profile = {
  name: string; email: string; photo: string | null; birth: string; sex: Sex; height: number; weight: number; target: number; rate: number;
  goal: Goal; workouts: number; activity: Activity; diet: Diet; allergies: string[]; meals: number; snacks: boolean;
  cook: 'quick' | 'normal' | 'chef'; motives: string[]; obstacles: string[];
  remindersOn: boolean; reminders: Record<'breakfast' | 'lunch' | 'dinner', string>; custom: number | null;
};

export const defaultProfile = (): Profile => ({
  name: '', email: '', photo: null, birth: new Date(new Date().getFullYear() - 28, 4, 14).toISOString(), sex: 'female',
  height: 170, weight: 70, target: 65, rate: 0.5, goal: 'lose', workouts: 2, activity: 'light', diet: 'all', allergies: [],
  meals: 3, snacks: true, cook: 'normal', motives: [], obstacles: [], remindersOn: true,
  reminders: { breakfast: '08:30', lunch: '12:30', dinner: '18:30' }, custom: null,
});

export const age = (p: Pick<Profile, 'birth'>, now = new Date()) => {
  const b = new Date(p.birth); let a = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
};
export const energyGoal = (g: Goal): Exclude<Goal, 'health'> => (g === 'health' ? 'maintain' : g);
export const changesWeight = (g: Goal) => energyGoal(g) !== 'maintain';
export const suggestedActivity = (n: number): Activity => (n >= 6 ? 'active' : n >= 3 ? 'moderate' : n >= 1 ? 'light' : 'sedentary');

export type Targets = { bmr: number; tdee: number; calories: number; protein: number; carbs: number; fat: number; fiber: number; water: number; clamped: boolean };

/** Mifflin-St Jeor × activity, safe deficit/surplus caps, protein on reference weight. Same as the Swift app. */
export function targets(p: Profile, now = new Date()): Targets {
  const goal = energyGoal(p.goal);
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * age(p, now) + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * (ACTIVITIES.find(a => a.id === p.activity) ?? ACTIVITIES[1]).mult;
  const rate = Math.min(Math.max(p.rate, 0), 1);
  const delta = goal === 'lose' ? -Math.min((rate * 7700) / 7, tdee * 0.25) : goal === 'gain' ? Math.min((rate * 7700) / 7, tdee * 0.15) : 0;
  let cal = tdee + delta, clamped = false;
  const floor = Math.max(p.sex === 'male' ? 1500 : 1200, bmr);
  if (cal < floor && goal === 'lose') { cal = floor; clamped = true; }
  if (p.custom && p.custom >= 800) { cal = p.custom; clamped = false; }
  cal = Math.round(cal / 10) * 10;
  const ppk = goal === 'lose' ? 2.0 : goal === 'gain' ? 1.8 : 1.6;
  const hm = p.height / 100, ref = Math.min(p.weight, 27 * hm * hm);
  let protein = ppk * ref, fat = Math.max((cal * 0.3) / 9, 0.6 * p.weight);
  if (protein * 4 + fat * 9 > cal * 0.85) { const s = (cal * 0.85) / (protein * 4 + fat * 9); protein *= s; fat *= s; }
  const carbs = Math.max(0, (cal - protein * 4 - fat * 9) / 4);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories: cal, protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat),
    fiber: Math.round((cal / 1000) * 14), water: Math.max(6, Math.round((p.weight * 35) / 250)), clamped };
}

export const weeksToGoal = (p: Profile) => (changesWeight(p.goal) && p.rate > 0 ? Math.ceil(Math.abs(p.weight - p.target) / Math.min(p.rate, 1)) : null);

export function mealBudgets(p: Profile, total: number): Record<Meal, number> {
  const snack = p.snacks ? 0.1 : 0;
  const s: Record<Meal, number> = { breakfast: 0, lunch: 0, dinner: 0, snack };
  if (p.meals <= 2) { s.lunch = (1 - snack) / 2; s.dinner = (1 - snack) / 2; }
  else if (p.meals === 3) { s.breakfast = s.lunch = s.dinner = (1 - snack) / 3; }
  else { const b = (1 - snack) / 4; s.breakfast = s.lunch = s.dinner = b; s.snack = b + snack; }
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.round((total * v) / 10) * 10])) as Record<Meal, number>;
}

export const scaled = (n: Nutrients, g: number): Nutrients => {
  const f = Math.max(g, 0) / 100;
  return { kcal: n.kcal * f, protein: n.protein * f, carbs: n.carbs * f, fat: n.fat * f, fiber: n.fiber * f, sugar: n.sugar * f };
};
export const add = (a: Nutrients, b: Nutrients): Nutrients => ({
  kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber, sugar: a.sugar + b.sugar,
});
export const sumEntries = (list: { per100: Nutrients; grams: number }[]) => list.reduce((acc, e) => add(acc, scaled(e.per100, e.grams)), ZERO);

export const fmt = (v: number) => Math.round(v || 0).toLocaleString('nl-NL');
export const kg1 = (v: number) => v.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------- search ---------- */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export function searchFoods(q: string, limit = 25): Food[] {
  const n = norm(q); if (!n) return [];
  const out: [Food, number][] = [];
  for (const f of FOODS) {
    let best = 0;
    for (const name of [f.name, ...f.aliases].map(norm)) {
      const s = name === n ? 100 : name.startsWith(n) ? 80 : name.split(' ').some(w => w.startsWith(n)) ? 60 : name.includes(n) ? 40 : 0;
      best = Math.max(best, s);
    }
    if (best) out.push([f, best]);
  }
  return out.sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name)).slice(0, limit).map(x => x[0]);
}

/* ---------- "2 boterhammen met kaas en een appel" ---------- */
const NUMW: Record<string, number> = { een: 1, 'één': 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, half: 0.5, halve: 0.5, anderhalf: 1.5, paar: 2 };
const FILLER = new Set(['stuk', 'stuks', 'glas', 'kop', 'kopje', 'kom', 'bord', 'portie', 'plak', 'plakje', 'plakjes', 'snee', 'sneetje', 'handje', 'beetje', 'wat']);
export function ruleParse(text: string) {
  let parts = [text.toLowerCase()];
  for (const sep of [',', ' en ', ' met ', ' + ', '\n', ';']) parts = parts.flatMap(p => p.split(sep));
  return parts.map(raw => {
    const w = raw.split(' ').filter(Boolean); if (!w.length) return null;
    let qty = 1, grams: number | null = null; const first = w[0];
    if (/^[\d.,]+$/.test(first)) { qty = parseFloat(first.replace(',', '.')); w.shift(); }
    else if (NUMW[first] != null) { qty = NUMW[first]; w.shift(); }
    else if (/^\d+g$/.test(first)) { grams = parseFloat(first); w.shift(); }
    if (w[0] && ['gram', 'g', 'gr'].includes(w[0])) { grams = qty; qty = 1; w.shift(); }
    while (w.length && FILLER.has(w[0])) w.shift();
    const name = w.join(' ').replace(/^[\s.,!?]+|[\s.,!?]+$/g, '');
    return name ? { name, qty, grams } : null;
  }).filter((x): x is { name: string; qty: number; grams: number | null } => !!x);
}
export const singular = (w: string) => (w.endsWith('mmen') ? w.slice(0, -3) : w.endsWith('en') && w.length > 4 ? w.slice(0, -2) : w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w);

export type Recognized = { uid: string; item: Food; grams: number; conf: number; alts: Food[] };
let seq = 0;
export const uid = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

export function parseDescription(text: string): Recognized[] {
  return ruleParse(text).map(p => {
    let m = searchFoods(p.name, 6); if (!m.length) m = searchFoods(singular(p.name), 6);
    if (!m.length) return null;
    const item = m[0];
    return { uid: uid(), item, grams: Math.round(p.grams ?? item.portionGrams * Math.max(p.qty, 0.25)), conf: 0.8, alts: m.slice(1) };
  }).filter((x): x is Recognized => !!x);
}

export const suggestedMeal = (d = new Date()): Meal => {
  const h = d.getHours();
  return h >= 4 && h < 10 ? 'breakfast' : h >= 10 && h < 14 ? 'lunch' : h >= 17 && h < 21 ? 'dinner' : 'snack';
};
export const startOfDay = (d: Date | string | number) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const sameDay = (a: Date | string, b: Date | string) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const dayKey = (d: Date | string) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`; };
export const DAY = 864e5;

/** Current time. Kept as a function so screens read the clock in one place. */
export const nowMs = () => Date.now();
export const lastNDays = (n: number) => Array.from({ length: n }, (_, i) => startOfDay(nowMs() - (n - 1 - i) * DAY));
