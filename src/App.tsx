import { useEffect, useState } from "react";
import { DataModeProvider, useDataMode } from "./context/DataModeContext";
import { HomePage } from "./pages/HomePage";
import { MonitorPage } from "./pages/MonitorPage";
import { WorkOrderPage } from "./pages/WorkOrderPage";

type ActivePage = "home" | "monitor" | "workOrder";

const navItems: Array<{ key: ActivePage; label: string }> = [
  { key: "home", label: "首页" },
  { key: "monitor", label: "监控页" },
  { key: "workOrder", label: "工单页" },
];

function pageFromHash(): ActivePage {
  const hash = window.location.hash.replace("#", "");
  if (hash === "monitor" || hash === "workOrder") return hash;
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
  const { demoDataEnabled, toggleDemoData } = useDataMode();
  const [modeHint, setModeHint] = useState("");

  useEffect(() => {
    const syncFromHash = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigate = (page: ActivePage) => {
    setActivePage(page);
    window.history.replaceState(null, "", `#${page}`);
  };

  const toggleDataSource = () => {
    toggleDemoData();
    const nextMode = demoDataEnabled ? "生产模式：已清除前端 mock，等待后端接口数据" : "演示模式：已恢复前端 mock 数据";
    setModeHint(nextMode);
    window.setTimeout(() => setModeHint(""), 2600);
  };

  return (
    <div className={`platform-shell ${demoDataEnabled ? "demo-data-mode" : "backend-data-mode"}`}>
      <header className="platform-nav">
        <div className="platform-brand">
          <button
            className="brand-mark"
            title="双击切换演示数据 / 生产接口模式"
            onDoubleClick={toggleDataSource}
          >
            路
          </button>
          <div>
            <strong>智慧路政巡检分析系统</strong>
            <small>
              Road Inspection Command Center · {demoDataEnabled ? "Demo mock data" : "Backend data waiting"}
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
      {modeHint ? <div className="hidden-mode-toast">{modeHint}</div> : null}
      <main className="platform-page">
        {activePage === "home" ? <HomePage /> : null}
        {activePage === "monitor" ? <MonitorPage /> : null}
        {activePage === "workOrder" ? <WorkOrderPage /> : null}
      </main>
    </div>
  );
}
