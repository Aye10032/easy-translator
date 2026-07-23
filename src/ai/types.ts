export type ProviderId = "openai" | "deepseek" | "qwen" | "custom";
export type ReasoningEffort = "low" | "medium" | "high";
export type TranslationTone = "conversational" | "academic" | "original";

export interface TranslationToneSettings {
  activeTone: TranslationTone;
  prompts: Record<TranslationTone, string>;
}

export interface ModelSettings {
  provider: ProviderId;
  baseUrl: string;
  model: string;
  reasoningEnabled: boolean;
  reasoningEffort: ReasoningEffort;
}

export interface ModelProfile extends ModelSettings {
  id: string;
  name: string;
}

export interface ModelProfilesState {
  activeModelId: string;
  profiles: ModelProfile[];
}

export interface TranslateInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  settings: ModelSettings;
  apiKey: string;
  toneInstruction?: string;
  abortSignal?: AbortSignal;
}
