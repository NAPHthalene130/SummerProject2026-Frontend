import type { RoadSegment, RoadStatus } from "./standardRoadNetwork";
import type { TrafficEvent, WorkOrder } from "../types/business";

export interface RoadSegmentUpdate {
  segment_id: string;
  status?: RoadStatus;
  traffic_flow?: number;
  avg_speed?: number;
  risk_score?: number;
}

export interface ScenarioStep {
  time_sec: number;
  description: string;
  updates: RoadSegmentUpdate[];
  events?: TrafficEvent[];
  workOrders?: WorkOrder[];
}

const accidentEvent: TrafficEvent = {
  event_id: "evt_001",
  segment_id: "seg_gaoxin_1",
  segment_name: "高新一路事故高发段",
  event_type: "accident",
  severity: "high",
  description: "系统检测到高新一路车辆轨迹异常、平均车速骤降，疑似发生追尾事故。",
  detected_by: "YOLO",
  timestamp_sec: 15,
};

const coreRiskEvent: TrafficEvent = {
  event_id: "evt_002",
  segment_id: "seg_tech_e",
  segment_name: "科技大道核心路口东段",
  event_type: "congestion",
  severity: "medium",
  description: "核心路口平均车速下降，科技大道东段进入高风险观察状态。",
  detected_by: "MultimodalAgent",
  timestamp_sec: 10,
};

const workOrder: WorkOrder = {
  work_order_id: "wo_001",
  event_id: "evt_001",
  title: "高新一路事故高发段异常事件处置工单",
  status: "pending",
  priority: "high",
  assignee: "待派发",
  created_at_sec: 15,
};

export const scenarioTimeline: ScenarioStep[] = [
  {
    time_sec: 0,
    description: "所有道路进入监控态势，科技大道车流略高。",
    updates: [
      { segment_id: "seg_tech_w", status: "normal", traffic_flow: 68, avg_speed: 52, risk_score: 0.3 },
      { segment_id: "seg_tech_e", status: "normal", traffic_flow: 70, avg_speed: 50, risk_score: 0.34 },
    ],
  },
  {
    time_sec: 5,
    description: "学院路早高峰车流升高，园区入口进入忙碌状态。",
    updates: [
      { segment_id: "seg_academy_w", status: "busy", traffic_flow: 78, avg_speed: 28, risk_score: 0.48 },
      { segment_id: "seg_academy_e", status: "busy", traffic_flow: 72, avg_speed: 30, risk_score: 0.45 },
    ],
  },
  {
    time_sec: 10,
    description: "科技大道核心路口平均车速下降，触发风险研判。",
    updates: [
      { segment_id: "seg_tech_e", status: "risk", traffic_flow: 94, avg_speed: 18, risk_score: 0.72 },
      { segment_id: "seg_cloud_n", status: "busy", traffic_flow: 76, avg_speed: 32, risk_score: 0.5 },
    ],
    events: [coreRiskEvent],
  },
  {
    time_sec: 15,
    description: "高新一路发生疑似追尾事故，系统生成异常事件与工单。",
    updates: [
      { segment_id: "seg_gaoxin_1", status: "danger", traffic_flow: 112, avg_speed: 7, risk_score: 0.96 },
    ],
    events: [accidentEvent],
    workOrders: [workOrder],
  },
  {
    time_sec: 20,
    description: "事故持续，创新路与智能北街出现连带拥堵。",
    updates: [
      { segment_id: "seg_innov_e", status: "busy", traffic_flow: 88, avg_speed: 24, risk_score: 0.58 },
      { segment_id: "seg_smart_s", status: "busy", traffic_flow: 64, avg_speed: 26, risk_score: 0.52 },
    ],
  },
  {
    time_sec: 25,
    description: "道路管理员接单，处置工单转为处理中。",
    updates: [
      { segment_id: "seg_gaoxin_1", status: "danger", traffic_flow: 98, avg_speed: 10, risk_score: 0.9 },
    ],
    workOrders: [{ ...workOrder, status: "processing", assignee: "路政巡检一组" }],
  },
  {
    time_sec: 30,
    description: "事故初步处理完成，高新一路从严重异常降为高风险。",
    updates: [
      { segment_id: "seg_gaoxin_1", status: "risk", traffic_flow: 70, avg_speed: 24, risk_score: 0.66 },
      { segment_id: "seg_innov_e", status: "busy", traffic_flow: 76, avg_speed: 29, risk_score: 0.5 },
    ],
    workOrders: [{ ...workOrder, status: "processing", assignee: "路政巡检一组" }],
  },
  {
    time_sec: 35,
    description: "道路逐步恢复，事故工单完成归档。",
    updates: [
      { segment_id: "seg_gaoxin_1", status: "normal", traffic_flow: 46, avg_speed: 42, risk_score: 0.38 },
      { segment_id: "seg_tech_e", status: "normal", traffic_flow: 68, avg_speed: 48, risk_score: 0.34 },
      { segment_id: "seg_academy_w", status: "normal", traffic_flow: 44, avg_speed: 38, risk_score: 0.28 },
      { segment_id: "seg_academy_e", status: "normal", traffic_flow: 40, avg_speed: 40, risk_score: 0.25 },
      { segment_id: "seg_innov_e", status: "normal", traffic_flow: 52, avg_speed: 42, risk_score: 0.38 },
      { segment_id: "seg_smart_s", status: "normal", traffic_flow: 28, avg_speed: 33, risk_score: 0.23 },
      { segment_id: "seg_cloud_n", status: "normal", traffic_flow: 54, avg_speed: 51, risk_score: 0.31 },
    ],
    workOrders: [{ ...workOrder, status: "completed", assignee: "路政巡检一组" }],
  },
];

export function applyScenarioSteps(baseSegments: RoadSegment[], stepIndex: number): RoadSegment[] {
  const cloned = baseSegments.map((segment) => ({ ...segment, camera_ids: [...segment.camera_ids] }));
  const byId = new Map(cloned.map((segment) => [segment.segment_id, segment]));
  scenarioTimeline.slice(0, stepIndex + 1).forEach((step) => {
    step.updates.forEach((update) => {
      const segment = byId.get(update.segment_id);
      if (segment) Object.assign(segment, update);
    });
  });
  return cloned;
}

export function getScenarioEvents(stepIndex: number): TrafficEvent[] {
  const events = new Map<string, TrafficEvent>();
  scenarioTimeline.slice(0, stepIndex + 1).forEach((step) => {
    step.events?.forEach((event) => events.set(event.event_id, event));
  });
  return Array.from(events.values()).sort((a, b) => b.timestamp_sec - a.timestamp_sec);
}

export function getScenarioWorkOrders(stepIndex: number): WorkOrder[] {
  const orders = new Map<string, WorkOrder>();
  scenarioTimeline.slice(0, stepIndex + 1).forEach((step) => {
    step.workOrders?.forEach((order) => orders.set(order.work_order_id, order));
  });
  return Array.from(orders.values()).sort((a, b) => b.created_at_sec - a.created_at_sec);
}
