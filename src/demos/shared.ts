import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { getRiskText, getRoadTypeText } from "../utils/riskStyle";

export function nodeMap(nodes: RoadNode[]) {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

export function getSegmentPoints(nodes: RoadNode[], segment: RoadSegment) {
  const map = nodeMap(nodes);
  const from = map.get(segment.from_node);
  const to = map.get(segment.to_node);
  if (!from || !to) return null;
  return { from, to };
}

export function getSegmentMidpoint(nodes: RoadNode[], segment: RoadSegment) {
  const points = getSegmentPoints(nodes, segment);
  if (!points) return { x: 0, y: 0, lng: 0, lat: 0 };
  return {
    x: (points.from.x + points.to.x) / 2,
    y: (points.from.y + points.to.y) / 2,
    lng: (points.from.lng + points.to.lng) / 2,
    lat: (points.from.lat + points.to.lat) / 2,
  };
}

export function formatSegmentPopup(segment: RoadSegment, cameras: CameraPoint[]) {
  const related = cameras.filter((camera) => segment.camera_ids.includes(camera.camera_id));
  return `
    <strong>${segment.name}</strong><br/>
    道路编号：${segment.segment_id}<br/>
    道路类型：${getRoadTypeText(segment.road_type)}<br/>
    长度：${segment.length_m} m<br/>
    车道数：${segment.lane_count}<br/>
    限速：${segment.speed_limit} km/h<br/>
    当前车流量：${segment.traffic_flow}<br/>
    平均车速：${segment.avg_speed} km/h<br/>
    风险分数：${segment.risk_score}<br/>
    当前状态：${getRiskText(segment.status)}<br/>
    关联摄像头：${related.length ? related.map((camera) => camera.name).join("、") : "无"}
  `;
}

export function eventPosition(nodes: RoadNode[], segments: RoadSegment[], event: TrafficEvent) {
  const segment = segments.find((item) => item.segment_id === event.segment_id);
  if (!segment) return { x: 0, y: 0, lng: 116.396, lat: 39.906 };
  return getSegmentMidpoint(nodes, segment);
}

export function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function recordRenderMetrics(start: number, callback: (renderMs: number) => void) {
  window.requestAnimationFrame(() => callback(performance.now() - start));
}
