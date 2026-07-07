// Phases 7–10: Building the Structure → Crystalizing → Life Enters → Ready

interface Props {
  displayName: string | null;
}

// Content area geometry (desktop 1440px: sidebar 256px + lg:px-8 32px left padding)
const CX = 288;  // content left x
const CW = 1120; // content width (1440 - 288 - 32px right pad)
const GAP = 12;
const ROW_H1 = 160;
const ROW_H2 = 140;
const ROW_TOP1 = 64;
const ROW_TOP2 = ROW_TOP1 + ROW_H1 + 16;

// 3-column row 1, 2-column row 2
const COL3 = (CW - GAP * 2) / 3; // ~365px
const COL2 = (CW - GAP) / 2;     // ~554px

interface CardDef {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  structureDelay: number; // phase 7
  crystalDelay:  number;  // phase 8
  contentDelay:  number;  // phase 9
  rows: number[];         // content skeleton row widths %
}

const CARDS: CardDef[] = [
  {
    x: CX,             y: ROW_TOP1, w: COL3, h: ROW_H1,
    label: "Tasks",    structureDelay: 4.60, crystalDelay: 6.20, contentDelay: 7.80,
    rows: [55, 38, 28],
  },
  {
    x: CX + COL3 + GAP, y: ROW_TOP1, w: COL3, h: ROW_H1,
    label: "Calendar", structureDelay: 4.75, crystalDelay: 6.35, contentDelay: 7.95,
    rows: [62, 42],
  },
  {
    x: CX + (COL3 + GAP) * 2, y: ROW_TOP1, w: COL3, h: ROW_H1,
    label: "AI Briefing", structureDelay: 4.90, crystalDelay: 6.50, contentDelay: 8.10,
    rows: [70, 48, 32],
  },
  {
    x: CX,             y: ROW_TOP2, w: COL2, h: ROW_H2,
    label: "Notes",    structureDelay: 5.05, crystalDelay: 6.65, contentDelay: 8.25,
    rows: [60, 44],
  },
  {
    x: CX + COL2 + GAP, y: ROW_TOP2, w: COL2, h: ROW_H2,
    label: "Documents", structureDelay: 5.20, crystalDelay: 6.80, contentDelay: 8.40,
    rows: [65, 46],
  },
];

function getGreeting(name: string | null): string {
  const h = new Date().getHours();
  const suffix = name ? `, ${name}` : "";
  if (h >= 5  && h < 12) return `Good morning${suffix}.`;
  if (h >= 12 && h < 17) return `Good afternoon${suffix}.`;
  if (h >= 17 && h < 21) return `Good evening${suffix}.`;
  return `Still here${suffix}.`;
}

export function WorkspaceBirth({ displayName }: Readonly<Props>) {
  return (
    <div className="hidden lg:block" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

      {/* ── Content-area luminous surface field (appears with trail at 4.2s) ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: CX,
          right: 0,
          bottom: 0,
          background: [
            "radial-gradient(ellipse 65% 45% at 52% 35%, rgba(107,95,232,0.08) 0%, transparent 70%)",
            "radial-gradient(ellipse 38% 28% at 76% 68%, rgba(74,63,212,0.06) 0%, transparent 65%)",
          ].join(", "),
          animation: "sfContentFieldAppear 0.60s ease-out 4.20s both",
          zIndex: 14,
        }}
      />

      {CARDS.map((card) => (
        <div key={card.label}>
          {/* Phase 7: Structure outline — framework skeleton */}
          <div
            style={{
              position: "absolute",
              top: card.y,
              left: card.x,
              width: card.w,
              height: card.h,
              borderRadius: 10,
              border: "1px solid rgba(107,95,232,0.14)",
              background: "rgba(15,10,38,0.30)",
              animation: `sfSurfaceReveal 0.50s ease-out ${card.structureDelay}s both`,
              zIndex: 15,
            }}
          >
            {/* Faint top-edge accent line on structure */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background:
                  "linear-gradient(to right, transparent, rgba(107,95,232,0.25), transparent)",
              }}
            />
          </div>

          {/* Phase 8: Crystallized card — fills in from light */}
          <div
            style={{
              position: "absolute",
              top: card.y,
              left: card.x,
              width: card.w,
              height: card.h,
              borderRadius: 10,
              border: "1px solid rgba(107,95,232,0.22)",
              background: "rgba(20,14,50,0.82)",
              overflow: "hidden",
              animation: `sfCardCrystalize 0.42s cubic-bezier(0.34,1.56,0.64,1) ${card.crystalDelay}s both`,
              zIndex: 16,
            }}
          >
            {/* Bright top edge — "born from light" highlight */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1.5,
                background:
                  "linear-gradient(to right, transparent, rgba(168,151,255,0.82), transparent)",
              }}
            />
            {/* Shimmer sweep at birth */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 72,
                background:
                  "linear-gradient(to right, transparent, rgba(168,151,255,0.12), transparent)",
                animation: `sfShimmerOnce 0.75s ease-out ${card.crystalDelay + 0.1}s both`,
              }}
            />
            {/* Phase 9: Content skeleton lines */}
            <div
              style={{
                padding: "14px 14px 0",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {card.rows.map((pct, j) => (
                <div
                  key={j}
                  style={{
                    width: `${pct}%`,
                    height: j === 0 ? 6 : 4,
                    borderRadius: 3,
                    background: `rgba(168,151,255,${j === 0 ? "0.32" : j === 1 ? "0.18" : "0.11"})`,
                    animation: `sfContentLineFade 0.30s ease-out ${card.contentDelay + j * 0.08}s both`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ── Phase 10: Time-aware greeting — appears at 9.2s ───────────────── */}
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
            animation: "sfGreetingReveal 1.50s ease-in-out 9.20s both",
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
            animation: "sfSubtitleReveal 1.50s ease-in-out 9.40s both",
            opacity: 0,
            marginTop: 8,
          }}
        >
          Here is your overview for today.
        </div>
      </div>
    </div>
  );
}
