// SmartFlow Workspace Birth Sequence — timing constants (ms)
export const T = {
  // Phase 1: The Void
  VOID_END: 400,

  // Phase 2: Photon Awakens
  PHOTON_START: 400,
  PHOTON_END: 800,

  // Phase 3: Thinking / Preparing
  ORB_FORM: 800,
  RING_1: 800,
  RING_2: 930,
  RING_3: 1060,
  BREATHE_START: 1300,

  // Phase 4: Deep Thinking
  DEEP_RINGS_START: 2000,

  // Phase 5: Decision
  DECISION_GLOW: 3000,
  BEAM_SHOOT: 3100,
  BEAM_FADE: 3550,
  THINKER_EXIT: 3500,

  // Phase 6: Ascend & Illuminate
  ASCEND_START: 3600,
  ASCEND_END: 4600,
  TRAIL_START: 3650,
  NAV_GLOW: 4300,
  NAV_ORB: 4300,
  LIGHT_SPREAD: 4200,

  // Phase 7: Building the Structure
  STRUCTURE_START: 4600,
  STRUCTURE_END: 6200,

  // Phase 8: Crystalizing Cards
  CRYSTALIZE_START: 6200,
  CRYSTALIZE_END: 8200,

  // Phase 9: Life Enters
  LIFE_START: 8200,
  LIFE_END: 9200,

  // Phase 10: Ready
  GREETING: 9200,
  NOTIFY_LAUNCHED: 9800,
  EXIT_START: 9800,
  OVERLAY_FADE_MS: 1200,
  UNMOUNT: 11200,

  // Safety fallback in LaunchContext (ms from mount)
  SAFETY_FALLBACK: 14000,
} as const;

// Seconds versions for CSS animation-delay strings
export const S = Object.fromEntries(
  Object.entries(T).map(([k, v]) => [k, `${(v / 1000).toFixed(3)}s`])
) as Record<keyof typeof T, string>;
