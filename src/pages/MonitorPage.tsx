import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CameraPoint, RoadSegment } from "../data/standardRoadNetwork";
import { useDataMode } from "../context/DataModeContext";
import { StreamProvider, useStreamState } from "../context/StreamContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { TrafficEvent } from "../types/business";
import { getRiskColor, getRiskText, getTrafficFlowColor } from "../utils/riskStyle";
import { fetchCameras, fetchCameraStats, postLiveOffer, type BackendCamera } from "../api/client";

interface CameraView {
  camera: CameraPoint;
  segment: RoadSegment | null;
  events: TrafficEvent[];
  channel: string;
  streamLabel: string;
  lastUpdate: string;
}

const PAGE_SIZE = 6;

function backendCameraToView(camera: BackendCamera, index: number): CameraView {
  const channelNum = String(index + 1).padStart(2, "0");
  return {
    camera: {
      camera_id: camera.id,
      name: camera.name,
      segment_id: "",
      lng: camera.longitude,
      lat: camera.latitude,
      x: 0,
      y: 0,
      status: "online",
    },
    segment: null,
    events: [],
    channel: `CH-${channelNum}`,
    streamLabel: camera.name,
    lastUpdate: "实时",
  };
}

const CACHE_KEY = "monitor_cameras";

function getCached(): BackendCamera[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cameras: unknown = JSON.parse(raw);
    return Array.isArray(cameras) && cameras.length > 0 ? cameras as BackendCamera[] : null;
  } catch { return null; }
}

function setCached(cams: BackendCamera[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cams)); } catch {}
}

export function MonitorPage() {
  return (
    <StreamProvider>
      <MonitorPageContent />
    </StreamProvider>
  );
}

