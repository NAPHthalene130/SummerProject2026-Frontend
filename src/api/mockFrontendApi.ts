import { mockFrontendEvents, mockWorkOrders, type WorkOrderItem } from "../data/mockWorkOrders";
import { standardCameraPoints, standardRoadNodes, standardRoadSegments } from "../data/standardRoadNetwork";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function wait<T>(payload: T, delay = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay);
  });
}

// Later replace with:
// GET /api/v1/segments
// GET /api/v1/traffic/live
// WebSocket /ws/v1/traffic/live
export async function fetchHomeRoadData() {
  return wait({
    nodes: standardRoadNodes,
    segments: standardRoadSegments,
    cameras: standardCameraPoints,
    events: mockFrontendEvents,
  });
}

// Later replace with: GET /api/v1/cameras
export async function fetchCameraList() {
  return wait(standardCameraPoints);
}

// Later replace with: GET /api/v1/traffic/live
export async function fetchMonitorStats() {
  const onlineCameras = standardCameraPoints.filter((camera) => camera.status === "online").length;
  const linkedSegments = standardCameraPoints
    .map((camera) => standardRoadSegments.find((segment) => segment.segment_id === camera.segment_id))
    .filter(Boolean);

  return wait({
    onlineCameras,
    offlineCameras: standardCameraPoints.length - onlineCameras,
    highRiskMonitors: linkedSegments.filter((segment) => segment?.status === "risk" || segment?.status === "danger").length,
    avgFlow: linkedSegments.reduce((sum, segment) => sum + (segment?.traffic_flow ?? 0), 0) / linkedSegments.length,
    avgSpeed: linkedSegments.reduce((sum, segment) => sum + (segment?.avg_speed ?? 0), 0) / linkedSegments.length,
  });
}

// Later replace with: GET /api/v1/work-orders
export async function fetchWorkOrders() {
  return wait(mockWorkOrders);
}

// Later replace with: PUT /api/v1/work-orders/{order_id}/feedback
export async function updateWorkOrderStatus(
  workOrderId: string,
  status: WorkOrderItem["status"],
  workOrders: WorkOrderItem[],
  assignee?: string,
) {
  return wait(
    workOrders.map((order) =>
      order.work_order_id === workOrderId
        ? {
            ...order,
            status,
            assignee: assignee ?? order.assignee,
            completed_at: status === "completed" || status === "false_alarm"
              ? new Date().toLocaleString("zh-CN", { hour12: false })
              : order.completed_at,
            process_message: status === "completed"
              ? order.process_message ?? "现场处置完成，道路状态恢复观察中。"
              : status === "false_alarm"
                ? order.process_message ?? "经人工复核，该事件为误报，已关闭。"
                : order.process_message,
            process_images: status === "completed" || status === "false_alarm"
              ? order.process_images ?? ["https://placehold.co/640x360/263d32/f4f8ff?text=Process+Image"]
              : order.process_images,
          }
        : order,
    ),
  );
}
