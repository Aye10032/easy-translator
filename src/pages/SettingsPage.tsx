import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, LoaderCircle, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { defaultProfile, providerLabels, providerPresets } from "../ai/providers";
import type { ModelProfile, ProviderId, ReasoningEffort } from "../ai/types";
import { deleteModelProfile, getApiKey, loadModelProfiles, saveApiKey, saveModelProfile, setActiveModel } from "../lib/settings";

export function SettingsPage() {
  const [profiles, setProfiles] = useState<ModelProfile[]>([defaultProfile]);
  const [settings, setSettings] = useState<ModelProfile>(defaultProfile);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadModelProfiles().then(async (state) => {
      const active = state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
      setProfiles(state.profiles);
      setSettings(active);
      setApiKey((await getApiKey(active.id)) ?? "");
    }).catch(() => setMessage("读取配置失败，请确认应用权限。"))
      .finally(() => setLoading(false));
  }, []);

  async function changeProfile(modelId: string) {
    setMessage("");
    try {
      const profile = await setActiveModel(modelId);
      setSettings(profile);
      setApiKey((await getApiKey(profile.id)) ?? "");
      setShowKey(false);
    } catch (error) {
      setMessage(`切换失败：${String(error)}`);
    }
  }

  async function addProfile() {
    const profile: ModelProfile = {
      ...defaultProfile,
      id: crypto.randomUUID(),
      name: `模型 ${profiles.length + 1}`,
    };
    try {
      const state = await saveModelProfile(profile);
      setProfiles(state.profiles);
      setSettings(profile);
      setApiKey("");
      setShowKey(false);
      setMessage("已新建模型配置，请填写并保存。")
    } catch (error) {
      setMessage(`新建失败：${String(error)}`);
    }
  }

  async function removeProfile() {
    if (profiles.length <= 1 || !window.confirm(`确定删除“${settings.name}”及其 API Key 吗？`)) return;
    try {
      const state = await deleteModelProfile(settings.id);
      const active = state.profiles.find((profile) => profile.id === state.activeModelId) ?? state.profiles[0];
      setProfiles(state.profiles);
      setSettings(active);
      setApiKey((await getApiKey(active.id)) ?? "");
      setShowKey(false);
      setMessage("模型配置已删除。");
    } catch (error) {
      setMessage(`删除失败：${String(error)}`);
    }
  }

  function changeProvider(provider: ProviderId) {
    const preset = provider === "custom" ? null : providerPresets[provider];
    setSettings((current) => ({ ...current, provider, ...(preset ?? {}) }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!settings.name.trim() || !settings.baseUrl.trim() || !settings.model.trim() || !apiKey.trim()) {
      setMessage("请填写配置名称、Base URL、模型名称和 API Key。")
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
      setMessage("配置已保存，可以开始翻译。")
    } catch (error) {
      setMessage(`保存失败：${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-state"><LoaderCircle className="spin" />正在读取配置…</div>;

  return (
    <section className="page narrow-page">
      <header className="page-header">
        <div><span className="eyebrow">SETTINGS</span><h1>模型设置</h1><p>保存多个兼容 OpenAI Chat Completions 的模型服务，并随时切换。</p></div>
      </header>

      <div className="profile-manager">
        <label>当前模型配置
          <select value={settings.id} onChange={(event) => void changeProfile(event.target.value)}>
            {profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name} · {profile.model}</option>)}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={() => void addProfile()}><Plus size={17} />新建</button>
        <button type="button" className="danger-icon-button" onClick={() => void removeProfile()} disabled={profiles.length <= 1} aria-label="删除当前模型配置"><Trash2 size={17} /></button>
      </div>

      <form className="settings-card" onSubmit={submit}>
        <div className="form-section">
          <div className="section-title"><span>1</span><div><h2>模型服务</h2><p>为配置命名，然后选择常用服务或填写自定义兼容接口。</p></div></div>
          <label>配置名称<input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} placeholder="例如：日常翻译" /></label>
          <div className="form-spacer" />
          <label>服务商
            <select value={settings.provider} onChange={(event) => changeProvider(event.target.value as ProviderId)}>
              {Object.entries(providerLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
            </select>
          </label>
          <div className="form-grid">
            <label>Base URL<input value={settings.baseUrl} onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })} placeholder="https://api.example.com/v1" /></label>
            <label>模型名称<input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} placeholder="model-name" /></label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title"><span>2</span><div><h2>访问凭据</h2><p>密钥仅用于当前模型服务。</p></div></div>
          <label>API Key
            <div className="input-action">
              <input type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." autoComplete="off" />
              <button type="button" className="icon-button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "隐藏密钥" : "显示密钥"}>{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          <div className="security-note"><ShieldCheck size={18} /><span><strong>仅保存在本机</strong>API Key 将写入应用配置，不会上传或同步。</span></div>
        </div>

        <div className="form-section compact-section">
          <div className="section-title"><span>3</span><div><h2>思索设置</h2><p>控制模型是否在回答前思索，以及投入的思维深度。</p></div></div>
          <div className="reasoning-row">
            <div className="reasoning-copy"><strong>开启思索</strong><span>仅对支持思索参数的模型生效。</span></div>
            <label className="switch-control">
              <input
                type="checkbox"
                checked={settings.reasoningEnabled}
                onChange={(event) => setSettings({ ...settings, reasoningEnabled: event.target.checked })}
              />
              <span className="switch-track" aria-hidden="true"><span /></span>
              <span className="sr-only">开启思索</span>
            </label>
          </div>
          <label className={`reasoning-effort${settings.reasoningEnabled ? "" : " disabled"}`}>思维深度
            <select
              value={settings.reasoningEffort}
              disabled={!settings.reasoningEnabled}
              onChange={(event) => setSettings({ ...settings, reasoningEffort: event.target.value as ReasoningEffort })}
            >
              <option value="low">低 · 更快响应</option>
              <option value="medium">中 · 平衡速度与质量</option>
              <option value="high">高 · 更充分思索</option>
            </select>
          </label>
        </div>

        <footer className="form-footer">
          <span className={message.includes("已保存") ? "success-message" : "status-message"}>{message && (message.includes("已保存") ? <Check size={16} /> : null)}{message}</span>
          <button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}{saving ? "保存中" : "保存配置"}</button>
        </footer>
      </form>
    </section>
  );
}
