import { invoke } from "@tauri-apps/api/core";

export function getApiKey(provider: string): Promise<string | null> {
  return invoke("get_api_key", { provider });
}

export function saveApiKey(provider: string, apiKey: string): Promise<void> {
  return invoke("save_api_key", { provider, apiKey });
}

export function deleteApiKey(provider: string): Promise<void> {
  return invoke("delete_api_key", { provider });
}
