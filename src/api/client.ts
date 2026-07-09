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

export function postLiveOffer(cameraId: string, body: LiveOfferRequest): Promise<LiveOfferResponse> {
  return request<LiveOfferResponse>(`/api/v1/live/${cameraId}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
