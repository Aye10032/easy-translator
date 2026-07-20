import type { ModelSettings, ProviderId } from "./types";

export const providerPresets: Record<Exclude<ProviderId, "custom">, Pick<ModelSettings, "baseUrl" | "model">> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
};

export const defaultSettings: ModelSettings = {
  provider: "openai",
  ...providerPresets.openai,
  temperature: 0.2,
};

export const providerLabels: Record<ProviderId, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  qwen: "通义千问",
  custom: "自定义兼容接口",
};
