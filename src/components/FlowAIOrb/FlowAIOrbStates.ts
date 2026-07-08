export type FlowAIOrbCanonicalState =
  | "dormant"
  | "awakening"
  | "thinking"
  | "reasoning"
  | "decision"
  | "creating"
  | "presence"
  | "ready"
  | "disabled";

export type FlowAIOrbLegacyState = "idle";

export type FlowAIOrbState = FlowAIOrbCanonicalState | FlowAIOrbLegacyState;

export type FlowAIOrbSize = number | "xs" | "sm" | "md" | "lg" | "xl" | "hero";

export type FlowAIOrbTheme = "dark" | "transparent" | "subtle";

export type FlowAIOrbMotionMood =
  | "silent"
  | "waking"
  | "curious"
  | "focused"
  | "insight"
  | "generative"
  | "present"
  | "settled"
  | "muted";

export interface FlowAIOrbMotionSpec {
  scale: number[];
  glowIntensity: number;
  coreBrightness: number;
  layerOpacity: number;
  particleSpeed: number;
  particleDensity: number;
  beamIntensity: number;
  breathingSpeed: number;
  motionMood: FlowAIOrbMotionMood;
}

export interface FlowAIOrbDerivedMotionSpec extends FlowAIOrbMotionSpec {
  canonicalState: FlowAIOrbCanonicalState;
  shellOpacity: number;
  shellScale: number[];
  shellDuration: number;
  glowOpacity: number;
  glowScale: number;
  coreScale: number[];
  coreOpacity: number;
  particleOpacity: number;
  particleDuration: number;
  orbitDuration: number;
  beamOpacity: number;
}

export interface FlowAIOrbSizeSpec {
  pixelSize: number;
  orbRadius: number;
  glowRadius: number;
  particleCount: number;
  beamWidth: number;
  bloomStrength: number;
}

export const FLOW_AI_ORB_COLORS = {
  core: "#FFFFFF",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  cyan: "#22D3EE",
  void: "#07060E",
} as const;

export const FLOW_AI_ORB_CANONICAL_STATES = [
  "dormant",
  "awakening",
  "thinking",
  "reasoning",
  "decision",
  "creating",
  "presence",
  "ready",
  "disabled",
] as const satisfies readonly FlowAIOrbCanonicalState[];

export const FLOW_AI_ORB_PUBLIC_STATES = [
  ...FLOW_AI_ORB_CANONICAL_STATES,
  "idle",
] as const satisfies readonly FlowAIOrbState[];

export const FLOW_AI_ORB_SIZE_PRESETS: Record<Exclude<FlowAIOrbSize, number>, FlowAIOrbSizeSpec> = {
  xs: {
    pixelSize: 24,
    orbRadius: 38,
    glowRadius: 1.08,
    particleCount: 2,
    beamWidth: 0.12,
    bloomStrength: 0.72,
  },
  sm: {
    pixelSize: 32,
    orbRadius: 39,
    glowRadius: 1.14,
    particleCount: 3,
    beamWidth: 0.13,
    bloomStrength: 0.8,
  },
  md: {
    pixelSize: 48,
    orbRadius: 40,
    glowRadius: 1.22,
    particleCount: 5,
    beamWidth: 0.15,
    bloomStrength: 0.88,
  },
  lg: {
    pixelSize: 64,
    orbRadius: 41,
    glowRadius: 1.3,
    particleCount: 7,
    beamWidth: 0.16,
    bloomStrength: 0.96,
  },
  xl: {
    pixelSize: 96,
    orbRadius: 42,
    glowRadius: 1.42,
    particleCount: 9,
    beamWidth: 0.18,
    bloomStrength: 1.08,
  },
  hero: {
    pixelSize: 192,
    orbRadius: 43.5,
    glowRadius: 1.78,
    particleCount: 14,
    beamWidth: 0.23,
    bloomStrength: 1.36,
  },
};

