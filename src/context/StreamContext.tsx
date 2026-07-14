import { createContext, useContext, useEffect, useRef, useState } from "react";

interface BoxData {
  track_id: number;
  class_name: string;
  bbox: number[];
}

interface TrafficFlow {
  entry_count: number;
  exit_count: number;
  flow_per_min: number;
}

// 对应后端 SSE payload 中 _derived 字段的结构（见 cameras.py stream_all_boxes）。
// 保留 _derived 后，MonitorPage 可通过 useStreamState().derived[cam_id] 直接读取，
// 无需额外轮询 /cameras/stats 或 /roads/traffic 获取这些衍生指标。
interface DerivedData {
  avg_speed: number;
  max_speed: number;
  car_count: number;
  truck_count: number;
  bus_count: number;
  moto_count: number;
}

interface StreamState {
  boxes: Record<string, BoxData[]>;
  traffic: Record<string, TrafficFlow>;
  lanes: Record<string, number>;
  derived: Record<string, DerivedData>;
}

const StreamContext = createContext<StreamState>({ boxes: {}, traffic: {}, lanes: {}, derived: {} });

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>({ boxes: {}, traffic: {}, lanes: {}, derived: {} });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/v1/cameras/boxes/stream");
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const all = JSON.parse(e.data);
        const { _traffic, _lanes, _derived, ...boxes } = all;
        setState({
          boxes,
          traffic: _traffic || {},
          lanes: _lanes || {},
          derived: _derived || {},
        });
      } catch {}
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  return (
    <StreamContext.Provider value={state}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStreamState() {
  return useContext(StreamContext);
}
