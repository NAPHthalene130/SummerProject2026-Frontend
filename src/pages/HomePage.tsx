import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import L from "leaflet";
import { eventPosition } from "../demos/shared";
import { useDataMode } from "../context/DataModeContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import {
  fetchRisks,
  fetchRoadRiskPredictions,
  fetchUnprocessedWorkOrders,
  fetchWorkOrderDetail,
  type RoadRiskPrediction,
  type RoadRiskPredictionInput,
  type RoadRiskPredictionResponse,
  type CameraUnprocessedEvents,
} from "../api/client";
import type { WorkOrderItem } from "../data/mockWorkOrders";
import {
  getRiskColor,
  getRiskText,
  getRoadTypeText,
  getRoadWidth,
  getTrafficFlowColor,
} from "../utils/riskStyle";

type MapMode = "realtime" | "traffic" | "prediction";

const POLL_INTERVAL_MS = 3000;
const PREDICTION_REFRESH_INTERVAL_MS = 15 * 60_000;
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

function predictionRiskColor(score: number): string {
  if (score < 0.3) {
    const t = Math.max(0, score) / 0.3;
    return hexLerp("#16a765", "#7fcf3a", t);
  }
  if (score < 0.5) {
    const t = Math.sqrt((score - 0.3) / 0.2);
    return hexLerp("#d6d22a", "#f1c40f", t);
  }
  const t = Math.min(1, (score - 0.5) / 0.5);
  return hexLerp("#f1c40f", "#e74c3c", t);
}

