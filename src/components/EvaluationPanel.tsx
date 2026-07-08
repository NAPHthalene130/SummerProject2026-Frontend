import type { EvaluationMetrics } from "../types";

interface EvaluationPanelProps {
  metrics: EvaluationMetrics;
}

function yesNo(value: boolean) {
  return value ? "是" : "否";
}

export function EvaluationPanel({ metrics }: EvaluationPanelProps) {
  const rows = [
    ["首次渲染耗时", `${metrics.render_time_ms.toFixed(2)} ms`],
    ["状态更新耗时", `${metrics.update_time_ms.toFixed(2)} ms`],
    ["路段数", metrics.road_count],
    ["摄像头数", metrics.camera_count],
    ["事件数", metrics.event_count],
    ["工单数", metrics.work_order_count],
    ["真实地图", yesNo(metrics.supports_real_map)],
    ["拓扑可控", yesNo(metrics.supports_topology_control)],
    ["动态刷新", yesNo(metrics.supports_dynamic_update)],
    ["事件点位", yesNo(metrics.supports_event_marker)],
    ["工单联动", yesNo(metrics.supports_work_order_link)],
    ["额外依赖数", metrics.dependency_count],
    ["需要 Token", yesNo(metrics.requires_token)],
  ];

  return (
    <section className="evaluation-panel">
      <h3>量化评估面板</h3>
      <div className="metric-grid">
        {rows.map(([label, value]) => (
          <div className="metric-cell" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
