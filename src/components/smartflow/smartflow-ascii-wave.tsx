"use client";

import { useEffect, useRef } from "react";

const waveChars = "·∘○◯◌●◉";

export function SmartflowAsciiWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "222 47% 11%";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cols = Math.max(1, Math.floor(rect.width / 20));
      const rows = Math.max(1, Math.floor(rect.height / 20));

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);
          const wave1 = Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
          const wave2 = Math.sin((x + y) * 0.1 + time * 1.5);
          const wave3 = Math.cos(x * 0.1 - y * 0.1 + time * 0.8);
          const normalized = ((wave1 + wave2 + wave3) / 3 + 1) / 2;
          const charIndex = Math.floor(normalized * (waveChars.length - 1));
          const alpha = 0.08 + normalized * 0.28;

          ctx.fillStyle = `hsl(${foreground} / ${alpha})`;
          ctx.fillText(waveChars[charIndex], px, py);
        }
      }

      time += 0.024;
      if (!reduceMotion) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
