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

interface StreamState {
  boxes: Record<string, BoxData[]>;
  traffic: Record<string, TrafficFlow>;
  lanes: Record<string, number>;
}

const StreamContext = createContext<StreamState>({ boxes: {}, traffic: {}, lanes: {} });

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>({ boxes: {}, traffic: {}, lanes: {} });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/v1/cameras/boxes/stream");
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const all = JSON.parse(e.data);
        const { _traffic, _lanes, _derived, ...boxes } = all;
        setState({ boxes, traffic: _traffic || {}, lanes: _lanes || {} });
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
