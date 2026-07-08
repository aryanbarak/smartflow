import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLaunch } from "@/contexts/LaunchContext";

interface BaseProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

interface NoDelayProps {
  children: ReactNode;
  className?: string;
}

// FadeUp — enters from below with opacity; primary content reveal primitive
export function FadeUp({ children, delay = 0, className }: Readonly<BaseProps>) {
  const { launched, isBirthingWorkspace } = useLaunch();
  const shouldReveal = launched && isBirthingWorkspace;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={shouldReveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ScaleIn — scales up from 95% with opacity; good for hero/featured cards
export function ScaleIn({ children, delay = 0, className }: Readonly<BaseProps>) {
  const { launched, isBirthingWorkspace } = useLaunch();
  const shouldReveal = launched && isBirthingWorkspace;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={shouldReveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// CardReveal — subtle y-shift with an overshoot ease; for individual cards
export function CardReveal({ children, delay = 0, className }: Readonly<BaseProps>) {
  const { launched, isBirthingWorkspace } = useLaunch();
  const shouldReveal = launched && isBirthingWorkspace;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={shouldReveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// StaggerContainer — orchestrates sequential child animation; pair with StaggerItem
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.07,
}: Readonly<BaseProps & { staggerDelay?: number }>) {
  const { launched, isBirthingWorkspace } = useLaunch();
  const shouldReveal = launched && isBirthingWorkspace;
  return (
    <motion.div
      initial="hidden"
      animate={shouldReveal ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// StaggerItem — must be a direct child of StaggerContainer
export function StaggerItem({ children, className }: Readonly<NoDelayProps>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// OrbTransition — animated gradient orb with pulse ring; used in LaunchExperience
export function OrbTransition({ size = 96 }: Readonly<{ size?: number }>) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-glow), 0 0 60px rgba(56, 189, 248, 0.35)",
        }}
      />
      {/* Pulse ring expands and fades — loops continuously */}
      <motion.div
        animate={{ scale: [1, 1.65], opacity: [0.45, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "var(--gradient-primary)",
        }}
      />
    </div>
  );
}
