import { useEffect, useMemo, useRef } from "react";
import maplibregl, { GeoJSONSource, Map } from "maplibre-gl";
import type { VisualDemoProps } from "../types";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import { eventPosition, formatSegmentPopup, recordRenderMetrics } from "./shared";

export function MapLibreGeoJsonDemo({
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
  const mapRef = useRef<Map | null>(null);
  const loadedRef = useRef(false);
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  useEffect(() => {
    const start = performance.now();
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [116.396, 39.906],
      zoom: 14.6,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "OpenStreetMap",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      loadedRef.current = true;
      map.addSource("roads", { type: "geojson", data: geojson });
      map.addSource("cameras", { type: "geojson", data: cameraGeoJSON(cameras) });
      map.addSource("events", { type: "geojson", data: eventGeoJSON(nodes, segments, events) });
      map.addLayer({
        id: "roads-line",
        type: "line",
        source: "roads",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": ["match", ["get", "road_type"], "main", 8, "secondary", 6, "branch", 4, 5],
          "line-opacity": ["match", ["get", "status"], "normal", 0.75, "busy", 0.85, "risk", 0.95, "danger", 1, 0.75],
          "line-color": ["match", ["get", "status"], "normal", "#2ecc71", "busy", "#f1c40f", "risk", "#e67e22", "danger", "#e74c3c", "#95a5a6"],
        },
      });
      map.addLayer({
        id: "road-labels",
        type: "symbol",
        source: "roads",
        layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-size": 12 },
        paint: { "text-color": "#0a1a28", "text-halo-color": "#ffffff", "text-halo-width": 1.2 },
      });
      map.addLayer({
        id: "camera-points",
        type: "circle",
        source: "cameras",
        paint: { "circle-radius": 6, "circle-color": "#21d4fd", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
      });
      map.addLayer({
        id: "event-points",
        type: "circle",
        source: "events",
        paint: { "circle-radius": 9, "circle-color": "#e74c3c", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
      });
      recordRenderMetrics(start, (renderMs) => onMetricsChange({ render_time_ms: renderMs }));
    });

    map.on("click", "roads-line", (event) => {
      const id = String(event.features?.[0]?.properties?.segment_id ?? "");
      const segment = segments.find((item) => item.segment_id === id);
      if (!segment) return;
      onSelectSegment(segment.segment_id);
      new maplibregl.Popup().setLngLat(event.lngLat).setHTML(formatSegmentPopup(segment, cameras)).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cameras, events, geojson, nodes, onMetricsChange, onSelectSegment, segments]);

  useEffect(() => {
    const start = performance.now();
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    (map.getSource("roads") as GeoJSONSource | undefined)?.setData(geojson);
    (map.getSource("cameras") as GeoJSONSource | undefined)?.setData(cameraGeoJSON(cameras));
    (map.getSource("events") as GeoJSONSource | undefined)?.setData(eventGeoJSON(nodes, segments, events));
    onMetricsChange({ update_time_ms: performance.now() - start });
  }, [geojson, cameras, events, nodes, segments, onMetricsChange]);

  return (
    <div className="demo-shell">
      <div className="scenario-badge">
        <b>{currentTimeSec}s</b>
        <span>{currentDescription}</span>
      </div>
      <div ref={containerRef} className="map-container" />
      <div className="map-legend floating">
        <b>统一图例</b>
        <span><i style={{ background: "#2ecc71" }} />通行正常</span>
        <span><i style={{ background: "#f1c40f" }} />车流较大</span>
        <span><i style={{ background: "#e67e22" }} />高风险</span>
        <span><i style={{ background: "#e74c3c" }} />事故异常</span>
        <span>蓝点摄像头 · 红点事件</span>
      </div>
    </div>
  );
}

function cameraGeoJSON(cameras: VisualDemoProps["cameras"]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cameras.map((camera) => ({
      type: "Feature",
      properties: camera,
      geometry: { type: "Point", coordinates: [camera.lng, camera.lat] },
    })),
  };
}

function eventGeoJSON(nodes: VisualDemoProps["nodes"], segments: VisualDemoProps["segments"], events: VisualDemoProps["events"]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map((event) => {
      const pos = eventPosition(nodes, segments, event);
      return {
        type: "Feature",
        properties: event,
        geometry: { type: "Point", coordinates: [pos.lng, pos.lat] },
      };
    }),
  };
}
