"use client";

import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SmartflowAsciiSphere } from "./smartflow-ascii-sphere";
import { SmartflowAsciiTetrahedron } from "./smartflow-ascii-tetrahedron";
import { SmartflowAsciiWave } from "./smartflow-ascii-wave";
import { SmartflowNavigation } from "./smartflow-navigation";

const workflowCards = [
  "Document intake",
  "OCR extraction",
  "AI summaries",
  "Task routing",
  "Agent handoff",
  "Audit trail",
];

const stats = [
  { value: "12x", label: "faster document triage" },
  { value: "84%", label: "less manual routing" },
  { value: "24/7", label: "agent-ready workflows" },
  { value: "0", label: "copy-paste operations" },
];

export function SmartflowLanding() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground noise-overlay">
      <SmartflowNavigation />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-35">
          {[...Array(8)].map((_, index) => (
            <div
              key={`h-${index}`}
              className="absolute left-0 right-0 h-px bg-foreground/10"
              style={{ top: `${12.5 * (index + 1)}%` }}
            />
          ))}
          {[...Array(12)].map((_, index) => (
            <div
              key={`v-${index}`}
              className="absolute bottom-0 top-0 w-px bg-foreground/10"
              style={{ left: `${8.33 * (index + 1)}%` }}
            />
          ))}
        </div>

        <div className="absolute inset-y-16 right-[-22%] w-[120%] opacity-45 pointer-events-none sm:right-[-20%] sm:w-[82%] lg:right-[-8%] lg:w-[62%]">
          <SmartflowAsciiSphere />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col justify-center px-6 py-32 lg:px-12">
          <div className="mb-8 inline-flex max-w-[320px] items-center gap-3 font-mono text-sm text-muted-foreground sm:max-w-none">
            <span className="h-px w-8 shrink-0 bg-foreground/30" />
            <span>AI operations for documents, tasks, and agents</span>
          </div>

          <div className="max-w-5xl">
            <h1 className="font-display text-[clamp(3.45rem,13vw,10rem)] leading-[0.88] tracking-tight">
              Smartflow
              <span className="block text-foreground/55">automation</span>
            </h1>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-end">
            <p className="max-w-[340px] text-lg leading-relaxed text-muted-foreground sm:max-w-xl sm:text-xl lg:text-2xl">
              Build AI-powered workflows for OCR, summaries, approvals, follow-ups, and future agent actions.
            </p>

            <div className="flex max-w-[340px] flex-col gap-4 sm:max-w-none sm:flex-row lg:justify-end">
              <Button size="lg" className="h-14 w-full justify-center rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90 sm:w-auto">
                Start workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 w-full justify-center rounded-full border-foreground/20 px-8 text-base sm:w-auto">
                View demo
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 z-10">
          <div className="flex gap-16 whitespace-nowrap marquee">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-16">
                {stats.map((stat) => (
                  <div key={`${setIndex}-${stat.label}`} className="flex items-baseline gap-4">
                    <span className="font-display text-4xl lg:text-5xl">{stat.value}</span>
                    <span className="max-w-36 text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflows" className="relative mx-auto max-w-[1400px] px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[420px_1fr] lg:gap-20">
          <div>
            <span className="mb-6 block font-mono text-sm text-muted-foreground">Workflow surface</span>
            <h2 className="font-display text-4xl leading-tight lg:text-6xl">
              Keep the useful motion.
              <span className="block text-muted-foreground">Make it Smartflow.</span>
            </h2>
          </div>
          <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-3">
            {workflowCards.map((card) => (
              <div key={card} className="bg-background p-6">
                <Check className="mb-10 h-5 w-5" />
                <h3 className="text-lg font-medium">{card}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="automation" className="border-y border-foreground/10 bg-foreground text-background">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-24 lg:grid-cols-2 lg:px-12 lg:py-32">
          <div>
            <span className="mb-6 block font-mono text-sm text-background/55">Automation layer</span>
            <h2 className="font-display text-4xl leading-tight lg:text-6xl">
              From upload
              <br />
              to action.
            </h2>
          </div>
          <p className="max-w-xl text-xl leading-relaxed text-background/65">
            This section is intentionally simple so the sticky menu, hero ASCII sphere, and closing tetrahedron remain
            the reusable design system pieces.
          </p>
        </div>
      </section>

      <section id="deploy" className="relative px-6 py-24 lg:px-12 lg:py-32">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden border border-foreground">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute left-0 right-0 top-1/3 h-px bg-foreground/20" />
            <div className="absolute bottom-0 top-0 right-20 w-px bg-foreground/20" />
          </div>

          <div className="grid min-h-[520px] gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:p-16">
            <div className="relative z-10 flex flex-col justify-center">
              <h2 className="font-display text-4xl leading-[0.98] lg:text-7xl">
                Ready to run
                <br />
                Smartflow?
              </h2>
              <p className="mt-8 max-w-xl text-xl leading-relaxed text-muted-foreground">
                Connect your documents, define the workflow, and let AI agents handle the repetitive work.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="h-14 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90">
                  Start automating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 rounded-full border-foreground/20 px-8 text-base">
                  Talk to sales
                </Button>
              </div>
              <p className="mt-8 font-mono text-sm text-muted-foreground">No credit card required</p>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="h-[420px] w-[420px]">
                <SmartflowAsciiTetrahedron />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="agents" className="relative overflow-hidden border-t border-foreground/10">
        <div className="absolute inset-0 h-72 opacity-25 pointer-events-none">
          <SmartflowAsciiWave />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1400px] gap-10 px-6 py-20 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-12">
          <div>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-2xl">Smartflow</span>
              <span className="font-mono text-xs text-muted-foreground">AI</span>
            </div>
            <p className="max-w-xs text-muted-foreground">
              AI automation for documents, workflows, and agent-ready operations.
            </p>
          </div>
          {[
            ["Product", "Workflows", "OCR", "Summaries", "Agents"],
            ["Teams", "Operations", "Finance", "Legal", "Support"],
            ["Company", "Security", "Status", "Contact", "Docs"],
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3 className="mb-5 text-sm font-medium">{title}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
