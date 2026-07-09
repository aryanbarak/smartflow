"use client";

import { useEffect, useRef } from "react";

type Point3d = {
  x: number;
  y: number;
  z: number;
};

type DrawPoint = Point3d & {
  char: string;
};

const asciiChars = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";
const vertices: Point3d[] = [
  { x: 0, y: 1, z: 0 },
  { x: -0.943, y: -0.333, z: -0.5 },
  { x: 0.943, y: -0.333, z: -0.5 },
  { x: 0, y: -0.333, z: 1 },
];

const edges = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [2, 3],
  [3, 1],
];

const faces = [
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 1],
  [1, 3, 2],
];

function rotateY(point: Point3d, angle: number): Point3d {
  return {
    x: point.x * Math.cos(angle) - point.z * Math.sin(angle),
    y: point.y,
    z: point.x * Math.sin(angle) + point.z * Math.cos(angle),
  };
}

function rotateX(point: Point3d, angle: number): Point3d {
  return {
    x: point.x,
    y: point.y * Math.cos(angle) - point.z * Math.sin(angle),
    z: point.y * Math.sin(angle) + point.z * Math.cos(angle),
  };
}

function rotateZ(point: Point3d, angle: number): Point3d {
  return {
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
    z: point.z,
  };
}

function rotate(point: Point3d, time: number) {
  return rotateZ(rotateX(rotateY(point, time * 0.4), time * 0.3), time * 0.2);
}

export function SmartflowAsciiTetrahedron() {
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
      const scale = Math.min(rect.width, rect.height) * 0.62;
      const points: DrawPoint[] = [];

      ctx.font = `${Math.max(12, Math.min(18, rect.width / 28))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      edges.forEach(([i, j]) => {
        const v1 = vertices[i];
        const v2 = vertices[j];

        for (let t = 0; t <= 1; t += 0.05) {
          const point = rotate(
            {
              x: v1.x + (v2.x - v1.x) * t,
              y: v1.y + (v2.y - v1.y) * t,
              z: v1.z + (v2.z - v1.z) * t,
            },
            time,
          );
          const depth = (point.z + 1.5) / 3;
          const charIndex = Math.floor(depth * (asciiChars.length - 1));

          points.push({
            x: centerX + point.x * scale,
            y: centerY - point.y * scale,
            z: point.z,
            char: asciiChars[Math.min(charIndex, asciiChars.length - 1)],
          });
        }
      });

      faces.forEach(([i, j, k]) => {
        const v1 = vertices[i];
        const v2 = vertices[j];
        const v3 = vertices[k];

        for (let u = 0; u <= 1; u += 0.12) {
          for (let v = 0; v <= 1 - u; v += 0.12) {
            const w = 1 - u - v;
            const point = rotate(
              {
                x: v1.x * u + v2.x * v + v3.x * w,
                y: v1.y * u + v2.y * v + v3.y * w,
                z: v1.z * u + v2.z * v + v3.z * w,
              },
              time,
            );
            const depth = (point.z + 1.5) / 3;
            const charIndex = Math.floor(depth * (asciiChars.length - 1));

            points.push({
              x: centerX + point.x * scale,
              y: centerY - point.y * scale,
              z: point.z,
              char: asciiChars[Math.min(charIndex, asciiChars.length - 1)],
            });
          }
        }
      });

      points.sort((a, b) => a.z - b.z);
      points.forEach((point) => {
        const alpha = Math.min(0.12 + (point.z + 1.5) * 0.22, 0.82);
        ctx.fillStyle = `hsl(${foreground} / ${alpha})`;
        ctx.fillText(point.char, point.x, point.y);
      });

      time += 0.014;
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
