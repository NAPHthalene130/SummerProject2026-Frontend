import type { CameraPoint, RoadNode, RoadSegment, RoadStatus } from "./data/standardRoadNetwork";
import type { TrafficEvent, WorkOrder } from "./types/business";

export type SolutionKey = "leaflet" | "maplibre" | "svg" | "canvas" | "dashboard" | "api";

export interface EvaluationMetrics {
  render_time_ms: number;
  update_time_ms: number;
  road_count: number;
  camera_count: number;
  event_count: number;
  work_order_count: number;
  supports_real_map: boolean;
  supports_topology_control: boolean;
  supports_dynamic_update: boolean;
  supports_event_marker: boolean;
  supports_work_order_link: boolean;
  dependency_count: number;
  requires_token: boolean;
}

export interface ScenarioState {
  currentTimeSec: number;
  currentDescription: string;
  nodes: RoadNode[];
  segments: RoadSegment[];
  cameras: CameraPoint[];
  events: TrafficEvent[];
  workOrders: WorkOrder[];
}

export interface VisualDemoProps extends ScenarioState {
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  onMetricsChange: (metrics: Partial<EvaluationMetrics>) => void;
}

export interface SegmentDetails {
  segment_id: string;
  name: string;
  road_type: RoadSegment["road_type"];
  length_m: number;
  lane_count: number;
  speed_limit: number;
  status: RoadStatus;
  traffic_flow: number;
  avg_speed: number;
  risk_score: number;
  camera_ids: string[];
}
