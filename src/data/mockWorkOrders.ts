import type { TrafficEvent } from "../types/business";

export interface FrontendWorkOrder {
  work_order_id: string;
  event_id: string;
  title: string;
  segment_id: string;
  segment_name: string;
  camera_id: string;
  event_type: "congestion" | "accident" | "violation" | "construction";
  event_level: "low" | "medium" | "high";
  status: "pending" | "processing" | "completed";
  priority: "low" | "medium" | "high";
  description: string;
  ai_suggestion: string;
  scene_images: string[];
  feedback_message?: string;
  feedback_images?: string[];
  assignee: string;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
}

export const mockFrontendEvents: TrafficEvent[] = [
  {
    event_id: "evt_front_001",
    segment_id: "seg_gaoxin_1",
    segment_name: "高新一路事故高发段",
    event_type: "accident",
    severity: "high",
    description: "高新一路检测到疑似追尾事故，车辆排队长度快速增加。",
    detected_by: "YOLO",
    timestamp_sec: 15,
  },
  {
    event_id: "evt_front_002",
    segment_id: "seg_innov_e",
    segment_name: "创新路施工拥堵段",
    event_type: "construction",
    severity: "medium",
    description: "施工围挡造成通行效率下降，建议发布绕行提示。",
    detected_by: "RuleEngine",
    timestamp_sec: 20,
  },
  {
    event_id: "evt_front_003",
    segment_id: "seg_academy_w",
    segment_name: "学院路园区入口西段",
    event_type: "congestion",
    severity: "medium",
    description: "学校入口早高峰车流集中，平均车速下降。",
    detected_by: "MultimodalAgent",
    timestamp_sec: 5,
  },
];

export const mockWorkOrders: FrontendWorkOrder[] = [
  {
    work_order_id: "wo_front_001",
    event_id: "evt_front_001",
    title: "高新一路疑似追尾事故处置",
    segment_id: "seg_gaoxin_1",
    segment_name: "高新一路事故高发段",
    camera_id: "cam_006",
    event_type: "accident",
    event_level: "high",
    status: "pending",
    priority: "high",
    description: "AI 检测到车辆异常停滞，疑似追尾事故，占用主干路右侧车道。",
    ai_suggestion: "建议派发巡检人员到场核查，临时引导车辆从创新路绕行，并同步交管处置。",
    scene_images: ["https://placehold.co/300x180?text=Scene+Image+1"],
    assignee: "待派发",
    created_at: "2026-07-08 09:15:00",
  },
  {
    work_order_id: "wo_front_002",
    event_id: "evt_front_002",
    title: "创新路施工拥堵巡检",
    segment_id: "seg_innov_e",
    segment_name: "创新路施工拥堵段",
    camera_id: "cam_003",
    event_type: "construction",
    event_level: "medium",
    status: "processing",
    priority: "medium",
    description: "施工围挡附近车辆排队明显，通行能力下降。",
    ai_suggestion: "建议核查施工占道范围，补充临时警示牌，并调整高峰期绕行提示。",
    scene_images: ["https://placehold.co/300x180?text=Scene+Image+2"],
    assignee: "路政巡检二组",
    created_at: "2026-07-08 09:22:00",
  },
  {
    work_order_id: "wo_front_003",
    event_id: "evt_front_003",
    title: "学院路园区入口拥堵疏导",
    segment_id: "seg_academy_w",
    segment_name: "学院路园区入口西段",
    camera_id: "cam_004",
    event_type: "congestion",
    event_level: "medium",
    status: "pending",
    priority: "medium",
    description: "园区入口车辆集中进入，短时拥堵并影响学院路通行。",
    ai_suggestion: "建议安排保安或巡检人员进行入口分流，优化临停区域。",
    scene_images: ["https://placehold.co/300x180?text=Scene+Image+3"],
    assignee: "待派发",
    created_at: "2026-07-08 09:30:00",
  },
  {
    work_order_id: "wo_front_004",
    event_id: "evt_front_004",
    title: "科技大道核心路口违停处理",
    segment_id: "seg_tech_e",
    segment_name: "科技大道核心路口东段",
    camera_id: "cam_002",
    event_type: "violation",
    event_level: "low",
    status: "completed",
    priority: "low",
    description: "核心路口附近检测到短时违停，影响右转车辆通行。",
    ai_suggestion: "建议巡检提醒驶离，并纳入重点观察点。",
    scene_images: ["https://placehold.co/300x180?text=Scene+Image+4"],
    feedback_message: "现场已完成劝离，路口通行恢复正常。",
    feedback_images: ["https://placehold.co/300x180?text=Feedback+Image+1"],
    assignee: "路政巡检一组",
    created_at: "2026-07-08 08:40:00",
    completed_at: "2026-07-08 08:58:00",
    completed_by: "张巡检",
  },
  {
    work_order_id: "wo_front_005",
    event_id: "evt_front_005",
    title: "数据南路井盖异常复核",
    segment_id: "seg_data_s",
    segment_name: "数据南路南段",
    camera_id: "cam_001",
    event_type: "violation",
    event_level: "low",
    status: "completed",
    priority: "low",
    description: "巡检图像提示井盖疑似偏移，需现场复核。",
    ai_suggestion: "建议复核井盖状态，如存在松动及时安排市政维修。",
    scene_images: ["https://placehold.co/300x180?text=Scene+Image+5"],
    feedback_message: "现场复核为误报，井盖状态正常。",
    feedback_images: ["https://placehold.co/300x180?text=Feedback+Image+2"],
    assignee: "路政巡检三组",
    created_at: "2026-07-08 08:10:00",
    completed_at: "2026-07-08 08:35:00",
    completed_by: "李巡检",
  },
];
