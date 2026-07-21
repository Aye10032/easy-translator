import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
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
import type { ModelProfile, ProviderId, ReasoningEffort } from "../ai/types";
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
import { deleteModelProfile, getApiKey, loadModelProfiles, saveApiKey, saveModelProfile, setActiveModel } from "../lib/settings";

export function SettingsPage() {
  const [profiles, setProfiles] = useState<ModelProfile[]>([defaultProfile]);
  const [settings, setSettings] = useState<ModelProfile>(defaultProfile);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelListMessage, setModelListMessage] = useState("");
  const [message, setMessage] = useState("");

  function clearModelList() {
    setAvailableModels([]);
    setModelListMessage("");
  }

  useEffect(() => {
    void loadModelProfiles()
      .then(async (state) => {
        const active = state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
        setProfiles(state.profiles);
        setSettings(active);
        setApiKey((await getApiKey(active.id)) ?? "");
      })
      .catch(() => setMessage("读取配置失败，请确认应用权限。"))
      .finally(() => setLoading(false));
  }, []);

  async function changeProfile(modelId: string) {
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
      setMessage("所有更改均已保存");
      toast.success("模型配置已保存");
    } catch (error) {
      const detail = String(error);
      setMessage(`保存失败：${detail}`);
      toast.error("保存失败", { description: detail });
    } finally {
      setSaving(false);
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
              <button type="button" key={profile.id} className={cn("profile-list-item", settings.id === profile.id && "active")} onClick={() => void changeProfile(profile.id)}>
                <span className="profile-icon"><Bot size={17} /></span>
                <span className="profile-copy"><strong>{profile.name}</strong><small>{profile.model}</small></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>

        </aside>

        <form className="settings-surface" onSubmit={submit}>
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
                <div className="model-input-row"><Input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} placeholder="model-name" /><Button type="button" variant="secondary" onClick={() => void fetchModels()} disabled={loadingModels}>{loadingModels ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}{loadingModels ? "获取中" : "获取列表"}</Button></div>
                {availableModels.length > 0 && <Select value={availableModels.includes(settings.model) ? settings.model : undefined} onValueChange={(model) => setSettings({ ...settings, model })}><SelectTrigger className="available-model-select"><SelectValue placeholder="从可用模型中选择…" /></SelectTrigger><SelectContent>{availableModels.map((model) => <SelectItem value={model} key={model}>{model}</SelectItem>)}</SelectContent></Select>}
                {modelListMessage && <small className={cn("field-message", availableModels.length > 0 && "success")}>{modelListMessage}</small>}
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
        </form>
      </div>
    </section>
  );
}
