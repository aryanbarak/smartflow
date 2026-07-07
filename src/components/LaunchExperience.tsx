import { useEffect, useState } from "react";
import { useLaunch } from "@/contexts/LaunchContext";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { OrbSequence } from "@/components/animations/OrbSequence";
import { WorkspaceBirth } from "@/components/animations/WorkspaceBirth";
import "@/styles/animations.css";
import { T } from "@/lib/animations/timelines";

const SESSION_KEY = "smartflow:v1:launched";

export function LaunchExperience() {
  const { notifyLaunched } = useLaunch();
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName =
    profile?.displayName?.trim() || user?.email?.split("@")[0] || null;

  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));
  const [exiting, setExiting] = useState(false);

  // Respect prefers-reduced-motion — skip the full sequence immediately
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!visible) return;

    if (prefersReducedMotion) {
      notifyLaunched();
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
      return;
    }

    // T.NOTIFY_LAUNCHED (9800ms): real dashboard cards begin their entrance
    const notifyTimer = setTimeout(notifyLaunched, T.NOTIFY_LAUNCHED);

    // T.EXIT_START (9800ms): overlay begins fading — real cards are mid-animation
    const exitTimer = setTimeout(() => {
      setExiting(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, T.EXIT_START);

    // T.UNMOUNT (11200ms): DOM cleanup
    const unmountTimer = setTimeout(() => setVisible(false), T.UNMOUNT);

    return () => {
      clearTimeout(notifyTimer);
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [visible, notifyLaunched, prefersReducedMotion]);

  if (!visible) return null;

  return (
    <>
      {/* DM Sans italic 300 for greeting — 9.2s of load time before it appears */}
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
        {/* Phases 1–6: Void → Photon → Thinking → Deep Thinking → Decision → Ascend */}
        <OrbSequence />

        {/* Phases 7–10: Building Structure → Crystalizing → Life → Ready */}
        <WorkspaceBirth displayName={displayName} />
      </div>
    </>
  );
}
