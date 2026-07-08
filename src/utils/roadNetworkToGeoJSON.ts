import type { FeatureCollection, LineString } from "geojson";
import type { RoadNode, RoadSegment } from "../data/standardRoadNetwork";

export function roadNetworkToGeoJSON(
  nodes: RoadNode[],
  segments: RoadSegment[],
): FeatureCollection<LineString> {
  const nodeMap = new Map(nodes.map((node) => [node.node_id, node]));

  return {
    type: "FeatureCollection",
    features: segments.flatMap((segment) => {
      const from = nodeMap.get(segment.from_node);
      const to = nodeMap.get(segment.to_node);
      if (!from || !to) return [];

      return [{
        type: "Feature" as const,
        properties: {
          segment_id: segment.segment_id,
          name: segment.name,
          road_type: segment.road_type,
          length_m: segment.length_m,
          lane_count: segment.lane_count,
          speed_limit: segment.speed_limit,
          traffic_flow: segment.traffic_flow,
          avg_speed: segment.avg_speed,
          risk_score: segment.risk_score,
          status: segment.status,
          camera_ids: segment.camera_ids,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ],
        },
      }];
    }),
  };
}
