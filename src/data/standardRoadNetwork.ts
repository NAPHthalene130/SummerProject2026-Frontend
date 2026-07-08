export type RoadStatus = "normal" | "busy" | "risk" | "danger";

export interface RoadNode {
  node_id: string;
  name: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  type: "intersection" | "entrance" | "camera_point" | "normal";
}

export interface RoadSegment {
  segment_id: string;
  name: string;
  from_node: string;
  to_node: string;
  road_type: "main" | "secondary" | "branch";
  length_m: number;
  lane_count: number;
  speed_limit: number;
  camera_ids: string[];
  base_risk: number;
  status: RoadStatus;
  traffic_flow: number;
  avg_speed: number;
  risk_score: number;
}

export interface CameraPoint {
  camera_id: string;
  name: string;
  segment_id: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  status: "online" | "offline";
}

export const standardRoadNodes: RoadNode[] = [
  { node_id: "n_w1", name: "科技大道西口", lng: 116.386, lat: 39.912, x: 80, y: 120, type: "normal" },
  { node_id: "n_c1", name: "科技大道核心路口", lng: 116.396, lat: 39.912, x: 380, y: 120, type: "intersection" },
  { node_id: "n_e1", name: "科技大道东口", lng: 116.406, lat: 39.912, x: 680, y: 120, type: "normal" },
  { node_id: "n_w2", name: "创新路西口", lng: 116.386, lat: 39.906, x: 80, y: 260, type: "normal" },
  { node_id: "n_c2", name: "创新路核心路口", lng: 116.396, lat: 39.906, x: 380, y: 260, type: "intersection" },
  { node_id: "n_e2", name: "创新路东口", lng: 116.406, lat: 39.906, x: 680, y: 260, type: "normal" },
  { node_id: "n_w3", name: "学院路西口", lng: 116.386, lat: 39.900, x: 80, y: 400, type: "normal" },
  { node_id: "n_school", name: "学校/园区入口", lng: 116.396, lat: 39.900, x: 380, y: 400, type: "entrance" },
  { node_id: "n_e3", name: "学院路东口", lng: 116.406, lat: 39.900, x: 680, y: 400, type: "normal" },
  { node_id: "n_north_w", name: "数据南路北口", lng: 116.386, lat: 39.916, x: 80, y: 40, type: "normal" },
  { node_id: "n_south_w", name: "数据南路南口", lng: 116.386, lat: 39.896, x: 80, y: 480, type: "normal" },
  { node_id: "n_north_c", name: "云计算路北口", lng: 116.396, lat: 39.916, x: 380, y: 40, type: "normal" },
  { node_id: "n_south_c", name: "云计算路南口", lng: 116.396, lat: 39.896, x: 380, y: 480, type: "normal" },
  { node_id: "n_north_e", name: "智能北街北口", lng: 116.406, lat: 39.916, x: 680, y: 40, type: "normal" },
  { node_id: "n_south_e", name: "智能北街南口", lng: 116.406, lat: 39.896, x: 680, y: 480, type: "normal" },
];

