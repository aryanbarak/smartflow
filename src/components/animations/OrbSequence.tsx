import { FlowAIOrb, type FlowAIOrbState } from "@/components/FlowAIOrb";
import { useLaunch } from "@/contexts/LaunchContext";
import { LAUNCH_PHASES, S, T, type LaunchPhase } from "@/lib/animations/timelines";

const seconds = (ms: number) => `${(ms / 1000).toFixed(3)}s`;

function mapLaunchPhaseToOrbState(phase: LaunchPhase): FlowAIOrbState {
  switch (phase) {
    case LAUNCH_PHASES.VOID:
    case LAUNCH_PHASES.IDLE:
      return "dormant";
    case LAUNCH_PHASES.AWAKENING:
      return "awakening";
    case LAUNCH_PHASES.THINKING:
      return "thinking";
    case LAUNCH_PHASES.DECISION:
      return "decision";
    case LAUNCH_PHASES.MOVING:
    case LAUNCH_PHASES.BIRTHING:
      return "creating";
    case LAUNCH_PHASES.READY:
      return "ready";
    default:
      return "presence";
  }
}

export function OrbSequence() {
  const { phase } = useLaunch();
  const orbState = mapLaunchPhaseToOrbState(phase);
  const settledOrbState: FlowAIOrbState =
    phase === LAUNCH_PHASES.READY ? "ready" : phase === LAUNCH_PHASES.BIRTHING ? "creating" : orbState;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 24,
          height: 24,
          transform: "translate(-50%,-50%)",
          animation: `sfDotAppear 0.43s ease-in-out ${S.PHOTON_START} both`,
          zIndex: 8,
        }}
      >
        <FlowAIOrb
          size={24}
          state="awakening"
          beam={false}
          particles={false}
          glowIntensity={0.75}
          theme="transparent"
        />
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 80,
          height: 80,
          animation: [
            `sfOrbForm 0.55s ease-out ${S.ORB_FORM} both`,
            `sfFlowOrbFormScale 0.55s ease-out ${S.ORB_FORM} both`,
            `sfFlowOrbBreatheLarge 1.75s ease-in-out ${S.BREATHE_START} 2`,
            `sfFlowOrbDecisionHold 0.50s ease-in-out ${S.DECISION_GLOW} both`,
            `sfOrbThinkerExit 0.25s ease-in ${S.THINKER_EXIT} both`,
          ].join(", "),
          zIndex: 10,
        }}
      >
        <FlowAIOrb
          size={80}
          state={orbState}
          beam={false}
          particles
          glowIntensity={phase === LAUNCH_PHASES.DECISION ? 1.2 : 1}
          theme="transparent"
        />
      </div>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "calc(50% - 1.5px)",
          top: 0,
          bottom: "50%",
          width: 3,
          transformOrigin: "bottom center",
          background:
            "linear-gradient(to top, rgba(168,151,255,0.9) 0%, rgba(196,184,255,0.4) 55%, transparent 100%)",
          boxShadow: "0 0 8px rgba(168,151,255,0.8), 0 0 20px rgba(107,95,232,0.4)",
          animation: [
            `sfBeamShoot 0.42s ease-out ${S.BEAM_SHOOT} both`,
            `sfBeamFade 0.45s ease-in ${S.BEAM_FADE} both`,
          ].join(", "),
          zIndex: 11,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 80,
          height: 80,
          animation: `sfFlowOrbAscent 0.85s cubic-bezier(0.4,0,0.25,1) ${S.ASCEND_START} both`,
          zIndex: 12,
        }}
      >
        <FlowAIOrb
          size={80}
          state="creating"
          beam={false}
          particles
          glowIntensity={1.05}
          theme="transparent"
        />
      </div>

      <svg
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          animation: `sfTrailLife 0.95s ease-in-out ${S.TRAIL_START} both`,
          pointerEvents: "none",
          zIndex: 11,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <filter id="sfLogoTrailGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          <filter id="sfLogoSparkGlow" x="-200%" y="-200%" width="600%" height="600%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
          </filter>
        </defs>
        <path
          d="M 50 50 C 36 30 16 15 3 7"
          stroke="rgba(168,151,255,0.55)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#sfLogoTrailGlow)"
        />
        <path
          d="M 50 50 C 36 30 16 15 3 7"
          stroke="rgba(196,184,255,0.26)"
          strokeWidth="0.45"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <circle cx="39" cy="37" r="0.8" fill="rgba(196,184,255,0.72)" filter="url(#sfLogoSparkGlow)" />
        <circle cx="25" cy="24" r="0.65" fill="rgba(196,184,255,0.55)" filter="url(#sfLogoSparkGlow)" />
        <circle cx="11" cy="13" r="0.5" fill="rgba(196,184,255,0.42)" filter="url(#sfLogoSparkGlow)" />
      </svg>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 36,
          height: 36,
          animation:
            `sfLogoOrbArrive 0.28s cubic-bezier(0.34,1.56,0.64,1) ${S.NAV_ORB} both, sfFlowLogoOrbBreathe 2.4s ease-in-out ${seconds(T.NAV_ORB + 220)} infinite`,
          zIndex: 22,
        }}
      >
        <FlowAIOrb
          size={36}
          state={settledOrbState}
          beam={false}
          particles={false}
          glowIntensity={0.78}
          theme="transparent"
        />
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          width: 760,
          height: 620,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at top, rgba(196,184,255,0.24) 0%, rgba(123,111,232,0.12) 36%, transparent 72%)",
          animation: `sfTopLightSpread 1.05s ease-out ${S.LIGHT_SPREAD} both`,
          pointerEvents: "none",
          zIndex: 13,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 220,
          height: "100%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, rgba(196,184,255,0.20), rgba(123,111,232,0.10) 32%, rgba(74,63,212,0.04) 62%, transparent)",
          animation: `sfVerticalLightField 1.20s ease-out ${S.LIGHT_SPREAD} both`,
          pointerEvents: "none",
          zIndex: 14,
        }}
      />
    </>
  );
}
