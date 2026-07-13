import { createContext, useContext, useEffect, useRef, useState } from "react";

export interface BoxData {
  track_id: number;
  class_name: string;
  confidence?: number;
  bbox: number[];
}

export interface FrameMetadata {
  width: number;
  height: number;
  updated_at: number;
}

interface TrafficFlow {
  entry_count: number;
  exit_count: number;
  flow_per_min: number;
}

interface StreamState {
  boxes: Record<string, BoxData[]>;
  traffic: Record<string, TrafficFlow>;
  lanes: Record<string, number>;
  frames: Record<string, FrameMetadata>;
}

const emptyState: StreamState = { boxes: {}, traffic: {}, lanes: {}, frames: {} };
const StreamContext = createContext<StreamState>(emptyState);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>(emptyState);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/v1/cameras/boxes/stream");
    let opened = false;
    esRef.current = es;
    es.onopen = () => { opened = true; };
    es.onmessage = (e) => {
      try {
        const all = JSON.parse(e.data);
        const { _traffic, _lanes, _derived, _frames, ...boxes } = all;
        setState({
          boxes,
          traffic: _traffic || {},
          lanes: _lanes || {},
          frames: _frames || {},
        });
      } catch {}
    };
    es.onerror = () => {
      if (opened) return;
      es.close();
      if (esRef.current === es) esRef.current = null;
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
