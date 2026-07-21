import { Store } from "@tauri-apps/plugin-store";
import { defaultSettings } from "../ai/providers";
import type { ModelSettings, ProviderId, ReasoningEffort } from "../ai/types";

const SETTINGS_KEY = "model-settings";
const API_KEYS_KEY = "api-keys";
let storePromise: Promise<Store> | undefined;

function getStore() {
  storePromise ??= Store.load("settings.json", { autoSave: true });
  return storePromise;
}

export async function loadSettings(): Promise<ModelSettings> {
  try {
    const stored = await (await getStore()).get<Partial<ModelSettings>>(SETTINGS_KEY);
    if (!stored) return defaultSettings;

    const provider: ProviderId = ["openai", "deepseek", "qwen", "custom"].includes(stored.provider ?? "")
      ? stored.provider as ProviderId
      : defaultSettings.provider;
    const reasoningEffort: ReasoningEffort = ["low", "medium", "high"].includes(stored.reasoningEffort ?? "")
      ? stored.reasoningEffort as ReasoningEffort
      : defaultSettings.reasoningEffort;

    // Rebuild from known fields so retired generation options are removed
    // when legacy settings are loaded and saved again.
    return {
      provider,
      baseUrl: typeof stored.baseUrl === "string" ? stored.baseUrl : defaultSettings.baseUrl,
      model: typeof stored.model === "string" ? stored.model : defaultSettings.model,
      reasoningEnabled: typeof stored.reasoningEnabled === "boolean" ? stored.reasoningEnabled : defaultSettings.reasoningEnabled,
      reasoningEffort,
    };
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
