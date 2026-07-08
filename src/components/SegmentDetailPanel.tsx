import type { CameraPoint, RoadSegment } from "../data/standardRoadNetwork";
import { getRiskText, getRoadColor, getRoadTypeText } from "../utils/riskStyle";

export function SegmentDetailPanel({
  segment,
  cameras,
}: {
  segment: RoadSegment | null;
  cameras: CameraPoint[];
}) {
  if (!segment) {
    return <p className="muted">点击任一道路后，这里会显示统一字段的路段详情。</p>;
  }

  const relatedCameras = cameras.filter((camera) => segment.camera_ids.includes(camera.camera_id));

  return (
    <div className="road-card">
      <strong>{segment.name}</strong>
      <span>{segment.segment_id}</span>
      <div className="road-kv"><span>道路类型</span><b>{getRoadTypeText(segment.road_type)}</b></div>
      <div className="road-kv"><span>长度</span><b>{segment.length_m} m</b></div>
      <div className="road-kv"><span>车道数</span><b>{segment.lane_count}</b></div>
      <div className="road-kv"><span>限速</span><b>{segment.speed_limit} km/h</b></div>
      <div className="road-kv"><span>当前车流量</span><b>{segment.traffic_flow}</b></div>
      <div className="road-kv"><span>平均车速</span><b>{segment.avg_speed} km/h</b></div>
      <div className="road-kv"><span>风险分数</span><b>{segment.risk_score}</b></div>
      <div className="road-kv"><span>关联摄像头</span><b>{relatedCameras.length ? relatedCameras.map((camera) => camera.name).join("、") : "无"}</b></div>
      <div className="risk-pill" style={{ background: getRoadColor(segment.status) }}>
        {getRiskText(segment.status)}
      </div>
    </div>
  );
}