function MonitorPageContent() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const streamState = useStreamState();
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<CameraView | null>(null);

  const cached = getCached();
  const [backendCameras, setBackendCameras] = useState<BackendCamera[]>(cached || []);
  const [backendLoading, setBackendLoading] = useState(cached ? false : true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [vehicleCountMap, setVehicleCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (demoDataEnabled) {
      try { sessionStorage.removeItem(CACHE_KEY); } catch {}
      setBackendCameras([]);
      setBackendError(null);
      setVehicleCountMap({});
      return;
    }

    let cancelled = false;
    const cachedCameras = getCached();
    setBackendLoading(cachedCameras === null);
    setBackendError(null);

    fetchCameras()
      .then((cameras) => {
        if (!cancelled) {
          setCached(cameras);
          setBackendCameras(cameras);
          setPage(0);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && cachedCameras === null) {
          setBackendError(err instanceof Error ? err.message : "无法连接后端服务");
        }
      })
      .finally(() => {
        if (!cancelled) setBackendLoading(false);
      });

    return () => { cancelled = true; };
  }, [demoDataEnabled]);

  useEffect(() => {
    if (demoDataEnabled) return;
    const interval = window.setInterval(() => {
      fetchCameraStats()
        .then((res) => {
          const map: Record<string, number> = {};
          for (const item of res.cameras) {
            map[item.camera_id] = item.total_vehicle_count;
          }
          setVehicleCountMap(map);
        })
        .catch(() => {});
    }, 2000);
    return () => window.clearInterval(interval);
  }, [demoDataEnabled]);

  const demoViews = useMemo(() => {
    if (!demoDataEnabled) return [];
    return scenario.cameras.map((camera, index) => {
      const segment = scenario.segments.find((s) => s.camera_ids.includes(camera.camera_id)) ?? null;
      const channelNum = String(index + 1).padStart(2, "0");
      return {
        camera,
        segment,
        events: segment ? scenario.events.filter((event) => event.segment_id === segment.segment_id) : [],
        channel: `CH-${channelNum}`,
        streamLabel: camera.name,
        lastUpdate: "实时",
      };
    });
  }, [demoDataEnabled, scenario.cameras, scenario.events, scenario.segments]);

  const backendViews = useMemo(() => {
    return backendCameras.map((cam, i) => backendCameraToView(cam, i));
  }, [backendCameras]);

  const cameraViews = demoDataEnabled ? demoViews : backendViews;

  const totalPages = Math.max(1, Math.ceil(cameraViews.length / PAGE_SIZE));
  const pageItems = cameraViews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const wallStats = {
    online: cameraViews.filter((view) => view.camera.status === "online").length,
    danger: cameraViews.filter((view) => view.segment?.status === "danger").length,
    risk: cameraViews.filter((view) => view.segment?.status === "risk").length,
  };
  const avgFlow = cameraViews.length > 0
    ? Math.round(cameraViews.reduce((sum, view) => sum + (view.segment?.traffic_flow ?? 0), 0) / cameraViews.length)
    : 0;
  const avgSpeed = cameraViews.length > 0
    ? Math.round(cameraViews.reduce((sum, view) => sum + (view.segment?.avg_speed ?? 0), 0) / cameraViews.length)
    : 0;

  const riskRows = [
    ["正常", cameraViews.filter((view) => view.segment?.status === "normal").length, "#34A853"],
    ["繁忙", cameraViews.filter((view) => view.segment?.status === "busy").length, "#FBBC04"],
    ["风险", wallStats.risk, "#FF6D01"],
    ["事故", wallStats.danger, "#EA4335"],
  ] as const;

  const totalVehicles = demoDataEnabled ? 0 : Object.values(vehicleCountMap).reduce((sum, count) => sum + count, 0);
  const allTraffic = demoDataEnabled ? [] : Object.values(streamState.traffic);
  const totalEntry = allTraffic.reduce((s, t) => s + (t.entry_count || 0), 0);
  const totalExit = allTraffic.reduce((s, t) => s + (t.exit_count || 0), 0);

  const isBackendEmpty = !demoDataEnabled && !backendLoading && !backendError && backendCameras.length === 0;

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
                <MonitorTile
                  key={view.camera.camera_id}
                  view={view}
                  expandedId={expandedId}
                  onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                  onSelect={setActiveCamera}
                />
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
      ) : backendLoading ? (
        <div className="monitor-empty-state">
          <b>正在加载摄像头数据…</b>
          <span>正在从后端接口获取摄像头列表，请稍候。</span>
        </div>
      ) : backendError ? (
        <div className="monitor-empty-state">
          <b>数据加载失败</b>
          <span>{backendError}</span>
          <button
            onClick={() => {
              setBackendError(null);
              setBackendLoading(true);
              fetchCameras()
                .then((cameras) => {
                  setCached(cameras);
                  setBackendCameras(cameras);
                  setPage(0);
                })
                .catch((err: unknown) => {
                  setBackendError(err instanceof Error ? err.message : "无法连接后端服务");
                })
                .finally(() => setBackendLoading(false));
            }}
            style={{ marginTop: 16, padding: "6px 18px", cursor: "pointer" }}
          >
            重试
          </button>
        </div>
      ) : isBackendEmpty ? (
        <div className="monitor-empty-state">
          <b>暂无摄像头数据</b>
          <span>后端未返回任何摄像头信息，请检查 config.yaml 配置。</span>
        </div>
      ) : (
        <>
          <div className="monitor-stage">
            <MonitorTelemetryRail
              side="left"
              kicker="TRAFFIC"
              title="车流量统计"
              metrics={[
                { label: "在线通道", value: String(wallStats.online), unit: "路", tone: "#72d4ff" },
                { label: "接入总数", value: String(cameraViews.length), unit: "路", tone: "#6ee7a8" },
                { label: "接入状态", value: "LIVE", unit: "WebRTC", tone: "#24c1e0" },
              ]}
              distribution={[]}
            />

            <div className="monitor-wall-grid">
              {pageItems.map((view) => page === 0 ? (
                <WebRTCTile
                  key={view.camera.camera_id}
                  view={view}
                  vehicleCount={vehicleCountMap[view.camera.camera_id] ?? 0}
                  expandedId={expandedId}
                  onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                  onSelect={setActiveCamera}
                />
              ) : (
                <MonitorTile
                  key={view.camera.camera_id}
                  view={view}
                  expandedId={expandedId}
                  onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                  onSelect={setActiveCamera}
                />
              ))}
            </div>

            <MonitorTelemetryRail
              side="right"
              kicker="STATS"
              title="实时状态"
              metrics={[
                { label: "识别车辆", value: String(totalVehicles), unit: "辆", tone: "#72d4ff" },
                { label: "总驶入", value: String(totalEntry), unit: "辆", tone: "#4CAF50" },
                { label: "总驶出", value: String(totalExit), unit: "辆", tone: "#FF9800" },
              ]}
              distribution={[]}
            />
          </div>

          <MonitorStatusBar
            wallStats={{ online: wallStats.online, danger: 0, risk: 0 }}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((value) => Math.max(0, value - 1))}
            onNext={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
          />
        </>
      )}

      {activeCamera ? (
        demoDataEnabled ? (
          <DemoMonitorModal view={activeCamera} onClose={() => setActiveCamera(null)} />
        ) : (
          <LiveMonitorModal cameraView={activeCamera} vehicleCount={vehicleCountMap[activeCamera.camera.camera_id] ?? 0} onClose={() => setActiveCamera(null)} />
        )
      ) : null}
    </section>
  );
}

