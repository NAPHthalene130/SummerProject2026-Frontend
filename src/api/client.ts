import type { StaffMember } from "../data/mockStaff";
import type { WorkOrderItem } from "../data/mockWorkOrders";

export interface BackendCamera {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

export interface LiveOfferRequest {
  sdp: string;
  type: string;
}

export interface LiveOfferResponse {
  sdp: string;
  type: string;
}

export interface CameraStatsItem {
  camera_id: string;
  total_vehicle_count: number;
}

export interface CameraStatsResponse {
  cameras: CameraStatsItem[];
}

export interface RiskDetail {
  risk_score: number;
  vehicle_count: number;
  max_vehicle_risk: number;
  min_vehicle_risk: number;
}

export interface RisksResponse {
  camera_risks: Record<string, number>;
  detailed: Record<string, RiskDetail>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchCameras(): Promise<BackendCamera[]> {
  return request<BackendCamera[]>("/api/v1/cameras/");
}

export function fetchCameraStats(): Promise<CameraStatsResponse> {
  return request<CameraStatsResponse>("/api/v1/cameras/stats");
}

export function fetchRisks(): Promise<RisksResponse> {
  return request<RisksResponse>("/api/v1/risks/");
}

export function postLiveOffer(cameraId: string, body: LiveOfferRequest): Promise<LiveOfferResponse> {
  return request<LiveOfferResponse>(`/api/v1/live/${cameraId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchWorkOrders(): Promise<WorkOrderItem[]> {
  return request<WorkOrderItem[]>("/api/v1/work-orders/");
}

export function fetchStaff(): Promise<StaffMember[]> {
  return request<StaffMember[]>("/api/v1/staff/");
}

export function dispatchWorkOrder(workOrderId: string, userId: string): Promise<WorkOrderItem> {
  return request<WorkOrderItem>(`/api/v1/work-orders/${encodeURIComponent(workOrderId)}/dispatch`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: Number(userId) }),
  });
}

export function updateWorkOrderStatus(
  workOrderId: string,
  body: {
    status: WorkOrderItem["status"];
    process_message?: string;
    process_image_url?: string;
  },
): Promise<WorkOrderItem> {
  return request<WorkOrderItem>(`/api/v1/work-orders/${encodeURIComponent(workOrderId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
