import { Store } from "@tauri-apps/plugin-store";
import { defaultSettings } from "../ai/providers";
import type { ModelSettings } from "../ai/types";

const SETTINGS_KEY = "model-settings";
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
