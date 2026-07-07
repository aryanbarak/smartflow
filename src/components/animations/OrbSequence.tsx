// Phases 1–6: Void → Photon → Thinking → Deep Thinking → Decision → Ascend

const ORB_GRADIENT =
  "radial-gradient(circle at 36% 30%, #EDE8FF 0%, #B4A8FF 18%, #7B6FE8 46%, #3D2FBE 72%, #1A0F6B 92%)";

const SPECULAR = {
  position: "absolute" as const,
  top: "18%",
  left: "18%",
  width: "28%",
  height: "22%",
  borderRadius: "50%",
  background: "rgba(255,252,255,0.22)",
  filter: "blur(2px)",
};

export function OrbSequence() {
  return (
    <>
      {/* ── Phase 2: Photon dot (400–800ms) ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#C4B8FF",
          transform: "translate(-50%,-50%)",
          boxShadow: "0 0 8px rgba(196,184,255,0.9), 0 0 20px rgba(123,111,232,0.45)",
          animation: "sfDotAppear 0.40s ease-in-out 0.40s both",
        }}
      />

      {/* ── Phase 3: Heartbeat rings (800–1200ms) ────────────────────────── */}
      {([0.80, 0.93, 1.06] as const).map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `${i === 0 ? "1.5px" : "1px"} solid rgba(${
              i === 0 ? "196,184,255,0.45" : i === 1 ? "168,151,255,0.28" : "107,95,232,0.16"
            })`,
            animation: `sfRingExpand 0.68s ease-out ${delay}s both`,
          }}
        />
      ))}

      {/* ── Phase 3–5: Thinker orb at center (800–3700ms) ───────────────── */}
      {/* Formation: 0.5s @ 0.8s. Breathing: 2.4s × 2 @ 1.3s. Glow peak: 0.6s @ 3.0s. Exit: 0.25s @ 3.5s */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          borderRadius: "50%",
          background: ORB_GRADIENT,
          animation: [
            "sfOrbForm 0.50s ease-out 0.80s both",
            "sfOrbExpand 0.50s ease-out 0.80s both",
            "sfOrbBreatheLarge 2.40s ease-in-out 1.30s 2",
            "sfDecisionGlowPeak 0.60s ease-in-out 3.00s both",
            "sfOrbThinkerExit 0.25s ease-in 3.50s both",
          ].join(", "),
          zIndex: 10,
        }}
      >
        <div style={SPECULAR} />
      </div>

      {/* ── Phase 4: Deep-thinking dotted rings (2000–4200ms) ────────────── */}
      {([2.00, 2.40, 2.80] as const).map((delay, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: `1px dashed rgba(168,151,255,${0.28 - i * 0.06})`,
            animation: `sfDeepRingExpand 2.00s ease-out ${delay}s both`,
          }}
        />
      ))}

      {/* ── Phase 5: Decision beam — vertical line shoots upward ─────────── */}
      {/* Beam occupies top 50% of screen, origin at center, shoots up */}
      <div
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
            "sfBeamShoot 0.45s ease-out 3.10s both",
            "sfBeamFade 0.50s ease-in 3.55s both",
          ].join(", "),
          zIndex: 11,
        }}
      />

      {/* ── Phase 6: Journey orb — ascent from center to sidebar ─────────── */}
      <div
        style={{
          position: "absolute",
          borderRadius: "50%",
          background: ORB_GRADIENT,
          animation: "sfOrbAscent 1.00s cubic-bezier(0.4,0,0.25,1) 3.60s both",
          zIndex: 12,
        }}
      >
        <div style={{ ...SPECULAR, filter: "blur(1px)" }} />
      </div>

      {/* ── Phase 6: Light trail along ascent arc ────────────────────────── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          animation: "sfTrailLife 1.00s ease-in-out 3.65s both",
          pointerEvents: "none",
          zIndex: 11,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <filter id="sfTGlow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          <filter id="sfSGlow2" x="-200%" y="-200%" width="600%" height="600%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
          </filter>
        </defs>
        <path
          d="M 50 50 C 36 28 16 14 3 4"
          stroke="rgba(168,151,255,0.55)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#sfTGlow2)"
        />
        <path
          d="M 50 50 C 36 28 16 14 3 4"
          stroke="rgba(168,151,255,0.22)"
          strokeWidth="0.4"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <circle cx="40" cy="40" r="0.9"  fill="rgba(196,184,255,0.75)" filter="url(#sfSGlow2)" />
        <circle cx="27" cy="27" r="0.7"  fill="rgba(196,184,255,0.58)" filter="url(#sfSGlow2)" />
        <circle cx="14" cy="16" r="0.55" fill="rgba(196,184,255,0.45)" filter="url(#sfSGlow2)" />
        <circle cx="7"  cy="8"  r="0.45" fill="rgba(196,184,255,0.35)" filter="url(#sfSGlow2)" />
      </svg>

      {/* ── Phase 6: Light spread from nav position across workspace ─────── */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(107,95,232,0.18) 0%, rgba(74,63,212,0.08) 45%, transparent 70%)",
          transformOrigin: "center",
          animation: "sfLightSpread 1.20s ease-out 4.20s both",
          pointerEvents: "none",
          zIndex: 13,
        }}
      />

      {/* ── Phase 6: Sidebar column ambient glow ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 256,
          height: "100%",
          background:
            "radial-gradient(ellipse at 16% 6%, rgba(107,95,232,0.24) 0%, transparent 58%)",
          animation:
            "sfNavGlowAppear 0.30s ease-out 4.30s both, sfNavGlowBreathe 2.4s ease-in-out 4.50s infinite",
          opacity: 0,
          zIndex: 19,
        }}
      />

      {/* ── Phase 6: Nav orb at sidebar logo position (42,42 center) ────── */}
      {/* top:30 + 24/2 = 42 ✓  left:30 + 24/2 = 42 ✓ */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: ORB_GRADIENT,
          animation:
            "sfNavOrbArrive 0.22s cubic-bezier(0.34,1.56,0.64,1) 4.30s both, sfOrbBreatheNav 2.4s ease-in-out 4.52s infinite",
          zIndex: 22,
        }}
      >
        <div style={{ ...SPECULAR, filter: "blur(1px)" }} />
      </div>
    </>
  );
}
