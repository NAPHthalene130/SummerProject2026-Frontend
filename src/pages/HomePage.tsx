import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import L from "leaflet";
import { eventPosition } from "../demos/shared";
import { useDataMode } from "../context/DataModeContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import { fetchRisks, type RisksResponse } from "../api/client";
import {
  getRiskColor,
  getRiskText,
  getRoadOpacity,
  getRoadTypeText,
  getRoadWidth,
  getTrafficFlowColor,
} from "../utils/riskStyle";
import type { FeatureCollection, LineString } from "geojson";

type MapMode = "risk" | "traffic";

const POLL_INTERVAL_MS = 3000;

const CONTINUOUS_STOPS = [
  { score: 0.0, color: "#2ecc71" },
  { score: 0.5, color: "#f1c40f" },
  { score: 1.0, color: "#e74c3c" },
];

function riskToColor(score: number): string {
  if (score <= 0) return CONTINUOUS_STOPS[0].color;
  if (score >= 1) return CONTINUOUS_STOPS[CONTINUOUS_STOPS.length - 1].color;
  for (let i = 0; i < CONTINUOUS_STOPS.length - 1; i++) {
    const lo = CONTINUOUS_STOPS[i];
    const hi = CONTINUOUS_STOPS[i + 1];
    if (score >= lo.score && score <= hi.score) {
      const t = (score - lo.score) / (hi.score - lo.score);
      return lerpColor(lo.color, hi.color, t);
    }
  }
  return CONTINUOUS_STOPS[0].color;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function gradientGeoJSON(
  nodes: RoadNode[],
  segments: RoadSegment[],
  cameraRisks: Record<string, number>,
): FeatureCollection<LineString> {
  const nodeMap = new Map(nodes.map((n) => [n.node_id, n]));
  const features: FeatureCollection<LineString>["features"] = [];

  const SUB_SEGMENTS = 8;

  for (const seg of segments) {
    const from = nodeMap.get(seg.from_node);
    const to = nodeMap.get(seg.to_node);
    if (!from || !to) continue;

    const path = seg.path && seg.path.length >= 2 ? seg.path : [[from.lng, from.lat], [to.lng, to.lat]];

    const camIds = seg.camera_ids ?? [];
    const startRisk = camIds.length > 0 ? (cameraRisks[camIds[0]] ?? 0.5) : 0.5;
    const endRisk = camIds.length > 1 ? (cameraRisks[camIds[camIds.length - 1]] ?? startRisk) : startRisk;
    const startColor = riskToColor(startRisk);
    const endColor = riskToColor(endRisk);

    if (path.length < 2) continue;

    const totalLen = path.length - 1;
    for (let i = 0; i < SUB_SEGMENTS; i++) {
      const t0 = i / SUB_SEGMENTS;
      const t1 = (i + 1) / SUB_SEGMENTS;

      const idx0 = Math.floor(t0 * totalLen);
      const idx1 = Math.min(Math.ceil(t1 * totalLen), totalLen);

      const subCoords: [number, number][] = [];
      for (let j = idx0; j <= idx1; j++) {
        subCoords.push(path[j] as [number, number]);
      }

      if (subCoords.length < 2) {
        if (idx0 !== idx1) subCoords.push(path[idx1] as [number, number]);
        else continue;
      }

      const midT = (t0 + t1) / 2;
      const color = lerpColor(startColor, endColor, midT);

      features.push({
        type: "Feature",
        properties: {
          segment_id: seg.segment_id,
          name: seg.name,
          road_type: seg.road_type,
          sub_index: i,
          sub_color: color,
        },
        geometry: {
          type: "LineString",
          coordinates: subCoords,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function HomePage() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const [mode, setMode] = useState<MapMode>("risk");
  const [modeOpen, setModeOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [cameraRisks, setCameraRisks] = useState<Record<string, number>>({});

  const nodes = !demoDataEnabled ? scenario.nodes : [];
  const segments = !demoDataEnabled ? scenario.segments : [];
  const cameras = !demoDataEnabled ? scenario.cameras : [];
  const events = !demoDataEnabled ? scenario.events : [];
  const selectedSegment = segments.find((segment) => segment.segment_id === selectedSegmentId) ?? null;
  const recentEvent = events[0];
  const dangerCount = segments.filter((segment) => segment.status === "danger").length;
  const closeModeMenu = useCallback(() => setModeOpen(false), []);

  useEffect(() => {
    if (demoDataEnabled) {
      setSelectedSegmentId(null);
      setModeOpen(false);
    }
  }, [demoDataEnabled]);

  useEffect(() => {
    if (demoDataEnabled) {
      setCameraRisks({});
      return;
    }
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      fetchRisks()
        .then((data) => {
          if (!cancelled) setCameraRisks(data.camera_risks);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) window.setTimeout(poll, POLL_INTERVAL_MS);
        });
    };
    poll();
    return () => { cancelled = true; };
  }, [demoDataEnabled]);

  return (
    <section className="home-command-page">
      <RoadMapView
        mode={mode}
        nodes={nodes}
        segments={segments}
        cameras={cameras}
        cameraRisks={cameraRisks}
        events={events}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={setSelectedSegmentId}
        onBlankClick={closeModeMenu}
      />

      <button
        className={`earth-toolbar-toggle ${controlOpen ? "active" : ""}`}
        onClick={() => setControlOpen((value) => !value)}
        aria-label="展开地图工具"
      >
        ...
      </button>

      {controlOpen ? (
        <div className="home-controls-drawer">
          <MapModeSwitcher
            mode={mode}
            open={modeOpen}
            onToggle={() => setModeOpen((value) => !value)}
            onChange={(nextMode) => {
              setMode(nextMode);
              setModeOpen(false);
            }}
          />

          <MapAssetDock
            mode={mode}
            segments={segments}
            cameras={cameras}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
          />

          <MapLegend mode={mode} />
          <MapEventNotification event={recentEvent} dangerCount={dangerCount} />
        </div>
      ) : null}

      {selectedSegment ? (
        <SelectedRoadPopup
          segment={selectedSegment}
          mode={mode}
          cameras={cameras}
          cameraRisks={cameraRisks}
          recentEvent={events.find((event) => event.segment_id === selectedSegment.segment_id)?.description ?? "暂无"}
          onClose={() => setSelectedSegmentId(null)}
        />
      ) : null}
    </section>
  );
}

function MapAssetDock({
  mode,
  segments,
  cameras,
  selectedSegmentId,
  onSelectSegment,
}: {
  mode: MapMode;
  segments: RoadSegment[];
  cameras: CameraPoint[];
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}) {
  const dangerCount = segments.filter((segment) => segment.status === "danger").length;
  const riskCount = segments.filter((segment) => segment.status === "risk").length;

  return (
    <aside className="map-asset-dock open">
      <div className="dock-summary">
        <span>道路资产</span>
        <strong>{segments.length}</strong>
        <i style={{ background: dangerCount ? "#EA4335" : "#34A853" }} />
      </div>
      <div className="dock-stats">
        <b>{dangerCount}</b><span>严重异常</span>
        <b>{riskCount}</b><span>高风险</span>
        <b>{cameras.length}</b><span>摄像头</span>
      </div>
      <div className="dock-layer-chips">
        <span className="active">RoadLayer</span>
        <span>CameraLayer</span>
        <span>EventLayer</span>
      </div>
      <div className="dock-road-list">
        {segments.slice(0, 8).map((segment) => (
          <button
            key={segment.segment_id}
            className={selectedSegmentId === segment.segment_id ? "active" : ""}
            onClick={() => onSelectSegment(segment.segment_id)}
          >
            <i style={{ background: mode === "risk" ? getRiskColor(segment.status) : getTrafficFlowColor(segment.traffic_flow) }} />
            <span>{segment.name}</span>
            <b>{mode === "risk" ? getRiskText(segment.status) : segment.traffic_flow}</b>
          </button>
        ))}
      </div>
    </aside>
  );
}

function RoadMapView({
  mode,
  nodes,
  segments,
  cameras,
  events,
  cameraRisks,
  selectedSegmentId,
  onSelectSegment,
  onBlankClick,
}: {
  mode: MapMode;
  nodes: RoadNode[];
  segments: RoadSegment[];
  cameras: CameraPoint[];
  events: TrafficEvent[];
  cameraRisks: Record<string, number>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  onBlankClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const roadLayerRef = useRef<L.GeoJSON | null>(null);
  const cameraLayerRef = useRef<L.LayerGroup | null>(null);
  const eventLayerRef = useRef<L.LayerGroup | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = L.map(containerRef.current, { center: [39.906, 116.396], zoom: 15, zoomControl: false });
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);
      map.on("click", onBlankClick);
      mapRef.current = map;
      setMapInstance(map);
    } catch (error) {
      if (errorRef.current) errorRef.current.textContent = `地图初始化失败：${String(error)}`;
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [onBlankClick]);

  return (
    <div className="full-map-shell">
      <div ref={containerRef} className="full-map" />
      <div ref={errorRef} className="map-error" />
      <RoadLayer
        map={mapInstance}
        layerRef={roadLayerRef}
        firstRender={firstRender}
        mode={mode}
        nodes={nodes}
        segments={segments}
        cameraRisks={cameraRisks}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={onSelectSegment}
      />
      <CameraLayer map={mapInstance} layerRef={cameraLayerRef} cameras={cameras} />
      <EventLayer map={mapInstance} layerRef={eventLayerRef} nodes={nodes} segments={segments} events={events} />
    </div>
  );
}

function RoadLayer({
  map,
  layerRef,
  firstRender,
  mode,
  nodes,
  segments,
  cameraRisks,
  selectedSegmentId,
  onSelectSegment,
}: {
  map: L.Map | null;
  layerRef: MutableRefObject<L.LayerGroup | null>;
  firstRender: MutableRefObject<boolean>;
  mode: MapMode;
  nodes: RoadNode[];
  segments: RoadSegment[];
  cameraRisks: Record<string, number>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}) {
  const hasRisks = Object.keys(cameraRisks).length > 0;
  const geojson = useMemo(
    () => hasRisks ? gradientGeoJSON(nodes, segments, cameraRisks) : roadNetworkToGeoJSON(nodes, segments),
    [nodes, segments, hasRisks, cameraRisks],
  );

  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    if (!segments.length) {
      layerRef.current = null;
      return;
    }
    const roadById = new Map(segments.map((segment) => [segment.segment_id, segment]));

    const casingLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const id = String(feature?.properties?.segment_id);
        const isSelected = selectedSegmentId === id;
        return {
          color: "#0a1520",
          weight: isSelected ? 12 : 9,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        };
      },
    });

    const coreLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const id = String(feature?.properties?.segment_id);
        const subColor = feature?.properties?.sub_color as string | undefined;
        if (subColor) {
          const segment = roadById.get(id);
          const baseWidth = segment ? getRoadWidth(segment.road_type) : 5;
          return {
            color: subColor,
            weight: baseWidth + (selectedSegmentId === id ? 2 : -1),
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
            interactive: true,
            className: "modern-road-glow",
          };
        }
        const segment = roadById.get(id);
        const baseWidth = segment ? getRoadWidth(segment.road_type) : 5;
        return {
          color: segment ? getSegmentColor(segment, mode) : "#95a5a6",
          weight: baseWidth + (selectedSegmentId === id ? 2 : -1),
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
          className: "modern-road-glow",
        };
      },
      onEachFeature: (feature, layer) => {
        const segment = roadById.get(String(feature.properties?.segment_id));
        if (!segment) return;

        layer.bindTooltip(segment.name, { sticky: true, direction: "top", className: "modern-tooltip" });

        layer.on("click", (event) => {
          L.DomEvent.stop(event);
          onSelectSegment(segment.segment_id);
        });
        layer.on("mouseover", () => {
          const pathLayer = layer as L.Path;
          pathLayer.bringToFront();
        });
      },
    });

    const group = L.layerGroup([casingLayer, coreLayer]).addTo(map);
    layerRef.current = group;

    if (firstRender.current) {
      const bounds = coreLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.3));
      }
      firstRender.current = false;
    }
  }, [geojson, firstRender, layerRef, map, mode, onSelectSegment, segments, selectedSegmentId]);

  return null;
}

