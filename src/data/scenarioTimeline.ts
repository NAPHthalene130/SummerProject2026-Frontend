import type { RoadSegment } from "./standardRoadNetwork";
import type { TrafficEvent, WorkOrder } from "../types/business";

export type RoadStatus = "normal" | "busy" | "risk" | "danger";

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

// 【修改点1】：把事故挪到真实的“北四环西路 (海淀桥-中关村一桥)”
const accidentEvent: TrafficEvent = {
  event_id: "evt_001",
  segment_id: "S-09-10", 
  segment_name: "北四环西路 (海淀桥段)",
  event_type: "accident",
  severity: "high",
  description: "北四环西路车辆轨迹异常、平均车速骤降，疑似发生追尾事故。",
  detected_by: "YOLO",
  timestamp_sec: 15,
};

// 【修改点2】：把风险事件挪到真实的“中关村大街”
const coreRiskEvent: TrafficEvent = {
  event_id: "evt_002",
  segment_id: "S-02-06",
  segment_name: "中关村大街 (黄庄段)",
  event_type: "congestion",
  severity: "medium",
  description: "中关村大街平均车速下降，进入高风险观察状态。",
  detected_by: "MultimodalAgent",
  timestamp_sec: 10,
};

const workOrder: WorkOrder = {
  work_order_id: "wo_001",
  event_id: "evt_001",
  title: "北四环西路追尾事故处置",
  status: "pending",
  priority: "high",
  assignee: "",
  created_at_sec: 15,
};

// 【修改点3】：时间轴更新对应的路段ID
export const scenarioTimeline: ScenarioStep[] = [
  {
    time_sec: 0,
    description: "系统初始化，海淀区路网态势平稳",
    updates: [],
  },
  {
    time_sec: 5,
    description: "中关村区域开始拥堵，风险上升",
    updates: [
      { segment_id: "S-09-10", status: "busy", traffic_flow: 380, avg_speed: 35, risk_score: 45 },
      { segment_id: "S-02-06", status: "busy", traffic_flow: 395, avg_speed: 32, risk_score: 52 },
    ],
  },
  {
    time_sec: 10,
    description: "AI 识别到多模态风险事件",
    updates: [
      { segment_id: "S-09-10", status: "risk", traffic_flow: 420, avg_speed: 25, risk_score: 75 },
      { segment_id: "S-02-06", status: "risk", traffic_flow: 440, avg_speed: 20, risk_score: 82 },
    ],
    events: [coreRiskEvent],
    workOrders: [workOrder],
  },
  {
    time_sec: 15,
    description: "发生严重交通事故！已自动派发工单",
    updates: [
      { segment_id: "S-09-10", status: "danger", traffic_flow: 600, avg_speed: 5, risk_score: 98 },
    ],
    events: [accidentEvent],
    workOrders: [{ ...workOrder, status: "processing" }],
  },
  {
    time_sec: 20,
    description: "路政巡检组抵达现场处置中",
    updates: [
      { segment_id: "S-09-10", status: "risk", traffic_flow: 250, avg_speed: 15, risk_score: 65 },
    ],
  },
  {
    time_sec: 25,
    description: "事故处置完毕，交通开始恢复",
    updates: [
      { segment_id: "S-09-10", status: "normal", traffic_flow: 80, avg_speed: 40, risk_score: 25 },
      { segment_id: "S-02-06", status: "normal", traffic_flow: 90, avg_speed: 45, risk_score: 20 },
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
