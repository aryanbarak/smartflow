import { memo, useId } from "react";
import { motion } from "framer-motion";
import type { FlowAIOrbDerivedMotionSpec, FlowAIOrbSizeSpec } from "./FlowAIOrbStates";

interface FlowAIOrbParticlesProps {
  config: FlowAIOrbDerivedMotionSpec;
  enabled: boolean;
  reducedMotion: boolean;
  sizeSpec: FlowAIOrbSizeSpec;
}

const PARTICLES = [
  { cx: 20, cy: 43, rx: 1.7, ry: 0.55, hue: "#22D3EE", x: [0, -1.1, -2.8, -1.5, 0], y: [0, -1.8, -0.9, 1.1, 0], rotate: [-18, -8, -25, -14], delay: 0 },
  { cx: 31, cy: 25, rx: 1.35, ry: 0.48, hue: "#FFFFFF", x: [0, 1.5, 2.2, 0.8, 0], y: [0, -1.3, -3.2, -1.2, 0], rotate: [22, 36, 18, 28], delay: 0.35 },
  { cx: 63, cy: 19, rx: 1.45, ry: 0.5, hue: "#8B5CF6", x: [0, 1.4, 2.7, 1.1, 0], y: [0, -0.9, 1.1, 2.5, 0], rotate: [-8, 10, 2, -12], delay: 0.78 },
  { cx: 80, cy: 38, rx: 1.55, ry: 0.52, hue: "#22D3EE", x: [0, 2.4, 1.2, -0.8, 0], y: [0, 0.9, 2.4, 1.2, 0], rotate: [12, 4, 22, 14], delay: 0.2 },
  { cx: 70, cy: 75, rx: 1.45, ry: 0.5, hue: "#FFFFFF", x: [0, 1.1, 2.8, 1.4, 0], y: [0, 1.7, 0.7, -1.3, 0], rotate: [-26, -14, -32, -20], delay: 0.62 },
  { cx: 37, cy: 80, rx: 1.25, ry: 0.44, hue: "#8B5CF6", x: [0, -1.4, -2.5, -0.9, 0], y: [0, 1.2, -0.5, -2.1, 0], rotate: [18, 28, 10, 20], delay: 1.05 },
  { cx: 21, cy: 65, rx: 1.4, ry: 0.48, hue: "#22D3EE", x: [0, -2.1, -1.2, 0.6, 0], y: [0, 0.8, 2.6, 1.1, 0], rotate: [-4, -20, -9, -16], delay: 0.48 },
  { cx: 55, cy: 33, rx: 1.12, ry: 0.42, hue: "#FFFFFF", x: [0, 0.8, 1.6, 0.2, 0], y: [0, -1.6, -0.6, 1.5, 0], rotate: [35, 24, 42, 31], delay: 0.95 },
  { cx: 60, cy: 64, rx: 1.18, ry: 0.43, hue: "#22D3EE", x: [0, -0.9, -2.2, -1, 0], y: [0, 1.7, 0.4, -1.4, 0], rotate: [-30, -18, -36, -24], delay: 1.26 },
  { cx: 34, cy: 55, rx: 1.05, ry: 0.4, hue: "#8B5CF6", x: [0, 1.5, 0.7, -0.9, 0], y: [0, 1.1, 2.3, 0.7, 0], rotate: [8, 20, 2, 14], delay: 1.42 },
  { cx: 15, cy: 50, rx: 1.05, ry: 0.36, hue: "#FFFFFF", x: [0, -1.6, -3.1, -1.4, 0], y: [0, -0.3, 1.2, 2, 0], rotate: [28, 18, 34, 24], delay: 1.7 },
  { cx: 48, cy: 10, rx: 0.98, ry: 0.34, hue: "#22D3EE", x: [0, 1, 2.1, 0.7, 0], y: [0, -1.4, -2.5, -1, 0], rotate: [-14, -4, -22, -10], delay: 1.9 },
  { cx: 86, cy: 50, rx: 1, ry: 0.35, hue: "#8B5CF6", x: [0, 2, 1.4, -0.4, 0], y: [0, -0.8, 1.2, 2.2, 0], rotate: [16, 30, 12, 22], delay: 2.1 },
  { cx: 52, cy: 90, rx: 0.9, ry: 0.32, hue: "#22D3EE", x: [0, 0.7, -0.8, -1.7, 0], y: [0, 1.2, 2.5, 0.8, 0], rotate: [-20, -8, -26, -16], delay: 2.35 },
] as const;

function FlowAIOrbParticlesComponent({
  config,
  enabled,
  reducedMotion,
  sizeSpec,
}: FlowAIOrbParticlesProps) {
  const id = useId().replace(/:/g, "");
  const particleFilterId = `flow-orb-particle-${id}`;
  const visibleOpacity = enabled ? config.particleOpacity : 0;
  const densityCount = Math.round(
    sizeSpec.particleCount * (0.45 + config.particleDensity * 0.58),
  );
  const particleLimit =
    enabled && visibleOpacity > 0.08
      ? Math.max(1, densityCount)
      : 0;
  const visibleParticles = PARTICLES.slice(0, Math.min(particleLimit, PARTICLES.length));
  const fieldInset = 18 + sizeSpec.glowRadius * 6;
  const driftMultiplier =
    config.motionMood === "focused" || config.motionMood === "curious"
      ? 1.42
      : config.motionMood === "present"
        ? 1.12
        : config.motionMood === "settled"
          ? 0.86
          : 1;

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute overflow-visible"
      viewBox="0 0 100 100"
      fill="none"
      initial={false}
      animate={reducedMotion ? { opacity: visibleOpacity * 0.52 } : { opacity: visibleOpacity }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
      style={{
        inset: `-${fieldInset}%`,
        height: `${100 + fieldInset * 2}%`,
        width: `${100 + fieldInset * 2}%`,
        transform: "translateZ(0)",
      }}
    >
      <defs>
        <filter id={particleFilterId} x="-260%" y="-260%" width="620%" height="620%">
          <feGaussianBlur stdDeviation="1.45" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {visibleParticles.map((particle, index) => {
        const duration = config.particleDuration + (index % 4) * 0.7;
        const peakOpacity = Math.min(0.82, visibleOpacity * (0.82 + (index % 3) * 0.08));

        return (
          <motion.ellipse
            key={`${particle.cx}-${particle.cy}`}
            cx={particle.cx}
            cy={particle.cy}
            rx={particle.rx}
            ry={particle.ry}
            fill={particle.hue}
            fillOpacity="0.72"
            filter={`url(#${particleFilterId})`}
            initial={false}
            animate={
              reducedMotion || !enabled
                ? { opacity: visibleOpacity * 0.22, scale: 0.9, x: 0, y: 0, rotate: particle.rotate[0] }
                : {
                    opacity: [0, peakOpacity * 0.35, peakOpacity, peakOpacity * 0.22, 0],
                    scale: [0.68, 0.96, 1.12, 0.88, 0.62],
                    x: particle.x.map((value) => value * driftMultiplier),
                    y: particle.y.map((value) => value * driftMultiplier),
                    rotate: particle.rotate,
                  }
            }
            transition={{
              duration: reducedMotion ? 0 : duration,
              repeat: reducedMotion || !enabled ? 0 : Infinity,
              delay: reducedMotion ? 0 : particle.delay,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: `${particle.cx}px ${particle.cy}px` }}
          />
        );
      })}
    </motion.svg>
  );
}

export const FlowAIOrbParticles = memo(FlowAIOrbParticlesComponent);
