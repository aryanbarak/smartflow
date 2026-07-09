import { memo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlowAIOrbBeam } from "./FlowAIOrbBeam";
import { FlowAIOrbCore } from "./FlowAIOrbCore";
import { FlowAIOrbGlow } from "./FlowAIOrbGlow";
import { FlowAIOrbIdentity } from "./FlowAIOrbIdentity";
import { FlowAIOrbParticles } from "./FlowAIOrbParticles";
import {
  FLOW_AI_ORB_COLORS,
  getFlowAIOrbStateConfig,
  normalizeFlowAIOrbState,
  resolveFlowAIOrbSize,
  type FlowAIOrbSize,
  type FlowAIOrbState,
  type FlowAIOrbTheme,
} from "./FlowAIOrbStates";

export type FlowAIOrbVariant = "default" | "identity";

export interface FlowAIOrbProps {
  size?: FlowAIOrbSize;
  state?: FlowAIOrbState;
  variant?: FlowAIOrbVariant;
  beam?: boolean | "auto";
  particles?: boolean;
  glowIntensity?: number;
  interactive?: boolean;
  reducedMotion?: boolean;
  theme?: FlowAIOrbTheme;
  className?: string;
  ariaLabel?: string;
}

type FlowAIOrbStyle = CSSProperties & {
  "--flow-orb-size": string;
  "--flow-orb-core": string;
  "--flow-orb-indigo": string;
  "--flow-orb-violet": string;
  "--flow-orb-cyan": string;
  "--flow-orb-glow": number;
  "--flow-orb-radius": number;
  "--flow-orb-glow-radius": number;
  "--flow-orb-beam-width": number;
  "--flow-orb-bloom": number;
};

function clampGlowIntensity(value: number) {
  return Math.min(Math.max(value, 0), 1.4);
}

function FlowAIOrbComponent({
  size = "md",
  state = "presence",
  variant = "default",
  beam = "auto",
  particles = true,
  glowIntensity = 1,
  interactive = false,
  reducedMotion,
  theme = "transparent",
  className,
  ariaLabel,
}: FlowAIOrbProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion ?? prefersReducedMotion ?? false;
  const sizeSpec = resolveFlowAIOrbSize(size);
  const canonicalState = normalizeFlowAIOrbState(state);
  const config = getFlowAIOrbStateConfig(state);
  const disabled = canonicalState === "disabled";
  const identityVariant = variant === "identity";
  const normalizedGlow = clampGlowIntensity(glowIntensity);
  const beamActive =
    !identityVariant &&
    (beam === "auto" ? canonicalState === "decision" || canonicalState === "creating" : beam);
  const particlesEnabled = !identityVariant && particles && !disabled;

  const style: FlowAIOrbStyle = {
    "--flow-orb-size": `${sizeSpec.pixelSize}px`,
    "--flow-orb-core": FLOW_AI_ORB_COLORS.core,
    "--flow-orb-indigo": FLOW_AI_ORB_COLORS.indigo,
    "--flow-orb-violet": FLOW_AI_ORB_COLORS.violet,
    "--flow-orb-cyan": FLOW_AI_ORB_COLORS.cyan,
    "--flow-orb-glow": normalizedGlow,
    "--flow-orb-radius": sizeSpec.orbRadius,
    "--flow-orb-glow-radius": sizeSpec.glowRadius,
    "--flow-orb-beam-width": sizeSpec.beamWidth,
    "--flow-orb-bloom": sizeSpec.bloomStrength,
    width: "var(--flow-orb-size)",
    height: "var(--flow-orb-size)",
  };

  return (
    <motion.div
      className={cn(
        "relative isolate inline-flex shrink-0 items-center justify-center overflow-visible rounded-full align-middle",
        theme === "dark" && "bg-[#07060E]",
        theme === "subtle" && "bg-white/[0.03]",
        interactive && !disabled && "cursor-pointer",
        disabled && "pointer-events-none",
        className,
      )}
      style={style}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      tabIndex={interactive && !disabled ? 0 : undefined}
      initial={false}
      animate={
        shouldReduceMotion
          ? { opacity: disabled ? 0.48 : 1, scale: 1 }
          : { opacity: disabled ? 0.48 : 1, scale: 1 }
      }
      whileHover={interactive && !disabled && !shouldReduceMotion ? { scale: 1.045 } : undefined}
      whileTap={interactive && !disabled && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
    >
      {identityVariant ? (
        <FlowAIOrbIdentity
          glowIntensity={normalizedGlow}
          reducedMotion={shouldReduceMotion || disabled}
          sizeSpec={sizeSpec}
        />
      ) : (
        <>
          <FlowAIOrbBeam
            active={beamActive && !disabled}
            config={config}
            reducedMotion={shouldReduceMotion}
            sizeSpec={sizeSpec}
          />
          <FlowAIOrbGlow
            config={config}
            glowIntensity={normalizedGlow}
            reducedMotion={shouldReduceMotion || disabled}
            sizeSpec={sizeSpec}
          />
          <FlowAIOrbCore config={config} reducedMotion={shouldReduceMotion || disabled} sizeSpec={sizeSpec} />
          <FlowAIOrbParticles
            config={config}
            enabled={particlesEnabled}
            reducedMotion={shouldReduceMotion || disabled}
            sizeSpec={sizeSpec}
          />
        </>
      )}
    </motion.div>
  );
}

export const FlowAIOrb = memo(FlowAIOrbComponent);