function MonitorTile({
  view,
  expandedId,
  onToggleExpand,
  onSelect,
}: {
  view: CameraView;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (view: CameraView) => void;
}) {
  const hasSegment = view.segment !== null;
  const statusText = hasSegment ? getRiskText(view.segment!.status) : "在线";
  const borderColor = getCameraBorderColor(view);
  const streamState = useStreamState();
  const trafficFlow = streamState.traffic[view.camera.camera_id] || null;

  return (
    <article
      className={`monitor-tile ${hasSegment ? view.segment!.status : ""}`}
      style={{ borderColor }}
    >
      <button className="monitor-video" onClick={() => onSelect(view)}>
        <div className="video-scanline" />
        <div className="signal-corner top-left" />
        <div className="signal-corner top-right" />
        <div className="signal-corner bottom-left" />
        <div className="signal-corner bottom-right" />
        <div className="live-badge">LIVE</div>
        <div className="channel-badge">{view.channel}</div>
        {hasSegment ? (
          <div className="status-ribbon" style={{ background: borderColor }}>{getRiskText(view.segment!.status)}</div>
        ) : null}
        <div className="mock-traffic-lines"><i /><i /><i /></div>
        <div className="video-caption">
          <b>{view.camera.name}</b>
          {hasSegment ? <span>{view.segment!.name}</span> : null}
        </div>
        <em>{view.camera.status === "online" ? statusText : "离线"}</em>
      </button>
      <div className="monitor-strip">
        {hasSegment ? (
          <>
            <span>车流 {view.segment!.traffic_flow} 辆/min</span>
            <span>均速 {view.segment!.avg_speed} km/h</span>
            <span>风险 {getRiskText(view.segment!.status)}</span>
          </>
        ) : (
          <>
            <span>驶入 {trafficFlow?.entry_count ?? "-"}</span>
            <span>驶出 {trafficFlow?.exit_count ?? "-"}</span>
            <span>车流 {trafficFlow?.flow_per_min ?? "-"}/min</span>
            <span>状态 {statusText}</span>
          </>
        )}
        <button onClick={() => onToggleExpand(view.camera.camera_id)}>详情</button>
      </div>
      {expandedId === view.camera.camera_id ? (
        <div className="monitor-inline-detail">
          {hasSegment ? (
            <>
              <p>风险分数：{view.segment!.risk_score}</p>
              <p>关联道路：{view.segment!.name}</p>
              <p>最近事件：{view.events[0]?.description ?? "暂无异常事件"}</p>
            </>
          ) : (
            <>
              <p>摄像头ID：{view.camera.camera_id}</p>
              <p>坐标：{view.camera.lng.toFixed(6)}, {view.camera.lat.toFixed(6)}</p>
              <p>最近事件：暂无交通数据接入</p>
            </>
          )}
          <p>更新时间：{view.lastUpdate}</p>
        </div>
      ) : null}
    </article>
  );
}

