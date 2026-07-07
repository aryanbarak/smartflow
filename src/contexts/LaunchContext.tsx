import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

const SESSION_KEY = "smartflow:v1:launched";

interface LaunchContextValue {
  launched: boolean;
  notifyLaunched: () => void;
}

const LaunchContext = createContext<LaunchContextValue>({
  launched: true,
  notifyLaunched: () => {},
});

export function LaunchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [launched, setLaunched] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  // Safety fallback: if LaunchExperience never fires (error, skip), unblock cards after 14s
  // 14s covers the full ~11.2s sequence plus margin
  useEffect(() => {
    if (launched) return;
    const fallback = setTimeout(() => setLaunched(true), 14000);
    return () => clearTimeout(fallback);
  }, [launched]);

  const notifyLaunched = useCallback(() => setLaunched(true), []);

  const value = useMemo(() => ({ launched, notifyLaunched }), [launched, notifyLaunched]);

  return (
    <LaunchContext.Provider value={value}>
      {children}
    </LaunchContext.Provider>
  );
}

export function useLaunch() {
  return useContext(LaunchContext);
}
