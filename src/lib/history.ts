import { Store } from "@tauri-apps/plugin-store";

const HISTORY_KEY = "translation-history";
const HISTORY_LIMIT = 200;
const HISTORY_SIZE_LIMIT = 10 * 1024 * 1024;
const encoder = new TextEncoder();
let storePromise: Promise<Store> | undefined;

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  modelId: string;
  profileName: string;
  model: string;
  createdAt: string;
}

export type NewTranslationHistoryItem = Omit<TranslationHistoryItem, "id" | "createdAt">;

function getStore() {
  storePromise ??= Store.load("translation-history.json", { autoSave: false });
  return storePromise;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeItem(value: unknown): TranslationHistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TranslationHistoryItem>;
  if (
    !isString(item.id) || !item.id ||
    !isString(item.sourceText) || !isString(item.translatedText) ||
    !isString(item.sourceLanguage) || !isString(item.targetLanguage) ||
    !isString(item.modelId) || !isString(item.profileName) ||
    !isString(item.model) || !isString(item.createdAt) ||
    Number.isNaN(Date.parse(item.createdAt))
  ) return null;

  return item as TranslationHistoryItem;
}

function serializedSize(value: unknown) {
  return encoder.encode(JSON.stringify(value)).byteLength;
}

function fitWithinLimits(items: TranslationHistoryItem[]) {
  const kept: TranslationHistoryItem[] = [];
  let size = 2;

  for (const item of items.slice(0, HISTORY_LIMIT)) {
    const itemSize = serializedSize(item) + (kept.length > 0 ? 1 : 0);
    if (size + itemSize > HISTORY_SIZE_LIMIT) break;
    kept.push(item);
    size += itemSize;
  }

  return kept;
}

async function saveHistory(items: TranslationHistoryItem[]) {
  const store = await getStore();
  await store.set(HISTORY_KEY, items);
  await store.save();
}

export async function loadTranslationHistory(): Promise<TranslationHistoryItem[]> {
  const stored = await (await getStore()).get<unknown>(HISTORY_KEY);
  if (!Array.isArray(stored)) return [];

  return stored
    .map(normalizeItem)
    .filter((item): item is TranslationHistoryItem => item !== null)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function getTranslationHistoryItem(id: string): Promise<TranslationHistoryItem | null> {
  const items = await loadTranslationHistory();
  return items.find((item) => item.id === id) ?? null;
}

export async function addTranslationHistory(input: NewTranslationHistoryItem): Promise<TranslationHistoryItem> {
  const item: TranslationHistoryItem = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  if (serializedSize([item]) > HISTORY_SIZE_LIMIT) {
    throw new Error("本次内容过长，未写入历史记录。");
  }

  const items = fitWithinLimits([item, ...await loadTranslationHistory()]);
  await saveHistory(items);
  return item;
}

export async function deleteTranslationHistoryItem(id: string): Promise<TranslationHistoryItem[]> {
  const items = (await loadTranslationHistory()).filter((item) => item.id !== id);
  await saveHistory(items);
  return items;
}

export async function clearTranslationHistory(): Promise<void> {
  await saveHistory([]);
}