function WebRTCTile({
  view,
  vehicleCount,
  expandedId,
  onToggleExpand,
  onSelect,
}: {
  view: CameraView;
  vehicleCount: number;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (view: CameraView) => void;
}) {
  const { stream, connecting, error } = useWebRTC(view.camera.camera_id);
  const streamState = useStreamState();
  const trafficFlow = streamState.traffic[view.camera.camera_id] || null;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const hasSegment = view.segment !== null;
  const statusText = hasSegment ? getRiskText(view.segment!.status) : "在线";
  const borderColor = getCameraBorderColor(view);

  return (
    <article
      className={`monitor-tile ${hasSegment ? view.segment!.status : ""}`}
      style={{ borderColor }}
    >
      <button className="monitor-video" onClick={() => onSelect(view)}>
        <div className="video-scanline" />
        <div className="signal-corner top-left" />
        <div className="signal-corner top-right" />
        <div className="signal-corner bottom-left" />
        <div className="signal-corner bottom-right" />
        <div className="live-badge">LIVE</div>
        <div className="channel-badge">{view.channel}</div>
        {hasSegment ? (
          <div className="status-ribbon" style={{ background: borderColor }}>{getRiskText(view.segment!.status)}</div>
        ) : null}
        {connecting ? (
          <div className="webrtc-placeholder"><span style={{ color: "#72d4ff" }}>连接中…</span></div>
        ) : error ? (
          <div className="webrtc-placeholder"><span style={{ color: "#ff8a80" }}>连接失败</span></div>
        ) : stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="monitor-live-video" />
        ) : (
          <div className="webrtc-placeholder"><span>等待视频流…</span></div>
        )}
        <div className="video-caption">
          <b>{view.camera.name}</b>
          {hasSegment ? <span>{view.segment!.name}</span> : null}
        </div>
        <em>{view.camera.status === "online" ? statusText : "离线"}</em>
      </button>
      <div className="monitor-strip">
        {hasSegment ? (
          <>
            <span>车流 {view.segment!.traffic_flow} 辆/min</span>
            <span>均速 {view.segment!.avg_speed} km/h</span>
            <span>风险 {getRiskText(view.segment!.status)}</span>
          </>
        ) : (
          <>
            <span>识别车辆 {vehicleCount}</span>
            <span>驶入 {trafficFlow?.entry_count ?? "-"}</span>
            <span>驶出 {trafficFlow?.exit_count ?? "-"}</span>
          </>
        )}
        <button onClick={() => onToggleExpand(view.camera.camera_id)}>详情</button>
      </div>
      {expandedId === view.camera.camera_id ? (
        <div className="monitor-inline-detail">
          {hasSegment ? (
            <>
              <p>风险分数：{view.segment!.risk_score}</p>
              <p>关联道路：{view.segment!.name}</p>
              <p>最近事件：{view.events[0]?.description ?? "暂无异常事件"}</p>
            </>
          ) : (
            <>
              <p>摄像头ID：{view.camera.camera_id}</p>
              <p>坐标：{view.camera.lng.toFixed(6)}, {view.camera.lat.toFixed(6)}</p>
              <p>最近事件：暂无交通数据接入</p>
            </>
          )}
          <p>更新时间：{view.lastUpdate}</p>
        </div>
      ) : null}
    </article>
  );
}

function getCameraBorderColor(view: CameraView) {
  if (view.camera.status === "offline") return "#95a5a6";
  if (view.segment?.status === "danger") return "#e74c3c";
  if (view.segment?.status === "risk") return "#e67e22";
  if (view.segment?.traffic_flow != null) return getTrafficFlowColor(view.segment.traffic_flow);
  return "#34A853";
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
    ? { value: metrics[0]?.value ?? total, label: metrics[0]?.label ?? "总数", unit: metrics[0]?.unit ?? "" }
    : { value: metrics[1]?.value ?? total, label: metrics[1]?.label ?? "总数", unit: metrics[1]?.unit ?? "" };

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

      {distribution.length > 0 ? (
        side === "left" ? (
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
        )
      ) : (
        <div className="telemetry-rail-chart">
          <span className="telemetry-section-label">等待交通数据接入</span>
        </div>
      )}

      <div className="telemetry-rail-orbit wing-orbit">
        <i />
        <div className="orbit-center">
          <b>{centerData.value}</b>
          <span>{centerData.label}</span>
          {centerData.unit ? <em>{centerData.unit}</em> : null}
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

function DemoMonitorModal({ view, onClose }: { view: CameraView; onClose: () => void }) {
  const highRisk = view.segment?.status === "risk" || view.segment?.status === "danger";
  const latestEvent = view.events[0];

  return (
    <div className="surveillance-modal-backdrop" onClick={onClose}>
      <div className="surveillance-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>X</button>
        {highRisk ? <div className="risk-warning">当前监控存在高风险异常，请及时处理</div> : null}
        <div className="modal-video-stage" style={{ borderColor: getRiskColor(view.segment?.status ?? "normal") }}>
          <div className="video-scanline" />
          <div className="live-badge">LIVE</div>
          <h2>{view.camera.name}</h2>
          <p>{view.streamLabel} · {view.channel}</p>
          <span>WebRTC Video Placeholder</span>
        </div>
        <div className="modal-video-info">
          {view.segment ? (
            <>
              <div><span>道路名称</span><b>{view.segment.name}</b></div>
              <div><span>当前状态</span><b>{getRiskText(view.segment.status)}</b></div>
              <div><span>车流量</span><b>{view.segment.traffic_flow} 辆/min</b></div>
              <div><span>平均车速</span><b>{view.segment.avg_speed} km/h</b></div>
              <div><span>风险等级</span><b>{view.segment.status}</b></div>
            </>
          ) : (
            <>
              <div><span>摄像头ID</span><b>{view.camera.camera_id}</b></div>
              <div><span>坐标</span><b>{view.camera.lng.toFixed(6)}, {view.camera.lat.toFixed(6)}</b></div>
            </>
          )}
          <div><span>最近异常</span><b>{latestEvent ? latestEvent.description : "暂无"}</b></div>
        </div>
        <div className="modal-exit-row">
          <button onClick={onClose}>退出放大</button>
        </div>
      </div>
    </div>
  );
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 3000) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId);
      pc.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    };
    const handleStateChange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    const timeoutId = window.setTimeout(finish, timeoutMs);
    pc.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