export function HomePage() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const [mode, setMode] = useState<MapMode>("realtime");
  const [controlOpen, setControlOpen] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [cameraRisks, setCameraRisks] = useState<Record<string, number>>({});
  const [rawCameraRisks, setRawCameraRisks] = useState<Record<string, number>>({});
  const [predictionData, setPredictionData] = useState<RoadRiskPredictionResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [roadTraffic, setRoadTraffic] = useState<Record<string, {total_vehicle_count: number; avg_speed: number; entry_count: number; exit_count: number; flow_per_min: number}>>({});
  const selectedSegmentIdRef = useRef<string | null>(null);

  const [cameraWorkOrders, setCameraWorkOrders] = useState<CameraUnprocessedEvents[]>([]);
  const [newEventCameras, setNewEventCameras] = useState<Set<string>>(new Set());
  const [selectedPopupCamera, setSelectedPopupCamera] = useState<string | null>(null);
  const [selectedPopupEvent, setSelectedPopupEvent] = useState<WorkOrderItem | null>(null);
  const [eventDetailLoading, setEventDetailLoading] = useState(false);
  const newEventTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prevWorkOrderIdsRef = useRef<Set<string>>(new Set());

  const toCanonicalCameraId = useCallback((id: string): string => {
    const m = id.replace(/_/g, "-").match(/(?:C|cam-?)0*(\d+)$/i);
    return m ? `C${String(Number(m[1])).padStart(2, "0")}` : id;
  }, []);

  const nodes = !demoDataEnabled ? scenario.nodes : [];
  const rawSegments = !demoDataEnabled ? scenario.segments : [];
  const segments = useMemo(() => rawSegments.map(seg => {
    const camIds = (seg.camera_ids || []).map(normalizeCameraId);
    const segData = camIds.map(id => roadTraffic[id] || {}).filter((t: any) => t.total_vehicle_count !== undefined);
    if (segData.length === 0) return seg;
    return {
      ...seg,
      traffic_flow: Math.round(segData.reduce((s: number, t: any) => s + (t.flow_per_min || 0), 0)),
      avg_speed: Math.round(segData.reduce((s: number, t: any) => s + (t.avg_speed || 0), 0) / segData.length),
    };
  }), [rawSegments, roadTraffic]);
  const cameras = !demoDataEnabled ? scenario.cameras : [];
  const events = !demoDataEnabled ? scenario.events : [];
  const selectedSegment = segments.find((segment) => segment.segment_id === selectedSegmentId) ?? null;
  const recentEvent = events[0];
  const dangerCount = segments.filter((segment) => segment.status === "danger").length;
  const onBlankClick = useCallback(() => {}, []);
  const predictionRisks = useMemo(
    () => Object.fromEntries((predictionData?.predictions ?? []).map((item) => [item.segment_id, item.risk_score])),
    [predictionData],
  );
  const selectedPrediction = predictionData?.predictions.find((item) => item.segment_id === selectedSegmentId) ?? null;

  useEffect(() => {
    if (demoDataEnabled) {
      setSelectedSegmentId(null);
    }
  }, [demoDataEnabled]);

  useEffect(() => {
    selectedSegmentIdRef.current = selectedSegmentId;
  }, [selectedSegmentId]);

  useEffect(() => {
    if (demoDataEnabled || mode !== "prediction" || rawSegments.length === 0) return;
    let cancelled = false;
    let timeoutId: number | null = null;

    const inputs: RoadRiskPredictionInput[] = rawSegments.map((segment) => {
      const point = segmentMidpoint(segment, nodes);
      return {
        segment_id: segment.segment_id,
        name: segment.name,
        latitude: point.lat,
        longitude: point.lng,
        road_type: segment.road_type,
        lane_count: segment.lane_count,
        speed_limit: segment.speed_limit,
        camera_ids: segment.camera_ids,
        traffic_flow: segment.traffic_flow,
        avg_speed: segment.avg_speed,
      };
    });

    const poll = () => {
      setPredictionLoading(true);
      setPredictionError(null);
      fetchRoadRiskPredictions(inputs, selectedSegmentIdRef.current)
        .then((data) => {
          if (!cancelled) setPredictionData(data);
        })
        .catch((error: unknown) => {
          if (!cancelled) setPredictionError(error instanceof Error ? error.message : "风险预测请求失败");
        })
        .finally(() => {
          if (cancelled) return;
          setPredictionLoading(false);
          timeoutId = window.setTimeout(poll, PREDICTION_REFRESH_INTERVAL_MS);
        });
    };
    poll();
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [demoDataEnabled, mode]);

  useEffect(() => {
    if (demoDataEnabled) {
      setCameraRisks({});
      setRawCameraRisks({});
      return;
    }
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      fetchRisks()
        .then((data) => {
          if (cancelled) return;
          const raw = data.camera_risks;
          setRawCameraRisks(raw);
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

  useEffect(() => {
    if (demoDataEnabled) return;
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      fetch("/api/v1/roads/traffic").then(r => r.json()).then(d => { if (!cancelled) setRoadTraffic(d.cameras || {}); }).catch(() => {});
      setTimeout(poll, 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [demoDataEnabled]);

  useEffect(() => {
    if (demoDataEnabled) return;
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      fetchUnprocessedWorkOrders()
        .then((data) => {
          if (cancelled) return;
          setCameraWorkOrders(data.cameras);
          const currentIds = new Set<string>();
          for (const cam of data.cameras) {
            for (const e of cam.events) {
              currentIds.add(e.work_order_id);
            }
          }
          const prevIds = prevWorkOrderIdsRef.current;
          const newIds = new Set([...currentIds].filter((id) => !prevIds.has(id)));
          prevWorkOrderIdsRef.current = currentIds;
          if (newIds.size === 0) return;
          const triggeredCameras = new Set<string>();
          for (const cam of data.cameras) {
            for (const e of cam.events) {
              if (newIds.has(e.work_order_id)) {
                triggeredCameras.add(cam.camera_id);
              }
            }
          }
          setNewEventCameras((prev) => {
            const next = new Set(prev);
            for (const cid of triggeredCameras) next.add(toCanonicalCameraId(cid));
            return next;
          });
          for (const cid of triggeredCameras) {
            const normalized = toCanonicalCameraId(cid);
            const existing = newEventTimersRef.current.get(normalized);
            if (existing) clearTimeout(existing);
            const timer = setTimeout(() => {
              setNewEventCameras((prev) => {
                const next = new Set(prev);
                next.delete(normalized);
                return next;
              });
              newEventTimersRef.current.delete(normalized);
            }, 30_000);
            newEventTimersRef.current.set(normalized, timer);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) window.setTimeout(poll, POLL_INTERVAL_MS);
        });
    };
    poll();
    return () => {
      cancelled = true;
      for (const t of newEventTimersRef.current.values()) clearTimeout(t);
      newEventTimersRef.current.clear();
    };
  }, [demoDataEnabled]);

  return (
    <section className="home-command-page">
      <RoadMapView
        mode={mode}
        nodes={nodes}
        segments={segments}
        cameras={cameras}
        cameraRisks={cameraRisks}
        predictionRisks={predictionRisks}
        events={events}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={setSelectedSegmentId}
        onBlankClick={onBlankClick}
        newEventCameras={newEventCameras}
        onCameraClick={(cid) => setSelectedPopupCamera(cid)}
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
            predictionRisks={predictionRisks}
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
          prediction={selectedPrediction}
          predictionData={predictionData}
          predictionLoading={predictionLoading}
          predictionError={predictionError}
          roadTraffic={roadTraffic}
          recentEvent={events.find((event) => event.segment_id === selectedSegment.segment_id)?.description ?? "暂无"}
          onClose={() => setSelectedSegmentId(null)}
        />
      ) : null}

      {selectedPopupCamera ? (
        <CameraEventListPopup
          cameraWorkOrders={cameraWorkOrders}
          cameraId={selectedPopupCamera}
          onClose={() => setSelectedPopupCamera(null)}
          onSelectEvent={async (workOrderId) => {
            setEventDetailLoading(true);
            try {
              const detail = await fetchWorkOrderDetail(workOrderId);
              setSelectedPopupEvent(detail);
            } catch {
              setSelectedPopupEvent(null);
            } finally {
              setEventDetailLoading(false);
            }
          }}
        />
      ) : null}

      {selectedPopupEvent ? (
        <EventDetailPopup
          event={selectedPopupEvent}
          loading={eventDetailLoading}
          onClose={() => setSelectedPopupEvent(null)}
          onHandle={() => {
            sessionStorage.setItem("selectedWorkOrderId", selectedPopupEvent.work_order_id);
            window.location.hash = "workOrder";
          }}
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
  predictionRisks,
  selectedSegmentId,
  onSelectSegment,
}: {
  mode: MapMode;
  onModeChange: (m: MapMode) => void;
  segments: RoadSegment[];
  cameras: CameraPoint[];
  cameraRisks: Record<string, number>;
  predictionRisks: Record<string, number>;
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
    const activeRisks = mode === "prediction" ? predictionRisks : cameraRisks;
    if (mode === "realtime") {
      arr.sort((a, b) => {
        const ra = segAvgRisk(a, activeRisks);
        const rb = segAvgRisk(b, activeRisks);
        return rb - ra;
      });
    } else if (mode === "traffic") {
      arr.sort((a, b) => b.traffic_flow - a.traffic_flow);
    } else {
      arr.sort((a, b) => (activeRisks[b.segment_id] ?? 0) - (activeRisks[a.segment_id] ?? 0));
    }
    return arr;
  }, [segments, mode, cameraRisks, predictionRisks]);

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
          const activeRisks = mode === "prediction" ? predictionRisks : cameraRisks;
          const risk = mode === "prediction"
            ? activeRisks[segment.segment_id] ?? 0
            : segAvgRisk(segment, activeRisks);
          const hasRisk = Object.keys(activeRisks).length > 0;
          const color = mode === "traffic"
            ? getTrafficFlowColor(segment.traffic_flow)
            : mode === "prediction"
              ? hasRisk ? predictionRiskColor(risk) : GRAY
              : hasRisk ? riskToColor(risk) : GRAY;
          const label = mode === "traffic"
            ? String(segment.traffic_flow)
            : hasRisk ? `${(risk * 100).toFixed(0)}%` : "等待数据";
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

function segmentMidpoint(segment: RoadSegment, nodes: RoadNode[]): { lat: number; lng: number } {
  if (segment.path && segment.path.length > 0) {
    const point = segment.path[Math.floor(segment.path.length / 2)];
    return { lng: point[0], lat: point[1] };
  }
  const from = nodes.find((node) => node.node_id === segment.from_node);
  const to = nodes.find((node) => node.node_id === segment.to_node);
  if (from && to) return { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };
  return { lat: from?.lat ?? to?.lat ?? 39.98, lng: from?.lng ?? to?.lng ?? 116.31 };
}

function formatRoadCondition(prediction: RoadRiskPrediction | null, segment: RoadSegment): string {
  const road = prediction?.road;
  const typeNames: Record<string, string> = {
    motorway: "高速公路",
    trunk: "快速路",
    primary: "主干路",
    secondary: "次干路",
    tertiary: "支路",
    residential: "居住道路",
    service: "内部道路",
    main: "主干路",
    branch: "支路",
  };
  const surfaceNames: Record<string, string> = {
    asphalt: "沥青路面",
    concrete: "水泥路面",
    paving_stones: "铺装路面",
    unpaved: "未铺装路面",
  };
  const roadType = typeNames[road?.road_type ?? segment.road_type] ?? road?.road_type ?? getRoadTypeText(segment.road_type);
  const lanes = road?.lanes ?? segment.lane_count;
  const maxspeed = road?.maxspeed ?? segment.speed_limit;
  const surface = road?.surface ? (surfaceNames[road.surface] ?? road.surface) : "路面信息待更新";
  return `${roadType} · ${lanes} 车道 · 限速 ${maxspeed} km/h · ${surface}`;
}

function getDynamicRoadCondition(prediction: RoadRiskPrediction | null, segment: RoadSegment) {
  const detectedSpeed = prediction?.vehicle.avg_speed_kmh;
  const currentSpeed = detectedSpeed != null && detectedSpeed > 0 ? detectedSpeed : segment.avg_speed;
  const rawLimit = prediction?.road.maxspeed ?? segment.speed_limit;
  const speedLimit = typeof rawLimit === "number" ? rawLimit : Number.parseFloat(String(rawLimit));
  const speedRatio = Number.isFinite(speedLimit) && speedLimit > 0 ? currentSpeed / speedLimit : null;
  const congestionIndex = speedRatio != null && speedRatio > 0 ? Math.min(5, 1 / speedRatio) : null;

  let status = "暂无动态路况";
  if (speedRatio != null) {
    if (speedRatio < 0.3) status = "严重拥堵";
    else if (speedRatio < 0.5) status = "拥堵";
    else if (speedRatio < 0.75) status = "缓行";
    else status = "畅通";
  }
  if ((prediction?.vehicle.active_incidents ?? 0) > 0) status = `${status}（检测到交通事件）`;

  return {
    status,
    currentSpeed,
    congestionIndex,
    source: detectedSpeed != null ? "15 分钟车辆轨迹窗口" : "道路历史基线",
  };
}

function normalizeCamId(id: string): string {
  const m = id.match(/^cam[-_](\d+)$/i);
  return m ? `C${String(Number(m[1])).padStart(2, "0")}` : id;
}

// 统一为后端 cam-NN 两位数字格式（用于匹配 /roads/traffic 返回的 key）。
// 支持 C25 / C05 / cam_001 / cam001 / cam-001 / cam-01 / cam-1 / cam25 等所有变体。
function normalizeCameraId(id: string): string {
  const m = id.replace(/_/g, "-").match(/^(?:C|cam-?)0*(\d+)$/i);
  return m ? `cam-${String(Number(m[1])).padStart(2, "0")}` : id;
}

function segAvgRisk(seg: RoadSegment, cameraRisks: Record<string, number>): number {
  const ids = seg.camera_ids ?? [];
  const vals = ids.map((id) => cameraRisks[normalizeCamId(id)]).filter((v): v is number => v !== undefined);
  if (vals.length > 0) return vals.reduce((a, b) => a + b, 0) / vals.length;
  const bySeg = cameraRisks[seg.segment_id];
  return bySeg ?? 0.5;
}

function RoadMapView({
  mode,
  nodes,
  segments,
  cameras,
  events,
  cameraRisks,
  predictionRisks,
  selectedSegmentId,
  onSelectSegment,
  onBlankClick,
  newEventCameras,
  onCameraClick,
}: {
  mode: MapMode;
  nodes: RoadNode[];
  segments: RoadSegment[];
  cameras: CameraPoint[];
  events: TrafficEvent[];
  cameraRisks: Record<string, number>;
  predictionRisks: Record<string, number>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  onBlankClick: () => void;
  newEventCameras: Set<string>;
  onCameraClick: (cameraId: string) => void;
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
      const map = L.map(containerRef.current, {
        center: [40.027, 116.281],
        zoom: 15,
        minZoom: 14,
        maxBounds: L.latLngBounds([40.010, 116.255], [40.044, 116.307]),
        maxBoundsViscosity: 0.8,
        zoomControl: false,
      });
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
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
        predictionRisks={predictionRisks}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={onSelectSegment}
      />
      <CameraLayer map={mapInstance} layerRef={cameraLayerRef} cameras={cameras} newEventCameras={newEventCameras} onCameraClick={onCameraClick} />
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
  predictionRisks,
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
  predictionRisks: Record<string, number>;
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}) {
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  const roadColors = useMemo(() => {
    const map = new Map<string, string>();
    if (mode === "traffic") {
      for (const seg of segments) map.set(seg.segment_id, getTrafficFlowColor(seg.traffic_flow));
      return map;
    }
    const activeRisks = mode === "prediction" ? predictionRisks : cameraRisks;
    if (Object.keys(activeRisks).length === 0) {
      for (const seg of segments) map.set(seg.segment_id, GRAY);
      return map;
    }
    for (const seg of segments) {
      if (mode === "prediction") {
        const predicted = activeRisks[seg.segment_id];
        map.set(seg.segment_id, predicted === undefined ? GRAY : predictionRiskColor(predicted));
        continue;
      }
      const camIds = seg.camera_ids ?? [];
      const risks: number[] = [];
      for (const cid of camIds) {
        const r = activeRisks[cid];
        if (r !== undefined) risks.push(r);
      }
      const avg = risks.length > 0 ? risks.reduce((a, b) => a + b, 0) / risks.length : 0.5;
      map.set(seg.segment_id, riskToColor(avg));
    }
    return map;
  }, [segments, mode, cameraRisks, predictionRisks]);

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
  newEventCameras,
  onCameraClick,
}: {
  map: L.Map | null;
  layerRef: MutableRefObject<L.LayerGroup | null>;
  cameras: CameraPoint[];
  newEventCameras: Set<string>;
  onCameraClick: (cameraId: string) => void;
}) {
  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    const group = L.layerGroup();
    cameras.forEach((camera) => {
      const canonId = (() => {
        const m = camera.camera_id.replace(/_/g, "-").match(/(?:C|cam-?)0*(\d+)$/i);
        return m ? `C${String(Number(m[1])).padStart(2, "0")}` : camera.camera_id;
      })();
      const hasNew = newEventCameras.has(canonId);
      const pulseClass = hasNew ? " camera-pulse" : "";
      const scale = hasNew ? " transform:rotate(-45deg) scale(1.5);" : " transform:rotate(-45deg);";
      const bg = hasNew ? "#ff4444" : "#26c6ff";
      const border = hasNew ? "#cc0000" : "#0097d4";
      const shadow = hasNew
        ? "box-shadow:0 0 12px rgba(255,68,68,0.7),1px 1px 3px rgba(0,0,0,0.5);"
        : "box-shadow:1px 1px 3px rgba(0,0,0,0.5);";
      const marker = L.marker([camera.lat, camera.lng], {
        icon: L.divIcon({
          className: pulseClass,
          html: `<div style="width:18px;height:18px;background:${bg};border:2px solid ${border};border-radius:50% 50% 50% 0;${scale}${shadow}"></div>`,
          iconSize: hasNew ? [27, 27] : [18, 18],
          iconAnchor: hasNew ? [13, 20] : [9, 16],
        }),
      });
      marker.bindTooltip(`摄像头：${camera.name}`);
      marker.on("click", () => onCameraClick(camera.camera_id));
      marker.addTo(group);
    });
    group.addTo(map);
    layerRef.current = group;
  }, [cameras, layerRef, map, newEventCameras, onCameraClick]);

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
  const rows = mode === "prediction"
    ? [
        ["#2ecc71", "0-30% 低风险"],
        ["#f1c40f", "30-50% 中风险"],
        ["#e74c3c", "50%以上 高风险"],
      ]
    : mode === "realtime"
      ? [
        ["#2ecc71", "通行正常"],
        ["#f1c40f", "车流较大"],
        ["#e67e22", "高风险"],
        ["#e74c3c", "事故/严重异常"],
      ]
      : [
        ["#34A853", "1-200 车流较小"],
        ["#FBBC04", "201-400 车流中等"],
        ["#FF6D01", "401-600 车流较大"],
        ["#EA4335", "600+ 严重拥堵"],
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
  prediction,
  predictionData,
  predictionLoading,
  predictionError,
  roadTraffic,
  recentEvent,
  onClose,
}: {
  segment: RoadSegment;
  mode: MapMode;
  cameras: CameraPoint[];
  cameraRisks: Record<string, number>;
  prediction: RoadRiskPrediction | null;
  predictionData: RoadRiskPredictionResponse | null;
  predictionLoading: boolean;
  predictionError: string | null;
  roadTraffic: Record<string, any>;
  recentEvent: string;
  onClose: () => void;
}) {
  const nid = (id: string) => { const m = id.match(/^cam[-_](\d+)$/i); return m ? `C${String(Number(m[1])).padStart(2, "0")}` : id; };
  const camIds = segment.camera_ids.map(normalizeCameraId);
  const segTraffic = camIds.map(id => roadTraffic[id] || {}).filter((t: any) => t.total_vehicle_count !== undefined);
  const realFlow = segTraffic.length > 0 ? Math.round(segTraffic.reduce((s: number, t: any) => s + (t.flow_per_min || 0), 0)) : segment.traffic_flow;
  const realSpeed = segTraffic.length > 0 ? Math.round(segTraffic.reduce((s: number, t: any) => s + (t.avg_speed || 0), 0) / segTraffic.length) : segment.avg_speed;
  const segCameras = cameras.filter((c) => segment.camera_ids.includes(c.camera_id));
  const cameraRiskDetails = segCameras.flatMap((camera) => {
    const risk = cameraRisks[nid(camera.camera_id)] ?? cameraRisks[camera.camera_id];
    return risk === undefined ? [] : [{ camera, risk }];
  });
  const lstmRisk = cameraRiskDetails.length > 0
    ? cameraRiskDetails.reduce((sum, item) => sum + item.risk, 0) / cameraRiskDetails.length
    : null;
  const dynamicRoad = getDynamicRoadCondition(prediction, segment);

  const predictionRiskToText = (score: number) => {
    if (score < 0.3) return "低风险";
    if (score < 0.5) return "中风险";
    return "高风险";
  };

  const realtimeRiskToText = (score: number) => {
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
        {mode === "realtime" ? (
          <>
            <span>LSTM 实时风险</span>
            <b style={{ color: lstmRisk !== null ? riskToColor(lstmRisk) : "#95a5a6" }}>
              {lstmRisk !== null ? `${(lstmRisk * 100).toFixed(1)}% (${realtimeRiskToText(lstmRisk)})` : "等待数据…"}
            </b>
            <span>车流量</span><b>{realFlow} 辆/min</b>
            <span>平均车速</span><b>{realSpeed} km/h</b>
          </>
        ) : null}
        {mode === "prediction" ? (
          <>
            <span>预测风险</span>
            <b style={{ color: prediction ? predictionRiskColor(prediction.risk_score) : "#95a5a6" }}>
              {prediction ? `${(prediction.risk_score * 100).toFixed(1)}%` : predictionLoading ? "预测中…" : "暂无预测"}
            </b>
            <span>预测时域</span><b>未来 {predictionData?.forecast_minutes ?? 15} 分钟</b>
            <span>日期时段</span>
            <b>{predictionData ? `${predictionData.date_context.date} ${predictionData.date_context.weekday} / ${predictionData.date_context.period}` : "计算中"}</b>
            <span>天气</span>
            <b>{predictionData ? `${predictionData.weather.temperature_2m.toFixed(1)}℃ / 湿度 ${predictionData.weather.relative_humidity_2m.toFixed(0)}%` : "采集中"}</b>
            <span>15 分钟累计车流</span><b>{prediction?.vehicle.window_vehicle_count ?? 0} 辆</b>
            <span>历史同时段基线</span>
            <b>{prediction ? `${prediction.vehicle.historical_baseline_count} 辆 / ${prediction.vehicle.flow_comparison} ${Math.abs(prediction.vehicle.flow_change_percent).toFixed(1)}%` : "计算中"}</b>
            <span>15 分钟平均速度</span><b>{prediction?.vehicle.avg_speed_kmh != null ? `${prediction.vehicle.avg_speed_kmh.toFixed(1)} km/h` : "等待窗口数据"}</b>
            <span>联网道路</span><b>{prediction?.road.display_name || prediction?.road.name || segment.name}</b>
            <span>道路情况</span><b>{formatRoadCondition(prediction, segment)}</b>
            <span>通行状态</span><b>{dynamicRoad.status}</b>
            <span>拥堵指数</span><b>{dynamicRoad.congestionIndex != null ? dynamicRoad.congestionIndex.toFixed(2) : "暂无数据"}</b>
            <span>交通事件</span><b>{(prediction?.vehicle.active_incidents ?? 0) > 0 ? `${prediction?.vehicle.active_incidents} 起` : "暂未检测到"}</b>
            <span>路况来源</span><b>{dynamicRoad.source}</b>
            <span>道路数据</span><b>{prediction?.road.source ?? "前端道路元数据"}</b>
          </>
        ) : null}
        <span>风险等级</span>
        <b>
          {mode === "prediction" && prediction
            ? predictionRiskToText(prediction.risk_score)
            : mode === "realtime" && lstmRisk !== null
              ? realtimeRiskToText(lstmRisk)
              : getRiskText(segment.status)}
        </b>
        <span>关联摄像头</span><b>{segCameras.length ? segCameras.map((c) => c.name).join("、") : "无"}</b>
      </div>
      {mode === "realtime" && cameraRiskDetails.length > 0 ? (
        <div className="segment-event-line">
          <em>摄像头风险明细</em>
          <p>
            {cameraRiskDetails.map(({ camera, risk }) => (
              <span key={camera.camera_id} style={{ marginRight: 8, display: "inline-block" }}>
                {camera.name}: {(risk * 100).toFixed(1)}%
              </span>
            ))}
          </p>
        </div>
      ) : null}
      {mode === "prediction" ? (
        <div className="segment-event-line">
          <em>预测依据</em>
          <p>{predictionError ?? prediction?.reason.join("；") ?? (predictionLoading ? "正在采集天气、道路和车辆数据…" : "暂无预测数据")}</p>
        </div>
      ) : null}
      <div className="segment-event-line">
        <em>最近异常</em>
        <p>{recentEvent}</p>
      </div>
    </div>
  );
}

function CameraEventListPopup({
  cameraWorkOrders,
  cameraId,
  onClose,
  onSelectEvent,
}: {
  cameraWorkOrders: CameraUnprocessedEvents[];
  cameraId: string;
  onClose: () => void;
  onSelectEvent: (workOrderId: string) => void;
}) {
  const canonId = (id: string) => {
    const m = id.replace(/_/g, "-").match(/(?:C|cam-?)0*(\d+)$/i);
    return m ? `C${String(Number(m[1])).padStart(2, "0")}` : id;
  };
  const normalizedCameraId = canonId(cameraId);
  const camera = cameraWorkOrders.find((c) => canonId(c.camera_id) === normalizedCameraId);
  const events = camera?.events ?? [];
  const cameraName = camera?.camera_name ?? "未知摄像头";

  const levelColor = (level: string) => {
    if (level === "high") return "#e74c3c";
    if (level === "medium") return "#f1c40f";
    return "#26c6ff";
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      unassigned: "未派发", pending: "待处理", processing: "处理中",
      completed: "已完成", ignored: "已忽略",
    };
    return map[s] ?? s;
  };

  return (
    <div className="camera-event-overlay" onClick={onClose}>
      <div className="camera-event-popup" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button className="cev-close" onClick={onClose}>&times;</button>
        <h2>{cameraName}</h2>
        <div className="cev-subtitle">摄像头ID: {cameraId} · 未处理事件: {events.length} 条</div>
        {events.length === 0 ? (
          <p style={{ color: "#8899aa", fontSize: 13 }}>当前无未处理事件</p>
        ) : (
          events.map((evt) => (
            <div
              key={evt.work_order_id}
              className="cev-event-item"
              onClick={() => onSelectEvent(evt.work_order_id)}
            >
              <span className="cev-event-level" style={{ background: levelColor(evt.event_level) }} />
              <div className="cev-event-info">
                <div className="cev-event-type">{evt.work_order_id}: {evt.accident_info}</div>
                <div className="cev-event-time">{evt.event_time} · {statusLabel(evt.status)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EventDetailPopup({
  event,
  loading,
  onClose,
  onHandle,
}: {
  event: WorkOrderItem;
  loading: boolean;
  onClose: () => void;
  onHandle: () => void;
}) {
  const levelLabel = (level: string) => {
    if (level === "high") return "紧急";
    if (level === "medium") return "中等";
    return "一般";
  };
  const levelColor = (level: string) => {
    if (level === "high") return "#e74c3c";
    if (level === "medium") return "#f1c40f";
    return "#26c6ff";
  };

  if (loading) {
    return (
      <div className="camera-event-overlay" onClick={onClose}>
        <div className="event-detail-popup" onClick={(e) => e.stopPropagation()}>
          <p style={{ textAlign: "center", color: "#8899aa" }}>正在加载事件详情…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-event-overlay" onClick={onClose}>
      <div className="event-detail-popup" onClick={(e) => e.stopPropagation()}>
        <h2>{event.accident_info}</h2>
        <div className="edp-grid">
          <span>工单编号</span><b>{event.work_order_id}</b>
          <span>事件等级</span><b style={{ color: levelColor(event.event_level) }}>{levelLabel(event.event_level)}</b>
          <span>工单状态</span><b>{event.status}</b>
          <span>摄像头</span><b>{event.camera_name}</b>
          <span>监控地址</span><b>{event.monitor_address}</b>
          <span>路段</span><b>{event.segment_name}</b>
          <span>事件时间</span><b>{event.event_time}</b>
          <span>负责人</span><b>{event.assignee || "未指派"}</b>
          <span>AI建议</span><b>{event.ai_suggestion || "暂无"}</b>
          <span>现场描述</span><b>{event.description}</b>
        </div>
        {event.scene_images && event.scene_images.length > 0 ? (
          <div className="edp-images">
            <em style={{ fontSize: 12, color: "#8899aa" }}>现场图片</em>
            {event.scene_images.map((url, i) => (
              <img key={i} src={url} alt={`现场图片 ${i + 1}`} />
            ))}
          </div>
        ) : null}
        <div className="edp-actions">
          <button className="edp-close-btn" onClick={onClose}>关闭</button>
          <button className="edp-handle-btn" onClick={onHandle}>立即处理</button>
        </div>
      </div>
    </div>
  );
}
