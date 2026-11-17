import { Food, Nutrients } from './nutrition';

/** Open Food Facts: free, open database of real products. Only the barcode or search term is sent. */
const FIELDS = 'code,product_name,product_name_nl,brands,nutriments,serving_quantity,serving_size';
const num = (v: unknown) => { const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN; return Number.isFinite(n) ? n : undefined; };

type OFFProduct = { code?: string; product_name?: string; product_name_nl?: string; brands?: string; nutriments?: Record<string, unknown>; serving_quantity?: unknown; serving_size?: string };

function toFood(p: OFFProduct, code?: string): Food | null {
  const name = (p.product_name_nl || p.product_name || '').trim();
  const n = p.nutriments; if (!name || !n) return null;
  const kj = num(n['energy_100g']);
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (kcal === undefined) return null;
  const per100: Nutrients = { kcal, protein: num(n['proteins_100g']) ?? 0, carbs: num(n['carbohydrates_100g']) ?? 0, fat: num(n['fat_100g']) ?? 0, fiber: num(n['fiber_100g']) ?? 0, sugar: num(n['sugars_100g']) ?? 0 };
  const serving = num(p.serving_quantity);
  return { id: 'off:' + (p.code || code || name), key: p.code || name, name, aliases: [], category: 'product', per100,
    portionLabel: serving ? p.serving_size || '1 portie' : '100 g', portionGrams: serving && serving < 2000 ? serving : 100, vision: [],
    brand: p.brands?.split(',')[0]?.trim() };
}

async function get(url: string) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Bord-Expo/1.0' }, signal: ctrl.signal });
    if (r.status === 404) throw new Error('Product niet gevonden in Open Food Facts.');
    if (!r.ok) throw new Error('De productdatabase reageert niet. Probeer het zo opnieuw.');
    return await r.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Geen verbinding met de productdatabase.');
    throw e;
  } finally { clearTimeout(t); }
}

export async function productByBarcode(code: string): Promise<Food> {
  const c = code.replace(/\D/g, '');
  const d = await get(`https://world.openfoodfacts.org/api/v2/product/${c}.json?fields=${FIELDS}`);
  if (d.status !== 1 || !d.product) throw new Error('Product niet gevonden in Open Food Facts.');
  const f = toFood(d.product, c);
  if (!f) throw new Error('Dit product heeft nog geen voedingswaarden.');
  return f;
}

export async function searchProducts(q: string): Promise<Food[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n&fields=${FIELDS}`;
  const d = await get(url);
  return ((d.products || []) as OFFProduct[]).map(p => toFood(p)).filter((x): x is Food => !!x);
}
