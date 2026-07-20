export type ProviderId = "openai" | "deepseek" | "qwen" | "custom";

export interface ModelSettings {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  temperature: number;
}

export interface TranslateInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  settings: ModelSettings;
  apiKey: string;
  abortSignal?: AbortSignal;
}