export const FLOW_AI_ORB_MOTION_SPEC: Record<FlowAIOrbCanonicalState, FlowAIOrbMotionSpec> = {
  dormant: {
    scale: [0.94, 0.965, 0.94],
    glowIntensity: 0.26,
    coreBrightness: 0.46,
    layerOpacity: 0.3,
    particleSpeed: 0.1,
    particleDensity: 0.04,
    beamIntensity: 0,
    breathingSpeed: 12,
    motionMood: "silent",
  },
  awakening: {
    scale: [0.72, 1.04, 0.98, 1],
    glowIntensity: 0.82,
    coreBrightness: 0.92,
    layerOpacity: 0.72,
    particleSpeed: 0.72,
    particleDensity: 0.46,
    beamIntensity: 0.08,
    breathingSpeed: 5.2,
    motionMood: "waking",
  },
  thinking: {
    scale: [1, 1.08, 0.965, 1.045, 1],
    glowIntensity: 0.9,
    coreBrightness: 1,
    layerOpacity: 0.82,
    particleSpeed: 0.86,
    particleDensity: 0.72,
    beamIntensity: 0,
    breathingSpeed: 4.8,
    motionMood: "curious",
  },
  reasoning: {
    scale: [1, 1.12, 0.94, 1.07, 1],
    glowIntensity: 1.02,
    coreBrightness: 1.08,
    layerOpacity: 0.92,
    particleSpeed: 1,
    particleDensity: 0.82,
    beamIntensity: 0.16,
    breathingSpeed: 4.1,
    motionMood: "focused",
  },
  decision: {
    scale: [1, 0.91, 1.14, 1.02],
    glowIntensity: 1.18,
    coreBrightness: 1.22,
    layerOpacity: 1,
    particleSpeed: 1.14,
    particleDensity: 0.68,
    beamIntensity: 0.44,
    breathingSpeed: 2.4,
    motionMood: "insight",
  },
  creating: {
    scale: [1, 1.055, 0.98, 1.025, 1],
    glowIntensity: 1.1,
    coreBrightness: 1.14,
    layerOpacity: 0.96,
    particleSpeed: 1.06,
    particleDensity: 0.78,
    beamIntensity: 0.8,
    breathingSpeed: 5.6,
    motionMood: "generative",
  },
  presence: {
    scale: [1, 1.035, 0.985, 1],
    glowIntensity: 0.74,
    coreBrightness: 0.96,
    layerOpacity: 0.7,
    particleSpeed: 0.52,
    particleDensity: 0.38,
    beamIntensity: 0,
    breathingSpeed: 8,
    motionMood: "present",
  },
  ready: {
    scale: [1, 1.025, 0.99, 1],
    glowIntensity: 0.66,
    coreBrightness: 0.9,
    layerOpacity: 0.64,
    particleSpeed: 0.42,
    particleDensity: 0.3,
    beamIntensity: 0,
    breathingSpeed: 9,
    motionMood: "settled",
  },
  disabled: {
    scale: [0.92],
    glowIntensity: 0.16,
    coreBrightness: 0.46,
    layerOpacity: 0.22,
    particleSpeed: 0,
    particleDensity: 0,
    beamIntensity: 0,
    breathingSpeed: 0,
    motionMood: "muted",
  },
};

export const FLOW_AI_ORB_STATE_CONFIG = FLOW_AI_ORB_MOTION_SPEC;

export function normalizeFlowAIOrbState(state: FlowAIOrbState = "presence"): FlowAIOrbCanonicalState {
  return state === "idle" ? "presence" : state;
}

export function resolveFlowAIOrbSize(size: FlowAIOrbSize = "md"): FlowAIOrbSizeSpec {
  if (typeof size !== "number") {
    return FLOW_AI_ORB_SIZE_PRESETS[size];
  }

  const clampedSize = Math.max(size, 16);
  const normalized = Math.min(Math.max((clampedSize - 24) / 168, 0), 1);

  return {
    pixelSize: clampedSize,
    orbRadius: 38 + normalized * 5,
    glowRadius: 1.08 + normalized * 0.58,
    particleCount: Math.round(2 + normalized * 10),
    beamWidth: 0.12 + normalized * 0.08,
    bloomStrength: 0.72 + normalized * 0.5,
  };
}

function dampScale(values: number[], intensity = 0.65) {
  return values.map((value) => 1 + (value - 1) * intensity);
}

export function getFlowAIOrbStateConfig(state: FlowAIOrbState): FlowAIOrbDerivedMotionSpec {
  const canonicalState = normalizeFlowAIOrbState(state);
  const spec = FLOW_AI_ORB_MOTION_SPEC[canonicalState];
  const active = canonicalState !== "disabled";
  const shellScale = active ? dampScale(spec.scale, 0.62) : spec.scale;
  const coreScale =
    spec.motionMood === "insight"
      ? [1, 0.86, 1.27, 1.025]
      : dampScale(spec.scale, 0.82);

  return {
    ...spec,
    canonicalState,
    shellOpacity: active ? 1 : 0.38,
    shellScale,
    shellDuration: spec.breathingSpeed,
    glowOpacity: spec.glowIntensity,
    glowScale: 0.9 + spec.glowIntensity * 0.28,
    coreScale,
    coreOpacity: Math.min(spec.coreBrightness, 1),
    particleOpacity: spec.particleDensity,
    particleDuration: spec.particleSpeed > 0 ? 5.8 / spec.particleSpeed : 0,
    orbitDuration: spec.particleSpeed > 0 ? 13 / spec.particleSpeed : 0,
    beamOpacity: spec.beamIntensity,
  };
}
