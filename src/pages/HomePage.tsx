import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { ScenarioController } from "../components/ScenarioController";
import { SegmentDetailPanel } from "../components/SegmentDetailPanel";
import { useScenarioPlayback } from "../hooks/useScenarioPlayback";
import { roadNetworkToGeoJSON } from "../utils/roadNetworkToGeoJSON";
import {
  getRiskColor,
  getRiskText,
  getRoadOpacity,
  getRoadTypeText,
  getRoadWidth,
  getTrafficFlowColor,
} from "../utils/riskStyle";
import { eventPosition, formatSegmentPopup } from "../demos/shared";

type MapMode = "risk" | "traffic";

export function HomePage() {
  const scenario = useScenarioPlayback();
  const [mode, setMode] = useState<MapMode>("risk");
  const [selectedSegmentId, setSelectedSegmentId] = useState("seg_gaoxin_1");
  const selectedSegment = scenario.segments.find((segment) => segment.segment_id === selectedSegmentId) ?? null;
  const highRiskCount = scenario.segments.filter((segment) => segment.status === "risk" || segment.status === "danger").length;
  const avgSpeed = scenario.segments.reduce((sum, segment) => sum + segment.avg_speed, 0) / scenario.segments.length;

  return (
    <section className="business-page">
      <ScenarioController
        currentStepIndex={scenario.currentStepIndex}
        isPlaying={scenario.isPlaying}
        onPlay={scenario.play}
        onPause={scenario.pause}
        onReset={scenario.reset}
        onNext={scenario.next}
        onPrevious={scenario.previous}
        onJump={scenario.jump}
      />

      <div className="home-layout">
        <div className="map-card">
          <div className="section-toolbar">
            <div>
              <h2>道路地图 / 热力图页面</h2>
              <p>科技园区道路测试场景 · Leaflet + OSM + GeoJSON</p>
            </div>
            <div className="mode-toggle">
              <button className={mode === "risk" ? "active" : ""} onClick={() => setMode("risk")}>事故风险模式</button>
              <button className={mode === "traffic" ? "active" : ""} onClick={() => setMode("traffic")}>车流密度模式</button>
            </div>
          </div>
          <HomeLeafletMap
            mode={mode}
            nodes={scenario.nodes}
            segments={scenario.segments}
            cameras={scenario.cameras}
            events={scenario.events}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
          />
        </div>

        <aside className="business-side-panel">
          <h2>路段信息数据面板</h2>
          <div className="summary-grid">
            <div><span>当前模式</span><strong>{mode === "risk" ? "事故风险" : "车流密度"}</strong></div>
            <div><span>路段总数</span><strong>{scenario.segments.length}</strong></div>
            <div><span>高风险路段数</span><strong>{highRiskCount}</strong></div>
            <div><span>平均车速</span><strong>{avgSpeed.toFixed(1)} km/h</strong></div>
            <div><span>当前事件数</span><strong>{scenario.events.length}</strong></div>
            <div><span>摄像头数</span><strong>{scenario.cameras.length}</strong></div>
          </div>

          <h3>选中路段详情</h3>
          <SegmentDetailPanel segment={selectedSegment} cameras={scenario.cameras} />

          <h3>路段列表</h3>
          <div className="segment-list">
            {scenario.segments.map((segment) => (
              <button
                key={segment.segment_id}
                className={selectedSegmentId === segment.segment_id ? "active" : ""}
                onClick={() => setSelectedSegmentId(segment.segment_id)}
              >
                <i style={{ background: mode === "risk" ? getRiskColor(segment.status) : getTrafficFlowColor(segment.traffic_flow) }} />
                <span>{segment.name}</span>
                <b>{mode === "risk" ? getRiskText(segment.status) : `${segment.traffic_flow} 辆/h`}</b>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function HomeLeafletMap({
  mode,
  nodes,
  segments,
  cameras,
  events,
  selectedSegmentId,
  onSelectSegment,
}: {
  mode: MapMode;
  nodes: ReturnType<typeof useScenarioPlayback>["nodes"];
  segments: ReturnType<typeof useScenarioPlayback>["segments"];
  cameras: ReturnType<typeof useScenarioPlayback>["cameras"];
  events: ReturnType<typeof useScenarioPlayback>["events"];
  selectedSegmentId: string;
  onSelectSegment: (segmentId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const roadLayerRef = useRef<L.GeoJSON | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const firstRender = useRef(true);
  const geojson = useMemo(() => roadNetworkToGeoJSON(nodes, segments), [nodes, segments]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = L.map(containerRef.current, { center: [39.906, 116.396], zoom: 15 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);
      mapRef.current = map;
    } catch (error) {
      if (errorRef.current) errorRef.current.textContent = `地图初始化失败：${String(error)}`;
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    roadLayerRef.current?.removeFrom(map);
    markerLayerRef.current?.removeFrom(map);
    const roadById = new Map(segments.map((segment) => [segment.segment_id, segment]));

    const roadLayer = L.geoJSON(geojson, {
      style: (feature) => {
        const id = String(feature?.properties?.segment_id);
        const segment = roadById.get(id);
        const color = segment ? (mode === "risk" ? getRiskColor(segment.status) : getTrafficFlowColor(segment.traffic_flow)) : "#95a5a6";
        return {
          color,
          weight: segment ? getRoadWidth(segment.road_type) + (id === selectedSegmentId ? 2 : 0) : 6,
          opacity: segment ? getRoadOpacity(segment.status) : 0.8,
        };
      },
      onEachFeature: (feature, layer) => {
        const id = String(feature.properties?.segment_id);
        const segment = roadById.get(id);
        if (!segment) return;
        layer.bindPopup(formatSegmentPopup(segment, cameras));
        layer.on("click", () => onSelectSegment(segment.segment_id));
      },
    }).addTo(map);

    const markerLayer = L.layerGroup();
    cameras.forEach((camera) => {
      L.circleMarker([camera.lat, camera.lng], {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: camera.status === "online" ? "#1f8fff" : "#95a5a6",
        fillOpacity: 0.95,
      }).bindTooltip(`摄像头：${camera.name}`).addTo(markerLayer);
    });
    events.forEach((event) => {
      const pos = eventPosition(nodes, segments, event);
      L.circleMarker([pos.lat, pos.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#e74c3c",
        fillOpacity: 1,
      }).bindTooltip(`${event.segment_name}<br/>${event.description}`).addTo(markerLayer);
    });
    markerLayer.addTo(map);
    roadLayerRef.current = roadLayer;
    markerLayerRef.current = markerLayer;
    if (firstRender.current) {
      map.fitBounds(roadLayer.getBounds(), { padding: [24, 24] });
      firstRender.current = false;
    }
  }, [geojson, segments, cameras, events, nodes, mode, selectedSegmentId, onSelectSegment]);

  return (
    <div className="home-map-shell">
      <div ref={containerRef} className="business-map" />
      <div ref={errorRef} className="map-error" />
      <MapLegend mode={mode} />
    </div>
  );
}

function MapLegend({ mode }: { mode: MapMode }) {
  const rows = mode === "risk"
    ? [
        ["#2ecc71", "normal：通行正常"],
        ["#f1c40f", "busy：车流较大"],
        ["#e67e22", "risk：高风险"],
        ["#e74c3c", "danger：事故/严重异常"],
      ]
    : [
        ["#2ecc71", "0-30：车流较小"],
        ["#f1c40f", "31-60：车流中等"],
        ["#e67e22", "61-90：车流较大"],
        ["#e74c3c", "90+：严重拥堵"],
      ];

  return (
    <div className="business-legend">
      <strong>{mode === "risk" ? "事故风险图例" : "车流密度图例"}</strong>
      {rows.map(([color, label]) => (
        <span key={label}><i style={{ background: color }} />{label}</span>
      ))}
      <span><i className="camera-dot" />摄像头点位</span>
      <span><i className="event-dot" />异常事件点位</span>
    </div>
  );
}