function CameraLayer({
  map,
  layerRef,
  cameras,
}: {
  map: L.Map | null;
  layerRef: MutableRefObject<L.LayerGroup | null>;
  cameras: CameraPoint[];
}) {
  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    const group = L.layerGroup();
    cameras.forEach((camera) => {
      const isOnline = camera.status === "online";
      const marker = L.circleMarker([camera.lat, camera.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: isOnline ? "#26c6ff" : "#95a5a6",
        fillOpacity: 0.95,
      });
      marker.bindTooltip(`摄像头：${camera.name}`);
      marker.addTo(group);
      const el = marker.getElement() as HTMLElement | undefined;
      if (el) el.style.zIndex = "1000";
    });
    group.addTo(map);
    layerRef.current = group;
  }, [cameras, layerRef, map]);

  return null;
}

function EventLayer({
  map,
  layerRef,
  nodes,
  segments,
  events,
}: {
  map: L.Map | null;
  layerRef: MutableRefObject<L.LayerGroup | null>;
  nodes: RoadNode[];
  segments: RoadSegment[];
  events: TrafficEvent[];
}) {
  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    const group = L.layerGroup();
    events.forEach((event) => {
      const pos = eventPosition(nodes, segments, event);
      L.circleMarker([pos.lat, pos.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: "#e74c3c",
        fillOpacity: 1,
        className: "leaflet-event-pulse",
      }).bindTooltip(`${event.segment_name}<br/>${event.description}`).addTo(group);
    });
    group.addTo(map);
    layerRef.current = group;
  }, [events, layerRef, map, nodes, segments]);

  return null;
}

