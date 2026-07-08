import { useCallback, useMemo, useState } from "react";
import { EvaluationPanel } from "../components/EvaluationPanel";
import { QualityChecklist } from "../components/QualityChecklist";
import { ScenarioController } from "../components/ScenarioController";
import { SegmentDetailPanel } from "../components/SegmentDetailPanel";
import { SolutionScoreTable } from "../components/SolutionScoreTable";
import { ApiDrivenGeoJsonDemo } from "../demos/ApiDrivenGeoJsonDemo";
import { CanvasRoadTopologyDemo } from "../demos/CanvasRoadTopologyDemo";
import { DashboardRoadHeatmapDemo } from "../demos/DashboardRoadHeatmapDemo";
import { LeafletGeoJsonDemo } from "../demos/LeafletGeoJsonDemo";
import { MapLibreGeoJsonDemo } from "../demos/MapLibreGeoJsonDemo";
import { SvgRoadTopologyDemo } from "../demos/SvgRoadTopologyDemo";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { EvaluationMetrics, SolutionKey, VisualDemoProps } from "../types";
import { getRiskText } from "../utils/riskStyle";

const solutionOrder: SolutionKey[] = ["leaflet", "maplibre", "svg", "canvas", "dashboard", "api"];

const solutionInfo: Record<SolutionKey, {
  shortName: string;
  name: string;
  stack: string;
  pros: string[];
  cons: string[];
  scene: string;
  baseMetrics: Pick<EvaluationMetrics,
    "supports_real_map" |
    "supports_topology_control" |
    "supports_dynamic_update" |
    "supports_event_marker" |
    "supports_work_order_link" |
    "dependency_count" |
    "requires_token"
  >;
}> = {
  leaflet: {
    shortName: "方案一",
    name: "Leaflet + OSM + GeoJSON",
    stack: "React + Leaflet + OSM + roadNetworkToGeoJSON",
    pros: ["开发速度快", "真实底图稳定", "GeoJSON 上手简单"],
    cons: ["高级矢量样式能力一般", "大规模动态刷新能力弱于 WebGL"],
    scene: "优先保证开发速度和稳定展示时，适合作为小学期最终版本。",
    baseMetrics: { supports_real_map: true, supports_topology_control: false, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 2, requires_token: false },
  },
  maplibre: {
    shortName: "方案二",
    name: "MapLibre GL + GeoJSON",
    stack: "React + MapLibre GL + OSM raster + GeoJSON source/layer",
    pros: ["真实 GIS 效果最好", "动态样式表达强", "后续工程扩展性高"],
    cons: ["实现复杂度高于 Leaflet", "需要理解 source/layer/style"],
    scene: "优先追求真实 GIS 效果和后续 FastAPI/WebSocket 联调时推荐。",
    baseMetrics: { supports_real_map: true, supports_topology_control: false, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 1, requires_token: false },
  },
  svg: {
    shortName: "方案三",
    name: "SVG 自绘道路拓扑图",
    stack: "React + SVG + 标准 x/y 节点坐标",
    pros: ["完全可控", "实现容易", "课堂解释直观"],
    cons: ["不是真实地图", "大规模节点会增加 DOM 压力"],
    scene: "地图服务不可用或时间紧时，可作为保底展示方案。",
    baseMetrics: { supports_real_map: false, supports_topology_control: true, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 0, requires_token: false },
  },
  canvas: {
    shortName: "方案四",
    name: "Canvas 自绘道路拓扑图",
    stack: "React + Canvas + 命中检测 + 重绘耗时统计",
    pros: ["动态刷新和动画灵活", "适合大量绘制对象", "可记录重绘成本"],
    cons: ["交互命中需要自写", "组件化和文本布局不如 SVG"],
    scene: "适合强调性能、动画和大规模刷新能力的对比展示。",
    baseMetrics: { supports_real_map: false, supports_topology_control: true, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 0, requires_token: false },
  },
  dashboard: {
    shortName: "方案五",
    name: "纯前端模拟大屏道路热力图",
    stack: "React + SVG + 指标卡 + 事件/工单面板",
    pros: ["课堂演示效果强", "业务闭环清楚", "不依赖地图服务"],
    cons: ["真实地图能力弱", "更像展示大屏而非 GIS 底座"],
    scene: "适合作为汇报首页或演示备选页。",
    baseMetrics: { supports_real_map: false, supports_topology_control: true, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 0, requires_token: false },
  },
  api: {
    shortName: "方案六",
    name: "接口驱动 GeoJSON 渲染 Demo",
    stack: "React + mock API + WebSocket 数据流模拟",
    pros: ["最贴近真实工程", "接口边界清晰", "方便接 FastAPI 和算法结果"],
    cons: ["地图效果取决于后续选择 Leaflet 或 MapLibre", "演示上需要解释架构价值"],
    scene: "适合作为后端联调和工程扩展性的说明页。",
    baseMetrics: { supports_real_map: true, supports_topology_control: true, supports_dynamic_update: true, supports_event_marker: true, supports_work_order_link: true, dependency_count: 0, requires_token: false },
  },
};

