import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LAUNCH_PHASES, T, type LaunchPhase } from "@/lib/animations/timelines";

// Clear sessionStorage key "smartflow:v1:launched" to manually test first-launch behavior.
const SESSION_KEY = "smartflow:v1:launched";

interface LaunchContextValue {
  phase: LaunchPhase;
  launched: boolean;
  isFirstLaunch: boolean;
  isBirthingWorkspace: boolean;
  canRenderAppShell: boolean;
  shouldShowAppShell: boolean;
  shouldRunLaunchExperience: boolean;
  notifyPhase: (phase: LaunchPhase) => void;
  notifyLaunched: () => void;
  completeLaunchSession: () => void;
}

const LaunchContext = createContext<LaunchContextValue>({
  phase: LAUNCH_PHASES.READY,
  launched: true,
  isFirstLaunch: false,
  isBirthingWorkspace: true,
  canRenderAppShell: true,
  shouldShowAppShell: true,
  shouldRunLaunchExperience: false,
  notifyPhase: () => {},
  notifyLaunched: () => {},
  completeLaunchSession: () => {},
});

function readLaunchSession() {
  return (
    typeof window !== "undefined" &&
    sessionStorage.getItem(SESSION_KEY) === "1"
  );
}

export function LaunchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [hasLaunchSession, setHasLaunchSession] = useState(readLaunchSession);
  const [launched, setLaunched] = useState(hasLaunchSession);
  const [phase, setPhase] = useState<LaunchPhase>(
    hasLaunchSession ? LAUNCH_PHASES.READY : LAUNCH_PHASES.VOID,
  );

  const persistLaunchSession = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    setHasLaunchSession(true);
  }, []);

  const completeLaunchSession = useCallback(() => {
    persistLaunchSession();
    setPhase(LAUNCH_PHASES.READY);
    setLaunched(true);
  }, [persistLaunchSession]);

  useEffect(() => {
    if (launched) return;
    const fallback = setTimeout(() => {
      completeLaunchSession();
    }, T.SAFETY_FALLBACK);
    return () => clearTimeout(fallback);
  }, [completeLaunchSession, launched]);

  const notifyPhase = useCallback((nextPhase: LaunchPhase) => {
    setPhase(nextPhase);
    if (nextPhase === LAUNCH_PHASES.READY) {
      setLaunched(true);
    }
  }, []);

  const notifyLaunched = useCallback(() => setLaunched(true), []);

  const isFirstLaunch = !hasLaunchSession;
  const shouldRunLaunchExperience = isFirstLaunch;
  const isBirthingWorkspace =
    launched || phase === LAUNCH_PHASES.BIRTHING || phase === LAUNCH_PHASES.READY;
  const canRenderAppShell = isBirthingWorkspace;
  const shouldShowAppShell = canRenderAppShell;

  const value = useMemo(
    () => ({
      phase,
      launched,
      isFirstLaunch,
      isBirthingWorkspace,
      canRenderAppShell,
      shouldShowAppShell,
      shouldRunLaunchExperience,
      notifyPhase,
      notifyLaunched,
      completeLaunchSession,
    }),
    [
      phase,
      launched,
      isFirstLaunch,
      isBirthingWorkspace,
      canRenderAppShell,
      shouldShowAppShell,
      shouldRunLaunchExperience,
      notifyPhase,
      notifyLaunched,
      completeLaunchSession,
    ],
  );

  return (
    <LaunchContext.Provider value={value}>
      {children}
    </LaunchContext.Provider>
  );
}

export function useLaunch() {
  return useContext(LaunchContext);
}
