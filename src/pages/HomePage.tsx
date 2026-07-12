import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import L from "leaflet";
import { eventPosition } from "../demos/shared";
import { useDataMode } from "../context/DataModeContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import { fetchRisks } from "../api/client";
import {
  getRiskColor,
  getRiskText,
  getRoadTypeText,
  getRoadWidth,
  getTrafficFlowColor,
} from "../utils/riskStyle";

type MapMode = "realtime" | "traffic" | "prediction";

const POLL_INTERVAL_MS = 3000;
const GRAY = "#7f8c8d";

const STOPS = [
  { s: 0.0, c: "#2ecc71" },
  { s: 0.5, c: "#f1c40f" },
  { s: 1.0, c: "#e74c3c" },
];

function hexLerp(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  return `#${[0, 1, 2].map(i => Math.round(pa[i] + (pb[i] - pa[i]) * t).toString(16).padStart(2, "0")).join("")}`;
}

function riskToColor(score: number): string {
  if (score <= 0) return STOPS[0].c;
  if (score >= 1) return STOPS[STOPS.length - 1].c;
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (score <= STOPS[i + 1].s) {
      const t = (score - STOPS[i].s) / (STOPS[i + 1].s - STOPS[i].s);
      return hexLerp(STOPS[i].c, STOPS[i + 1].c, t);
    }
  }
  return STOPS[0].c;
}

