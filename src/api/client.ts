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

export function postLiveOffer(cameraId: string, body: LiveOfferRequest): Promise<LiveOfferResponse> {
  return request<LiveOfferResponse>(`/api/v1/live/${cameraId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
