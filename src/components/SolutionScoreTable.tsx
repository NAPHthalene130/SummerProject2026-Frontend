import { useMemo, useState } from "react";
import type { SolutionKey } from "../types";

const labels: Record<SolutionKey, string> = {
  leaflet: "Leaflet",
  maplibre: "MapLibre",
  svg: "SVG",
  canvas: "Canvas",
  dashboard: "大屏热力图",
  api: "接口驱动",
};

const dimensions = [
  { key: "realMap", label: "真实地图能力" },
  { key: "status", label: "道路状态表达能力" },
  { key: "dynamic", label: "动态刷新效果" },
  { key: "workOrder", label: "事件/工单联动能力" },
  { key: "ease", label: "实现复杂度" },
  { key: "backend", label: "后端对接扩展性" },
  { key: "presentation", label: "课堂演示效果" },
] as const;

type ScoreKey = (typeof dimensions)[number]["key"];
type ScoreRow = Record<ScoreKey, number>;

const initialScores: Record<SolutionKey, ScoreRow> = {
  leaflet: { realMap: 4, status: 4, dynamic: 4, workOrder: 4, ease: 5, backend: 4, presentation: 4 },
  maplibre: { realMap: 5, status: 5, dynamic: 5, workOrder: 4, ease: 3, backend: 5, presentation: 5 },
  svg: { realMap: 1, status: 5, dynamic: 5, workOrder: 4, ease: 5, backend: 3, presentation: 4 },
  canvas: { realMap: 1, status: 4, dynamic: 5, workOrder: 4, ease: 3, backend: 3, presentation: 4 },
  dashboard: { realMap: 1, status: 4, dynamic: 4, workOrder: 5, ease: 5, backend: 3, presentation: 5 },
  api: { realMap: 4, status: 4, dynamic: 5, workOrder: 5, ease: 3, backend: 5, presentation: 4 },
};

export function SolutionScoreTable() {
  const [scores, setScores] = useState(initialScores);
  const totals = useMemo(() => {
    return Object.fromEntries(
      Object.entries(scores).map(([solution, row]) => [
        solution,
        dimensions.reduce((sum, dimension) => sum + row[dimension.key], 0),
      ]),
    ) as Record<SolutionKey, number>;
  }, [scores]);

  return (
    <section className="score-table">
      <h2>方案评分表</h2>
      <p className="muted">分值范围 0-5；“实现复杂度”分数越高表示越容易实现。表格可手动调整，用于答辩前复核取舍。</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>方案</th>
              {dimensions.map((dimension) => <th key={dimension.key}>{dimension.label}</th>)}
              <th>总分</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(labels) as SolutionKey[]).map((solution) => (
              <tr key={solution}>
                <td>{labels[solution]}</td>
                {dimensions.map((dimension) => (
                  <td key={dimension.key}>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={scores[solution][dimension.key]}
                      onChange={(event) => {
                        const value = Math.max(0, Math.min(5, Number(event.target.value)));
                        setScores((previous) => ({
                          ...previous,
                          [solution]: { ...previous[solution], [dimension.key]: value },
                        }));
                      }}
                    />
                  </td>
                ))}
                <td><strong>{totals[solution]}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
