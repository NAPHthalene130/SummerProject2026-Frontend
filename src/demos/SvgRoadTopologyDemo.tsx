import { useEffect, useRef } from "react";
import type { VisualDemoProps } from "../types";
import { getRoadColor, getRoadOpacity, getRoadWidth } from "../utils/riskStyle";
import { eventPosition, getSegmentMidpoint, getSegmentPoints, recordRenderMetrics } from "./shared";

export function SvgRoadTopologyDemo({
  nodes,
  segments,
  cameras,
  events,
  workOrders,
  currentTimeSec,
  currentDescription,
  selectedSegmentId,
  onSelectSegment,
  onMetricsChange,
}: VisualDemoProps) {
  const firstRender = useRef(true);

  useEffect(() => {
    const start = performance.now();
    recordRenderMetrics(start, (renderMs) => {
      onMetricsChange(firstRender.current ? { render_time_ms: renderMs } : { update_time_ms: renderMs });
      firstRender.current = false;
    });
  }, [segments, cameras, events, workOrders, onMetricsChange]);

  return (
    <div className="topology-card">
      <div className="scenario-badge inline">
        <b>{currentTimeSec}s</b>
        <span>{currentDescription}</span>
      </div>
      <svg className="topology-svg" viewBox="0 0 760 540" role="img" aria-label="SVG 科技园区道路拓扑图">
        <rect width="760" height="540" rx="14" fill="#071827" />
        <Grid />
        {segments.map((segment) => {
          const points = getSegmentPoints(nodes, segment);
          if (!points) return null;
          const mid = getSegmentMidpoint(nodes, segment);
          const selected = selectedSegmentId === segment.segment_id;
          return (
            <g key={segment.segment_id}>
              <line
                x1={points.from.x}
                y1={points.from.y}
                x2={points.to.x}
                y2={points.to.y}
                stroke="#07111d"
                strokeWidth={getRoadWidth(segment.road_type) + (selected ? 10 : 7)}
                strokeLinecap="round"
              />
              <line
                className={segment.status === "danger" ? "pulse-line" : ""}
                x1={points.from.x}
                y1={points.from.y}
                x2={points.to.x}
                y2={points.to.y}
                stroke={getRoadColor(segment.status)}
                strokeWidth={getRoadWidth(segment.road_type) + (selected ? 2 : 0)}
                opacity={getRoadOpacity(segment.status)}
                strokeLinecap="round"
                onClick={() => onSelectSegment(segment.segment_id)}
              />
              <text x={mid.x + 6} y={mid.y - 8} fill="#dff7ff" fontSize="13" fontWeight="700">
                {segment.name}
              </text>
            </g>
          );
        })}
        {nodes.filter((node) => node.type === "intersection" || node.type === "entrance").map((node) => (
          <g key={node.node_id}>
            <circle cx={node.x} cy={node.y} r={node.type === "entrance" ? 9 : 7} fill={node.type === "entrance" ? "#9b59b6" : "#ffffff"} />
            <text x={node.x + 10} y={node.y + 18} fill="#b9d9e8" fontSize="12">{node.name}</text>
          </g>
        ))}
        {cameras.map((camera) => (
          <g key={camera.camera_id} transform={`translate(${camera.x} ${camera.y})`}>
            <circle r="7" fill="#21d4fd" stroke="#ffffff" strokeWidth="2" />
            <text x="10" y="4" fill="#8feaff" fontSize="12">摄像头</text>
          </g>
        ))}
        {events.map((event) => {
          const pos = eventPosition(nodes, segments, event);
          return (
            <g className="pulse-line" key={event.event_id} transform={`translate(${pos.x} ${pos.y})`}>
              <circle r="12" fill="#e74c3c" stroke="#ffffff" strokeWidth="2" />
              <text x="-4" y="5" fill="#ffffff" fontWeight="900">!</text>
            </g>
          );
        })}
        <Legend />
      </svg>
    </div>
  );
}

function Grid() {
  return (
    <g opacity="0.2">
      {Array.from({ length: 10 }).map((_, index) => <line key={`v-${index}`} x1={60 + index * 70} y1="28" x2={60 + index * 70} y2="510" stroke="#8bd3ff" />)}
      {Array.from({ length: 8 }).map((_, index) => <line key={`h-${index}`} x1="38" y1={50 + index * 60} x2="720" y2={50 + index * 60} stroke="#8bd3ff" />)}
    </g>
  );
}

function Legend() {
  return (
    <g transform="translate(30 30)">
      <text fill="#ffffff" fontSize="18" fontWeight="800">SVG 标准路网拓扑</text>
      <text y="26" fill="#9fc4d8" fontSize="13">所有坐标来自 standardRoadNetwork.ts</text>
    </g>
  );
}
