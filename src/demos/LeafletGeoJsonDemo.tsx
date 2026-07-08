import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type { VisualDemoProps } from "../types";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import { getRiskText, getRoadColor, getRoadOpacity, getRoadWidth } from "../utils/riskStyle";
import { eventPosition, formatSegmentPopup, recordRenderMetrics } from "./shared";

export function LeafletGeoJsonDemo({
  nodes,
  segments,
  cameras,
  events,
  currentTimeSec,
  currentDescription,
  onSelectSegment,
  onMetricsChange,
}: VisualDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const roadLayerRef = useRef<L.GeoJSON | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const firstRender = useRef(true);
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  useEffect(() => {
    const start = performance.now();
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [39.906, 116.396], zoom: 15 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const legend = new L.Control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "map-legend");
      div.innerHTML = `
        <b>统一图例</b>
        <span><i style="background:#2ecc71"></i>通行正常</span>
        <span><i style="background:#f1c40f"></i>车流较大</span>
        <span><i style="background:#e67e22"></i>高风险</span>
        <span><i style="background:#e74c3c"></i>事故/严重异常</span>
        <span>📷 摄像头 · ⚠ 异常事件</span>
      `;
      return div;
    };
    legend.addTo(map);
    mapRef.current = map;
    recordRenderMetrics(start, (renderMs) => onMetricsChange({ render_time_ms: renderMs }));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMetricsChange]);

  useEffect(() => {
    const start = performance.now();
    const map = mapRef.current;
    if (!map) return;

    roadLayerRef.current?.removeFrom(map);
    markerLayerRef.current?.removeFrom(map);

    const roadById = new Map(segments.map((segment) => [segment.segment_id, segment]));
    const roadLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const segment = roadById.get(String(feature?.properties?.segment_id));
        return {
          color: getRoadColor(String(feature?.properties?.status)),
          weight: segment ? getRoadWidth(segment.road_type) : 6,
          opacity: segment ? getRoadOpacity(segment.status) : 0.8,
        };
      },
      onEachFeature: (feature, layer) => {
        const segment = roadById.get(String(feature.properties?.segment_id));
        if (!segment) return;
        layer.bindPopup(formatSegmentPopup(segment, cameras));
        layer.on("click", () => onSelectSegment(segment.segment_id));
      },
    }).addTo(map);

    const markerLayer = L.layerGroup();
    cameras.forEach((camera) => {
      L.circleMarker([camera.lat, camera.lng], {
        radius: 6,
        color: "#7ddfff",
        weight: 2,
        fillColor: camera.status === "online" ? "#21d4fd" : "#95a5a6",
        fillOpacity: 0.9,
      }).bindTooltip(`📷 ${camera.name}`).addTo(markerLayer);
    });
    events.forEach((event) => {
      const pos = eventPosition(nodes, segments, event);
      L.circleMarker([pos.lat, pos.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#e74c3c",
        fillOpacity: 1,
      }).bindTooltip(`⚠ ${event.segment_name}<br/>${event.description}`).addTo(markerLayer);
    });
    markerLayer.addTo(map);

    roadLayerRef.current = roadLayer;
    markerLayerRef.current = markerLayer;
    if (firstRender.current) {
      map.fitBounds(roadLayer.getBounds(), { padding: [28, 28] });
      firstRender.current = false;
    }
    onMetricsChange({ update_time_ms: performance.now() - start });
  }, [geojson, segments, cameras, events, nodes, onSelectSegment, onMetricsChange]);

  return (
    <div className="demo-shell">
      <div className="scenario-badge">
        <b>{currentTimeSec}s</b>
        <span>{currentDescription}</span>
      </div>
      <div ref={containerRef} className="map-container" />
    </div>
  );
}
