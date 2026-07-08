import { useEffect, useRef } from "react";
import type { RoadSegment } from "../data/standardRoadNetwork";
import type { VisualDemoProps } from "../types";
import { getRoadColor, getRoadOpacity, getRoadWidth } from "../utils/riskStyle";
import { distanceToSegment, eventPosition, getSegmentMidpoint, getSegmentPoints } from "./shared";

export function CanvasRoadTopologyDemo({
  nodes,
  segments,
  cameras,
  events,
  currentTimeSec,
  currentDescription,
  selectedSegmentId,
  onSelectSegment,
  onMetricsChange,
}: VisualDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverSegmentRef = useRef<RoadSegment | null>(null);
  const animationRef = useRef<number>();
  const firstRender = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = (time: number) => {
      const start = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#061522");
      gradient.addColorStop(1, "#092b3d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, canvas.width, canvas.height);
      segments.forEach((segment) => {
        const points = getSegmentPoints(nodes, segment);
        if (!points) return;
        const selected = selectedSegmentId === segment.segment_id || hoverSegmentRef.current?.segment_id === segment.segment_id;
        const flash = segment.status === "danger" ? 0.55 + Math.abs(Math.sin(time / 250)) * 0.45 : 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#06101b";
        ctx.lineWidth = getRoadWidth(segment.road_type) + (selected ? 11 : 8);
        ctx.beginPath();
        ctx.moveTo(points.from.x, points.from.y);
        ctx.lineTo(points.to.x, points.to.y);
        ctx.stroke();

        ctx.globalAlpha = getRoadOpacity(segment.status) * flash;
        ctx.shadowBlur = segment.status === "danger" ? 18 : 0;
        ctx.shadowColor = getRoadColor(segment.status);
        ctx.strokeStyle = getRoadColor(segment.status);
        ctx.lineWidth = getRoadWidth(segment.road_type) + (selected ? 2 : 0);
        ctx.beginPath();
        ctx.moveTo(points.from.x, points.from.y);
        ctx.lineTo(points.to.x, points.to.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        const mid = getSegmentMidpoint(nodes, segment);
        ctx.fillStyle = "#dff7ff";
        ctx.font = "700 13px Microsoft YaHei, sans-serif";
        ctx.fillText(segment.name, mid.x + 7, mid.y - 7);
      });

      cameras.forEach((camera) => {
        ctx.fillStyle = "#21d4fd";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(camera.x, camera.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      events.forEach((event) => {
        const pos = eventPosition(nodes, segments, event);
        ctx.fillStyle = "#e74c3c";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 16px Microsoft YaHei, sans-serif";
        ctx.fillText("!", pos.x - 4, pos.y + 6);
      });

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 18px Microsoft YaHei, sans-serif";
      ctx.fillText(`Canvas 标准路网拓扑 · ${currentTimeSec}s`, 28, 34);
      ctx.fillStyle = "#9fc4d8";
      ctx.font = "13px Microsoft YaHei, sans-serif";
      ctx.fillText(currentDescription, 28, 58);

      const drawMs = performance.now() - start;
      onMetricsChange(firstRender.current ? { render_time_ms: drawMs, update_time_ms: drawMs } : { update_time_ms: drawMs });
      firstRender.current = false;
      animationRef.current = window.requestAnimationFrame(draw);
    };

    animationRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    };
  }, [nodes, segments, cameras, events, selectedSegmentId, currentTimeSec, currentDescription, onMetricsChange]);

  const pickSegment = (clientX: number, clientY: number): RoadSegment | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    let best: RoadSegment | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    segments.forEach((segment) => {
      const points = getSegmentPoints(nodes, segment);
      if (!points) return;
      const distance = distanceToSegment(x, y, points.from.x, points.from.y, points.to.x, points.to.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = segment;
      }
    });
    return bestDistance < 18 ? best : null;
  };

  return (
    <div className="topology-card">
      <canvas
        ref={canvasRef}
        className="canvas-topology"
        width={760}
        height={540}
        onMouseMove={(event) => {
          hoverSegmentRef.current = pickSegment(event.clientX, event.clientY);
          event.currentTarget.style.cursor = hoverSegmentRef.current ? "pointer" : "default";
        }}
        onMouseLeave={() => {
          hoverSegmentRef.current = null;
        }}
        onClick={(event) => {
          const segment = pickSegment(event.clientX, event.clientY);
          if (segment) onSelectSegment(segment.segment_id);
        }}
      />
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "rgba(139, 211, 255, 0.18)";
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 28);
    ctx.lineTo(x, height - 28);
    ctx.stroke();
  }
  for (let y = 50; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(38, y);
    ctx.lineTo(width - 38, y);
    ctx.stroke();
  }
}
