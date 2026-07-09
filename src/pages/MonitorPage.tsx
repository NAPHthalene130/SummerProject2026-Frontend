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

  return (
    <section className="monitor-wall-page">
      <div className="monitor-wall-header">
        <div>
          <span>VIDEO WALL</span>
          <h1>道路监控视频墙</h1>
          <div className="reference-chips">
            <span>OpenRemote device status</span>
            <span>ThingsBoard telemetry</span>
          </div>
        </div>
        <div className="monitor-pager">
          <button onClick={() => setPage((value) => Math.max(0, value - 1))}>上一组监控</button>
          <strong>第 {page + 1} / {totalPages} 页</strong>
          <button onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}>下一组监控</button>
        </div>
      </div>

      <div className="monitor-system-strip">
        <span><i className="blue" />在线通道 {wallStats.online}</span>
        <span><i className="red" />事故告警 {wallStats.danger}</span>
        <span><i className="orange" />高风险 {wallStats.risk}</span>
        <span><i className="green" />WebRTC 模拟流稳定</span>
      </div>

      {demoDataEnabled ? (
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
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
