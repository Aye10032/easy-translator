import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  Copy,
  Languages,
  LoaderCircle,
  Settings2,
  Square,
  WandSparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { defaultProfile } from "../ai/providers";
import { translateText } from "../ai/translate";
import type { ModelProfile } from "../ai/types";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { getApiKey, loadModelProfiles, loadSettings, setActiveModel } from "../lib/settings";

const languages = ["自动检测", "中文", "英语", "日语", "韩语", "法语", "德语", "西班牙语"];

function nextAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function revealChunk(current: string, chunk: string, signal: AbortSignal, update: (value: string) => void) {
  const characters = Array.from(chunk);
  if (characters.length <= 12) {
    const next = current + chunk;
    update(next);
    return next;
  }

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
  const [profiles, setProfiles] = useState<ModelProfile[]>([defaultProfile]);
  const [settings, setSettings] = useState<ModelProfile>(defaultProfile);
  const [sourceLanguage, setSourceLanguage] = useState("自动检测");
  const [targetLanguage, setTargetLanguage] = useState("英语");
  const [source, setSource] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");
  const [translating, setTranslating] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void loadModelProfiles().then((state) => {
      setProfiles(state.profiles);
      setSettings(state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0]);
    });
  }, []);

  async function changeProfile(modelId: string) {
    try {
      const profile = await setActiveModel(modelId);
      setSettings(profile);
      setError("");
      toast.success(`已切换至 ${profile.name}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      toast.error("模型切换失败", { description: message });
    }
  }

  function swapLanguages() {
    if (sourceLanguage === "自动检测") return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSource(translation);
    setTranslation(source);
  }

  async function copyTranslation() {
    await navigator.clipboard.writeText(translation);
    toast.success("译文已复制");
  }

  async function runTranslation() {
    if (!source.trim() || translating) return;
    setError("");
    setTranslation("");
    setTranslating(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const currentSettings = await loadSettings();
      setSettings(currentSettings);
      const apiKey = await getApiKey(currentSettings.id);
      if (!apiKey) throw new Error("尚未配置 API Key，请先前往模型设置。");

      let content = "";
      for await (const chunk of translateText({
        text: source,
        sourceLanguage,
        targetLanguage,
        settings: currentSettings,
        apiKey,
        abortSignal: controller.signal,
      })) {
        content = await revealChunk(content, chunk, controller.signal, setTranslation);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(message);
        toast.error("翻译失败", { description: message });
      }
    } finally {
      setTranslating(false);
      controllerRef.current = null;
    }
  }

  return (
    <section className="workspace-page">
      <div className="workspace-tools">
        <div className="header-tools">
          <Select value={settings.id} onValueChange={(value) => void changeProfile(value)} disabled={translating}>
            <SelectTrigger className="model-select" aria-label="选择模型"><SelectValue /></SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => <SelectItem value={profile.id} key={profile.id}>{profile.model}</SelectItem>)}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="secondary" size="icon"><Link to="/settings" aria-label="管理模型"><Settings2 size={17} /></Link></Button>
            </TooltipTrigger>
            <TooltipContent>管理模型</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="translation-workbench">
        <div className="language-toolbar">
          <div className="language-slot">
            <span>源语言</span>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="language-select"><SelectValue /></SelectTrigger>
              <SelectContent>{languages.map((language) => <SelectItem value={language} key={language}>{language}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" className="swap-button" onClick={swapLanguages} disabled={sourceLanguage === "自动检测"} aria-label="交换语言">
                <ArrowRightLeft size={17} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>交换语言</TooltipContent>
          </Tooltip>

          <div className="language-slot target-language-slot">
            <span>目标语言</span>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="language-select"><SelectValue /></SelectTrigger>
              <SelectContent>{languages.slice(1).map((language) => <SelectItem value={language} key={language}>{language}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="translation-panels">
          <article className="translation-panel source-panel">
            <div className="panel-heading"><span>原文</span><small>{source.length.toLocaleString()} 字符</small></div>
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void runTranslation();
                }
              }}
              placeholder="输入或粘贴需要翻译的内容…"
              autoFocus
            />
            <div className="panel-footer">
              <span>支持段落与长文本</span>
              {source && <Button variant="ghost" size="sm" onClick={() => setSource("")}><X size={14} />清空</Button>}
            </div>
          </article>

          <article className="translation-panel result-panel">
            <div className="panel-heading">
              <span>译文</span>
              {translation && (
                <Button variant="ghost" size="sm" onClick={() => void copyTranslation()}><Copy size={14} />复制</Button>
              )}
            </div>

            {translation ? (
              <div className="translation-output">{translation}</div>
            ) : error ? (
              <div className="panel-state error-state"><div className="state-icon"><X size={20} /></div><strong>翻译没有完成</strong><p>{error}</p><Button asChild variant="secondary" size="sm"><Link to="/settings">检查模型设置</Link></Button></div>
            ) : translating ? (
              <div className="panel-state"><div className="state-icon active"><LoaderCircle className="spin" size={22} /></div><strong>正在连接模型</strong><p>译文会实时出现在这里</p></div>
            ) : (
              <div className="panel-state"><div className="state-icon"><Languages size={22} /></div><strong>等待翻译</strong><p>输入原文后开始生成译文</p></div>
            )}

            <div className="panel-footer result-footer">
              <span>{translation ? <><Check size={13} /> 已生成</> : "由 AI 生成的内容可能需要校对"}</span>
            </div>
          </article>
        </div>

        <footer className="workbench-footer">
          <div className="shortcut-hint"><kbd>Ctrl</kbd><span>+</span><kbd>Enter</kbd><span>开始翻译</span></div>
          {translating ? (
            <div className="generating-actions"><span><LoaderCircle className="spin" size={15} />正在生成译文</span><Button variant="secondary" onClick={() => controllerRef.current?.abort()}><Square size={15} />停止生成</Button></div>
          ) : (
            <Button size="lg" className="start-translation" onClick={() => void runTranslation()} disabled={!source.trim()}><WandSparkles size={18} />开始翻译</Button>
          )}
        </footer>
      </div>
    </section>
  );
}
