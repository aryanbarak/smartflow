import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useLaunch } from "@/contexts/LaunchContext";
import { LAUNCH_PHASES } from "@/lib/animations/timelines";

interface WorkspaceRevealProps {
  children: ReactNode;
  className?: string;
}

interface WorkspaceRevealSectionProps {
  children: ReactNode;
  order: number;
  className?: string;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function useWorkspaceRevealState() {
  const { phase, launched } = useLaunch();
  return launched || phase === LAUNCH_PHASES.BIRTHING || phase === LAUNCH_PHASES.READY;
}

export function WorkspaceReveal({
  children,
  className = "",
}: Readonly<WorkspaceRevealProps>) {
  const shouldReveal = useWorkspaceRevealState();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative isolate ${className}`}
      initial={false}
      animate={shouldReveal ? "visible" : "hidden"}
      variants={{
        hidden: {
          opacity: reduceMotion ? 1 : 0.01,
          y: reduceMotion ? 0 : 8,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        ease: easeOut,
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        initial={false}
        animate={
          shouldReveal
            ? { opacity: reduceMotion ? 0.16 : [0.14, 0.24, 0.18] }
            : { opacity: 0 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(ellipse 54% 36% at 50% 0%, rgba(196,184,255,0.16), transparent 66%), radial-gradient(ellipse 42% 28% at 50% 18%, rgba(56,189,248,0.07), transparent 72%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-32 w-32 -translate-x-1/2 rounded-full"
        initial={false}
        animate={
          shouldReveal
            ? { opacity: reduceMotion ? 0.18 : [0.16, 0.28, 0.18], scale: 1 }
            : { opacity: 0, scale: 0.88 }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(circle, rgba(196,184,255,0.24), rgba(123,111,232,0.12) 45%, transparent 72%)",
          filter: "blur(8px)",
        }}
      />
      {children}
    </motion.div>
  );
}

export function WorkspaceRevealSection({
  children,
  order,
  className = "",
}: Readonly<WorkspaceRevealSectionProps>) {
  const shouldReveal = useWorkspaceRevealState();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={false}
      animate={shouldReveal ? "visible" : "hidden"}
      variants={{
        hidden: {
          opacity: reduceMotion ? 1 : 0,
          y: reduceMotion ? 0 : 24,
          filter: reduceMotion ? "none" : "blur(8px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        },
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.64,
        delay: reduceMotion ? 0 : order * 0.16,
        ease: easeOut,
      }}
      style={{ willChange: reduceMotion ? undefined : "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
