import { useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

export function SmartflowPointerFollower() {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsFinePointer || reduceMotion) return;

    const root = rootRef.current;
    if (!root) return;

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      setEnabled(true);
    };

    const animate = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.085;
      current.y += (target.y - current.y) * 0.085;

      root.style.transform = `translate3d(${current.x - 72}px, ${current.y - 72}px, 0)`;
      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-20 h-36 w-36 rounded-full opacity-0 mix-blend-screen transition-opacity duration-500"
      style={{
        opacity: enabled ? 0.72 : 0,
        willChange: "transform, opacity",
      }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,hsl(0_0%_100%/0.5),hsl(var(--primary)/0.34)_18%,hsl(var(--primary)/0.12)_42%,transparent_70%)] blur-xl" />
      <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_0_28px_hsl(var(--primary)/0.78)]" />
      <div className="absolute inset-8 rounded-full border border-primary/25" />
    </div>
  );
}
