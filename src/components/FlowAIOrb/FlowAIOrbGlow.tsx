import { memo } from "react";
import { motion } from "framer-motion";
import type { FlowAIOrbDerivedMotionSpec, FlowAIOrbSizeSpec } from "./FlowAIOrbStates";

interface FlowAIOrbGlowProps {
  config: FlowAIOrbDerivedMotionSpec;
  glowIntensity: number;
  reducedMotion: boolean;
  sizeSpec: FlowAIOrbSizeSpec;
}

function FlowAIOrbGlowComponent({
  config,
  glowIntensity,
  reducedMotion,
  sizeSpec,
}: FlowAIOrbGlowProps) {
  const opacity = config.glowOpacity * glowIntensity;
  const bloom = sizeSpec.bloomStrength;
  const activity =
    config.motionMood === "focused" || config.motionMood === "curious"
      ? 1.24
      : config.motionMood === "present"
        ? 1
        : config.motionMood === "settled"
          ? 0.82
          : 1.08;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `-${sizeSpec.glowRadius * 42}%`,
          background:
            "radial-gradient(circle at 48% 45%, rgba(255,255,255,0.16) 0%, rgba(139,92,246,0.30) 26%, rgba(99,102,241,0.18) 48%, rgba(34,211,238,0.08) 66%, transparent 82%)",
          filter: `blur(calc(var(--flow-orb-size) * ${0.11 * bloom}))`,
          transform: "translateZ(0)",
        }}
        animate={
          reducedMotion
            ? { opacity, scale: config.glowScale }
            : {
                opacity: [opacity * 0.62, opacity, opacity * 0.74],
                scale: [
                  config.glowScale * (1 - 0.025 * activity),
                  config.glowScale * (1 + 0.045 * activity),
                  config.glowScale,
                ],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `-${sizeSpec.glowRadius * 22}%`,
          background:
            "radial-gradient(ellipse at 36% 40%, rgba(255,255,255,0.22) 0%, rgba(139,92,246,0.36) 30%, transparent 62%), radial-gradient(ellipse at 68% 58%, rgba(34,211,238,0.18) 0%, rgba(99,102,241,0.20) 32%, transparent 66%)",
          filter: `blur(calc(var(--flow-orb-size) * ${0.055 * bloom}))`,
          mixBlendMode: "screen",
          transform: "translateZ(0)",
        }}
        animate={
          reducedMotion
            ? { opacity: opacity * 0.7, rotate: 0 }
            : {
                opacity: [opacity * 0.34, opacity * 0.82, opacity * 0.42],
                x: [-1.2 * activity, 1.4 * activity, -0.45 * activity, -1.2 * activity],
                y: [0.7 * activity, -0.9 * activity, 0.38 * activity, 0.7 * activity],
                rotate: [0, 3.5 * activity, -2.8 * activity, 1.4 * activity, 0],
                scale: [1, 1 + 0.026 * activity, 1 - 0.014 * activity, 1],
              }
        }
        transition={{
          opacity: {
            duration: reducedMotion ? 0 : config.shellDuration * 1.18,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: reducedMotion ? 0 : Math.max(config.orbitDuration * 0.8, 14),
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
          scale: {
            duration: reducedMotion ? 0 : config.shellDuration * 1.24,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
          x: {
            duration: reducedMotion ? 0 : config.shellDuration * 1.32,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
          y: {
            duration: reducedMotion ? 0 : config.shellDuration * 1.18,
            repeat: reducedMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
        }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `-${sizeSpec.glowRadius * 8}%`,
          background:
            "radial-gradient(ellipse at 48% 44%, rgba(255,255,255,0.16), rgba(139,92,246,0.18) 34%, rgba(34,211,238,0.10) 58%, transparent 76%)",
          filter: `blur(calc(var(--flow-orb-size) * ${0.032 * bloom}))`,
          mixBlendMode: "screen",
          transform: "translateZ(0)",
        }}
        animate={
          reducedMotion
            ? { opacity: opacity * 0.38, scale: 1 }
            : {
                opacity: [opacity * 0.2, opacity * 0.5, opacity * 0.26],
                x: [0.6 * activity, -0.9 * activity, 0.3 * activity],
                y: [-0.5 * activity, 0.55 * activity, -0.18 * activity],
                scale: [0.985, 1.025, 0.996],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 0.92,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export const FlowAIOrbGlow = memo(FlowAIOrbGlowComponent);
