import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { FileText, Languages } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";

export function AboutPage() {
  const [version, setVersion] = useState("0.1.0");
  const [fontLicense, setFontLicense] = useState("");
  const [fontLicenseLoading, setFontLicenseLoading] = useState(false);
  const [fontLicenseError, setFontLicenseError] = useState("");

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => undefined);
  }, []);

  async function loadFontLicense() {
    if (fontLicense || fontLicenseLoading) return;

    setFontLicenseLoading(true);
    setFontLicenseError("");
    try {
      const response = await fetch("/licenses/HarmonyOS_Sans_LICENSE.txt");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFontLicense(await response.text());
    } catch {
      setFontLicenseError("许可证文件读取失败，请检查应用安装是否完整。");
    } finally {
      setFontLicenseLoading(false);
    }
  }

  return (
    <section className="about-page">
      <header className="about-page-header">
        <span>应用信息</span>
        <h1>关于 Easy Translator</h1>
        <p>查看应用版本、所用资源及相关许可信息。</p>
      </header>

      <section className="about-app-card" aria-labelledby="about-app-name">
        <img src="/app-icon.png" alt="" />
        <div>
          <div className="about-app-title"><h2 id="about-app-name">Easy Translator</h2><span>版本 {version}</span></div>
          <p>一个简洁、专注的本地桌面翻译工具。</p>
        </div>
      </section>

      <section className="about-section" aria-labelledby="licenses-title">
        <div className="about-section-heading">
          <div><h2 id="licenses-title">许可与致谢</h2><p>本应用使用的第三方资源及其许可信息。</p></div>
        </div>

        <div className="about-license-item">
          <span className="about-license-icon"><Languages size={20} /></span>
          <div className="about-license-copy">
            <strong>HarmonyOS Sans</strong>
            <p>本软件使用 HarmonyOS Sans 字体。</p>
            <small>Copyright 2021 Huawei Device Co., Ltd.</small>
          </div>
          <AlertDialog onOpenChange={(open) => { if (open) void loadFontLicense(); }}>
            <AlertDialogTrigger asChild><Button type="button" variant="secondary"><FileText size={15} />查看许可证</Button></AlertDialogTrigger>
            <AlertDialogContent className="font-license-dialog">
              <AlertDialogTitle>HarmonyOS Sans 字体许可证</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="font-license-dialog-body">
                  <p>以下内容来自随字体包提供的原始许可证文件。</p>
                  <pre>{fontLicenseLoading ? "正在读取许可证…" : fontLicenseError || fontLicense}</pre>
                </div>
              </AlertDialogDescription>
              <div className="dialog-actions"><AlertDialogCancel asChild><Button type="button" variant="secondary">关闭</Button></AlertDialogCancel></div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </section>
  );
}
