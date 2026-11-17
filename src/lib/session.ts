import type { Recognized, Meal, Food } from './nutrition';

/** Transient hand-off between scanner → review → search (not persisted). */
export const scanSession: {
  foods: Recognized[]; photo: string | null; source: 'photo' | 'barcode' | 'describe'; meal: Meal | null;
  message: string | null; ai: boolean; pickFor: 'review' | 'log' | null; amountFood: Food | null; amountMeal: Meal | null;
} = { foods: [], photo: null, source: 'photo', meal: null, message: null, ai: false, pickFor: null, amountFood: null, amountMeal: null };

export const setScanFoods = (foods: Recognized[]) => { scanSession.foods = foods; };
export const setScanMeal = (meal: Meal | null) => { scanSession.meal = meal; };
export const setPickFor = (v: 'review' | 'log' | null) => { scanSession.pickFor = v; };
export const clearScan = () => { scanSession.foods = []; scanSession.meal = null; };
export const addScanFood = (item: Food) => {
  scanSession.foods = [...scanSession.foods, { uid: Math.random().toString(36).slice(2), item, grams: item.portionGrams, conf: 1, alts: [] }];
};
export const setAmountFood = (f: Food | null, meal?: Meal | null) => { scanSession.amountFood = f; if (meal !== undefined) scanSession.amountMeal = meal; };
