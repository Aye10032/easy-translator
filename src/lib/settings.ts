import { Store } from "@tauri-apps/plugin-store";
import { defaultSettings } from "../ai/providers";
import type { ModelSettings } from "../ai/types";

const SETTINGS_KEY = "model-settings";
const API_KEYS_KEY = "api-keys";
let storePromise: Promise<Store> | undefined;

function getStore() {
  storePromise ??= Store.load("settings.json", { autoSave: true });
  return storePromise;
}

export async function loadSettings(): Promise<ModelSettings> {
  try {
    const stored = await (await getStore()).get<ModelSettings>(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...stored } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: ModelSettings): Promise<void> {
  const store = await getStore();
  await store.set(SETTINGS_KEY, settings);
  await store.save();
}

export async function getApiKey(provider: string): Promise<string | null> {
  const keys = await (await getStore()).get<Record<string, string>>(API_KEYS_KEY);
  return keys?.[provider] || null;
}

export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  const store = await getStore();
  const keys = (await store.get<Record<string, string>>(API_KEYS_KEY)) ?? {};
  await store.set(API_KEYS_KEY, { ...keys, [provider]: apiKey });
  await store.save();
}
