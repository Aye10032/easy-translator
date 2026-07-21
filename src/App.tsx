import { lazy, Suspense } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { History, Info, Languages, Settings } from "lucide-react";
import { Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import "./App.css";

const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then((module) => ({ default: module.HistoryPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const TranslatePage = lazy(() => import("./pages/TranslatePage").then((module) => ({ default: module.TranslatePage })));

const navigation = [
  { to: "/translate", label: "翻译", icon: Languages },
  { to: "/history", label: "历史记录", icon: History },
  { to: "/settings", label: "模型设置", icon: Settings },
];

export default function App() {
  return (
    <TooltipProvider delayDuration={350}>
      <div className="app-shell">
        <aside className="app-rail">
          <nav className="rail-navigation" aria-label="主导航">
            {navigation.map(({ to, label, icon: Icon }) => (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <NavLink to={to} aria-label={label}>
                    <Icon size={20} />
                    <span>{label}</span>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <nav className="rail-navigation rail-navigation-secondary" aria-label="应用信息">
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink to="/about" aria-label="关于">
                  <Info size={20} />
                  <span>关于</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">关于</TooltipContent>
            </Tooltip>
          </nav>
        </aside>

        <main className="app-content">
          <Suspense fallback={<div className="page-loading"><strong>正在加载页面</strong></div>}>
            <Routes>
              <Route path="/translate" element={<TranslatePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/translate" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
