import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Copy, Languages, LoaderCircle, Settings2, Square, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { defaultSettings, providerLabels } from "../ai/providers";
import { translateText } from "../ai/translate";
import type { ModelSettings } from "../ai/types";
import { getApiKey, loadSettings } from "../lib/settings";

const languages = ["自动检测", "中文", "英语", "日语", "韩语", "法语", "德语", "西班牙语"];

function nextAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function revealChunk(
  current: string,
  chunk: string,
  signal: AbortSignal,
  update: (value: string) => void,
) {
  const characters = Array.from(chunk);

  if (characters.length <= 12) {
    const next = current + chunk;
    update(next);
    return next;
  }

  // Some OpenAI-compatible services buffer multiple tokens into one large
  // SSE chunk. Reveal large chunks over at most ~45 frames for a consistent
  // streaming experience without noticeably delaying the final result.
  const batchSize = Math.max(2, Math.ceil(characters.length / 45));
  let next = current;
  for (let index = 0; index < characters.length; index += batchSize) {
    if (signal.aborted) return next;
    next += characters.slice(index, index + batchSize).join("");
    update(next);
    await nextAnimationFrame();
  }

  return next;
}

export function TranslatePage() {
  const [settings, setSettings] = useState<ModelSettings>(defaultSettings);
  const [sourceLanguage, setSourceLanguage] = useState("自动检测");
  const [targetLanguage, setTargetLanguage] = useState("英语");
  const [source, setSource] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");
  const [translating, setTranslating] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => { void loadSettings().then(setSettings); }, []);

  function swapLanguages() {
    if (sourceLanguage === "自动检测") return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSource(translation);
    setTranslation(source);
  }

  async function runTranslation() {
    if (!source.trim()) return;
    setError("");
    setTranslation("");
    setTranslating(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const currentSettings = await loadSettings();
      setSettings(currentSettings);
      const apiKey = await getApiKey(currentSettings.provider);
      if (!apiKey) throw new Error("尚未配置 API Key，请先前往模型设置。")

      let content = "";
      for await (const chunk of translateText({ text: source, sourceLanguage, targetLanguage, settings: currentSettings, apiKey, abortSignal: controller.signal })) {
        content = await revealChunk(content, chunk, controller.signal, setTranslation);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(message);
      }
    } finally {
      setTranslating(false);
      controllerRef.current = null;
    }
  }

  return (
    <section className="page translate-page">
      <header className="page-header">
        <div><span className="eyebrow">TRANSLATE</span><h1>让表达跨越语言</h1><p>由你选择的大模型提供自然、准确的翻译。</p></div>
        <Link className="model-chip" to="/settings"><span className="online-dot" />{providerLabels[settings.provider]} · {settings.model}<Settings2 size={15} /></Link>
      </header>

      <div className="language-bar">
        <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}>{languages.map((language) => <option key={language}>{language}</option>)}</select>
        <button className="swap-button" onClick={swapLanguages} disabled={sourceLanguage === "自动检测"} aria-label="交换语言"><ArrowRightLeft size={18} /></button>
        <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{languages.slice(1).map((language) => <option key={language}>{language}</option>)}</select>
      </div>

      <div className="translator-grid">
        <div className="text-panel">
          <div className="panel-label"><span>原文</span><small>{source.length} 字符</small></div>
          <textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder="输入或粘贴需要翻译的内容…" autoFocus />
          <div className="panel-actions"><button className="text-button" onClick={() => setSource("")} disabled={!source}>清空</button></div>
        </div>

        <div className="text-panel result-panel">
          <div className="panel-label"><span>译文</span>{translation && <button className="icon-button" onClick={() => void navigator.clipboard.writeText(translation)} aria-label="复制译文"><Copy size={17} /></button>}</div>
          {translation ? (
            <div className="translation-output">{translation}</div>
          ) : error ? (
            <div className="result-feedback error-feedback"><span>翻译失败</span><small>{error}</small></div>
          ) : translating ? (
            <div className="result-feedback"><LoaderCircle className="spin" size={28} /><span>正在连接模型…</span></div>
          ) : (
            <div className="empty-result"><Languages size={32} /><span>译文将在这里显示</span></div>
          )}
        </div>
      </div>

      <div className="translate-actions">
        {translating ? <button className="secondary-button" onClick={() => controllerRef.current?.abort()}><Square size={16} />停止生成</button> : <button className="primary-button translate-button" onClick={() => void runTranslation()} disabled={!source.trim()}><WandSparkles size={18} />开始翻译</button>}
        {translating && <span className="stream-status"><LoaderCircle className="spin" size={16} />正在生成译文</span>}
      </div>

    </section>
  );
}
