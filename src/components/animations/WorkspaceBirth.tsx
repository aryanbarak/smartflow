import { S, T } from "@/lib/animations/timelines";

interface Props {
  displayName: string | null;
}

const CX = 288;
const CW = 1120;
const GAP = 12;

const COL3 = (CW - GAP * 2) / 3;
const COL2 = (CW - GAP) / 2;
const RIGHT_W = 280;
const LEFT_W = CW - RIGHT_W - 20;

const seconds = (ms: number) => `${(ms / 1000).toFixed(3)}s`;

interface SurfaceDef {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  structureOffset: number;
  crystalOffset: number;
  contentOffset: number;
  rows: number[];
}

const SURFACES: SurfaceDef[] = [
  {
    x: CX,
    y: 34,
    w: 270,
    h: 22,
    label: "Context",
    structureOffset: 0,
    crystalOffset: 360,
    contentOffset: 520,
    rows: [70],
  },
  {
    x: CX,
    y: 76,
    w: COL3,
    h: 148,
    label: "Tasks",
    structureOffset: 140,
    crystalOffset: 520,
    contentOffset: 650,
    rows: [55, 38, 28],
  },
  {
    x: CX + COL3 + GAP,
    y: 76,
    w: COL3,
    h: 148,
    label: "Calendar",
    structureOffset: 220,
    crystalOffset: 600,
    contentOffset: 720,
    rows: [62, 42],
  },
  {
    x: CX + (COL3 + GAP) * 2,
    y: 76,
    w: COL3,
    h: 148,
    label: "Finance",
    structureOffset: 300,
    crystalOffset: 680,
    contentOffset: 790,
    rows: [58, 46],
  },
  {
    x: CX + LEFT_W + 20,
    y: 244,
    w: RIGHT_W,
    h: 245,
    label: "Flow AI",
    structureOffset: 460,
    crystalOffset: 880,
    contentOffset: 940,
    rows: [52, 68, 44, 40],
  },
  {
    x: CX,
    y: 244,
    w: (LEFT_W - GAP * 2) / 3,
    h: 136,
    label: "Learning",
    structureOffset: 540,
    crystalOffset: 960,
    contentOffset: 1000,
    rows: [58, 36],
  },
  {
    x: CX + (LEFT_W - GAP * 2) / 3 + GAP,
    y: 244,
    w: (LEFT_W - GAP * 2) / 3,
    h: 136,
    label: "Focus",
    structureOffset: 620,
    crystalOffset: 1040,
    contentOffset: 1060,
    rows: [66, 46, 32],
  },
  {
    x: CX + ((LEFT_W - GAP * 2) / 3 + GAP) * 2,
    y: 244,
    w: (LEFT_W - GAP * 2) / 3,
    h: 136,
    label: "Insights",
    structureOffset: 700,
    crystalOffset: 1120,
    contentOffset: 1120,
    rows: [62, 40],
  },
  {
    x: CX,
    y: 400,
    w: LEFT_W,
    h: 150,
    label: "Briefing",
    structureOffset: 860,
    crystalOffset: 1300,
    contentOffset: 1240,
    rows: [72, 56, 42],
  },
  {
    x: CX,
    y: 570,
    w: LEFT_W,
    h: 96,
    label: "Recommendations",
    structureOffset: 1020,
    crystalOffset: 1480,
    contentOffset: 1340,
    rows: [64, 46],
  },
  {
    x: CX + LEFT_W + 20,
    y: 510,
    w: RIGHT_W,
    h: 128,
    label: "Actions",
    structureOffset: 1100,
    crystalOffset: 1580,
    contentOffset: 1420,
    rows: [54, 44, 38],
  },
];

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
    <div className="hidden lg:block" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: CX,
          right: 0,
          bottom: 0,
          background: [
            "radial-gradient(ellipse 58% 32% at 50% 0%, rgba(196,184,255,0.12) 0%, transparent 70%)",
            "linear-gradient(to bottom, rgba(123,111,232,0.08), rgba(74,63,212,0.035) 42%, transparent 82%)",
          ].join(", "),
          animation: `sfContentFieldAppear 0.65s ease-out ${S.STRUCTURE_START} both`,
          zIndex: 14,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 180,
          height: "100%",
          background:
            "linear-gradient(to bottom, rgba(230,226,255,0.22), rgba(168,151,255,0.13) 28%, rgba(107,95,232,0.05) 58%, transparent 88%)",
          animation: `sfVerticalLightField 1.10s ease-out ${S.STRUCTURE_START} both`,
          zIndex: 15,
        }}
      />

      {SURFACES.map((surface) => {
        const structureDelay = seconds(T.STRUCTURE_START + surface.structureOffset);
        const crystalDelay = seconds(T.CRYSTALIZE_START + surface.crystalOffset);
        const contentDelay = T.LIFE_START + surface.contentOffset;

        return (
          <div key={surface.label}>
            <div
              style={{
                position: "absolute",
                top: surface.y,
                left: surface.x,
                width: surface.w,
                height: surface.h,
                borderRadius: surface.h < 40 ? 8 : 12,
                border: "1px solid rgba(168,151,255,0.15)",
                background: "rgba(15,10,38,0.26)",
                animation: `sfSurfaceRevealFromTop 0.58s ease-out ${structureDelay} both`,
                zIndex: 16,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "12%",
                  right: "12%",
                  height: 1,
                  background:
                    "linear-gradient(to right, transparent, rgba(196,184,255,0.45), transparent)",
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                top: surface.y,
                left: surface.x,
                width: surface.w,
                height: surface.h,
                borderRadius: surface.h < 40 ? 8 : 12,
                border: "1px solid rgba(168,151,255,0.24)",
                background: "rgba(20,14,50,0.80)",
                overflow: "hidden",
                animation: `sfCardCrystalizeFromTop 0.48s cubic-bezier(0.22,1,0.36,1) ${crystalDelay} both`,
                zIndex: 17,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1.5,
                  background:
                    "linear-gradient(to right, transparent, rgba(230,226,255,0.82), transparent)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 72,
                  background:
                    "linear-gradient(to bottom, transparent, rgba(230,226,255,0.12), transparent)",
                  animation: `sfShimmerDown 0.80s ease-out ${seconds(T.CRYSTALIZE_START + surface.crystalOffset + 80)} both`,
                }}
              />
              <div
                style={{
                  padding: surface.h < 40 ? "8px 12px 0" : "14px 14px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {surface.rows.map((pct, j) => (
                  <div
                    key={j}
                    style={{
                      width: `${pct}%`,
                      height: j === 0 ? 6 : 4,
                      borderRadius: 3,
                      background: `rgba(196,184,255,${j === 0 ? "0.32" : j === 1 ? "0.18" : "0.11"})`,
                      animation: `sfContentLineFade 0.30s ease-out ${seconds(contentDelay + j * 80)} both`,
                      opacity: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

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
            fontSize: 26,
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
