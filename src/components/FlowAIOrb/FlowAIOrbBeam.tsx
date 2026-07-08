import { memo } from "react";
import { motion } from "framer-motion";
import type { FlowAIOrbDerivedMotionSpec, FlowAIOrbSizeSpec } from "./FlowAIOrbStates";

interface FlowAIOrbBeamProps {
  active: boolean;
  config: FlowAIOrbDerivedMotionSpec;
  reducedMotion: boolean;
  sizeSpec: FlowAIOrbSizeSpec;
}

function FlowAIOrbBeamComponent({ active, config, reducedMotion, sizeSpec }: FlowAIOrbBeamProps) {
  const opacity = active ? config.beamOpacity : 0;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: `calc(var(--flow-orb-size) * ${sizeSpec.beamWidth})`,
        height: "calc(var(--flow-orb-size) * 1.48)",
        transformOrigin: "top center",
        background:
          "linear-gradient(to bottom, rgba(255,255,255,0.82), rgba(139,92,246,0.58) 20%, rgba(99,102,241,0.28) 58%, rgba(34,211,238,0.10) 78%, transparent)",
        borderRadius: 999,
        filter: `blur(calc(var(--flow-orb-size) * ${0.024 * sizeSpec.bloomStrength}))`,
        mixBlendMode: "screen",
        translate: "-50% 0",
      }}
      initial={false}
      animate={
        reducedMotion
          ? { opacity, scaleY: active ? 0.72 : 0.35 }
          : {
              opacity: active ? [opacity * 0.45, opacity, opacity * 0.72] : 0,
              scaleY: active ? [0.18, 1, 0.88] : 0.18,
            }
      }
      transition={{
        duration: reducedMotion ? 0 : active ? 2.8 : 0.35,
        repeat: reducedMotion || !active ? 0 : Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export const FlowAIOrbBeam = memo(FlowAIOrbBeamComponent);
