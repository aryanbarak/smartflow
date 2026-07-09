import { memo, useId } from "react";
import { motion } from "framer-motion";
import type { FlowAIOrbSizeSpec } from "./FlowAIOrbStates";

interface FlowAIOrbIdentityProps {
  glowIntensity: number;
  reducedMotion: boolean;
  sizeSpec: FlowAIOrbSizeSpec;
}

const thoughtDots = [
  {
    cx: 78,
    cy: 28,
    r: 2.8,
    minOpacity: 0.42,
    maxOpacity: 0.74,
    x: [0, 2.5, 1, 0],
    y: [0, -2, 1, 0],
    scale: [0.92, 1.08, 0.98, 1.04, 0.92],
    duration: 5.5,
    delay: 0.15,
  },
  {
    cx: 24,
    cy: 71,
    r: 2.55,
    minOpacity: 0.36,
    maxOpacity: 0.66,
    x: [0, -2, 1.5, 0],
    y: [0, 1.8, -1, 0],
    scale: [0.9, 1.02, 1.12, 0.96, 0.9],
    duration: 6.4,
    delay: 0.9,
  },
  {
    cx: 30,
    cy: 28,
    r: 2.25,
    minOpacity: 0.34,
    maxOpacity: 0.62,
    x: [0, -1.5, 2, 0],
    y: [0, -1, -2, 0],
    scale: [0.86, 1.1, 0.94, 1.04, 0.86],
    duration: 7.2,
    delay: 1.65,
  },
] as const;

