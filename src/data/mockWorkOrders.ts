import type { TrafficEvent } from "../types/business";

export interface WorkOrderItem {
  work_order_id: string;
  event_id: string;
  camera_id: string;
  camera_name: string;
  segment_id: string;
  segment_name: string;
  monitor_address: string;
  accident_info: string;
  event_time: string;
  event_level: "low" | "medium" | "high";
  status: "unassigned" | "pending" | "processing" | "completed" | "false_alarm";
  assignee?: string;
  description: string;
  ai_suggestion: string;
  scene_images: string[];
  scene_info: string;
  process_message?: string;
  process_images?: string[];
  completed_at?: string;
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

export const mockWorkOrders: WorkOrderItem[] = [
  {
    work_order_id: "WO-20260709-001",
    event_id: "evt_front_001",
    camera_id: "cam_006",
    camera_name: "高新一路事故高发点",
    segment_id: "seg_gaoxin_1",
    segment_name: "高新一路事故高发段",
    monitor_address: "科技园区东侧高新一路与创新路交会区域",
    accident_info: "疑似追尾事故，占用主干路右侧车道",
    event_time: "2026-07-09 09:15:00",
    event_level: "high",
    status: "unassigned",
    description: "AI 检测到车辆异常停滞，后方车流排队长度快速增加。",
    ai_suggestion: "建议优先确认现场人员安全，临时封控右侧车道，并联动交警与清障车辆。",
    scene_images: ["https://placehold.co/640x360/172033/f4f8ff?text=Gaoxin+Accident"],
    scene_info: "画面显示 2 辆小客车低速接触，后方车辆出现连续变道。",
  },
  {
    work_order_id: "WO-20260709-002",
    event_id: "evt_front_002",
    camera_id: "cam_003",
    camera_name: "创新路西段摄像头",
    segment_id: "seg_innov_e",
    segment_name: "创新路施工拥堵段",
    monitor_address: "创新路东段施工围挡区域",
    accident_info: "施工占道导致拥堵",
    event_time: "2026-07-09 09:22:00",
    event_level: "medium",
    status: "pending",
    assignee: "人员B",
    description: "施工围挡附近车辆排队明显，通行效率下降。",
    ai_suggestion: "建议核查施工占道范围，补充临时警示牌，调整高峰绕行提示。",
    scene_images: ["https://placehold.co/640x360/2c2f39/f4f8ff?text=Construction+Queue"],
    scene_info: "施工区外侧车道通行能力下降，排队影响创新路东向西车流。",
  },
  {
    work_order_id: "WO-20260709-003",
    event_id: "evt_front_003",
    camera_id: "cam_004",
    camera_name: "学校入口摄像头",
    segment_id: "seg_academy_w",
    segment_name: "学院路园区入口西段",
    monitor_address: "学院路学校/园区入口",
    accident_info: "早高峰入口拥堵",
    event_time: "2026-07-09 09:30:00",
    event_level: "medium",
    status: "processing",
    assignee: "人员C",
    description: "园区入口车辆集中进入，短时拥堵并影响学院路通行。",
    ai_suggestion: "建议安排现场疏导，开放临停区，并优化入口排队动线。",
    scene_images: ["https://placehold.co/640x360/1b3044/f4f8ff?text=Campus+Entrance"],
    scene_info: "入口等待车辆约 18 辆，非机动车与机动车有短时交织。",
  },
  {
    work_order_id: "WO-20260709-004",
    event_id: "evt_front_004",
    camera_id: "cam_002",
    camera_name: "核心十字路口鹰眼",
    segment_id: "seg_tech_e",
    segment_name: "科技大道核心路口东段",
    monitor_address: "科技大道核心十字路口",
    accident_info: "短时违停影响右转车道",
    event_time: "2026-07-09 08:40:00",
    event_level: "low",
    status: "completed",
    assignee: "人员A",
    description: "核心路口附近检测到短时违停，影响右转车辆通行。",
    ai_suggestion: "建议巡检提醒驶离，并纳入重点观察点。",
    scene_images: ["https://placehold.co/640x360/14263a/f4f8ff?text=Illegal+Parking"],
    scene_info: "违停车辆停靠约 4 分钟，未造成持续拥堵。",
    process_message: "现场已完成劝离，路口通行恢复正常。",
    process_images: ["https://placehold.co/640x360/123826/f4f8ff?text=Feedback+Resolved"],
    completed_at: "2026-07-09 08:58:00",
  },
  {
    work_order_id: "WO-20260709-005",
    event_id: "evt_front_005",
    camera_id: "cam_001",
    camera_name: "科技大道西段卡口",
    segment_id: "seg_data_s",
    segment_name: "数据南路南段",
    monitor_address: "数据南路南段市政井盖点位",
    accident_info: "井盖疑似偏移",
    event_time: "2026-07-09 08:10:00",
    event_level: "low",
    status: "completed",
    assignee: "人员D",
    description: "巡检图像提示井盖疑似偏移，需现场复核。",
    ai_suggestion: "建议复核井盖状态，如存在松动及时安排市政维修。",
    scene_images: ["https://placehold.co/640x360/253142/f4f8ff?text=Manhole+Check"],
    scene_info: "疑似偏移区域位于慢行车道边缘。",
    process_message: "现场复核为误报，井盖状态正常。",
    process_images: ["https://placehold.co/640x360/263d32/f4f8ff?text=Feedback+Checked"],
    completed_at: "2026-07-09 08:35:00",
  },
  {
    work_order_id: "WO-20260709-006",
    event_id: "evt_front_006",
    camera_id: "cam_005",
    camera_name: "云计算路北段摄像头",
    segment_id: "seg_cloud_n",
    segment_name: "云计算路核心北段",
    monitor_address: "云计算路北段公交港湾附近",
    accident_info: "AI 误报行人闯入机动车道",
    event_time: "2026-07-09 07:52:00",
    event_level: "low",
    status: "false_alarm",
    assignee: "人员A",
    description: "模型将路侧工作人员误判为行人闯入机动车道。",
    ai_suggestion: "建议将该样本加入误报样本库，优化施工人员识别标签。",
    scene_images: ["https://placehold.co/640x360/202b3b/f4f8ff?text=False+Alarm"],
    scene_info: "现场为路侧保洁人员在隔离区域作业。",
    process_message: "确认误报，已关闭并加入样本复盘。",
    process_images: ["https://placehold.co/640x360/343434/f4f8ff?text=False+Alarm+Closed"],
    completed_at: "2026-07-09 08:05:00",
  },
];