function emptyMetrics(base: typeof solutionInfo[SolutionKey]["baseMetrics"], roadCount: number, cameraCount: number, eventCount: number, workOrderCount: number): EvaluationMetrics {
  return {
    render_time_ms: 0,
    update_time_ms: 0,
    road_count: roadCount,
    camera_count: cameraCount,
    event_count: eventCount,
    work_order_count: workOrderCount,
    ...base,
  };
}

function renderDemo(solution: SolutionKey, props: VisualDemoProps) {
  switch (solution) {
    case "leaflet":
      return <LeafletGeoJsonDemo {...props} />;
    case "maplibre":
      return <MapLibreGeoJsonDemo {...props} />;
    case "svg":
      return <SvgRoadTopologyDemo {...props} />;
    case "canvas":
      return <CanvasRoadTopologyDemo {...props} />;
    case "dashboard":
      return <DashboardRoadHeatmapDemo {...props} />;
    case "api":
      return <ApiDrivenGeoJsonDemo {...props} />;
    default:
      return null;
  }
}

export function EvaluationPage() {
  const scenario = useScenarioPlayback();
  const [activeSolution, setActiveSolution] = useState<SolutionKey>("leaflet");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>("seg_gaoxin_1");
  const [runtimeMetrics, setRuntimeMetrics] = useState<Partial<Record<SolutionKey, Partial<EvaluationMetrics>>>>({});
  const info = solutionInfo[activeSolution];

  const selectedSegment = useMemo(() => {
    return scenario.segments.find((segment) => segment.segment_id === selectedSegmentId) ?? null;
  }, [scenario.segments, selectedSegmentId]);

  const metrics = {
    ...emptyMetrics(
      info.baseMetrics,
      scenario.segments.length,
      scenario.cameras.length,
      scenario.events.length,
      scenario.workOrders.length,
    ),
    ...runtimeMetrics[activeSolution],
    road_count: scenario.segments.length,
    camera_count: scenario.cameras.length,
    event_count: scenario.events.length,
    work_order_count: scenario.workOrders.length,
  };

  const onMetricsChange = useCallback((patch: Partial<EvaluationMetrics>) => {
    setRuntimeMetrics((previous) => ({
      ...previous,
      [activeSolution]: {
        ...previous[activeSolution],
        ...patch,
      },
    }));
  }, [activeSolution]);

  const demoProps: VisualDemoProps = {
    currentTimeSec: scenario.currentTimeSec,
    currentDescription: scenario.currentDescription,
    nodes: scenario.nodes,
    segments: scenario.segments,
    cameras: scenario.cameras,
    events: scenario.events,
    workOrders: scenario.workOrders,
    selectedSegmentId,
    onSelectSegment: setSelectedSegmentId,
    onMetricsChange,
  };

  const avgSpeed = scenario.segments.reduce((sum, segment) => sum + segment.avg_speed, 0) / scenario.segments.length;
  const dangerCount = scenario.segments.filter((segment) => segment.status === "danger").length;

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Smart Road Inspection · Evaluation Bench</p>
          <h1>智慧路政巡检系统 GIS 可视化方案评测台</h1>
          <p className="hero-subtitle">同一标准路网、同一事件脚本、同一评价指标，用来横向比较六种可视化技术路线。</p>
        </div>
        <div className="hero-stats">
          <span>路段 {scenario.segments.length} 条</span>
          <span>摄像头 {scenario.cameras.length} 个</span>
          <span>均速 {avgSpeed.toFixed(1)} km/h</span>
          <span>严重异常 {dangerCount} 条</span>
        </div>
      </header>

      <ScenarioController
        currentStepIndex={scenario.currentStepIndex}
        isPlaying={scenario.isPlaying}
        onPlay={scenario.play}
        onPause={scenario.pause}
        onReset={scenario.reset}
        onNext={scenario.next}
        onPrevious={scenario.previous}
        onJump={scenario.jump}
      />

      <nav className="tabs" aria-label="方案切换">
        {solutionOrder.map((key) => (
          <button
            key={key}
            className={activeSolution === key ? "active" : ""}
            onClick={() => setActiveSolution(key)}
          >
            <span>{solutionInfo[key].shortName}</span>
            {solutionInfo[key].name}
          </button>
        ))}
      </nav>

      <section className="workspace">
        <div className="demo-area">{renderDemo(activeSolution, demoProps)}</div>

        <aside className="side-panel">
          <section>
            <h2>{info.name}</h2>
            <p className="stack">{info.stack}</p>
          </section>
          <section>
            <h3>方案说明</h3>
            <p>{info.scene}</p>
            <div className="two-col-list">
              <div><b>优点</b>{info.pros.map((item) => <span key={item}>{item}</span>)}</div>
              <div><b>缺点</b>{info.cons.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </section>
          <section>
            <h3>当前选中道路详情</h3>
            <SegmentDetailPanel segment={selectedSegment} cameras={scenario.cameras} />
          </section>
          <EvaluationPanel metrics={metrics} />
          <QualityChecklist solution={activeSolution} />
          <section>
            <h3>异常事件列表</h3>
            <div className="side-list">
              {scenario.events.length === 0 ? <p className="muted">当前时间点暂无异常事件。</p> : null}
              {scenario.events.map((event) => (
                <article className="event-item" key={event.event_id}>
                  <strong>{event.segment_name}</strong>
                  <span>{event.event_type} · {event.detected_by} · T{event.timestamp_sec}s</span>
                  <p>{event.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h3>工单列表</h3>
            <div className="side-list">
              {scenario.workOrders.length === 0 ? <p className="muted">T3 事故发生后会生成处置工单。</p> : null}
              {scenario.workOrders.map((order) => (
                <article className="work-item" key={order.work_order_id}>
                  <strong>{order.title}</strong>
                  <span>{order.work_order_id} · {order.status} · {order.assignee}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="comparison">
        <h2>当前场景状态总览</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>路段</th>
                <th>业务含义</th>
                <th>类型</th>
                <th>车流量</th>
                <th>平均车速</th>
                <th>风险分数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {scenario.segments.map((segment) => (
                <tr key={segment.segment_id}>
                  <td>{segment.segment_id}</td>
                  <td>{segment.name}</td>
                  <td>{segment.road_type}</td>
                  <td>{segment.traffic_flow}</td>
                  <td>{segment.avg_speed} km/h</td>
                  <td>{segment.risk_score}</td>
                  <td>{getRiskText(segment.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SolutionScoreTable />

      <section className="recommendation">
        <h2>初步推荐</h2>
        <p>若优先保证开发速度和稳定展示，推荐 Leaflet + GeoJSON；若优先追求真实 GIS 效果和后续工程扩展，推荐 MapLibre GL；若时间非常紧且地图服务存在问题，可用 SVG / 大屏热力图作为保底展示方案。最终小学期版本建议采用 Leaflet 或 MapLibre，并保留 SVG 大屏作为演示备选。</p>
      </section>
    </main>
  );
}