function FlowAIOrbIdentityComponent({
  glowIntensity,
  reducedMotion,
  sizeSpec,
}: FlowAIOrbIdentityProps) {
  const id = useId().replace(/:/g, "");
  const sphereGradient = `flow-orb-identity-sphere-${id}`;
  const depthGradient = `flow-orb-identity-depth-${id}`;
  const coreGradient = `flow-orb-identity-core-${id}`;
  const livingFieldGradient = `flow-orb-identity-field-${id}`;
  const dotGradient = `flow-orb-identity-dot-${id}`;
  const softFilter = `flow-orb-identity-soft-${id}`;
  const glowFilter = `flow-orb-identity-glow-${id}`;
  const radius = Math.min(sizeSpec.orbRadius, 41);
  const glowOpacity = Math.min(0.46, glowIntensity * 0.42);

  return (
    <motion.svg
      aria-hidden
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      fill="none"
      initial={false}
      animate={reducedMotion ? { scale: 1 } : { scale: [1, 1.018, 0.992, 1] }}
      transition={{
        duration: reducedMotion ? 0 : 8.5,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
      style={{ transformOrigin: "50% 50%", transform: "translateZ(0)" }}
    >
      <defs>
        <radialGradient id={sphereGradient} cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.86)" />
          <stop offset="22%" stopColor="rgba(214,205,255,0.74)" />
          <stop offset="52%" stopColor="rgba(139,92,246,0.58)" />
          <stop offset="78%" stopColor="rgba(91,80,201,0.42)" />
          <stop offset="100%" stopColor="rgba(29,22,72,0.20)" />
        </radialGradient>
        <radialGradient id={depthGradient} cx="63%" cy="67%" r="64%">
          <stop offset="0%" stopColor="rgba(7,6,14,0.20)" />
          <stop offset="42%" stopColor="rgba(79,70,229,0.18)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0)" />
        </radialGradient>
        <radialGradient id={coreGradient} cx="48%" cy="46%" r="58%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="36%" stopColor="rgba(255,255,255,0.86)" />
          <stop offset="72%" stopColor="rgba(191,176,255,0.34)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0)" />
        </radialGradient>
        <linearGradient id={livingFieldGradient} x1="24" y1="38" x2="76" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="38%" stopColor="rgba(221,214,254,0.28)" />
          <stop offset="66%" stopColor="rgba(139,92,246,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={dotGradient} cx="45%" cy="42%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="44%" stopColor="rgba(216,204,255,0.86)" />
          <stop offset="72%" stopColor="rgba(139,92,246,0.44)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0)" />
        </radialGradient>
        <filter id={softFilter} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={glowFilter} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        cx="50"
        cy="50"
        r={radius + 8}
        fill="rgba(139,92,246,0.22)"
        filter={`url(#${glowFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: glowOpacity, scale: 1 }
            : { opacity: [glowOpacity * 0.72, glowOpacity, glowOpacity * 0.82], scale: [0.98, 1.04, 1] }
        }
        transition={{
          duration: reducedMotion ? 0 : 7.8,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "50px 50px" }}
      />

      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill={`url(#${sphereGradient})`}
        filter={`url(#${softFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.98 }
            : { opacity: [0.92, 1, 0.95], r: [radius, radius + 0.5, radius - 0.2, radius] }
        }
        transition={{
          duration: reducedMotion ? 0 : 8.5,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <circle cx="50" cy="50" r={radius * 0.96} fill={`url(#${depthGradient})`} />

      <motion.path
        d="M30 56 C35 36 54 27 70 39 C61 39 51 44 44 53 C38 61 34 66 30 56Z"
        fill="rgba(255,255,255,0.12)"
        filter={`url(#${softFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.26, x: 0, y: 0 }
            : { opacity: [0.18, 0.32, 0.22], x: [-0.4, 0.8, -0.2], y: [0.3, -0.6, 0.1] }
        }
        transition={{
          duration: reducedMotion ? 0 : 9.4,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.g
        filter={`url(#${softFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.24, x: 0, y: 0, scale: 1 }
            : {
                opacity: [0.16, 0.34, 0.22, 0.3, 0.16],
                x: [-1.2, 1.5, 0.2, -0.8, -1.2],
                y: [0.7, -0.9, 1.1, -0.2, 0.7],
                scale: [0.98, 1.04, 1, 1.03, 0.98],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : 7.4,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "50px 50px" }}
      >
        <ellipse
          cx="50"
          cy="51"
          rx={radius * 0.74}
          ry={radius * 0.34}
          fill={`url(#${livingFieldGradient})`}
          transform="rotate(-18 50 51)"
        />
        <ellipse
          cx="50"
          cy="48"
          rx={radius * 0.52}
          ry={radius * 0.22}
          fill="rgba(99,102,241,0.18)"
          transform="rotate(29 50 48)"
        />
      </motion.g>

      <motion.g
        filter={`url(#${glowFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { x: 0, y: 0 }
            : { x: [0, 0.9, -0.55, 0], y: [0, -0.7, 0.45, 0] }
        }
        transition={{
          duration: reducedMotion ? 0 : 5.9,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "50px 50px" }}
      >
        <path
          d="M47 39 C55 37 62 44 61 52 C60 60 51 65 44 61 C38 58 36 50 39 45 C41 42 43 40 47 39Z"
          fill={`url(#${coreGradient})`}
        />
        <motion.circle
          cx="48"
          cy="48"
          r="6.5"
          fill="rgba(255,255,255,0.36)"
          filter={`url(#${softFilter})`}
          initial={false}
          animate={
            reducedMotion
              ? { opacity: 0.84, scale: 1 }
              : { opacity: [0.78, 1, 0.82, 0.94, 0.78], scale: [0.92, 1.08, 0.95, 1.03, 0.92] }
          }
          transition={{
            duration: reducedMotion ? 0 : 4.2,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "48px 48px" }}
        />
        <motion.circle
          cx="48"
          cy="48"
          r="10"
          fill="rgba(255,255,255,0.14)"
          filter={`url(#${softFilter})`}
          initial={false}
          animate={
            reducedMotion
              ? { opacity: 0.32, scale: 1 }
              : { opacity: [0.26, 0.48, 0.3, 0.4, 0.26], scale: [0.9, 1.1, 0.96, 1.04, 0.9] }
          }
          transition={{
            duration: reducedMotion ? 0 : 4.2,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "48px 48px" }}
        />
      </motion.g>

      {thoughtDots.map((dot) => (
        <motion.g
          key={`${dot.cx}-${dot.cy}`}
          initial={false}
          animate={
            reducedMotion
              ? { opacity: dot.maxOpacity * 0.72, x: 0, y: 0, scale: 1 }
              : {
                  opacity: [dot.minOpacity, dot.maxOpacity, dot.minOpacity * 1.1, dot.maxOpacity * 0.86],
                  x: dot.x,
                  y: dot.y,
                  scale: dot.scale,
                }
          }
          transition={{
            duration: reducedMotion ? 0 : dot.duration,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
            delay: reducedMotion ? 0 : dot.delay,
          }}
          style={{ transformOrigin: `${dot.cx}px ${dot.cy}px` }}
        >
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r + 2.9}
            fill="rgba(139,92,246,0.18)"
            filter={`url(#${softFilter})`}
          />
          <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={`url(#${dotGradient})`} />
        </motion.g>
      ))}
    </motion.svg>
  );
}

export const FlowAIOrbIdentity = memo(FlowAIOrbIdentityComponent);
