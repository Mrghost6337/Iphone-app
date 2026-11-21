import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { FOODS, Food, Recognized, norm, searchFoods, uid } from './nutrition';

/**
 * Photo → foods with Claude vision. Expo Go can't run Apple's on-device Vision model, so recognition
 * runs on Claude with the user's own API key, kept in the iOS Keychain (expo-secure-store).
 * Never ship a shared key inside the app: anyone could extract it. For a public release, put this
 * call behind your own server.
 */
const KEY_NAME = 'anthropic_api_key';
// SecureStore has no web implementation; the web build is only a preview, so it simply has no key.
const web = Platform.OS === 'web';
export const getApiKey = async () => (web ? null : SecureStore.getItemAsync(KEY_NAME));
export const setApiKey = async (k: string) => { if (web) return; await (k ? SecureStore.setItemAsync(KEY_NAME, k.trim()) : SecureStore.deleteItemAsync(KEY_NAME)); };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isFood', 'items'],
  properties: {
    isFood: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'databaseName', 'grams', 'kcal100', 'protein100', 'carbs100', 'fat100', 'fiber100', 'confidence'],
        properties: {
          name: { type: 'string', description: 'Nederlandse naam van het onderdeel' },
          databaseName: { type: 'string', description: 'Exacte naam uit de lijst als die overeenkomt, anders lege string' },
          grams: { type: 'number', description: 'Geschatte portie in gram' },
          kcal100: { type: 'number' }, protein100: { type: 'number' }, carbs100: { type: 'number' }, fat100: { type: 'number' }, fiber100: { type: 'number' },
          confidence: { type: 'number', description: '0 tot 1' },
        },
      },
    },
  },
} as const;

type Result = { isFood: boolean; items: { name: string; databaseName: string; grams: number; kcal100: number; protein100: number; carbs100: number; fat100: number; fiber100: number; confidence: number }[] };

export class AIError extends Error {}

export async function recognizeMeal(base64Jpeg: string): Promise<{ foods: Recognized[]; notFood: boolean }> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new AIError('Voeg in Instellingen › AI-herkenning je Anthropic API-sleutel toe om foto\'s te laten herkennen.');
  const list = FOODS.map(f => f.name).join('; ');
  // Plain fetch instead of the Node SDK: works the same in Expo Go (Hermes) and on web.
  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg } },
            { type: 'text', text:
              'Dit is een foto uit een calorie-app. Benoem elk afzonderlijk onderdeel dat iemand eet (max. 5). ' +
              'Schat per onderdeel de portie in gram zo realistisch mogelijk (let op bordgrootte en verhoudingen) en geef voedingswaarden per 100 gram. ' +
              'Als een onderdeel overeenkomt met een product uit deze lijst, zet de exacte naam in databaseName, anders een lege string: ' + list +
              '. Is er geen eten te zien, zet isFood op false en laat items leeg.' },
          ],
        }],
      }),
    });
  } catch {
    throw new AIError('Geen internetverbinding.');
  }
  if (res.status === 401 || res.status === 403) throw new AIError('Je API-sleutel klopt niet. Controleer hem in Instellingen.');
  if (res.status === 429) throw new AIError('Even te veel verzoeken. Probeer het over een minuut opnieuw.');
  if (!res.ok) throw new AIError(`De AI-dienst gaf een fout (${res.status}). Probeer het opnieuw.`);
  const response = (await res.json()) as { stop_reason?: string; content: { type: string; text?: string }[] };
  if (response.stop_reason === 'refusal') throw new AIError('Deze foto kon niet worden geanalyseerd.');
  const text = response.content.map(b => (b.type === 'text' ? b.text ?? '' : '')).join('');
  let parsed: Result;
  try { parsed = JSON.parse(text) as Result; } catch { throw new AIError('De herkenning gaf een onleesbaar antwoord. Probeer het opnieuw.'); }

  const foods: Recognized[] = parsed.items.slice(0, 5).map(it => {
    const db = it.databaseName ? FOODS.find(f => norm(f.name) === norm(it.databaseName)) : undefined;
    const grams = Math.max(5, Math.min(1500, Math.round(it.grams || 100)));
    const item: Food = db ?? {
      id: 'ai:' + uid(), key: 'ai', name: it.name.slice(0, 60), aliases: [], category: 'ai', ai: true, vision: [],
      portionLabel: null, portionGrams: grams,
      per100: { kcal: it.kcal100, protein: it.protein100, carbs: it.carbs100, fat: it.fat100, fiber: it.fiber100, sugar: 0 },
    };
    const alts = searchFoods(it.name, 6).filter(f => f.id !== item.id).slice(0, 5);
    return { uid: uid(), item, grams, conf: Math.max(0, Math.min(1, it.confidence)), alts };
  });
  return { foods, notFood: !parsed.isFood };
}
