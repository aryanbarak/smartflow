import { describe, expect, it } from "vitest";
import { supportedIntentTypes as validatorIntentTypes } from "./intentValidator";
// Cross-package import on purpose: the Worker and the frontend are two
// separately deployed artifacts (Cloudflare Worker vs Pages), so nothing
// enforces that their intent lists agree except this test. A missing entry
// on either side fails silently otherwise — Gemini simply can't propose an
// intent absent from the Worker's schema enum, or the deterministic
// validator rejects a proposal absent from its own supported-type list —
// with no error, just a quiet fallback to ask_clarification/unsupported.
import { SUPPORTED_INTENT_VALUES as workerIntentValues } from "../../../../agent/worker/reasoning-endpoint";

describe("reasoning intent parity between the Worker schema and the frontend validator", () => {
  it("keeps every intent in sync across both lists", () => {
    // Guards against a vacuous pass if either import silently resolved empty.
    expect(workerIntentValues.length).toBeGreaterThan(0);
    expect(validatorIntentTypes.length).toBeGreaterThan(0);

    const workerSet = new Set<string>(workerIntentValues);
    const validatorSet = new Set<string>(validatorIntentTypes);

    const missingFromWorker = validatorIntentTypes.filter((type) => !workerSet.has(type));
    const missingFromValidator = workerIntentValues.filter((type) => !validatorSet.has(type));

    expect(
      missingFromWorker,
      "These intents are in intentValidator.ts's supportedIntentTypes but missing from " +
        "agent/worker/reasoning-endpoint.ts's SUPPORTED_INTENT_VALUES — Gemini's schema enum " +
        "cannot include them until they're added there, so the model can never propose them.",
    ).toEqual([]);

    expect(
      missingFromValidator,
      "These intents are in agent/worker/reasoning-endpoint.ts's SUPPORTED_INTENT_VALUES but " +
        "missing from intentValidator.ts's supportedIntentTypes — the deterministic validator " +
        "will reject any proposal for them as unsupported until they're added there.",
    ).toEqual([]);
  });
});