function MapModeSwitcher({
  mode,
  open,
  onToggle,
  onChange,
}: {
  mode: MapMode;
  open: boolean;
  onToggle: () => void;
  onChange: (mode: MapMode) => void;
}) {
  return (
    <div className="map-mode-float">
      <button className="mode-trigger" onClick={onToggle}>模式</button>
      {open ? (
        <div className="mode-popover">
          <button className={mode === "risk" ? "active" : ""} onClick={() => onChange("risk")}>事故风险模式</button>
          <button className={mode === "traffic" ? "active" : ""} onClick={() => onChange("traffic")}>车流密度模式</button>
        </div>
      ) : null}
    </div>
  );
}

function MapLegend({ mode }: { mode: MapMode }) {
  const rows = mode === "risk"
    ? [
        ["#2ecc71", "通行正常"],
        ["#f1c40f", "车流较大"],
        ["#e67e22", "高风险"],
        ["#e74c3c", "事故/严重异常"],
      ]
    : [
        ["#2ecc71", "0-30 车流较小"],
        ["#f1c40f", "31-60 车流中等"],
        ["#e67e22", "61-90 车流较大"],
        ["#e74c3c", "90+ 严重拥堵"],
      ];

  return (
    <div className="map-legend-float">
      <strong>{mode === "risk" ? "事故风险图例" : "车流密度图例"}</strong>
      {rows.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}
      <span><i className="camera-dot" />摄像头</span>
      <span><i className="event-dot" />异常事件</span>
    </div>
  );
}

