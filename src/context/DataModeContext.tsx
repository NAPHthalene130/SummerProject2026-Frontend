import { createContext, useContext, type ReactNode } from "react";

interface DataModeContextValue {
  demoDataEnabled: boolean;
  toggleDemoData: () => void;
}

const DataModeContext = createContext<DataModeContextValue | null>(null);

export function DataModeProvider({ children }: { children: ReactNode }) {
  return <DataModeContext.Provider value={{ demoDataEnabled: false, toggleDemoData: () => undefined }}>{children}</DataModeContext.Provider>;
}

export function useDataMode() {
  const value = useContext(DataModeContext);
  if (!value) {
    throw new Error("useDataMode must be used within DataModeProvider");
  }
  return value;
}
