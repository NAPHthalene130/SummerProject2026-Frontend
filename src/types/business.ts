export interface TrafficEvent {
  event_id: string;
  segment_id: string;
  segment_name: string;
  event_type: "congestion" | "accident" | "violation" | "construction";
  severity: "low" | "medium" | "high";
  description: string;
  detected_by: "YOLO" | "MultimodalAgent" | "RuleEngine";
  timestamp_sec: number;
}

export interface WorkOrder {
  work_order_id: string;
  event_id: string;
  title: string;
  status: "pending" | "processing" | "completed";
  priority: "low" | "medium" | "high";
  assignee: string;
  created_at_sec: number;
}
