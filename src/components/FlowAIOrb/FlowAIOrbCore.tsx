import { memo, useId } from "react";
import { motion } from "framer-motion";
import type { FlowAIOrbDerivedMotionSpec, FlowAIOrbSizeSpec } from "./FlowAIOrbStates";

interface FlowAIOrbCoreProps {
  config: FlowAIOrbDerivedMotionSpec;
  reducedMotion: boolean;
  sizeSpec: FlowAIOrbSizeSpec;
}

interface PresenceLayerProps extends FlowAIOrbCoreProps {
  ids: {
    atmosphereGradient: string;
    depthGradient: string;
    innerEnergyGradient: string;
    memoryGradient: string;
    reasoningGradient: string;
    refractionGradient: string;
    wispGradient: string;
    coreGradient: string;
    coreWarmthGradient: string;
    softFilter: string;
    deepSoftFilter: string;
    bloomFilter: string;
    streamFilter: string;
    clip: string;
  };
  activity: number;
  radius: number;
}

function resolveActivity(config: FlowAIOrbDerivedMotionSpec) {
  if (config.motionMood === "focused" || config.motionMood === "curious") return 1.35;
  if (config.motionMood === "generative" || config.motionMood === "insight") return 1.22;
  if (config.motionMood === "present") return 1;
  if (config.motionMood === "settled") return 0.82;
  if (config.motionMood === "waking") return 1.12;
  return 0.42;
}

