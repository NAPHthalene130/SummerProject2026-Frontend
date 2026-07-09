import { useMemo, useState } from "react";
import type { CameraPoint, RoadSegment } from "../data/standardRoadNetwork";
import { mockMonitorVideos } from "../data/mockMonitorVideos";
import { useDataMode } from "../context/DataModeContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { TrafficEvent } from "../types/business";
import { getRiskColor, getRiskText, getTrafficFlowColor } from "../utils/riskStyle";

interface CameraView {
  camera: CameraPoint;
  segment: RoadSegment;
  events: TrafficEvent[];
  channel: string;
  streamLabel: string;
  lastUpdate: string;
}

const PAGE_SIZE = 6;

export function MonitorPage() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<CameraView | null>(null);

  const cameraViews = useMemo(() => {
    if (!demoDataEnabled) return [];
    return scenario.cameras.flatMap((camera) => {
      const segment = scenario.segments.find((item) => item.segment_id === camera.segment_id);
      const meta = mockMonitorVideos.find((item) => item.camera_id === camera.camera_id);
      if (!segment || !meta) return [];
      return [{
        camera,
        segment,
        events: scenario.events.filter((event) => event.segment_id === segment.segment_id),
        channel: meta.channel_no,
        streamLabel: meta.stream_label,
        lastUpdate: meta.last_update,
      }];
    });
  }, [demoDataEnabled, scenario.cameras, scenario.events, scenario.segments]);

  const totalPages = Math.max(1, Math.ceil(cameraViews.length / PAGE_SIZE));
  const pageItems = cameraViews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const wallStats = {
    online: cameraViews.filter((view) => view.camera.status === "online").length,
    danger: cameraViews.filter((view) => view.segment.status === "danger").length,
    risk: cameraViews.filter((view) => view.segment.status === "risk").length,
  };
  const avgFlow = Math.round(cameraViews.reduce((sum, view) => sum + view.segment.traffic_flow, 0) / Math.max(1, cameraViews.length));
  const avgSpeed = Math.round(cameraViews.reduce((sum, view) => sum + view.segment.avg_speed, 0) / Math.max(1, cameraViews.length));
  const riskRows = [
    ["正常", cameraViews.filter((view) => view.segment.status === "normal").length, "#34A853"],
    ["繁忙", cameraViews.filter((view) => view.segment.status === "busy").length, "#FBBC04"],
    ["风险", wallStats.risk, "#FF6D01"],
    ["事故", wallStats.danger, "#EA4335"],
  ] as const;

  return (
    <section className="monitor-wall-page">
      {demoDataEnabled ? (
        <>
          <div className="monitor-stage">
            <MonitorTelemetryRail
              side="left"
              kicker="TRAFFIC"
              title="车流量统计"
              metrics={[
                { label: "平均车流", value: String(avgFlow), unit: "辆/min", tone: "#72d4ff" },
                { label: "平均车速", value: String(avgSpeed), unit: "km/h", tone: "#6ee7a8" },
                { label: "在线通道", value: String(wallStats.online), unit: "路", tone: "#24c1e0" },
              ]}
              distribution={riskRows}
            />

            <div className="monitor-wall-grid">
              {pageItems.map((view) => (
                <article
                  key={view.camera.camera_id}
                  className={`monitor-tile ${view.segment.status}`}
                  style={{ borderColor: getCameraBorderColor(view) }}
                >
                  <button className="monitor-video" onClick={() => setActiveCamera(view)}>
                    <div className="video-scanline" />
                    <div className="signal-corner top-left" />
                    <div className="signal-corner top-right" />
                    <div className="signal-corner bottom-left" />
                    <div className="signal-corner bottom-right" />
                    <div className="live-badge">LIVE</div>
                    <div className="channel-badge">{view.channel}</div>
                    <div className="status-ribbon" style={{ background: getCameraBorderColor(view) }}>{getRiskText(view.segment.status)}</div>
                    <div className="mock-traffic-lines">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="video-caption">
                      <b>{view.camera.name}</b>
                      <span>{view.segment.name}</span>
                    </div>
                    <em>{view.camera.status === "online" ? getRiskText(view.segment.status) : "离线"}</em>
                  </button>
                  <div className="monitor-strip">
                    <span>车流 {view.segment.traffic_flow} 辆/min</span>
                    <span>均速 {view.segment.avg_speed} km/h</span>
                    <span>风险 {getRiskText(view.segment.status)}</span>
                    <button onClick={() => setExpandedId(expandedId === view.camera.camera_id ? null : view.camera.camera_id)}>详情</button>
                  </div>
                  {expandedId === view.camera.camera_id ? (
                    <div className="monitor-inline-detail">
                      <p>风险分数：{view.segment.risk_score}</p>
                      <p>关联道路：{view.segment.name}</p>
                      <p>最近事件：{view.events[0]?.description ?? "暂无异常事件"}</p>
                      <p>更新时间：{view.lastUpdate}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <MonitorTelemetryRail
              side="right"
              kicker="ALARM"
              title="预警与工况"
              metrics={[
                { label: "事故告警", value: String(wallStats.danger), unit: "起", tone: "#ff8a80" },
                { label: "高风险", value: String(wallStats.risk), unit: "处", tone: "#ffb74d" },
                { label: "接入状态", value: "READY", unit: "WebRTC", tone: "#81c784" },
              ]}
              distribution={riskRows.slice().reverse()}
            />
          </div>

          <MonitorStatusBar
            wallStats={wallStats}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((value) => Math.max(0, value - 1))}
            onNext={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
          />
        </>
      ) : (
        <div className="monitor-empty-state">
          <b>监控视频墙已切换为生产数据源</b>
          <span>前端 mock 摄像头与 WebRTC 占位流已清空，等待后端摄像头列表与真实 WebRTC 信令接入。</span>
          <small>双击左上角“路”字图标恢复演示监控数据。</small>
        </div>
      )}

      {activeCamera ? <MonitorModal view={activeCamera} onClose={() => setActiveCamera(null)} /> : null}
    </section>
  );
}

function MonitorTelemetryRail({
  side,
  kicker,
  title,
  metrics,
  distribution,
}: {
  side: "left" | "right";
  kicker: string;
  title: string;
  metrics: Array<{ label: string; value: string; unit: string; tone: string }>;
  distribution: ReadonlyArray<readonly [string, number, string]>;
}) {
  const max = Math.max(1, ...distribution.map(([, value]) => value));
  const total = distribution.reduce((sum, [, value]) => sum + value, 0);

  const getPiePaths = () => {
    let currentAngle = -90;
    return distribution.map(([label, value, color]) => {
      const percentage = value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      return { label, value, color, path };
    });
  };

  const piePaths = getPiePaths();

  const centerData = side === "left" 
    ? { value: metrics[0]?.value || total, label: metrics[0]?.label || "总数", unit: metrics[0]?.unit || "" }
    : { value: metrics[1]?.value || total, label: metrics[1]?.label || "总数", unit: metrics[1]?.unit || "" };

  return (
    <aside className={`monitor-telemetry-rail ${side}`}>
      <header className="telemetry-rail-head">
        <span>{kicker}</span>
        <h2>{title}</h2>
      </header>

      <dl className="telemetry-rail-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="telemetry-rail-row">
            <dt>{metric.label}</dt>
            <dd style={{ color: metric.tone }}>
              <strong>{metric.value}</strong>
              <em>{metric.unit}</em>
            </dd>
          </div>
        ))}
      </dl>

      {side === "left" ? (
        <div className="telemetry-rail-chart bar-chart">
          <span className="telemetry-section-label">STATUS DISTRIBUTION</span>
          {distribution.map(([label, value, color]) => (
            <div key={label} className="bar-chart-row">
              <span className="bar-label">{label}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.max(4, (value / max) * 100)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  }}
                >
                  <span className="bar-value">{value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="telemetry-rail-chart pie-chart">
          <span className="telemetry-section-label">STATUS DISTRIBUTION</span>
          <div className="pie-container">
            <svg viewBox="0 0 100 100" className="pie-svg">
              {piePaths.map(({ label, color, path }) => (
                <path
                  key={label}
                  d={path}
                  fill={color}
                  className="pie-slice"
                />
              ))}
              <circle cx="50" cy="50" r="25" fill="rgba(0,0,0,0.6)" />
            </svg>
            <div className="pie-center">
              <b>{total}</b>
              <span>监控点</span>
            </div>
          </div>
          <div className="pie-legend">
            {distribution.map(([label, value, color]) => (
              <div key={label} className="pie-legend-item">
                <span className="legend-dot" style={{ background: color }} />
                <span className="legend-label">{label}</span>
                <span className="legend-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="telemetry-rail-orbit wing-orbit">
        <i />
        <div className="orbit-center">
          <b>{centerData.value}</b>
          <span>{centerData.label}</span>
          {centerData.unit && <em>{centerData.unit}</em>}
        </div>
      </div>
    </aside>
  );
}

function MonitorStatusBar({
  wallStats,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  wallStats: { online: number; danger: number; risk: number };
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const metrics = [
    { label: "在线通道", value: wallStats.online, tone: "#4285F4" },
    { label: "事故告警", value: wallStats.danger, tone: "#EA4335" },
    { label: "高风险", value: wallStats.risk, tone: "#FF6D01" },
    { label: "流媒体", value: "STABLE", sub: "WebRTC", tone: "#34A853" },
  ];

  return (
    <footer className="monitor-status-bar">
      <div className="monitor-status-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="monitor-status-metric">
            <span className="status-metric-label">{metric.label}</span>
            <strong className="status-metric-value" style={{ color: metric.tone }}>
              {metric.value}
              {metric.sub ? <em>{metric.sub}</em> : null}
            </strong>
          </div>
        ))}
      </div>

      <div className="monitor-pager monitor-status-pager">
        <button onClick={onPrev} disabled={page === 0}>上一组</button>
        <span className="status-page-indicator">{String(page + 1).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}</span>
        <button onClick={onNext} disabled={page >= totalPages - 1}>下一组</button>
      </div>
    </footer>
  );
}

function getCameraBorderColor(view: CameraView) {
  if (view.camera.status === "offline") return "#95a5a6";
  if (view.segment.status === "danger") return "#e74c3c";
  if (view.segment.status === "risk") return "#e67e22";
  return getTrafficFlowColor(view.segment.traffic_flow);
}

function MonitorModal({ view, onClose }: { view: CameraView; onClose: () => void }) {
  const highRisk = view.segment.status === "risk" || view.segment.status === "danger";
  const latestEvent = view.events[0];

  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="surveillance-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>X</button>
        {highRisk ? <div className="risk-warning">当前监控存在高风险异常，请及时处理</div> : null}
        <div className="modal-video-stage" style={{ borderColor: getRiskColor(view.segment.status) }}>
          <div className="video-scanline" />
          <div className="live-badge">LIVE</div>
          <h2>{view.camera.name}</h2>
          <p>{view.streamLabel} · {view.channel}</p>
          <span>WebRTC Video Placeholder</span>
        </div>
        <div className="modal-video-info">
          <div><span>道路名称</span><b>{view.segment.name}</b></div>
          <div><span>当前状态</span><b>{getRiskText(view.segment.status)}</b></div>
          <div><span>车流量</span><b>{view.segment.traffic_flow} 辆/min</b></div>
          <div><span>平均车速</span><b>{view.segment.avg_speed} km/h</b></div>
          <div><span>风险等级</span><b>{view.segment.status}</b></div>
          <div><span>最近异常</span><b>{latestEvent ? latestEvent.description : "暂无"}</b></div>
        </div>
        <div className="modal-exit-row">
          <button onClick={onClose}>退出放大</button>
        </div>
      </div>
    </div>
  );
}
