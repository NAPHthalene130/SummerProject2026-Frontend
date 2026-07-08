import type { RoadSegment, RoadStatus } from "../data/standardRoadNetwork";

export function getRoadColor(status: string): string {
  switch (status) {
    case "normal":
      return "#2ecc71";
    case "busy":
      return "#f1c40f";
    case "risk":
      return "#e67e22";
    case "danger":
      return "#e74c3c";
    default:
      return "#95a5a6";
  }
}

export function getRiskColor(status: RoadStatus): string {
  return getRoadColor(status);
}

export function getTrafficFlowColor(flow: number): string {
  if (flow <= 30) return "#2ecc71";
  if (flow <= 60) return "#f1c40f";
  if (flow <= 90) return "#e67e22";
  return "#e74c3c";
}

export function getRiskText(status: string): string {
  switch (status) {
    case "normal":
      return "通行正常";
    case "busy":
      return "车流较大";
    case "risk":
      return "高风险";
    case "danger":
      return "事故/严重异常";
    default:
      return "未知状态";
  }
}

export function getRoadWidth(roadType: RoadSegment["road_type"]): number {
  switch (roadType) {
    case "main":
      return 8;
    case "secondary":
      return 6;
    case "branch":
      return 4;
    default:
      return 5;
  }
}

export function getRoadOpacity(status: RoadStatus): number {
  switch (status) {
    case "normal":
      return 0.75;
    case "busy":
      return 0.85;
    case "risk":
      return 0.95;
    case "danger":
      return 1;
    default:
      return 0.75;
  }
}

export function getRoadTypeText(roadType: RoadSegment["road_type"]): string {
  switch (roadType) {
    case "main":
      return "主干路";
    case "secondary":
      return "次干路";
    case "branch":
      return "支路";
    default:
      return "未知道路";
  }
}
