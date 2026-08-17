import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { listAvailableModels } from "../ai/models";
import { defaultProfile, providerLabels, providerPresets } from "../ai/providers";
import { defaultTranslationToneSettings, translationToneDescriptions, translationToneLabels, translationTones } from "../ai/tones";
import { checkModelAvailability } from "../ai/translate";
import type { ModelProfile, ProviderId, ReasoningEffort, TranslationToneSettings } from "../ai/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { cn } from "../lib/utils";
import { deleteModelProfile, getApiKey, loadModelProfiles, loadTranslationToneSettings, saveApiKey, saveModelProfile, saveTranslationToneSettings, setActiveModel } from "../lib/settings";

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<"models" | "translation">("models");
  const [profiles, setProfiles] = useState<ModelProfile[]>([defaultProfile]);
  const [settings, setSettings] = useState<ModelProfile>(defaultProfile);
  const [apiKey, setApiKey] = useState("");
  const [toneSettings, setToneSettings] = useState<TranslationToneSettings>(defaultTranslationToneSettings);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [checkingModel, setCheckingModel] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelListMessage, setModelListMessage] = useState("");
  const [modelCheck, setModelCheck] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [message, setMessage] = useState("");
  const [toneSaving, setToneSaving] = useState(false);
  const [toneMessage, setToneMessage] = useState("");
  const modelCheckSequence = useRef(0);

  function clearModelCheck() {
    modelCheckSequence.current += 1;
    setCheckingModel(false);
    setModelCheck(null);
  }

  function clearModelList() {
    setAvailableModels([]);
    setModelListMessage("");
    clearModelCheck();
  }

  function formatDuration(milliseconds: number) {
    return milliseconds < 1_000 ? `${milliseconds} 毫秒` : `${(milliseconds / 1_000).toFixed(2)} 秒`;
  }

  useEffect(() => {
    void Promise.all([loadModelProfiles(), loadTranslationToneSettings()])
      .then(async ([state, savedToneSettings]) => {
        const active = state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
        setProfiles(state.profiles);
        setSettings(active);
        setToneSettings(savedToneSettings);
        setApiKey((await getApiKey(active.id)) ?? "");
      })
      .catch(() => setMessage("读取配置失败，请确认应用权限。"))
      .finally(() => setLoading(false));
  }, []);

  async function changeProfile(modelId: string) {
    setActiveSection("models");
    if (modelId === settings.id) return;
    setMessage("");
    try {
      const profile = await setActiveModel(modelId);
      setSettings(profile);
      setApiKey((await getApiKey(profile.id)) ?? "");
      setShowKey(false);
      clearModelList();
    } catch (error) {
      const detail = String(error);
      setMessage(`切换失败：${detail}`);
      toast.error("模型切换失败", { description: detail });
    }
  }

  async function addProfile() {
    const profile: ModelProfile = { ...defaultProfile, id: crypto.randomUUID(), name: `模型 ${profiles.length + 1}` };
    try {
      const state = await saveModelProfile(profile);
      setProfiles(state.profiles);
      setSettings(profile);
      setActiveSection("models");
      setApiKey("");
      setShowKey(false);
      clearModelList();
      setMessage("已新建配置，请完善右侧信息并保存。");
      toast.success("已新建模型配置");
    } catch (error) {
      toast.error("新建失败", { description: String(error) });
    }
  }

  async function removeProfile() {
    if (profiles.length <= 1) return;
    try {
      const state = await deleteModelProfile(settings.id);
      const active = state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
      setProfiles(state.profiles);
      setSettings(active);
      setApiKey((await getApiKey(active.id)) ?? "");
      setShowKey(false);
      clearModelList();
      setMessage("");
      toast.success("模型配置已删除");
    } catch (error) {
      toast.error("删除失败", { description: String(error) });
    }
  }

  function changeProvider(provider: ProviderId) {
    const preset = provider === "custom" ? null : providerPresets[provider];
    setSettings((current) => ({ ...current, provider, ...(preset ?? {}) }));
    clearModelList();
  }

  async function fetchModels() {
    if (!settings.baseUrl.trim() || !apiKey.trim()) {
      setModelListMessage("请先填写 Base URL 和 API Key。");
      return;
    }

    setLoadingModels(true);
    setAvailableModels([]);
    setModelListMessage("");
    try {
      const models = await listAvailableModels(settings.baseUrl, apiKey);
      setAvailableModels(models);
      setModelListMessage(`已获取 ${models.length} 个模型`);
      toast.success(`已获取 ${models.length} 个可用模型`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setModelListMessage(`获取失败：${detail}；仍可手动填写模型名称。`);
    } finally {
      setLoadingModels(false);
    }
  }

  async function checkModel() {
    if (!settings.baseUrl.trim() || !settings.model.trim() || !apiKey.trim()) {
      setModelCheck({ status: "error", message: "请先填写 Base URL、模型名称和 API Key。" });
      return;
    }

    const checkSequence = ++modelCheckSequence.current;
    setCheckingModel(true);
    setModelCheck(null);
    try {
      const result = await checkModelAvailability({
        ...settings,
        baseUrl: settings.baseUrl.trim(),
        model: settings.model.trim(),
      }, apiKey.trim());
      if (checkSequence !== modelCheckSequence.current) return;
      const message = `模型可用 · 首字延迟 ${formatDuration(result.firstTokenLatencyMs)} · 完成耗时 ${formatDuration(result.totalDurationMs)}`;
      setModelCheck({ status: "success", message });
      toast.success("模型检查通过", { description: message });
    } catch (error) {
      if (checkSequence !== modelCheckSequence.current) return;
      const detail = error instanceof Error ? error.message : String(error);
      setModelCheck({ status: "error", message: `检查失败：${detail}` });
      toast.error("模型不可用", { description: detail });
    } finally {
      if (checkSequence === modelCheckSequence.current) setCheckingModel(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!settings.name.trim() || !settings.baseUrl.trim() || !settings.model.trim() || !apiKey.trim()) {
      setMessage("请填写配置名称、Base URL、模型名称和 API Key。");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const saved = { ...settings, name: settings.name.trim(), baseUrl: settings.baseUrl.trim(), model: settings.model.trim() };
      await saveApiKey(saved.id, apiKey.trim());
      const state = await saveModelProfile(saved);
      setProfiles(state.profiles);
      setSettings(saved);
      setMessage("模型配置已保存");
      toast.success("模型配置已保存");
    } catch (error) {
      const detail = String(error);
      setMessage(`保存失败：${detail}`);
      toast.error("保存失败", { description: detail });
    } finally {
      setSaving(false);
    }
  }

  async function submitToneSettings(event: React.FormEvent) {
    event.preventDefault();
    setToneSaving(true);
    setToneMessage("");
    try {
      setToneSettings(await saveTranslationToneSettings(toneSettings));
      setToneMessage("翻译偏好已保存");
      toast.success("翻译偏好已保存");
    } catch (error) {
      const detail = String(error);
      setToneMessage(`保存失败：${detail}`);
      toast.error("保存失败", { description: detail });
    } finally {
      setToneSaving(false);
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="loading-orbit"><LoaderCircle className="spin" /></div><strong>正在读取配置</strong><span>很快就好</span></div>;
  }

  return (
    <section className="settings-page">
      <div className="settings-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-heading"><div><span>模型配置</span><small>{profiles.length} 个配置</small></div><Tooltip><TooltipTrigger asChild><Button size="icon-sm" variant="secondary" onClick={() => void addProfile()} aria-label="新建配置"><Plus size={16} /></Button></TooltipTrigger><TooltipContent>新建配置</TooltipContent></Tooltip></div>

          <div className="profile-list">
            {profiles.map((profile) => (
              <button type="button" key={profile.id} className={cn("profile-list-item", activeSection === "models" && settings.id === profile.id && "active")} onClick={() => void changeProfile(profile.id)}>
                <span className="profile-icon"><Bot size={17} /></span>
                <span className="profile-copy"><strong>{profile.name}</strong><small>{profile.model}</small></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>

          <div className="profile-preferences">
            <div className="profile-preferences-heading"><span>翻译设置</span><small>适用于所有模型</small></div>
            <button type="button" className={cn("profile-list-item", activeSection === "translation" && "active")} onClick={() => { setActiveSection("translation"); setToneMessage(""); }}>
              <span className="profile-icon"><MessageSquareText size={17} /></span>
              <span className="profile-copy"><strong>翻译语气</strong><small>三档语气与提示词</small></span>
              <ChevronRight size={15} />
            </button>
          </div>
        </aside>

        {activeSection === "models" ? <form className="settings-surface" onSubmit={submit}>
          <div className="settings-surface-header">
            <div><span>正在编辑</span><h2>{settings.name}</h2></div>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={profiles.length <= 1} aria-label="删除当前配置"><Trash2 size={17} /></Button></AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>删除配置</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <div className="dialog-danger-icon"><Trash2 size={20} /></div>
                <AlertDialogTitle>删除“{settings.name}”？</AlertDialogTitle>
                <AlertDialogDescription>该模型配置及保存在本机的 API Key 将一并删除，此操作无法撤销。</AlertDialogDescription>
                <div className="dialog-actions"><AlertDialogCancel asChild><Button type="button" variant="secondary">取消</Button></AlertDialogCancel><AlertDialogAction asChild><Button type="button" variant="destructive" onClick={() => void removeProfile()}>确认删除</Button></AlertDialogAction></div>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="settings-form-body">
            <section className="setting-section">
              <div className="setting-section-title"><span className="section-icon"><Bot size={18} /></span><div><h3>模型服务</h3><p>选择预设服务，或连接任何兼容 OpenAI 的接口。</p></div></div>
              <div className="field-grid two-columns">
                <label className="field-label"><span>配置名称</span><Input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} placeholder="例如：日常翻译" /></label>
                <label className="field-label"><span>服务商</span>
                  <Select value={settings.provider} onValueChange={(value) => changeProvider(value as ProviderId)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(providerLabels).map(([id, label]) => <SelectItem value={id} key={id}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
              </div>
              <label className="field-label field-spaced"><span>Base URL</span><Input value={settings.baseUrl} onChange={(event) => { setSettings({ ...settings, baseUrl: event.target.value }); clearModelList(); }} placeholder="https://api.example.com/v1" /></label>
              <div className="field-label field-spaced"><span>模型名称</span>
                <div className="model-input-row">
                  <Input value={settings.model} onChange={(event) => { setSettings({ ...settings, model: event.target.value }); clearModelCheck(); }} placeholder="model-name" />
                  <div className="model-input-actions">
                    <Button type="button" variant="secondary" onClick={() => void checkModel()} disabled={checkingModel}>{checkingModel ? <LoaderCircle className="spin" size={15} /> : <Activity size={15} />}{checkingModel ? "检查中" : "检查模型"}</Button>
                    <Button type="button" variant="secondary" onClick={() => void fetchModels()} disabled={loadingModels}>{loadingModels ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}{loadingModels ? "获取中" : "获取列表"}</Button>
                  </div>
                </div>
                {availableModels.length > 0 && <Select value={availableModels.includes(settings.model) ? settings.model : undefined} onValueChange={(model) => { setSettings({ ...settings, model }); clearModelCheck(); }}><SelectTrigger className="available-model-select"><SelectValue placeholder="从可用模型中选择…" /></SelectTrigger><SelectContent>{availableModels.map((model) => <SelectItem value={model} key={model}>{model}</SelectItem>)}</SelectContent></Select>}
                {modelListMessage && <small className={cn("field-message", availableModels.length > 0 && "success")}>{modelListMessage}</small>}
                {modelCheck && <small className={cn("field-message", modelCheck.status === "success" && "success")} role={modelCheck.status === "error" ? "alert" : "status"}>{modelCheck.message}</small>}
              </div>
            </section>

            <section className="setting-section">
              <div className="setting-section-title"><span className="section-icon"><KeyRound size={18} /></span><div><h3>访问凭据</h3><p>用于验证当前模型服务的访问权限。</p></div></div>
              <label className="field-label"><span>API Key</span><div className="secret-input"><Input type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => { setApiKey(event.target.value); clearModelList(); }} placeholder="sk-..." autoComplete="off" /><Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "隐藏密钥" : "显示密钥"}>{showKey ? <EyeOff size={17} /> : <Eye size={17} />}</Button></div></label>
              <div className="inline-security"><ShieldCheck size={16} /><span><strong>仅保存在本机</strong>应用只会将密钥发送给上方配置的模型服务。</span></div>
            </section>

            <section className="setting-section">
              <div className="setting-section-title"><span className="section-icon"><SlidersHorizontal size={18} /></span><div><h3>思索设置</h3><p>为支持该能力的模型调整思维深度。</p></div></div>
              <div className="toggle-setting"><div><strong>开启思索</strong><span>模型会在生成译文前进行更充分的推理。</span></div><Switch checked={settings.reasoningEnabled} onCheckedChange={(checked) => setSettings({ ...settings, reasoningEnabled: checked })} aria-label="开启思索" /></div>
              <label className={cn("field-label field-spaced", !settings.reasoningEnabled && "disabled-field")}><span>思维深度</span>
                <Select value={settings.reasoningEffort} disabled={!settings.reasoningEnabled} onValueChange={(value) => setSettings({ ...settings, reasoningEffort: value as ReasoningEffort })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">低 · 更快响应</SelectItem><SelectItem value="medium">中 · 平衡速度与质量</SelectItem><SelectItem value="high">高 · 更充分思索</SelectItem></SelectContent>
                </Select>
              </label>
            </section>

          </div>

          <footer className="settings-form-footer">
            <span className={cn("save-status", message.includes("已保存") && "success")}>{message && (message.includes("已保存") ? <Check size={15} /> : null)}{message}</span>
            <Button disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{saving ? "保存中" : "保存更改"}</Button>
          </footer>
        </form> : <form className="settings-surface" onSubmit={submitToneSettings}>
          <div className="settings-surface-header">
            <div><span>通用设置</span><h2>翻译偏好</h2></div>
          </div>

          <div className="settings-form-body">
            <section className="setting-section">
              <div className="setting-section-title"><span className="section-icon"><MessageSquareText size={18} /></span><div><h3>翻译语气提示词</h3><p>这些设置对所有模型生效。分别定制三档语气要求；留空代表不追加该档语气要求。</p></div></div>
              <div className="tone-prompt-list">
                {translationTones.map((tone) => (
                  <label className="tone-prompt-field" key={tone}>
                    <span><strong>{translationToneLabels[tone]}</strong><small>{translationToneDescriptions[tone]}</small></span>
                    <textarea
                      value={toneSettings.prompts[tone]}
                      onChange={(event) => setToneSettings((current) => ({
                        ...current,
                        prompts: { ...current.prompts, [tone]: event.target.value },
                      }))}
                      placeholder="留空则不添加特殊语气要求"
                      rows={3}
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <footer className="settings-form-footer">
            <span className={cn("save-status", toneMessage.includes("已保存") && "success")}>{toneMessage && (toneMessage.includes("已保存") ? <Check size={15} /> : null)}{toneMessage}</span>
            <Button disabled={toneSaving}>{toneSaving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{toneSaving ? "保存中" : "保存翻译偏好"}</Button>
          </footer>
        </form>}
      </div>
    </section>
  );
}
