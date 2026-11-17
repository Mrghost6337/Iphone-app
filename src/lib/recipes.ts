import recipesJson from '@/data/recipes_nl.json';
import { foodByKey, Nutrients, ZERO, add, scaled, Diet, DIETS } from './nutrition';
import type { Post } from './store';

export type Recipe = {
  id: string; title: string; subtitle: string; image: number | { uri: string }; minutes: number; servings: number; difficulty: string;
  tags: string[]; allergens: string[]; ingredients: string[]; steps: { text: string; minutes?: number }[]; per: Nutrients;
  author: string; credit?: { artist: string; license: string }; community?: boolean; createdAt?: number;
};

const IMAGES: Record<string, number> = {
  shakshuka: require('../../assets/recipes/shakshuka.jpg'), carbonara: require('../../assets/recipes/carbonara.jpg'),
  greencurry: require('../../assets/recipes/greencurry.jpg'), poke: require('../../assets/recipes/poke.jpg'),
  stamppot: require('../../assets/recipes/stamppot.jpg'), pesto: require('../../assets/recipes/pesto.jpg'),
  pancakes: require('../../assets/recipes/pancakes.jpg'), tikka: require('../../assets/recipes/tikka.jpg'),
  chili: require('../../assets/recipes/chili.jpg'), hummus: require('../../assets/recipes/hummus.jpg'),
  avotoast: require('../../assets/recipes/avotoast.jpg'), greeksalad: require('../../assets/recipes/greeksalad.jpg'),
};

type Raw = { id: string; title: string; subtitle: string; image: string; time: number; servings: number; difficulty: string; tags: string[];
  allergens: string[]; ingredients: { t: string; ref?: string; g?: number }[]; steps: { t: string; min?: number }[]; credit?: { artist: string; license: string } };

/** Editorial recipes; nutrition per serving computed from the food database. */
export const RECIPES: Recipe[] = (recipesJson as Raw[]).map(r => {
  let total = ZERO;
  for (const i of r.ingredients) if (i.ref && i.g && foodByKey[i.ref]) total = add(total, scaled(foodByKey[i.ref].per100, i.g));
  return {
    id: 'r-' + r.id, title: r.title, subtitle: r.subtitle, image: IMAGES[r.image], minutes: r.time, servings: r.servings, difficulty: r.difficulty,
    tags: r.tags, allergens: r.allergens, ingredients: r.ingredients.map(i => i.t), steps: r.steps.map(s => ({ text: s.t, minutes: s.min })),
    per: scaled(total, 100 / r.servings), author: 'Bord-redactie', credit: r.credit,
  };
});

export const fitsDiet = (r: Recipe, d: Diet) => d === 'all' || DIETS.find(x => x.id === d)!.tags.some(t => r.tags.includes(t));
export const allergenHits = (r: Recipe, allergies: string[]) => r.allergens.filter(a => allergies.includes(a));

export function scaleText(text: string, from: number, to: number) {
  if (from === to) return text;
  const m = /^(\d+(?:[.,]\d+)?)/.exec(text);
  if (!m) return text;
  const v = Math.round(((parseFloat(m[1].replace(',', '.')) * to) / from) * 10) / 10;
  return v.toLocaleString('nl-NL') + text.slice(m[0].length);
}

export const postToRecipe = (p: Post): Recipe => ({
  id: 'p-' + p.id, title: p.title, subtitle: p.subtitle, image: { uri: p.photo }, minutes: p.minutes, servings: p.servings, difficulty: 'Makkelijk',
  tags: p.tags, allergens: [], ingredients: p.ingredients, steps: p.steps.map(text => ({ text })),
  per: { kcal: p.kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }, author: p.author || 'Jij', community: true, createdAt: p.createdAt,
});

