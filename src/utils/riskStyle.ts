import type { RoadSegment, RoadStatus } from "../data/standardRoadNetwork";

export function getRoadColor(status: string): string {
  switch (status) {
    case "normal":
      return "#34A853";
    case "busy":
      return "#FBBC04";
    case "risk":
      return "#FF6D01";
    case "danger":
      return "#EA4335";
    default:
      return "#95a5a6";
  }
}

export function getRiskColor(status: RoadStatus): string {
  return getRoadColor(status);
}

export function getTrafficFlowColor(flow: number): string {
  if (flow <= 200) return "#34A853";
  if (flow <= 400) return "#FBBC04";
  if (flow <= 600) return "#FF6D01";
  return "#EA4335";
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

export function getLevelText(level: "low" | "medium" | "high"): string {
  if (level === "low") return "低等级";
  if (level === "medium") return "中等级";
  return "高等级";
}
