import { useEffect, useRef } from "react";
import type { VisualDemoProps } from "../types";
import { getRoadColor, getRoadOpacity, getRoadWidth } from "../utils/riskStyle";
import { eventPosition, getSegmentMidpoint, getSegmentPoints, recordRenderMetrics } from "./shared";

export function DashboardRoadHeatmapDemo({
  nodes,
  segments,
  cameras,
  events,
  workOrders,
  currentTimeSec,
  currentDescription,
  onSelectSegment,
  onMetricsChange,
}: VisualDemoProps) {
  const firstRender = useRef(true);
  const avgSpeed = segments.reduce((sum, segment) => sum + segment.avg_speed, 0) / segments.length;
  const highRisk = segments.filter((segment) => segment.status === "risk" || segment.status === "danger").length;
  const pendingOrders = workOrders.filter((order) => order.status !== "completed").length;

  useEffect(() => {
    const start = performance.now();
    recordRenderMetrics(start, (time) => {
      onMetricsChange(firstRender.current ? { render_time_ms: time } : { update_time_ms: time });
      firstRender.current = false;
    });
  }, [segments, cameras, events, workOrders, onMetricsChange]);

  return (
    <div className="dashboard-demo">
      <div className="metric-strip wide">
        <div><span>监测路段数</span><strong>{segments.length}</strong></div>
        <div><span>在线摄像头数</span><strong>{cameras.filter((camera) => camera.status === "online").length}</strong></div>
        <div><span>平均车速</span><strong>{avgSpeed.toFixed(1)} km/h</strong></div>
        <div><span>高风险路段数</span><strong>{highRisk}</strong></div>
        <div><span>今日异常事件数</span><strong>{events.length}</strong></div>
        <div><span>待处理工单数</span><strong>{pendingOrders}</strong></div>
      </div>

      <div className="dashboard-grid">
        <div className="heatmap-panel">
          <div className="panel-title">智慧交通大屏 · 科技园区道路热力图 · {currentTimeSec}s</div>
          <p className="muted">{currentDescription}</p>
          <svg viewBox="0 0 760 500" className="heatmap-svg">
            <rect width="760" height="500" rx="16" fill="#061829" />
            <g opacity="0.22">
              {Array.from({ length: 50 }).map((_, index) => (
                <circle key={index} cx={40 + (index % 10) * 74} cy={46 + Math.floor(index / 10) * 90} r="2" fill="#5ee7ff" />
              ))}
            </g>
            {segments.map((segment) => {
              const points = getSegmentPoints(nodes, segment);
              if (!points) return null;
              const mid = getSegmentMidpoint(nodes, segment);
              return (
                <g key={segment.segment_id}>
                  <line
                    className={segment.status === "danger" ? "pulse-line" : ""}
                    x1={points.from.x}
                    y1={points.from.y}
                    x2={points.to.x}
                    y2={points.to.y}
                    stroke={getRoadColor(segment.status)}
                    strokeWidth={getRoadWidth(segment.road_type) + 4}
                    opacity={getRoadOpacity(segment.status)}
                    strokeLinecap="round"
                    onClick={() => onSelectSegment(segment.segment_id)}
                  />
                  <text x={mid.x + 7} y={mid.y - 8} fill="#dff7ff" fontSize="12" fontWeight="700">{segment.name}</text>
                </g>
              );
            })}
            {cameras.map((camera) => <circle key={camera.camera_id} cx={camera.x} cy={camera.y} r="7" fill="#21d4fd" stroke="#ffffff" strokeWidth="2" />)}
            {events.map((event) => {
              const pos = eventPosition(nodes, segments, event);
              return <circle className="pulse-line" key={event.event_id} cx={pos.x} cy={pos.y} r="13" fill="#e74c3c" stroke="#ffffff" strokeWidth="2" />;
            })}
          </svg>
        </div>

        <div className="ops-panel">
          <div className="panel-title">异常事件列表</div>
          <div className="compact-list">
            {events.length === 0 ? <p className="muted">当前无异常事件。</p> : null}
            {events.map((event) => (
              <div className="compact-item danger-border" key={event.event_id}>
                <strong>{event.segment_name}</strong>
                <span>{event.event_type} · {event.detected_by} · T{event.timestamp_sec}s</span>
              </div>
            ))}
          </div>
          <div className="panel-title">工单联动</div>
          <div className="compact-list">
            {workOrders.length === 0 ? <p className="muted">事故触发后自动生成处置工单。</p> : null}
            {workOrders.map((order) => (
              <div className="compact-item" key={order.work_order_id}>
                <strong>{order.title}</strong>
                <span>{order.status} · {order.assignee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
