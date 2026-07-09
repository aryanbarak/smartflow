"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  z: number;
  char: string;
};

const asciiChars = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";

export function SmartflowAsciiSphere() {
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

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.48;
      const points: Point[] = [];

      ctx.font = `${Math.max(10, Math.min(14, rect.width / 54))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let phi = 0; phi < Math.PI * 2; phi += 0.16) {
        for (let theta = 0; theta < Math.PI; theta += 0.16) {
          const x = Math.sin(theta) * Math.cos(phi + time * 0.5);
          const y = Math.sin(theta) * Math.sin(phi + time * 0.5);
          const z = Math.cos(theta);

          const rotY = time * 0.3;
          const newX = x * Math.cos(rotY) - z * Math.sin(rotY);
          const newZ = x * Math.sin(rotY) + z * Math.cos(rotY);

          const rotX = time * 0.2;
          const newY = y * Math.cos(rotX) - newZ * Math.sin(rotX);
          const finalZ = y * Math.sin(rotX) + newZ * Math.cos(rotX);
          const depth = (finalZ + 1) / 2;
          const charIndex = Math.floor(depth * (asciiChars.length - 1));

          points.push({
            x: centerX + newX * radius,
            y: centerY + newY * radius,
            z: finalZ,
            char: asciiChars[Math.min(charIndex, asciiChars.length - 1)],
          });
        }
      }

      points.sort((a, b) => a.z - b.z);
      points.forEach((point) => {
        const alpha = 0.12 + (point.z + 1) * 0.28;
        ctx.fillStyle = `hsl(${foreground} / ${alpha})`;
        ctx.fillText(point.char, point.x, point.y);
      });

      time += 0.018;
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
