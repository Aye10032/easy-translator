import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { TranslateInput } from "./types";

export async function* translateText(input: TranslateInput): AsyncGenerator<string> {
  const provider = createOpenAI({
    apiKey: input.apiKey,
    baseURL: input.settings.baseUrl.replace(/\/$/, ""),
    name: input.settings.provider,
  });

  const result = streamText({
    model: provider.chat(input.settings.model),
    temperature: input.settings.temperature,
    abortSignal: input.abortSignal,
    system: [
      "You are a professional translator.",
      "Translate faithfully while preserving meaning, tone, paragraph breaks, and formatting.",
      "Return only the translation without explanations or quotation marks.",
    ].join(" "),
    prompt: `Source language: ${input.sourceLanguage}\nTarget language: ${input.targetLanguage}\n\nText:\n${input.text}`,
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