function useWebRTC(cameraId: string) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeCurrentPeer = useCallback(() => {
    const pc = pcRef.current;
    pcRef.current = null;
    if (!pc) return;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    if (pc.connectionState !== "closed") pc.close();
  }, []);

  const connect = useCallback(async () => {
    closeCurrentPeer();
    setConnecting(true);
    setError(null);
    setStream(null);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;
    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (event) => {
      if (pcRef.current !== pc) return;
      setStream(event.streams[0] ?? new MediaStream([event.track]));
      setConnecting(false);
    };

    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc || pc.connectionState !== "failed") return;
      pcRef.current = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      setError("WebRTC 连接已断开");
      setConnecting(false);
      setStream(null);
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      if (pcRef.current !== pc) {
        pc.close();
        return;
      }

      const answer = await postLiveOffer(cameraId, {
        sdp: pc.localDescription?.sdp ?? offer.sdp ?? "",
        type: pc.localDescription?.type ?? offer.type ?? "offer",
      });

      if (pcRef.current !== pc) {
        pc.close();
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer as RTCSessionDescriptionInit));
      if (pcRef.current === pc) setConnecting(false);
    } catch (err: unknown) {
      if (pcRef.current === pc) {
        pcRef.current = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        setError(err instanceof Error ? err.message : "WebRTC 连接失败");
        setConnecting(false);
        setStream(null);
      }
      if (pc.connectionState !== "closed") pc.close();
    }
  }, [cameraId, closeCurrentPeer]);

  useEffect(() => {
    void connect();
    return closeCurrentPeer;
  }, [connect, closeCurrentPeer]);

  const disconnect = useCallback(() => {
    closeCurrentPeer();
    setStream(null);
    setConnecting(false);
    setError(null);
  }, [closeCurrentPeer]);

  return { stream, connecting, error, disconnect };
}


function LiveMonitorModal({ cameraView, vehicleCount, onClose }: { cameraView: CameraView; vehicleCount: number; onClose: () => void }) {
  const { stream, connecting, error, disconnect } = useWebRTC(cameraView.camera.camera_id);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const handleClose = () => {
    disconnect();
    onClose();
  };

  return (
    <div className="surveillance-modal-backdrop" onClick={handleClose}>
      <div className="surveillance-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-x" onClick={handleClose}>X</button>
        <div className="modal-video-stage" style={{ borderColor: "#34A853", position: "relative", overflow: "hidden" }}>
          <div className="live-badge">LIVE</div>
          <h2>{cameraView.camera.name}</h2>
          <p>{cameraView.streamLabel} · {cameraView.channel}</p>
          {error ? (
            <div className="risk-warning" style={{ marginTop: 12 }}>{error}</div>
          ) : connecting ? (
            <span style={{ color: "#72d4ff" }}>正在建立 WebRTC 连接…</span>
          ) : stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "auto", maxHeight: 360, display: "block", marginTop: 8 }}
            />
          ) : (
            <span style={{ color: "#aaa" }}>等待视频流…</span>
          )}
        </div>
        <div className="modal-video-info">
          <div><span>摄像头ID</span><b>{cameraView.camera.camera_id}</b></div>
          <div><span>名称</span><b>{cameraView.camera.name}</b></div>
          <div><span>坐标</span><b>{cameraView.camera.lng.toFixed(6)}, {cameraView.camera.lat.toFixed(6)}</b></div>
          <div><span>识别车辆</span><b>{vehicleCount}</b></div>
          <div><span>状态</span><b>{cameraView.camera.status === "online" ? "在线" : "离线"}</b></div>
        </div>
        <div className="modal-exit-row">
          <button onClick={handleClose}>退出放大</button>
        </div>
      </div>
    </div>
  );
}