function MapEventNotification({ event, dangerCount }: { event?: TrafficEvent; dangerCount: number }) {
  return (
    <div className={`event-radar-float ${dangerCount > 0 ? "danger" : ""}`}>
      <b>{event ? "最近异常" : "态势正常"}</b>
      <span>{event ? `${event.segment_name}：${event.description}` : "当前未触发新的异常事件"}</span>
    </div>
  );
}

function SelectedRoadPopup({
  segment,
  mode,
  cameras,
  cameraRisks,
  recentEvent,
  onClose,
}: {
  segment: RoadSegment;
  mode: MapMode;
  cameras: CameraPoint[];
  cameraRisks: Record<string, number>;
  recentEvent: string;
  onClose: () => void;
}) {
  const segCameras = cameras.filter((c) => segment.camera_ids.includes(c.camera_id));
  const segRisks = segCameras.map((c) => cameraRisks[c.camera_id]).filter((r): r is number => r !== undefined);
  const lstmRisk = segRisks.length > 0 ? segRisks.reduce((a, b) => a + b, 0) / segRisks.length : null;

  const riskToText = (score: number) => {
    if (score <= 0.25) return "正常";
    if (score <= 0.5) return "繁忙";
    if (score <= 0.75) return "高风险";
    return "危险";
  };

  return (
    <div className="segment-float">
      <button onClick={onClose}>x</button>
      <small>道路详情</small>
      <h2>{segment.name}</h2>
      <div className="segment-float-grid">
        <span>道路编号</span><b>{segment.segment_id}</b>
        <span>道路类型</span><b>{getRoadTypeText(segment.road_type)}</b>
        <span>当前模式</span><b>{mode === "risk" ? "事故风险" : "车流密度"}</b>
        <span>LSTM 实时风险</span>
        <b style={{ color: lstmRisk !== null ? riskToColor(lstmRisk) : "#95a5a6" }}>
          {lstmRisk !== null ? `${(lstmRisk * 100).toFixed(1)}% (${riskToText(lstmRisk)})` : "等待数据…"}
        </b>
        <span>车流量</span><b>{segment.traffic_flow} 辆/min</b>
        <span>平均车速</span><b>{segment.avg_speed} km/h</b>
        <span>风险等级</span><b>{getRiskText(segment.status)}</b>
        <span>关联摄像头</span><b>{segCameras.length ? segCameras.map((c) => c.name).join("、") : "无"}</b>
      </div>
      {lstmRisk !== null ? (
        <div className="segment-event-line">
          <em>摄像头风险明细</em>
          <p>
            {segRisks.map((r, i) => (
              <span key={i} style={{ marginRight: 8, display: "inline-block" }}>
                {segCameras[i]?.name ?? `C${i}`}: {(r * 100).toFixed(0)}%
              </span>
            ))}
          </p>
        </div>
      ) : null}
      <div className="segment-event-line">
        <em>最近异常</em>
        <p>{recentEvent}</p>
      </div>
    </div>
  );
}

function getSegmentColor(segment: RoadSegment, mode: MapMode) {
  return mode === "risk" ? getRiskColor(segment.status) : getTrafficFlowColor(segment.traffic_flow);
}
