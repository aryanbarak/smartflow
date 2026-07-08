import { useState } from "react";
import { FlowAIOrb } from "./FlowAIOrb";
import {
  FLOW_AI_ORB_CANONICAL_STATES,
  type FlowAIOrbCanonicalState,
  type FlowAIOrbSize,
} from "./FlowAIOrbStates";

const SIZES: FlowAIOrbSize[] = [24, 32, 48, 64, 96, 128, "hero"];
const BEAM_OPTIONS = ["auto", "on", "off"] as const;

type BeamOption = (typeof BEAM_OPTIONS)[number];

function resolveBeamOption(option: BeamOption) {
  if (option === "auto") return "auto";
  return option === "on";
}

function formatSize(size: FlowAIOrbSize) {
  return typeof size === "number" ? `${size}px` : size;
}

export function FlowAIOrbPlayground() {
  const [beam, setBeam] = useState<BeamOption>("auto");
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="min-h-screen bg-[#07060E] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8B5CF6]">
              Internal Preview
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Flow AI Orb Playground</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            <label className="flex items-center gap-2">
              <span>Beam</span>
              <select
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white outline-none"
                value={beam}
                onChange={(event) => setBeam(event.target.value as BeamOption)}
              >
                {BEAM_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#07060E]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => setReducedMotion(event.target.checked)}
              />
              <span>Reduced motion</span>
            </label>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FLOW_AI_ORB_CANONICAL_STATES.map((state) => (
            <StatePreview
              key={state}
              state={state}
              beam={resolveBeamOption(beam)}
              reducedMotion={reducedMotion}
            />
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-[#22D3EE]">
            Size Scale
          </h2>
          <div className="mt-6 flex flex-wrap items-end gap-8">
            {SIZES.map((size) => (
              <div key={String(size)} className="flex min-w-16 flex-col items-center gap-3">
                <FlowAIOrb
                  size={size}
                  state="presence"
                  beam={resolveBeamOption(beam)}
                  reducedMotion={reducedMotion}
                  theme="transparent"
                  ariaLabel={`Flow AI Orb ${formatSize(size)}`}
                />
                <span className="text-xs text-white/55">{formatSize(size)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-[#8B5CF6]">
            Theme Check
          </h2>
          <div className="mt-6 flex flex-wrap gap-8">
            {(["transparent", "dark", "subtle"] as const).map((theme) => (
              <div key={theme} className="flex flex-col items-center gap-3">
                <FlowAIOrb
                  size={96}
                  state="thinking"
                  beam={resolveBeamOption(beam)}
                  reducedMotion={reducedMotion}
                  theme={theme}
                  ariaLabel={`Flow AI Orb ${theme} theme`}
                />
                <span className="text-xs text-white/55">{theme}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatePreview({
  state,
  beam,
  reducedMotion,
}: {
  state: FlowAIOrbCanonicalState;
  beam: boolean | "auto";
  reducedMotion: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium capitalize text-white">{state}</h2>
          <p className="mt-1 text-xs text-white/50">state=&quot;{state}&quot;</p>
        </div>
        <FlowAIOrb
          size={64}
          state={state}
          beam={beam}
          reducedMotion={reducedMotion}
          theme="transparent"
          ariaLabel={`Flow AI Orb ${state}`}
        />
      </div>
    </div>
  );
}
