import type { TranslationTone, TranslationToneSettings } from "./types";

export const translationTones: TranslationTone[] = ["conversational", "academic", "original"];

export const translationToneLabels: Record<TranslationTone, string> = {
  conversational: "口语化表达",
  academic: "学术化表达",
  original: "保持原文风格",
};

export const translationToneDescriptions: Record<TranslationTone, string> = {
  conversational: "使用自然、地道、易读的日常表达。",
  academic: "使用正式、严谨、术语准确的学术表达。",
  original: "让译文沿用原文的语域、正式程度和情绪。",
};

export const defaultTranslationToneSettings: TranslationToneSettings = {
  activeTone: "original",
  prompts: {
    conversational: "Use natural, conversational, and idiomatic phrasing in the target language. Keep the translation clear and approachable, and avoid stiff or overly formal wording.",
    academic: "Use formal, precise academic language in the target language. Prefer rigorous terminology, clear logical connections, and an objective register without adding information.",
    original: "Match the source text's style, register, level of formality, and emotional tone in the translation.",
  },
};
