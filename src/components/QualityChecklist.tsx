import type { SolutionKey } from "../types";

const labels = [
  "是否展示真实底图",
  "是否展示完整路网",
  "是否展示道路名称",
  "是否展示摄像头",
  "是否展示异常事件点",
  "是否展示工单联动",
  "是否支持动态刷新",
  "是否支持点击道路查看详情",
  "是否能表达风险等级",
  "是否适合课堂汇报",
] as const;

const checks: Record<SolutionKey, boolean[]> = {
  leaflet: [true, true, true, true, true, true, true, true, true, true],
  maplibre: [true, true, true, true, true, true, true, true, true, true],
  svg: [false, true, true, true, true, true, true, true, true, true],
  canvas: [false, true, true, true, true, true, true, true, true, true],
  dashboard: [false, true, true, true, true, true, true, true, true, true],
  api: [true, true, true, true, true, true, true, true, true, true],
};

export function QualityChecklist({ solution }: { solution: SolutionKey }) {
  return (
    <section className="quality-checklist">
      <h3>可视化质量检查</h3>
      <div className="check-grid">
        {labels.map((label, index) => (
          <div key={label} className={checks[solution][index] ? "ok" : "no"}>
            <b>{checks[solution][index] ? "✓" : "×"}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
