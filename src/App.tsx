import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Languages, Settings } from "lucide-react";
import { SettingsPage } from "./pages/SettingsPage";
import { TranslatePage } from "./pages/TranslatePage";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Languages size={22} /></div>
          <div>
            <strong>Easy Translator</strong>
            <span>AI 翻译助手</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          <NavLink to="/translate"><Languages size={18} />翻译</NavLink>
          <NavLink to="/settings"><Settings size={18} />模型设置</NavLink>
        </nav>

        <p className="sidebar-note">API Key 保存在系统凭据库中</p>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/translate" replace />} />
        </Routes>
      </main>
    </div>
  );
}
