import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { History, Languages, Settings } from "lucide-react";
import { Toaster } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TranslatePage } from "./pages/TranslatePage";
import "./App.css";

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
        </aside>

        <main className="app-content">
          <Routes>
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/translate" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
