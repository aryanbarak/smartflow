import { useEffect, useState } from "react";
import { useLaunch } from "@/contexts/LaunchContext";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { OrbSequence } from "@/components/animations/OrbSequence";
import { WorkspaceBirth } from "@/components/animations/WorkspaceBirth";
import "@/styles/animations.css";
import { LAUNCH_PHASES, T } from "@/lib/animations/timelines";

export function LaunchExperience() {
  const {
    shouldRunLaunchExperience,
    notifyPhase,
    notifyLaunched,
    completeLaunchSession,
  } = useLaunch();
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName =
    profile?.displayName?.trim() || user?.email?.split("@")[0] || null;

  const [visible, setVisible] = useState(shouldRunLaunchExperience);
  const [exiting, setExiting] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    setVisible(shouldRunLaunchExperience);
  }, [shouldRunLaunchExperience]);

  useEffect(() => {
    if (!visible) return;

    if (prefersReducedMotion) {
      notifyPhase(LAUNCH_PHASES.READY);
      notifyLaunched();
      completeLaunchSession();
      setVisible(false);
      return;
    }

    const phaseTimers = [
      setTimeout(() => notifyPhase(LAUNCH_PHASES.AWAKENING), T.PHOTON_START),
      setTimeout(() => notifyPhase(LAUNCH_PHASES.THINKING), T.ORB_FORM),
      setTimeout(() => notifyPhase(LAUNCH_PHASES.DECISION), T.DECISION_GLOW),
      setTimeout(() => notifyPhase(LAUNCH_PHASES.MOVING), T.ASCEND_START),
      setTimeout(() => notifyPhase(LAUNCH_PHASES.BIRTHING), T.STRUCTURE_START),
      setTimeout(() => notifyPhase(LAUNCH_PHASES.READY), T.UNMOUNT),
    ];

    const notifyTimer = setTimeout(notifyLaunched, T.NOTIFY_LAUNCHED);
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, T.EXIT_START);
    const unmountTimer = setTimeout(() => {
      completeLaunchSession();
      setVisible(false);
    }, T.UNMOUNT);

    return () => {
      phaseTimers.forEach(clearTimeout);
      clearTimeout(notifyTimer);
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [
    completeLaunchSession,
    visible,
    notifyPhase,
    notifyLaunched,
    prefersReducedMotion,
  ]);

  if (!visible) return null;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@1,9..40,300&display=swap"
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#07060E",
          overflow: "hidden",
          opacity: exiting ? 0 : 1,
          transition: exiting
            ? `opacity ${T.OVERLAY_FADE_MS}ms cubic-bezier(0.22,1,0.36,1)`
            : "none",
          pointerEvents: exiting ? "none" : undefined,
        }}
      >
        <OrbSequence />
        <WorkspaceBirth displayName={displayName} />
      </div>
    </>
  );
}