export const standardRoadSegments: RoadSegment[] = [
  { segment_id: "seg_tech_w", name: "科技大道西段", from_node: "n_w1", to_node: "n_c1", road_type: "main", length_m: 860, lane_count: 4, speed_limit: 60, camera_ids: ["cam_001"], base_risk: 0.28, status: "normal", traffic_flow: 62, avg_speed: 52, risk_score: 0.28 },
  { segment_id: "seg_tech_e", name: "科技大道核心路口东段", from_node: "n_c1", to_node: "n_e1", road_type: "main", length_m: 880, lane_count: 4, speed_limit: 60, camera_ids: ["cam_002"], base_risk: 0.34, status: "normal", traffic_flow: 66, avg_speed: 50, risk_score: 0.34 },
  { segment_id: "seg_innov_w", name: "创新路西段", from_node: "n_w2", to_node: "n_c2", road_type: "secondary", length_m: 820, lane_count: 3, speed_limit: 50, camera_ids: ["cam_003"], base_risk: 0.22, status: "normal", traffic_flow: 42, avg_speed: 46, risk_score: 0.22 },
  { segment_id: "seg_innov_e", name: "创新路施工拥堵段", from_node: "n_c2", to_node: "n_e2", road_type: "secondary", length_m: 830, lane_count: 3, speed_limit: 50, camera_ids: [], base_risk: 0.38, status: "normal", traffic_flow: 48, avg_speed: 44, risk_score: 0.38 },
  { segment_id: "seg_academy_w", name: "学院路园区入口西段", from_node: "n_w3", to_node: "n_school", road_type: "secondary", length_m: 790, lane_count: 2, speed_limit: 40, camera_ids: ["cam_004"], base_risk: 0.26, status: "normal", traffic_flow: 38, avg_speed: 39, risk_score: 0.26 },
  { segment_id: "seg_academy_e", name: "学院路东段", from_node: "n_school", to_node: "n_e3", road_type: "secondary", length_m: 800, lane_count: 2, speed_limit: 40, camera_ids: [], base_risk: 0.24, status: "normal", traffic_flow: 34, avg_speed: 41, risk_score: 0.24 },
  { segment_id: "seg_data_n", name: "数据南路北段", from_node: "n_north_w", to_node: "n_w1", road_type: "branch", length_m: 420, lane_count: 2, speed_limit: 35, camera_ids: [], base_risk: 0.18, status: "normal", traffic_flow: 24, avg_speed: 32, risk_score: 0.18 },
  { segment_id: "seg_data_s", name: "数据南路南段", from_node: "n_w1", to_node: "n_south_w", road_type: "branch", length_m: 1420, lane_count: 2, speed_limit: 35, camera_ids: [], base_risk: 0.21, status: "normal", traffic_flow: 26, avg_speed: 31, risk_score: 0.21 },
  { segment_id: "seg_cloud_n", name: "云计算路核心北段", from_node: "n_north_c", to_node: "n_c1", road_type: "main", length_m: 430, lane_count: 4, speed_limit: 60, camera_ids: ["cam_005"], base_risk: 0.31, status: "normal", traffic_flow: 54, avg_speed: 51, risk_score: 0.31 },
  { segment_id: "seg_cloud_s", name: "云计算路园区入口段", from_node: "n_c1", to_node: "n_south_c", road_type: "main", length_m: 1460, lane_count: 4, speed_limit: 60, camera_ids: [], base_risk: 0.33, status: "normal", traffic_flow: 58, avg_speed: 49, risk_score: 0.33 },
  { segment_id: "seg_smart_n", name: "智能北街北段", from_node: "n_north_e", to_node: "n_e1", road_type: "branch", length_m: 420, lane_count: 2, speed_limit: 35, camera_ids: [], base_risk: 0.2, status: "normal", traffic_flow: 22, avg_speed: 34, risk_score: 0.2 },
  { segment_id: "seg_smart_s", name: "智能北街南段", from_node: "n_e1", to_node: "n_south_e", road_type: "branch", length_m: 1420, lane_count: 2, speed_limit: 35, camera_ids: [], base_risk: 0.23, status: "normal", traffic_flow: 25, avg_speed: 33, risk_score: 0.23 },
  { segment_id: "seg_gaoxin_1", name: "高新一路事故高发段", from_node: "n_c2", to_node: "n_e1", road_type: "main", length_m: 920, lane_count: 4, speed_limit: 50, camera_ids: ["cam_006"], base_risk: 0.52, status: "normal", traffic_flow: 45, avg_speed: 43, risk_score: 0.52 },
  { segment_id: "seg_gaoxin_2", name: "高新二路联络段", from_node: "n_w2", to_node: "n_c1", road_type: "secondary", length_m: 900, lane_count: 3, speed_limit: 45, camera_ids: [], base_risk: 0.36, status: "normal", traffic_flow: 40, avg_speed: 42, risk_score: 0.36 },
];

export const standardCameraPoints: CameraPoint[] = [
  { camera_id: "cam_001", name: "科技大道西段卡口", segment_id: "seg_tech_w", lng: 116.391, lat: 39.912, x: 230, y: 104, status: "online" },
  { camera_id: "cam_002", name: "核心十字路口鹰眼", segment_id: "seg_tech_e", lng: 116.398, lat: 39.912, x: 440, y: 106, status: "online" },
  { camera_id: "cam_003", name: "创新路西段摄像头", segment_id: "seg_innov_w", lng: 116.391, lat: 39.906, x: 230, y: 244, status: "online" },
  { camera_id: "cam_004", name: "学校入口摄像头", segment_id: "seg_academy_w", lng: 116.394, lat: 39.900, x: 320, y: 384, status: "online" },
  { camera_id: "cam_005", name: "云计算路北段摄像头", segment_id: "seg_cloud_n", lng: 116.396, lat: 39.914, x: 398, y: 76, status: "online" },
  { camera_id: "cam_006", name: "高新一路事故高发点", segment_id: "seg_gaoxin_1", lng: 116.401, lat: 39.909, x: 530, y: 180, status: "online" },
];

export function getNodeById(nodeId: string, nodes = standardRoadNodes) {
  return nodes.find((node) => node.node_id === nodeId);
}
