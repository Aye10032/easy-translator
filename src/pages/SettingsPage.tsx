import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { defaultSettings, providerLabels, providerPresets } from "../ai/providers";
import type { ModelSettings, ProviderId, ReasoningEffort } from "../ai/types";
import { getApiKey, loadSettings, saveApiKey, saveSettings } from "../lib/settings";

export function SettingsPage() {
  const [settings, setSettings] = useState<ModelSettings>(defaultSettings);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadSettings().then(async (value) => {
      setSettings(value);
      setApiKey((await getApiKey(value.provider)) ?? "");
    }).catch(() => setMessage("读取配置失败，请确认应用权限。"))
      .finally(() => setLoading(false));
  }, []);

  async function changeProvider(provider: ProviderId) {
    const preset = provider === "custom" ? null : providerPresets[provider];
    setSettings((current) => ({ ...current, provider, ...(preset ?? {}) }));
    try {
      setApiKey((await getApiKey(provider)) ?? "");
    } catch {
      setApiKey("");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!settings.baseUrl.trim() || !settings.model.trim() || !apiKey.trim()) {
      setMessage("请填写 Base URL、模型名称和 API Key。")
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await saveSettings({ ...settings, baseUrl: settings.baseUrl.trim(), model: settings.model.trim() });
      await saveApiKey(settings.provider, apiKey.trim());
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
        <div><span className="eyebrow">SETTINGS</span><h1>模型设置</h1><p>配置一个兼容 OpenAI Chat Completions 的模型服务。</p></div>
      </header>

      <form className="settings-card" onSubmit={submit}>
        <div className="form-section">
          <div className="section-title"><span>1</span><div><h2>模型服务</h2><p>选择常用服务，或填写自定义兼容接口。</p></div></div>
          <label>服务商
            <select value={settings.provider} onChange={(event) => void changeProvider(event.target.value as ProviderId)}>
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
