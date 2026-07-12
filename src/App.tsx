import { useEffect, useState } from "react";
import { DataModeProvider } from "./context/DataModeContext";
import { HomePage } from "./pages/HomePage";
import { MonitorPage } from "./pages/MonitorPage";
import { UserPage } from "./pages/UserPage";
import { WorkOrderPage } from "./pages/WorkOrderPage";

type ActivePage = "home" | "monitor" | "workOrder" | "users";

const navItems: Array<{ key: ActivePage; label: string }> = [
  { key: "home", label: "首页" },
  { key: "monitor", label: "监控页" },
  { key: "workOrder", label: "工单页" },
  { key: "users", label: "用户页" },
];

function pageFromHash(): ActivePage {
  const hash = window.location.hash.replace("#", "");
  if (hash === "monitor" || hash === "workOrder" || hash === "users") return hash;
  return "home";
}

export default function App() {
  return (
    <DataModeProvider>
      <AppShell />
    </DataModeProvider>
  );
}

function AppShell() {
  const [activePage, setActivePage] = useState<ActivePage>(() => pageFromHash());

  useEffect(() => {
    const syncFromHash = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigate = (page: ActivePage) => {
    setActivePage(page);
    window.history.replaceState(null, "", `#${page}`);
  };

  return (
    <div className="platform-shell">
      <header className="platform-nav">
        <div className="platform-brand">
          <button
            className="brand-mark"
            title="智慧路政巡检分析系统"
          >
            路
          </button>
          <div>
            <strong>智慧路政巡检分析系统</strong>
            <small>
              Road Inspection Command Center · Live service
            </small>
          </div>
        </div>
        <nav className="platform-tabs">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={activePage === item.key ? "active" : ""}
              onClick={() => navigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="platform-page">
        {activePage === "home" ? <HomePage /> : null}
        {activePage === "monitor" ? <MonitorPage /> : null}
        {activePage === "workOrder" ? <WorkOrderPage /> : null}
        {activePage === "users" ? <UserPage /> : null}
      </main>
    </div>
  );
}
