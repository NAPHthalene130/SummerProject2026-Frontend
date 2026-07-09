import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import L from "leaflet";
import { eventPosition } from "../demos/shared";
import { useDataMode } from "../context/DataModeContext";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import type { CameraPoint, RoadNode, RoadSegment } from "../data/standardRoadNetwork";
import type { TrafficEvent } from "../types/business";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import {
  getRiskColor,
  getRiskText,
  getRoadOpacity,
  getRoadTypeText,
  getRoadWidth,
  getTrafficFlowColor,
} from "../utils/riskStyle";

type MapMode = "risk" | "traffic";

export function HomePage() {
  const scenario = useScenarioPlayback();
  const { demoDataEnabled } = useDataMode();
  const [mode, setMode] = useState<MapMode>("risk");
  const [modeOpen, setModeOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(true);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const nodes = demoDataEnabled ? scenario.nodes : [];
  const segments = demoDataEnabled ? scenario.segments : [];
  const cameras = demoDataEnabled ? scenario.cameras : [];
  const events = demoDataEnabled ? scenario.events : [];
  const selectedSegment = segments.find((segment) => segment.segment_id === selectedSegmentId) ?? null;
  const recentEvent = events[0];
  const dangerCount = segments.filter((segment) => segment.status === "danger").length;
  const closeModeMenu = useCallback(() => setModeOpen(false), []);

  useEffect(() => {
    if (!demoDataEnabled) {
      setSelectedSegmentId(null);
      setModeOpen(false);
    }
  }, [demoDataEnabled]);

  return (
    <section className="home-command-page">
      <RoadMapView
        mode={mode}
        nodes={nodes}
        segments={segments}
        cameras={cameras}
        events={events}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={setSelectedSegmentId}
        onBlankClick={closeModeMenu}
      />

      <div className="map-title-float">
        <span className="system-kicker">ROAD COMMAND</span>
        <h1>智慧路政巡检分析系统</h1>
        <p>{new Date().toLocaleString("zh-CN", { hour12: false })} · {mode === "risk" ? "事故风险模式" : "车流密度模式"}</p>
        <div className="reference-chips">
          <span>Traccar map-first</span>
          <span>Kepler layer control</span>
          <span>deck.gl layers</span>
        </div>
      </div>

      <MapModeSwitcher
        mode={mode}
        open={modeOpen}
        onToggle={() => setModeOpen((value) => !value)}
        onChange={(nextMode) => {
          setMode(nextMode);
          setModeOpen(false);
        }}
      />

      <div className="map-playback-float">
        <button onClick={scenario.isPlaying ? scenario.pause : scenario.play}>{scenario.isPlaying ? "暂停" : "播放"}</button>
        <button onClick={scenario.previous}>上一步</button>
        <button onClick={scenario.next}>下一步</button>
        <button onClick={scenario.reset}>重置</button>
        <span>T+{scenario.currentTimeSec}s</span>
      </div>

      <MapLegend mode={mode} />
      {!demoDataEnabled ? <BackendWaitingNotice pageName="道路地图" /> : null}
      <MapEventNotification event={recentEvent} dangerCount={dangerCount} />

      <MapAssetDock
        open={assetOpen}
        mode={mode}
        segments={segments}
        cameras={cameras}
        selectedSegmentId={selectedSegmentId}
        onToggle={() => setAssetOpen((value) => !value)}
        onSelectSegment={setSelectedSegmentId}
      />

      {selectedSegment ? (
        <SelectedRoadPopup
          segment={selectedSegment}
          mode={mode}
          cameraNames={cameras.filter((camera) => selectedSegment.camera_ids.includes(camera.camera_id)).map((camera) => camera.name)}
          recentEvent={events.find((event) => event.segment_id === selectedSegment.segment_id)?.description ?? "暂无"}
          onClose={() => setSelectedSegmentId(null)}
        />
      ) : null}
    </section>
  );
}

function BackendWaitingNotice({ pageName }: { pageName: string }) {
  return (
    <div className="backend-waiting-notice">
      <b>{pageName}已切换为生产数据源</b>
      <span>前端 mock 已清空，等待后端接口返回路网、摄像头、事件和工单数据。</span>
      <small>双击左上角“路”字图标可恢复演示数据。</small>
    </div>
  );
}

function MapAssetDock({
  open,
  mode,
  segments,
  cameras,
  selectedSegmentId,
  onToggle,
  onSelectSegment,
}: {
  open: boolean;
  mode: MapMode;
  segments: RoadSegment[];
  cameras: CameraPoint[];
  selectedSegmentId: string | null;
  onToggle: () => void;
  onSelectSegment: (segmentId: string) => void;
}) {
  const dangerCount = segments.filter((segment) => segment.status === "danger").length;
  const riskCount = segments.filter((segment) => segment.status === "risk").length;

  return (
    <aside className={`map-asset-dock ${open ? "open" : "closed"}`}>
      <button className="dock-tab" onClick={onToggle}>{open ? "收起资产" : "展开资产"}</button>
      {open ? (
        <>
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
        </>
      ) : null}
    </aside>
  );
}

function RoadMapView({
  mode,
  nodes,
  segments,
  cameras,
  events,
  selectedSegmentId,
  onSelectSegment,
  onBlankClick,
}: {
  mode: MapMode;
  nodes: RoadNode[];
  segments: RoadSegment[];
  cameras: CameraPoint[];
  events: TrafficEvent[];
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
  selectedSegmentId,
  onSelectSegment,
}: {
  map: L.Map | null;
  layerRef: MutableRefObject<L.GeoJSON | null>;
  firstRender: MutableRefObject<boolean>;
  mode: MapMode;
  nodes: RoadNode[];
  segments: RoadSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}) {
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  useEffect(() => {
    if (!map) return;
    layerRef.current?.removeFrom(map);
    if (!segments.length) {
      layerRef.current = null;
      return;
    }
    const roadById = new Map(segments.map((segment) => [segment.segment_id, segment]));
    const roadLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const id = String(feature?.properties?.segment_id);
        const segment = roadById.get(id);
        return {
          color: segment ? getSegmentColor(segment, mode) : "#95a5a6",
          weight: segment ? getRoadWidth(segment.road_type) + (selectedSegmentId === id ? 3 : 0) : 6,
          opacity: segment ? getRoadOpacity(segment.status) : 0.85,
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
        };
      },
      onEachFeature: (feature, layer) => {
        const segment = roadById.get(String(feature.properties?.segment_id));
        if (!segment) return;
        layer.bindTooltip(segment.name, { sticky: true, direction: "top" });
        layer.on("click", (event) => {
          L.DomEvent.stop(event);
          onSelectSegment(segment.segment_id);
        });
        layer.on("mouseover", () => {
          const pathLayer = layer as L.Path;
          pathLayer.bringToFront();
        });
      },
    }).addTo(map);

    layerRef.current = roadLayer;
    if (firstRender.current) {
      map.fitBounds(roadLayer.getBounds(), { padding: [24, 24] });
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
      L.circleMarker([camera.lat, camera.lng], {
        radius: 6,
        color: "#dff7ff",
        weight: 2,
        fillColor: camera.status === "online" ? "#26c6ff" : "#95a5a6",
        fillOpacity: 0.95,
      }).bindTooltip(`摄像头：${camera.name}`).addTo(group);
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
  cameraNames,
  recentEvent,
  onClose,
}: {
  segment: RoadSegment;
  mode: MapMode;
  cameraNames: string[];
  recentEvent: string;
  onClose: () => void;
}) {
  return (
    <div className="segment-float">
      <button onClick={onClose}>×</button>
      <small>道路详情</small>
      <h2>{segment.name}</h2>
      <div className="segment-float-grid">
        <span>道路编号</span><b>{segment.segment_id}</b>
        <span>道路类型</span><b>{getRoadTypeText(segment.road_type)}</b>
        <span>当前模式</span><b>{mode === "risk" ? "事故风险" : "车流密度"}</b>
        <span>当前车流量</span><b>{segment.traffic_flow} 辆/min</b>
        <span>平均车速</span><b>{segment.avg_speed} km/h</b>
        <span>风险分数</span><b>{segment.risk_score}</b>
        <span>风险等级</span><b>{getRiskText(segment.status)}</b>
        <span>关联摄像头</span><b>{cameraNames.length ? cameraNames.join("、") : "无"}</b>
      </div>
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
