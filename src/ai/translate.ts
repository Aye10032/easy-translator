import { createOpenAI } from "@ai-sdk/openai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { streamText } from "ai";
import type { ModelSettings, TranslateInput } from "./types";

export interface ModelAvailabilityResult {
  firstTokenLatencyMs: number;
  totalDurationMs: number;
}

function addProviderReasoningControls(body: BodyInit | null | undefined, settings: ModelSettings) {
  if (typeof body !== "string") return body;

  try {
    const payload = JSON.parse(body) as Record<string, unknown>;

    // These OpenAI-compatible providers use their own switch in addition to
    // reasoning_effort. Keep it provider-specific so other endpoints do not
    // receive fields they may reject.
    if (settings.provider === "deepseek") {
      payload.thinking = { type: settings.reasoningEnabled ? "enabled" : "disabled" };
    } else if (settings.provider === "qwen") {
      payload.enable_thinking = settings.reasoningEnabled;
    }

    return JSON.stringify(payload);
  } catch {
    return body;
  }
}

function getReasoningSetting(settings: ModelSettings) {
  if (settings.reasoningEnabled) return settings.reasoningEffort;

  // DeepSeek and Qwen use the explicit provider switches injected above.
  if (settings.provider === "deepseek" || settings.provider === "qwen") return undefined;

  // OpenAI models before GPT-5.1 do not support `none`; omitting the option
  // keeps non-reasoning models such as gpt-4o-mini working normally.
  if (settings.provider === "openai") {
    const version = /^gpt-5\.(\d+)/i.exec(settings.model)?.[1];
    return version && Number(version) >= 1 ? "none" as const : undefined;
  }

  // A custom endpoint is user-declared as OpenAI-compatible, so use the
  // standard opt-out value and let the endpoint validate model support.
  return "none" as const;
}

function createConfiguredProvider(settings: ModelSettings, apiKey: string) {
  return createOpenAI({
    apiKey,
    baseURL: settings.baseUrl.replace(/\/$/, ""),
    name: settings.provider,
    fetch: (request, init) => tauriFetch(request, {
      ...init,
      body: addProviderReasoningControls(init?.body, settings),
    }),
  });
}

export async function checkModelAvailability(settings: ModelSettings, apiKey: string): Promise<ModelAvailabilityResult> {
  const checkSettings = { ...settings, reasoningEnabled: false };
  const provider = createConfiguredProvider(checkSettings, apiKey);
  const startedAt = performance.now();
  let firstTokenAt: number | undefined;
  let responseText = "";

  const result = streamText({
    model: provider.chat(checkSettings.model),
    reasoning: getReasoningSetting(checkSettings),
    prompt: "Reply with exactly: OK",
    maxOutputTokens: 16,
    timeout: 30_000,
  });

  for await (const chunk of result.textStream) {
    if (chunk && firstTokenAt === undefined) firstTokenAt = performance.now();
    responseText += chunk;
  }

  const completedAt = performance.now();
  if (!responseText.trim()) throw new Error("模型已连接，但没有返回文本内容。");

  return {
    firstTokenLatencyMs: Math.round((firstTokenAt ?? completedAt) - startedAt),
    totalDurationMs: Math.round(completedAt - startedAt),
  };
}

export async function* translateText(input: TranslateInput): AsyncGenerator<string> {
  const provider = createConfiguredProvider(input.settings, input.apiKey);

  const result = streamText({
    model: provider.chat(input.settings.model),
    reasoning: getReasoningSetting(input.settings),
    abortSignal: input.abortSignal,
    system: [
      "You are a professional translator.",
      "Translate faithfully while preserving meaning, paragraph breaks, and formatting.",
      input.toneInstruction?.trim() ? `Translation style requirement: ${input.toneInstruction.trim()}` : "",
      "Return only the translation without explanations or quotation marks.",
    ].filter(Boolean).join(" "),
    prompt: `Source language: ${input.sourceLanguage}\nTarget language: ${input.targetLanguage}\n\nText:\n${input.text}`,
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
