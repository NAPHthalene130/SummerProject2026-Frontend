import { useMemo, useState } from "react";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { CameraPoint, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { getRiskColor, getRiskText, getTrafficFlowColor } from "../utils/riskStyle";

interface CameraView {
  camera: CameraPoint;
  segment: RoadSegment;
  events: TrafficEvent[];
}

export function MonitorPage() {
  const scenario = useScenarioPlayback();
  const [activeCamera, setActiveCamera] = useState<CameraView | null>(null);
  const cameraViews = useMemo(() => {
    return scenario.cameras.flatMap((camera) => {
      const segment = scenario.segments.find((item) => item.segment_id === camera.segment_id);
      if (!segment) return [];
      return [{
        camera,
        segment,
        events: scenario.events.filter((event) => event.segment_id === segment.segment_id),
      }];
    });
  }, [scenario.cameras, scenario.segments, scenario.events]);

  const stats = useMemo(() => {
    const online = scenario.cameras.filter((camera) => camera.status === "online").length;
    const highRisk = cameraViews.filter((view) => view.camera.status === "online" && (view.segment.status === "risk" || view.segment.status === "danger")).length;
    const avgFlow = cameraViews.reduce((sum, view) => sum + view.segment.traffic_flow, 0) / cameraViews.length;
    const avgSpeed = cameraViews.reduce((sum, view) => sum + view.segment.avg_speed, 0) / cameraViews.length;
    const distribution = ["normal", "busy", "risk", "danger"].map((status) => ({
      status,
      count: cameraViews.filter((view) => view.segment.status === status).length,
    }));
    return {
      online,
      offline: scenario.cameras.length - online,
      highRisk,
      avgFlow,
      avgSpeed,
      distribution,
    };
  }, [cameraViews, scenario.cameras]);

  return (
    <section className="business-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WebRTC Monitor Mock</p>
          <h1>多路视频监控页面</h1>
          <p>当前使用 WebRTC Video Placeholder 模拟真实视频流，后续可替换为 WebRTC 播放组件。</p>
        </div>
      </div>

      <div className="monitor-layout">
        <div className="video-grid">
          {cameraViews.map((view) => (
            <button
              key={view.camera.camera_id}
              className="video-card"
              style={{ borderColor: getCameraBorderColor(view) }}
              onClick={() => setActiveCamera(view)}
            >
              <div className="video-meta">
                <strong>{view.camera.name}</strong>
                <span>{view.camera.camera_id} · {view.segment.name}</span>
              </div>
              <div className="video-placeholder">
                <b>{view.camera.camera_id}</b>
                <span>WebRTC Video Placeholder</span>
              </div>
              <div className="video-stats">
                <span>状态：{view.camera.status === "online" ? getRiskText(view.segment.status) : "摄像头离线"}</span>
                <span>车流量：{view.segment.traffic_flow}</span>
                <span>平均车速：{view.segment.avg_speed} km/h</span>
                <span>风险等级：{view.segment.status}</span>
              </div>
            </button>
          ))}
        </div>

        <aside className="business-side-panel">
          <h2>数据报表预留区</h2>
          <div className="summary-grid">
            <div><span>在线摄像头数</span><strong>{stats.online}</strong></div>
            <div><span>离线摄像头数</span><strong>{stats.offline}</strong></div>
            <div><span>高风险监控数</span><strong>{stats.highRisk}</strong></div>
            <div><span>平均车流量</span><strong>{stats.avgFlow.toFixed(1)}</strong></div>
            <div><span>平均车速</span><strong>{stats.avgSpeed.toFixed(1)} km/h</strong></div>
          </div>

          <h3>风险等级分布</h3>
          <div className="risk-bars">
            {stats.distribution.map((item) => (
              <div key={item.status}>
                <span><i style={{ background: getRiskColor(item.status as RoadSegment["status"]) }} />{item.status}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>

          <h3>最近异常事件</h3>
          <div className="side-list">
            {scenario.events.length === 0 ? <p className="muted">当前无异常事件，播放场景后会出现事件。</p> : null}
            {scenario.events.map((event) => (
              <article className="event-item" key={event.event_id}>
                <strong>{event.segment_name}</strong>
                <span>{event.event_type} · {event.detected_by}</span>
                <p>{event.description}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {activeCamera ? <MonitorModal view={activeCamera} onClose={() => setActiveCamera(null)} /> : null}
    </section>
  );
}

function getCameraBorderColor(view: CameraView) {
  if (view.camera.status === "offline") return "#95a5a6";
  if (view.segment.status === "danger") return "#e74c3c";
  if (view.segment.status === "risk") return "#e67e22";
  return getTrafficFlowColor(view.segment.traffic_flow);
}

function MonitorModal({ view, onClose }: { view: CameraView; onClose: () => void }) {
  const latestEvent = view.events[0];
  const highRisk = view.segment.status === "risk" || view.segment.status === "danger";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="monitor-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>关闭</button>
        <div className="large-video-placeholder">
          <b>{view.camera.camera_id}</b>
          <span>WebRTC Video Placeholder</span>
          {highRisk ? <em>高风险警示</em> : null}
        </div>
        <div className="modal-info">
          <h2>{view.camera.name}</h2>
          <p>{view.segment.name}</p>
          <div className="summary-grid">
            <div><span>当前车流量</span><strong>{view.segment.traffic_flow}</strong></div>
            <div><span>平均车速</span><strong>{view.segment.avg_speed} km/h</strong></div>
            <div><span>风险等级</span><strong>{getRiskText(view.segment.status)}</strong></div>
            <div><span>最近事件</span><strong>{latestEvent ? latestEvent.event_type : "暂无"}</strong></div>
          </div>
          {latestEvent ? <p className="modal-desc">{latestEvent.description}</p> : null}
        </div>
      </div>
    </div>
  );
}
