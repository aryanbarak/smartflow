// SmartFlow Workspace Birth Sequence - timing constants (ms)
export const T = {
  // Phase 1: The Void
  VOID_END: 350,

  // Phase 2: Photon Awakens
  PHOTON_START: 350,
  PHOTON_END: 780,

  // Phase 3: Thinking / Preparing
  ORB_FORM: 780,
  RING_1: 780,
  RING_2: 920,
  RING_3: 1060,
  BREATHE_START: 1250,

  // Phase 4: Deep Thinking
  DEEP_RINGS_START: 2100,

  // Phase 5: Decision
  DECISION_GLOW: 3300,
  BEAM_SHOOT: 3450,
  BEAM_FADE: 3850,
  THINKER_EXIT: 3850,

  // Phase 6: Ascend & Illuminate
  ASCEND_START: 3900,
  ASCEND_END: 4750,
  TRAIL_START: 3950,
  NAV_GLOW: 4650,
  NAV_ORB: 4650,
  LIGHT_SPREAD: 4800,

  // Phase 7: Building the Structure
  STRUCTURE_START: 5100,
  STRUCTURE_END: 6250,

  // Phase 8: Crystalizing Cards
  CRYSTALIZE_START: 5750,
  CRYSTALIZE_END: 7100,

  // Phase 9: Life Enters
  LIFE_START: 6400,
  LIFE_END: 7350,

  // Phase 10: Ready
  GREETING: 7000,
  NOTIFY_LAUNCHED: 6400,
  EXIT_START: 7600,
  OVERLAY_FADE_MS: 700,
  UNMOUNT: 8400,

  // Safety fallback in LaunchContext (ms from mount)
  SAFETY_FALLBACK: 10000,
} as const;

export const LAUNCH_PHASES = {
  IDLE: "idle",
  VOID: "void",
  AWAKENING: "awakening",
  THINKING: "thinking",
  DECISION: "decision",
  MOVING: "moving",
  BIRTHING: "birthing",
  READY: "ready",
} as const;

export type LaunchPhase = (typeof LAUNCH_PHASES)[keyof typeof LAUNCH_PHASES];

// Seconds versions for CSS animation-delay strings
export const S = Object.fromEntries(
  Object.entries(T).map(([key, value]) => [key, `${(value / 1000).toFixed(3)}s`]),
) as Record<keyof typeof T, string>;
