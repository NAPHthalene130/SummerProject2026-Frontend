import { useState } from "react";
import { EvaluationPage } from "./pages/EvaluationPage";
import { HomePage } from "./pages/HomePage";
import { MonitorPage } from "./pages/MonitorPage";
import { WorkOrderPage } from "./pages/WorkOrderPage";

type ActivePage = "home" | "monitor" | "workOrder" | "evaluation";

const navItems: Array<{ key: ActivePage; label: string }> = [
  { key: "home", label: "首页" },
  { key: "monitor", label: "监控页" },
  { key: "workOrder", label: "工单页" },
  { key: "evaluation", label: "方案评测台" },
];

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("home");

  return (
    <div className="shell">
      <header className="top-nav">
        <div className="brand">
          <strong>智慧路政巡检分析系统</strong>
          <span>Frontend Prototype Demo</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={activePage === item.key ? "active" : ""}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="page-host">
        {activePage === "home" ? <HomePage /> : null}
        {activePage === "monitor" ? <MonitorPage /> : null}
        {activePage === "workOrder" ? <WorkOrderPage /> : null}
        {activePage === "evaluation" ? <EvaluationPage /> : null}
      </div>
    </div>
  );
}
