import { Store } from "@tauri-apps/plugin-store";
import { defaultProfile, defaultSettings } from "../ai/providers";
import type { ModelProfile, ModelProfilesState, ModelSettings, ProviderId, ReasoningEffort } from "../ai/types";

const LEGACY_SETTINGS_KEY = "model-settings";
const PROFILES_KEY = "model-profiles";
const API_KEYS_KEY = "api-keys";
const providerIds: ProviderId[] = ["openai", "deepseek", "qwen", "custom"];
const reasoningEfforts: ReasoningEffort[] = ["low", "medium", "high"];
let storePromise: Promise<Store> | undefined;

function getStore() {
  storePromise ??= Store.load("settings.json", { autoSave: true });
  return storePromise;
}

function normalizeSettings(stored?: Partial<ModelSettings> | null): ModelSettings {
  const provider = providerIds.includes(stored?.provider as ProviderId)
    ? stored?.provider as ProviderId
    : defaultSettings.provider;
  const reasoningEffort = reasoningEfforts.includes(stored?.reasoningEffort as ReasoningEffort)
    ? stored?.reasoningEffort as ReasoningEffort
    : defaultSettings.reasoningEffort;

  return {
    provider,
    baseUrl: typeof stored?.baseUrl === "string" ? stored.baseUrl : defaultSettings.baseUrl,
    model: typeof stored?.model === "string" ? stored.model : defaultSettings.model,
    reasoningEnabled: typeof stored?.reasoningEnabled === "boolean" ? stored.reasoningEnabled : defaultSettings.reasoningEnabled,
    reasoningEffort,
  };
}

function normalizeProfile(stored: Partial<ModelProfile>, fallbackId: string): ModelProfile {
  return {
    id: typeof stored.id === "string" && stored.id ? stored.id : fallbackId,
    name: typeof stored.name === "string" && stored.name.trim() ? stored.name.trim() : "未命名模型",
    ...normalizeSettings(stored),
  };
}

function normalizeProfilesState(stored: ModelProfilesState): ModelProfilesState | null {
  if (!Array.isArray(stored.profiles) || stored.profiles.length === 0) return null;

  const seenIds = new Set<string>();
  const profiles = stored.profiles.map((profile, index) => {
    let fallbackId = `model-${index + 1}`;
    while (seenIds.has(fallbackId)) fallbackId += "-copy";
    const normalized = normalizeProfile(profile, fallbackId);
    if (seenIds.has(normalized.id)) normalized.id = fallbackId;
    seenIds.add(normalized.id);
    return normalized;
  });
  const activeModelId = profiles.some((profile) => profile.id === stored.activeModelId)
    ? stored.activeModelId
    : profiles[0].id;

  return { activeModelId, profiles };
}

async function migrateLegacySettings(store: Store): Promise<ModelProfilesState> {
  const legacy = await store.get<Partial<ModelSettings>>(LEGACY_SETTINGS_KEY);
  const profile = legacy ? normalizeProfile({ ...legacy, id: defaultProfile.id, name: defaultProfile.name }, defaultProfile.id) : defaultProfile;
  const state = { activeModelId: profile.id, profiles: [profile] };

  try {
    const keys = (await store.get<Record<string, string>>(API_KEYS_KEY)) ?? {};
    const legacyApiKey = keys[profile.provider];
    if (legacyApiKey) {
      const { [profile.provider]: _legacyKey, ...remainingKeys } = keys;
      await store.set(API_KEYS_KEY, {
        ...remainingKeys,
        [profile.id]: keys[profile.id] || legacyApiKey,
      });
    }
    await store.set(PROFILES_KEY, state);
    await store.save();
  } catch {
    // The in-memory migrated state remains usable even if persistence fails.
  }

  return state;
}

export async function loadModelProfiles(): Promise<ModelProfilesState> {
  try {
    const store = await getStore();
    const stored = await store.get<ModelProfilesState>(PROFILES_KEY);
    const normalized = stored ? normalizeProfilesState(stored) : null;
    return normalized ?? migrateLegacySettings(store);
  } catch {
    return { activeModelId: defaultProfile.id, profiles: [defaultProfile] };
  }
}

export async function loadSettings(): Promise<ModelProfile> {
  const state = await loadModelProfiles();
  return state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
}

export async function saveModelProfile(profile: ModelProfile): Promise<ModelProfilesState> {
  const store = await getStore();
  const current = await loadModelProfiles();
  const normalized = normalizeProfile(profile, profile.id);
  const exists = current.profiles.some((item) => item.id === normalized.id);
  const profiles = exists
    ? current.profiles.map((item) => item.id === normalized.id ? normalized : item)
    : [...current.profiles, normalized];
  const next = { activeModelId: normalized.id, profiles };
  await store.set(PROFILES_KEY, next);
  await store.save();
  return next;
}

export async function setActiveModel(modelId: string): Promise<ModelProfile> {
  const store = await getStore();
  const current = await loadModelProfiles();
  const profile = current.profiles.find((item) => item.id === modelId);
  if (!profile) throw new Error("模型配置不存在。");
  await store.set(PROFILES_KEY, { ...current, activeModelId: modelId });
  await store.save();
  return profile;
}

export async function deleteModelProfile(modelId: string): Promise<ModelProfilesState> {
  const store = await getStore();
  const current = await loadModelProfiles();
  if (current.profiles.length <= 1) throw new Error("至少需要保留一个模型配置。");

  const profiles = current.profiles.filter((profile) => profile.id !== modelId);
  if (profiles.length === current.profiles.length) throw new Error("模型配置不存在。");
  const activeModelId = current.activeModelId === modelId ? profiles[0].id : current.activeModelId;
  const keys = (await store.get<Record<string, string>>(API_KEYS_KEY)) ?? {};
  const { [modelId]: _deletedKey, ...remainingKeys } = keys;
  const next = { activeModelId, profiles };

  await store.set(PROFILES_KEY, next);
  await store.set(API_KEYS_KEY, remainingKeys);
  await store.save();
  return next;
}

export async function getApiKey(modelId: string): Promise<string | null> {
  const keys = await (await getStore()).get<Record<string, string>>(API_KEYS_KEY);
  return keys?.[modelId] || null;
}

export async function saveApiKey(modelId: string, apiKey: string): Promise<void> {
  const store = await getStore();
  const keys = (await store.get<Record<string, string>>(API_KEYS_KEY)) ?? {};
  await store.set(API_KEYS_KEY, { ...keys, [modelId]: apiKey });
  await store.save();
}
