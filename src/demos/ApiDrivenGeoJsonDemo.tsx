import { useEffect, useRef, useState } from "react";
import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { VisualDemoProps } from "../types";
import { fetchCameras, fetchEvents, fetchRoadSegments, fetchTrafficLive, fetchWorkOrders } from "../api/mockTrafficApi";
import { getRoadColor, getRoadOpacity, getRoadWidth } from "../utils/riskStyle";
import { eventPosition, getSegmentMidpoint, getSegmentPoints, recordRenderMetrics } from "./shared";

export function ApiDrivenGeoJsonDemo(props: VisualDemoProps) {
  const {
    nodes,
    segments,
    cameras,
    events,
    workOrders,
    currentTimeSec,
    currentDescription,
    onSelectSegment,
    onMetricsChange,
  } = props;
  const [apiSegments, setApiSegments] = useState<RoadSegment[]>(segments);
  const [apiCameras, setApiCameras] = useState<CameraPoint[]>(cameras);
  const [apiNodes, setApiNodes] = useState<RoadNode[]>(nodes);
  const [loading, setLoading] = useState(true);
  const firstRender = useRef(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetchRoadSegments(nodes, segments),
      fetchCameras(cameras),
      fetchTrafficLive(segments),
      fetchEvents(events),
      fetchWorkOrders(workOrders),
    ]).then(([payload]) => {
      if (!alive) return;
      setApiNodes(payload.nodes);
      setApiSegments(payload.segments);
      setApiCameras(cameras);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [nodes, segments, cameras, events, workOrders]);

  useEffect(() => {
    const start = performance.now();
    recordRenderMetrics(start, (time) => {
      onMetricsChange(firstRender.current ? { render_time_ms: time } : { update_time_ms: time });
      firstRender.current = false;
    });
  }, [apiSegments, apiCameras, events, workOrders, onMetricsChange]);

  return (
    <div className="api-demo">
      <div className="api-map">
        <div className="panel-title">接口驱动 GeoJSON / 路网渲染 · {currentTimeSec}s</div>
        <p className="muted">{currentDescription}</p>
        {loading ? <div className="loading">正在模拟 Mock API / WebSocket 数据同步...</div> : null}
        <svg viewBox="0 0 760 420" className="api-svg">
          <rect width="760" height="420" rx="14" fill="#081a2b" />
          {apiSegments.map((segment) => {
            const points = getSegmentPoints(apiNodes, segment);
            if (!points) return null;
            const mid = getSegmentMidpoint(apiNodes, segment);
            return (
              <g key={segment.segment_id}>
                <line
                  x1={points.from.x}
                  y1={points.from.y}
                  x2={points.to.x}
                  y2={points.to.y}
                  stroke={getRoadColor(segment.status)}
                  strokeWidth={getRoadWidth(segment.road_type)}
                  opacity={getRoadOpacity(segment.status)}
                  strokeLinecap="round"
                  onClick={() => onSelectSegment(segment.segment_id)}
                />
                <text x={mid.x + 6} y={mid.y - 7} fill="#dff7ff" fontSize="12" fontWeight="700">{segment.name}</text>
              </g>
            );
          })}
          {apiCameras.map((camera) => <circle key={camera.camera_id} cx={camera.x} cy={camera.y} r="6" fill="#21d4fd" stroke="#ffffff" strokeWidth="2" />)}
          {events.map((event) => {
            const pos = eventPosition(apiNodes, apiSegments, event);
            return <circle key={event.event_id} cx={pos.x} cy={pos.y} r="11" fill="#e74c3c" stroke="#ffffff" strokeWidth="2" />;
          })}
        </svg>
      </div>

      <div className="api-side">
        <div className="panel-title">模拟真实后端接口</div>
        <code>GET /api/v1/segments</code>
        <code>GET /api/v1/cameras</code>
        <code>GET /api/v1/traffic/live</code>
        <code>GET /api/v1/events</code>
        <code>GET /api/v1/work-orders</code>
      </div>

      <div className="data-flow vertical-flow">
        <span>Mock API / WebSocket 模拟</span>
        <b>↓</b>
        <span>前端状态管理</span>
        <b>↓</b>
        <span>地图道路颜色更新</span>
        <b>↓</b>
        <span>异常事件面板</span>
        <b>↓</b>
        <span>工单面板</span>
      </div>
    </div>
  );
}
