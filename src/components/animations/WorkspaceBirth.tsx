import { S, T } from "@/lib/animations/timelines";

interface Props {
  displayName: string | null;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(3)}s`;

const SURFACE_HINTS = [
  {
    top: "14%",
    left: "clamp(18px, 19vw, 300px)",
    width: "min(64vw, 760px)",
    height: 42,
    offset: 0,
  },
  {
    top: "25%",
    left: "clamp(18px, 20vw, 320px)",
    width: "min(58vw, 680px)",
    height: 108,
    offset: 180,
  },
  {
    top: "41%",
    left: "clamp(18px, 18vw, 288px)",
    width: "min(70vw, 860px)",
    height: 132,
    offset: 360,
  },
  {
    top: "61%",
    left: "clamp(18px, 22vw, 360px)",
    width: "min(54vw, 620px)",
    height: 92,
    offset: 560,
  },
] as const;

function getGreeting(name: string | null): string {
  const h = new Date().getHours();
  const suffix = name ? `, ${name}` : "";
  if (h >= 5 && h < 12) return `Good morning${suffix}.`;
  if (h >= 12 && h < 17) return `Good afternoon${suffix}.`;
  if (h >= 17 && h < 21) return `Good evening${suffix}.`;
  return `Still here${suffix}.`;
}

export function WorkspaceBirth({ displayName }: Readonly<Props>) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(ellipse 54% 32% at 50% 0%, rgba(230,226,255,0.20), transparent 68%)",
            "radial-gradient(ellipse 42% 28% at 50% 18%, rgba(34,211,238,0.08), transparent 72%)",
            "linear-gradient(to bottom, rgba(123,111,232,0.08), rgba(7,6,14,0.02) 58%, transparent 100%)",
          ].join(", "),
          animation: `sfBirthBridgeField 1.30s ease-out ${S.LIGHT_SPREAD} both`,
          zIndex: 13,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "min(34vw, 280px)",
          minWidth: 120,
          height: "100%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(196,184,255,0.18) 16%, rgba(123,111,232,0.09) 48%, rgba(34,211,238,0.04) 72%, transparent 94%)",
          filter: "blur(16px)",
          animation: `sfBirthVerticalField 1.45s ease-out ${S.LIGHT_SPREAD} both`,
          zIndex: 14,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "min(92vw, 1180px)",
          height: "78%",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(230,226,255,0.16) 12%, rgba(123,111,232,0.09) 32%, rgba(34,211,238,0.035) 54%, transparent 78%)",
          mixBlendMode: "screen",
          animation: `sfCreationWashDown 1.85s cubic-bezier(0.22,1,0.36,1) ${S.STRUCTURE_START} both`,
          zIndex: 15,
        }}
      />

      {SURFACE_HINTS.map((hint, index) => (
        <div
          key={hint.top}
          style={{
            position: "absolute",
            top: hint.top,
            left: hint.left,
            width: hint.width,
            height: hint.height,
            borderRadius: 10,
            border: "1px solid rgba(196,184,255,0.13)",
            background:
              "linear-gradient(180deg, rgba(230,226,255,0.06), rgba(123,111,232,0.035))",
            boxShadow: "0 0 32px rgba(123,111,232,0.08)",
            overflow: "hidden",
            animation: `sfAmbientSurfaceHint 1.05s ease-out ${seconds(T.STRUCTURE_START + hint.offset)} both`,
            zIndex: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: index % 2 === 0 ? "8%" : "18%",
              right: index % 2 === 0 ? "18%" : "8%",
              height: 1,
              background:
                "linear-gradient(to right, transparent, rgba(230,226,255,0.48), transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(105deg, transparent 0%, rgba(230,226,255,0.12) 42%, transparent 72%)",
              animation: `sfSurfaceHintGlint 0.80s ease-out ${seconds(T.STRUCTURE_START + hint.offset + 140)} both`,
            }}
          />
        </div>
      ))}

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "clamp(20px, 3vw, 26px)",
            fontWeight: 300,
            fontStyle: "italic",
            letterSpacing: "0.02em",
            color: "rgba(230,226,255,0.80)",
            whiteSpace: "nowrap",
            animation: `sfGreetingReveal 1.15s ease-in-out ${S.GREETING} both`,
            opacity: 0,
          }}
        >
          {getGreeting(displayName)}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "rgba(168,151,255,0.50)",
            whiteSpace: "nowrap",
            animation: `sfSubtitleReveal 1.15s ease-in-out ${seconds(T.GREETING + 160)} both`,
            opacity: 0,
            marginTop: 8,
          }}
        >
          Here is your workspace for today.
        </div>
      </div>
    </div>
  );
}