function FlowAIOrbCoreComponent({ config, reducedMotion, sizeSpec }: FlowAIOrbCoreProps) {
  const id = useId().replace(/:/g, "");
  const ids = {
    atmosphereGradient: `flow-orb-atmosphere-${id}`,
    depthGradient: `flow-orb-depth-${id}`,
    innerEnergyGradient: `flow-orb-inner-energy-${id}`,
    memoryGradient: `flow-orb-memory-cloud-${id}`,
    reasoningGradient: `flow-orb-reasoning-flow-${id}`,
    refractionGradient: `flow-orb-refraction-${id}`,
    wispGradient: `flow-orb-wisp-${id}`,
    coreGradient: `flow-orb-conscious-core-${id}`,
    coreWarmthGradient: `flow-orb-conscious-warmth-${id}`,
    softFilter: `flow-orb-soft-${id}`,
    deepSoftFilter: `flow-orb-deep-soft-${id}`,
    bloomFilter: `flow-orb-bloom-${id}`,
    streamFilter: `flow-orb-stream-${id}`,
    clip: `flow-orb-presence-clip-${id}`,
  };
  const radius = sizeSpec.orbRadius;
  const activity = resolveActivity(config);

  return (
    <motion.svg
      aria-hidden
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      fill="none"
      initial={false}
      animate={
        reducedMotion
          ? { opacity: config.shellOpacity, scale: 1 }
          : { opacity: config.shellOpacity, scale: config.shellScale }
      }
      transition={{
        duration: reducedMotion ? 0 : config.shellDuration,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
      style={{ transformOrigin: "50% 50%", transform: "translateZ(0)" }}
    >
      <PresenceDefs ids={ids} config={config} sizeSpec={sizeSpec} radius={radius} />
      <AmbientPresence ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
      <g clipPath={`url(#${ids.clip})`}>
        <MemoryField ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
        <InnerEnergy ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
        <InternalWisps ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
        <ReasoningFlow ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
        <ConsciousCore ids={ids} config={config} reducedMotion={reducedMotion} sizeSpec={sizeSpec} activity={activity} radius={radius} />
      </g>
    </motion.svg>
  );
}

function PresenceDefs({
  ids,
  config,
  sizeSpec,
  radius,
}: Pick<PresenceLayerProps, "ids" | "config" | "sizeSpec" | "radius">) {
  const coreBrightness = config.coreBrightness;

  return (
    <defs>
      <clipPath id={ids.clip}>
        <circle cx="50" cy="50" r={radius + 1.8} />
      </clipPath>

      <radialGradient id={ids.atmosphereGradient} cx="42%" cy="36%" r="72%">
        <stop offset="0%" stopColor={`rgba(255,255,255,${Math.min(0.58 + coreBrightness * 0.2, 0.9)})`} />
        <stop offset="24%" stopColor="rgba(221,210,255,0.66)" />
        <stop offset="48%" stopColor="rgba(139,92,246,0.50)" />
        <stop offset="72%" stopColor="rgba(99,102,241,0.34)" />
        <stop offset="100%" stopColor="rgba(34,211,238,0.08)" />
      </radialGradient>

      <radialGradient id={ids.depthGradient} cx="62%" cy="66%" r="74%">
        <stop offset="0%" stopColor="rgba(7,6,14,0.22)" />
        <stop offset="38%" stopColor="rgba(99,102,241,0.10)" />
        <stop offset="72%" stopColor="rgba(139,92,246,0.05)" />
        <stop offset="100%" stopColor="rgba(7,6,14,0)" />
      </radialGradient>

      <radialGradient id={ids.innerEnergyGradient} cx="47%" cy="45%" r="66%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
        <stop offset="34%" stopColor="rgba(139,92,246,0.30)" />
        <stop offset="62%" stopColor="rgba(34,211,238,0.16)" />
        <stop offset="100%" stopColor="rgba(99,102,241,0)" />
      </radialGradient>

      <radialGradient id={ids.memoryGradient} cx="34%" cy="42%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
        <stop offset="38%" stopColor="rgba(139,92,246,0.62)" />
        <stop offset="72%" stopColor="rgba(99,102,241,0.28)" />
        <stop offset="100%" stopColor="rgba(139,92,246,0)" />
      </radialGradient>

      <linearGradient id={ids.reasoningGradient} x1="22" y1="26" x2="80" y2="76">
        <stop offset="0%" stopColor="rgba(34,211,238,0.04)" />
        <stop offset="28%" stopColor="rgba(34,211,238,0.44)" />
        <stop offset="58%" stopColor="rgba(255,255,255,0.32)" />
        <stop offset="100%" stopColor="rgba(139,92,246,0.16)" />
      </linearGradient>

      <linearGradient id={ids.refractionGradient} x1="24" y1="24" x2="78" y2="72">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="34%" stopColor="rgba(255,255,255,0.24)" />
        <stop offset="58%" stopColor="rgba(34,211,238,0.16)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      <linearGradient id={ids.wispGradient} x1="20" y1="52" x2="82" y2="45">
        <stop offset="0%" stopColor="rgba(139,92,246,0)" />
        <stop offset="28%" stopColor="rgba(139,92,246,0.22)" />
        <stop offset="54%" stopColor="rgba(255,255,255,0.24)" />
        <stop offset="76%" stopColor="rgba(34,211,238,0.18)" />
        <stop offset="100%" stopColor="rgba(34,211,238,0)" />
      </linearGradient>

      <radialGradient id={ids.coreGradient} cx="48%" cy="47%" r="62%">
        <stop offset="0%" stopColor="rgba(255,255,255,1)" />
        <stop offset="34%" stopColor="rgba(255,255,255,0.92)" />
        <stop offset="66%" stopColor="rgba(225,213,255,0.48)" />
        <stop offset="100%" stopColor="rgba(139,92,246,0)" />
      </radialGradient>

      <radialGradient id={ids.coreWarmthGradient} cx="54%" cy="56%" r="58%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
        <stop offset="52%" stopColor="rgba(139,92,246,0.30)" />
        <stop offset="100%" stopColor="rgba(34,211,238,0)" />
      </radialGradient>

      <filter id={ids.softFilter} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={1.25 * sizeSpec.bloomStrength} />
      </filter>

      <filter id={ids.deepSoftFilter} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation={2.35 * sizeSpec.bloomStrength} />
      </filter>

      <filter id={ids.bloomFilter} x="-90%" y="-90%" width="280%" height="280%">
        <feGaussianBlur stdDeviation={3.7 * sizeSpec.bloomStrength} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id={ids.streamFilter} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation={0.9 * sizeSpec.bloomStrength} result="streamBlur" />
        <feMerge>
          <feMergeNode in="streamBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function AmbientPresence({ ids, config, reducedMotion, activity, radius }: PresenceLayerProps) {
  const layerOpacity = 0.44 + config.layerOpacity * 0.34;

  return (
    <>
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill={`url(#${ids.atmosphereGradient})`}
        filter={`url(#${ids.softFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: layerOpacity }
            : {
                opacity: [layerOpacity * 0.86, layerOpacity, layerOpacity * 0.9],
                r: [radius, radius + 0.85 * activity, radius - 0.25 * activity, radius],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.18,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.circle
        cx="50"
        cy="50"
        r={radius * 0.94}
        fill={`url(#${ids.depthGradient})`}
        filter={`url(#${ids.deepSoftFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: config.layerOpacity * 0.4, x: 0, y: 0 }
            : {
                opacity: [config.layerOpacity * 0.24, config.layerOpacity * 0.46, config.layerOpacity * 0.3],
                x: [0.9 * activity, -0.45 * activity, 0.65 * activity],
                y: [0.7 * activity, -0.2 * activity, 0.45 * activity],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.52,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.22,
        }}
      />

      <motion.path
        d="M20 58 C27 35 43 25 61 28 C79 31 87 48 80 67 C70 86 42 86 27 70 C23 66 21 62 20 58Z"
        fill="rgba(255,255,255,0.10)"
        filter={`url(#${ids.softFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: config.layerOpacity * 0.24 }
            : {
                opacity: [config.layerOpacity * 0.12, config.layerOpacity * 0.3, config.layerOpacity * 0.16],
                x: [-0.7 * activity, 0.8 * activity, -0.2 * activity],
                y: [0.4 * activity, -0.7 * activity, 0.25 * activity],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.4,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

function InnerEnergy({ ids, config, reducedMotion, activity }: PresenceLayerProps) {
  const opacity = config.layerOpacity;

  return (
    <motion.g
      filter={`url(#${ids.deepSoftFilter})`}
      style={{ transformOrigin: "50px 50px" }}
      animate={
        reducedMotion
          ? { opacity: opacity * 0.42, x: 0, y: 0, scale: 1 }
          : {
              opacity: [opacity * 0.22, opacity * 0.56, opacity * 0.3],
              x: [0.5 * activity, -0.85 * activity, 0.28 * activity],
              y: [-0.55 * activity, 0.6 * activity, -0.25 * activity],
              scale: [0.985, 1.035, 0.995],
            }
      }
      transition={{
        duration: reducedMotion ? 0 : Math.max(config.shellDuration * 1.08, 5.6),
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
        delay: reducedMotion ? 0 : 0.16,
      }}
    >
      <path
        d="M29 53 C31 39 43 30 57 32 C68 34 76 44 74 56 C72 67 61 74 48 71 C36 69 28 63 29 53Z"
        fill={`url(#${ids.innerEnergyGradient})`}
      />
      <motion.path
        d="M37 35 C48 42 58 39 67 48 C60 54 52 55 42 51 C34 48 31 42 37 35Z"
        fill="rgba(255,255,255,0.09)"
        animate={
          reducedMotion
            ? { opacity: opacity * 0.22 }
            : { opacity: [opacity * 0.08, opacity * 0.28, opacity * 0.12] }
        }
        transition={{
          duration: reducedMotion ? 0 : Math.max(config.shellDuration * 0.86, 4.5),
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.48,
        }}
      />
    </motion.g>
  );
}

function MemoryField({ ids, config, reducedMotion, activity }: PresenceLayerProps) {
  const opacity = config.layerOpacity;

  return (
    <motion.g
      style={{ transformOrigin: "50px 50px" }}
      animate={
        reducedMotion
          ? { opacity: opacity * 0.58, x: 0, y: 0, scale: 1 }
          : {
              opacity: [opacity * 0.32, opacity * 0.72, opacity * 0.42],
              x: [-1.1 * activity, 1.2 * activity, -0.5 * activity],
              y: [0.85 * activity, -0.75 * activity, 0.35 * activity],
              scale: [0.97, 1.035, 0.99],
            }
      }
      transition={{
        duration: reducedMotion ? 0 : Math.max(config.orbitDuration * 0.55, 6.2),
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
    >
      <path
        d="M18 54 C26 35 44 22 61 27 C75 31 86 44 83 59 C79 75 61 83 44 77 C29 72 18 64 18 54Z"
        fill={`url(#${ids.memoryGradient})`}
        filter={`url(#${ids.softFilter})`}
      />
      <motion.path
        d="M32 71 C24 58 28 43 42 34 C55 26 73 31 78 45 C67 39 56 42 47 51 C40 58 38 66 32 71Z"
        fill="rgba(139,92,246,0.24)"
        filter={`url(#${ids.softFilter})`}
        animate={
          reducedMotion
            ? { opacity: opacity * 0.38 }
            : { opacity: [opacity * 0.18, opacity * 0.52, opacity * 0.24] }
        }
        transition={{
          duration: reducedMotion ? 0 : Math.max(config.shellDuration * 0.9, 4.8),
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.g>
  );
}

function InternalWisps({ ids, config, reducedMotion, activity }: PresenceLayerProps) {
  const opacity = config.layerOpacity;
  const duration = Math.max(config.shellDuration * 1.18, 5.8);

  return (
    <motion.g
      filter={`url(#${ids.streamFilter})`}
      style={{ transformOrigin: "50px 50px" }}
      animate={
        reducedMotion
          ? { opacity: opacity * 0.22 }
          : {
              opacity: [0, opacity * 0.34, opacity * 0.18, 0],
              x: [-1.4 * activity, 0.7 * activity, 1.2 * activity, -0.5 * activity],
              y: [0.6 * activity, -0.35 * activity, 0.22 * activity, 0.5 * activity],
            }
      }
      transition={{
        duration: reducedMotion ? 0 : duration,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
        delay: reducedMotion ? 0 : 0.34,
      }}
    >
      <motion.path
        d="M22 55 C35 48 44 45 56 49 C66 52 75 51 82 44"
        stroke={`url(#${ids.wispGradient})`}
        strokeWidth={2.4 + activity * 0.25}
        strokeLinecap="round"
        strokeDasharray="18 34"
        initial={false}
        animate={
          reducedMotion
            ? { pathLength: 0.42, strokeDashoffset: 0 }
            : { pathLength: [0.08, 0.62, 0.28, 0.08], strokeDashoffset: [18, 4, -14, -24] }
        }
        transition={{
          duration: reducedMotion ? 0 : duration * 0.94,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M26 43 C38 38 50 41 60 46 C68 51 73 50 79 46"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth={1.2 + activity * 0.12}
        strokeLinecap="round"
        strokeDasharray="10 24"
        initial={false}
        animate={
          reducedMotion
            ? { pathLength: 0.34, strokeDashoffset: 0 }
            : { pathLength: [0.06, 0.48, 0.2, 0.06], strokeDashoffset: [-8, -18, -26, -34] }
        }
        transition={{
          duration: reducedMotion ? 0 : duration * 1.18,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.82,
        }}
      />
    </motion.g>
  );
}

function ReasoningFlow({ ids, config, reducedMotion, activity }: PresenceLayerProps) {
  const flowDuration = Math.max(config.shellDuration * 0.72, 3.8);
  const streamOpacity = config.layerOpacity;

  return (
    <motion.g
      filter={`url(#${ids.streamFilter})`}
      style={{ transformOrigin: "50px 50px" }}
      animate={
        reducedMotion
          ? { opacity: streamOpacity * 0.42, x: 0, y: 0 }
          : {
              opacity: [streamOpacity * 0.28, streamOpacity * 0.74, streamOpacity * 0.36],
              x: [0.7 * activity, -0.9 * activity, 0.35 * activity],
              y: [-0.45 * activity, 0.75 * activity, -0.25 * activity],
            }
      }
      transition={{
        duration: reducedMotion ? 0 : flowDuration,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.path
        d="M24 60 C34 48 39 38 52 39 C64 40 68 51 78 45"
        stroke={`url(#${ids.reasoningGradient})`}
        strokeWidth={1.45 + activity * 0.18}
        strokeLinecap="round"
        strokeDasharray="14 26"
        initial={false}
        animate={
          reducedMotion
            ? { pathLength: 0.56, strokeDashoffset: 0 }
            : { pathLength: [0.22, 0.9, 0.38], strokeDashoffset: [18, -4, -24] }
        }
        transition={{
          duration: reducedMotion ? 0 : flowDuration * 0.92,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M28 40 C40 49 45 62 58 62 C68 62 72 52 80 57"
        stroke="rgba(255,255,255,0.24)"
        strokeWidth={0.92 + activity * 0.1}
        strokeLinecap="round"
        strokeDasharray="8 18"
        initial={false}
        animate={
          reducedMotion
            ? { pathLength: 0.44, strokeDashoffset: 0 }
            : { pathLength: [0.18, 0.62, 0.26], strokeDashoffset: [-9, 6, 18] }
        }
        transition={{
          duration: reducedMotion ? 0 : flowDuration * 1.24,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.35,
        }}
      />
      <motion.path
        d="M35 28 C46 35 55 31 65 36 C73 40 75 49 70 57"
        stroke="rgba(34,211,238,0.20)"
        strokeWidth="0.82"
        strokeLinecap="round"
        strokeDasharray="6 20"
        initial={false}
        animate={
          reducedMotion
            ? { pathLength: 0.34, strokeDashoffset: 0 }
            : { pathLength: [0.14, 0.54, 0.22], strokeDashoffset: [4, -8, -18] }
        }
        transition={{
          duration: reducedMotion ? 0 : flowDuration * 1.45,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.7,
        }}
      />
    </motion.g>
  );
}

function ConsciousCore({ ids, config, reducedMotion, activity }: PresenceLayerProps) {
  const coreDrift = 1.04 * activity;
  const coreOpacity = config.coreOpacity;

  return (
    <motion.g
      filter={`url(#${ids.bloomFilter})`}
      style={{ transformOrigin: "50px 50px" }}
      initial={false}
      animate={
        reducedMotion
          ? { opacity: coreOpacity, x: 0, y: 0, scale: 1 }
          : {
              opacity: [coreOpacity * 0.78, coreOpacity, coreOpacity * 0.84],
              x: [0, coreDrift, -coreDrift * 0.72, coreDrift * 0.34, 0],
              y: [0, -coreDrift * 0.64, coreDrift * 0.54, coreDrift * 0.2, 0],
              scale: config.coreScale,
            }
      }
      transition={{
        duration: reducedMotion ? 0 : config.shellDuration * 0.78,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.path
        d="M47 34 C59 33 68 42 68 53 C67 64 56 72 45 69 C35 66 30 56 33 46 C35 38 40 35 47 34Z"
        fill="rgba(255,255,255,0.18)"
        filter={`url(#${ids.deepSoftFilter})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: coreOpacity * 0.24, scale: 1 }
            : {
                opacity: [coreOpacity * 0.16, coreOpacity * 0.38, coreOpacity * 0.2],
                scale: [1.02, 1.08, 1.03],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.16,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.2,
        }}
      />
      <motion.path
        d="M49 36 C57 35 64 42 64 51 C64 60 56 67 47 65 C39 63 34 55 36 47 C38 40 42 37 49 36Z"
        fill={`url(#${ids.coreGradient})`}
        initial={false}
        animate={
          reducedMotion
            ? {
                d: "M49 36 C57 35 64 42 64 51 C64 60 56 67 47 65 C39 63 34 55 36 47 C38 40 42 37 49 36Z",
              }
            : {
                d: [
                  "M49 36 C57 35 64 42 64 51 C64 60 56 67 47 65 C39 63 34 55 36 47 C38 40 42 37 49 36Z",
                  "M51 35 C60 37 65 45 62 54 C59 63 50 68 42 63 C35 59 34 49 39 42 C42 38 45 35 51 35Z",
                  "M47 37 C56 33 65 40 66 50 C67 59 58 65 49 66 C40 67 35 59 36 50 C37 42 40 39 47 37Z",
                  "M49 36 C57 35 64 42 64 51 C64 60 56 67 47 65 C39 63 34 55 36 47 C38 40 42 37 49 36Z",
                ],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.05,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M46 42 C51 38 58 42 59 49 C60 56 53 60 47 58 C42 56 40 50 42 46 C43 44 44 43 46 42Z"
        fill={`url(#${ids.coreWarmthGradient})`}
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.56, scale: 1 }
            : { opacity: [0.38, 0.72, 0.46], scale: [0.96, 1.12, 1] }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 0.74,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M39 48 C45 41 53 39 61 43"
        stroke={`url(#${ids.refractionGradient})`}
        strokeWidth={1.15 + activity * 0.08}
        strokeLinecap="round"
        strokeDasharray="8 18"
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.18, pathLength: 0.38, strokeDashoffset: 0 }
            : {
                opacity: [0.08, 0.34, 0.14],
                pathLength: [0.16, 0.62, 0.28],
                strokeDashoffset: [8, -2, -14],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 0.9,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.34,
        }}
      />
      <motion.path
        d="M44 58 C50 62 58 58 61 51"
        stroke="rgba(34,211,238,0.16)"
        strokeWidth="0.85"
        strokeLinecap="round"
        strokeDasharray="6 16"
        initial={false}
        animate={
          reducedMotion
            ? { opacity: 0.12, pathLength: 0.3, strokeDashoffset: 0 }
            : {
                opacity: [0.04, 0.22, 0.08],
                pathLength: [0.12, 0.48, 0.2],
                strokeDashoffset: [-4, -12, -20],
              }
        }
        transition={{
          duration: reducedMotion ? 0 : config.shellDuration * 1.08,
          repeat: reducedMotion ? 0 : Infinity,
          ease: "easeInOut",
          delay: reducedMotion ? 0 : 0.72,
        }}
      />
    </motion.g>
  );
}

export const FlowAIOrbCore = memo(FlowAIOrbCoreComponent);
