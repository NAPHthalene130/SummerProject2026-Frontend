import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent, WorkOrder } from "../types/business";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function wait<T>(payload: T, delay = 260): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(payload)), delay);
  });
}

export async function fetchRoadSegments(nodes: RoadNode[], segments: RoadSegment[]) {
  return wait({ nodes, segments });
}

export async function fetchCameras(cameras: CameraPoint[]) {
  return wait(cameras);
}

export async function fetchTrafficLive(segments: RoadSegment[]) {
  return wait(segments.map((segment) => ({
    segment_id: segment.segment_id,
    traffic_flow: segment.traffic_flow,
    avg_speed: segment.avg_speed,
    risk_score: segment.risk_score,
    status: segment.status,
  })));
}

export async function fetchEvents(events: TrafficEvent[]) {
  return wait(events);
}

export async function fetchWorkOrders(workOrders: WorkOrder[]) {
  return wait(workOrders);
}
