import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface DataModeContextValue {
  demoDataEnabled: boolean;
  toggleDemoData: () => void;
}

const DataModeContext = createContext<DataModeContextValue | null>(null);

// Use a versioned key so browsers that inherited the old default `true`
// migrate to the new backend-first default once.
const STORAGE_KEY = "smart-road-demo-data-enabled-v2";

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [demoDataEnabled, setDemoDataEnabled] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(demoDataEnabled));
  }, [demoDataEnabled]);

  const value = useMemo<DataModeContextValue>(() => ({
    demoDataEnabled,
    toggleDemoData: () => setDemoDataEnabled((current) => !current),
  }), [demoDataEnabled]);

  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>;
}

export function useDataMode() {
  const value = useContext(DataModeContext);
  if (!value) {
    throw new Error("useDataMode must be used within DataModeProvider");
  }
  return value;
}