export function HomePage() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const [mode, setMode] = useState<MapMode>("realtime");
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
  const onBlankClick = useCallback(() => {}, []);

  useEffect(() => {
    if (demoDataEnabled) {
      setSelectedSegmentId(null);
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
          if (cancelled) return;
          const raw = data.camera_risks;
          const values = Object.values(raw);
          if (values.length === 0) return;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min || 1;
          const normalized: Record<string, number> = {};
          for (const [id, val] of Object.entries(raw)) {
            normalized[id] = (val - min) / range;
          }
          setCameraRisks(normalized);
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
        onBlankClick={onBlankClick}
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
          <MapAssetDock
            mode={mode}
            onModeChange={setMode}
            segments={segments}
            cameras={cameras}
            cameraRisks={cameraRisks}
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
  onModeChange,
  segments,
  cameras,
  cameraRisks,
  selectedSegmentId,
  onSelectSegment,
}: {
  mode: MapMode;
  onModeChange: (m: MapMode) => void;
  segments: RoadSegment[];
  cameras: CameraPoint[];
  cameraRisks: Record<string, number>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}) {
  const MODE_LABELS: { key: MapMode; label: string }[] = [
    { key: "realtime", label: "实时风险" },
    { key: "traffic", label: "车流密度" },
    { key: "prediction", label: "风险预测" },
  ];

  const sorted = useMemo(() => {
    const arr = [...segments];
    if (mode === "realtime") {
      arr.sort((a, b) => {
        const ra = segAvgRisk(a, cameraRisks);
        const rb = segAvgRisk(b, cameraRisks);
        return rb - ra;
      });
    } else if (mode === "traffic") {
      arr.sort((a, b) => b.traffic_flow - a.traffic_flow);
    } else {
      arr.sort((a, b) => b.risk_score - a.risk_score);
    }
    return arr;
  }, [segments, mode, cameraRisks]);

  const dangerCount = segments.filter((s) => s.status === "danger").length;

  return (
    <aside className="map-asset-dock open">
      <div className="dock-summary">
        <span>道路资产</span>
        <strong>{segments.length}</strong>
        <i style={{ background: dangerCount ? "#EA4335" : "#34A853" }} />
      </div>

      <div className="dock-layer-chips" style={{ display: "flex", gap: 4, padding: "4px 0" }}>
        {MODE_LABELS.map(({ key, label }) => (
          <span
            key={key}
            className={mode === key ? "active" : ""}
            style={{ cursor: "pointer", padding: "4px 10px", borderRadius: 4, fontSize: 12, background: mode === key ? "#26c6ff" : "#1f2a3a", color: mode === key ? "#000" : "#ccc" }}
            onClick={() => onModeChange(key)}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="dock-road-list">
        {sorted.map((segment) => {
          const risk = segAvgRisk(segment, cameraRisks);
          const hasRisk = Object.keys(cameraRisks).length > 0;
          const color = mode === "traffic"
            ? getTrafficFlowColor(segment.traffic_flow)
            : hasRisk ? riskToColor(risk) : getRiskColor(segment.status);
          const label = mode === "traffic"
            ? String(segment.traffic_flow)
            : hasRisk ? `${(risk * 100).toFixed(0)}%` : getRiskText(segment.status);
          return (
            <button
              key={segment.segment_id}
              className={selectedSegmentId === segment.segment_id ? "active" : ""}
              onClick={() => onSelectSegment(segment.segment_id)}
            >
              <i style={{ background: color }} />
              <span>{segment.name}</span>
              <b>{label}</b>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function segAvgRisk(seg: RoadSegment, cameraRisks: Record<string, number>): number {
  const ids = seg.camera_ids ?? [];
  const vals = ids.map((id) => cameraRisks[id]).filter((v): v is number => v !== undefined);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.5;
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
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  const roadColors = useMemo(() => {
    const map = new Map<string, string>();
    if (Object.keys(cameraRisks).length === 0) {
      for (const seg of segments) map.set(seg.segment_id, GRAY);
      return map;
    }
    for (const seg of segments) {
      const camIds = seg.camera_ids ?? [];
      const risks: number[] = [];
      for (const cid of camIds) {
        const r = cameraRisks[cid];
        if (r !== undefined) risks.push(r);
      }
      const avg = risks.length > 0 ? risks.reduce((a, b) => a + b, 0) / risks.length : 0.5;
      map.set(seg.segment_id, riskToColor(avg));
    }
    return map;
  }, [segments, cameraRisks]);

  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    if (!segments.length) {
      layerRef.current = null;
      return;
    }
    const roadById = new Map(segments.map((s) => [s.segment_id, s]));

    const casingLayer = L.geoJSON(geojson, {
      style: (f) => {
        const id = String(f?.properties?.segment_id);
        return {
          color: "#0a1520",
          weight: selectedSegmentId === id ? 12 : 9,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        };
      },
    });

    const coreLayer = L.geoJSON(geojson, {
      style: (f) => {
        const id = String(f?.properties?.segment_id);
        const seg = roadById.get(id);
        const baseWidth = seg ? getRoadWidth(seg.road_type) : 5;
        const color = roadColors.get(id) || GRAY;
        return {
          color,
          weight: baseWidth + (selectedSegmentId === id ? 2 : -1),
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        };
      },
      onEachFeature: (f, layer) => {
        const seg = roadById.get(String(f.properties?.segment_id));
        if (!seg) return;
        layer.bindTooltip(seg.name, { sticky: true, direction: "top", className: "modern-tooltip" });
        layer.on("click", (e) => { L.DomEvent.stop(e); onSelectSegment(seg.segment_id); });
        layer.on("mouseover", () => { (layer as L.Path).bringToFront(); });
      },
    });

    const group = L.layerGroup([casingLayer, coreLayer]).addTo(map);
    layerRef.current = group;

    if (firstRender.current) {
      try {
        const bounds = (coreLayer as any).getBounds();
        if (bounds?.isValid?.()) map.fitBounds(bounds.pad(0.3));
      } catch {}
      firstRender.current = false;
    }
  }, [geojson, roadColors, firstRender, layerRef, map, onSelectSegment, segments, selectedSegmentId]);

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
      const marker = L.marker([camera.lat, camera.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            width:18px;height:18px;
            background:#e74c3c;
            border:2px solid #c0392b;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:1px 1px 3px rgba(0,0,0,0.5);
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 16],
        }),
      });
      marker.bindTooltip(`摄像头：${camera.name}`);
      marker.addTo(group);
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

function MapLegend({ mode }: { mode: MapMode }) {
  const rows = mode === "realtime" || mode === "prediction"
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
      <strong>{mode === "traffic" ? "车流密度图例" : "风险等级图例"}</strong>
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
        <span>当前模式</span><b>{mode === "realtime" ? "实时风险" : mode === "traffic" ? "车流密度" : "风险预测"}</b>
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
