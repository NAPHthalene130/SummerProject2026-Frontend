import { mockFrontendEvents, mockWorkOrders, type FrontendWorkOrder } from "../data/mockWorkOrders";
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
  status: FrontendWorkOrder["status"],
  workOrders: FrontendWorkOrder[],
) {
  return wait(
    workOrders.map((order) =>
      order.work_order_id === workOrderId
        ? {
            ...order,
            status,
            assignee: status === "pending" ? order.assignee : "路政巡检一组",
            completed_at: status === "completed" ? new Date().toLocaleString("zh-CN", { hour12: false }) : order.completed_at,
            completed_by: status === "completed" ? "路政巡检一组" : order.completed_by,
            feedback_message: status === "completed" ? order.feedback_message ?? "已完成现场处置，交通状态恢复观察中。" : order.feedback_message,
            feedback_images: status === "completed" ? order.feedback_images ?? ["https://placehold.co/300x180?text=Feedback+Image"] : order.feedback_images,
          }
        : order,
    ),
  );
}
