import { useEffect, useRef } from "react";

type Point3D = {
  x: number;
  y: number;
  z: number;
  ring: number;
  segment: number;
};

export function SmartflowWireMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const primary =
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
      "248 86% 67%";
    const highlight = "0 0% 100%";
    const points: Point3D[] = [];
    const rings = 28;
    const segments = 54;

    for (let ring = 1; ring < rings; ring += 1) {
      const phi = (ring / rings) * Math.PI;
      for (let segment = 0; segment < segments; segment += 1) {
        const theta = (segment / segments) * Math.PI * 2;
        const noise =
          1 +
          0.14 * Math.sin(theta * 5 + phi * 3) +
          0.08 * Math.cos(theta * 9 - phi * 4);

        points.push({
          x: Math.sin(phi) * Math.cos(theta) * noise,
          y: Math.cos(phi) * noise,
          z: Math.sin(phi) * Math.sin(theta) * noise,
          ring,
          segment,
        });
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rotate = (point: Point3D, time: number) => {
      const ay = time * 0.00016;
      const ax = -0.34 + Math.sin(time * 0.00022) * 0.08;
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);

      const x1 = point.x * cy - point.z * sy;
      const z1 = point.x * sy + point.z * cy;
      const y1 = point.y * cx - z1 * sx;
      const z2 = point.y * sx + z1 * cx;

      return { x: x1, y: y1, z: z2 };
    };

    const render = (time = 0) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const scale = Math.min(width, height) * 0.36;
      const projected = points.map((point) => {
        const wobble = reduceMotion
          ? 1
          : 1 + 0.04 * Math.sin(time * 0.001 + point.ring * 0.75 + point.segment * 0.18);
        const rotated = rotate(
          {
            ...point,
            x: point.x * wobble,
            y: point.y * wobble,
            z: point.z * wobble,
          },
          time,
        );
        const depth = 2.8 + rotated.z;
        const perspective = 1.8 / depth;

        return {
          x: width / 2 + rotated.x * scale * perspective,
          y: height / 2 + rotated.y * scale * perspective,
          z: rotated.z,
          ring: point.ring,
          segment: point.segment,
        };
      });

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.55;

      const glow = ctx.createRadialGradient(
        width * 0.48,
        height * 0.48,
        0,
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.46,
      );
      glow.addColorStop(0, `hsl(${highlight} / 0.22)`);
      glow.addColorStop(0.2, `hsl(${primary} / 0.22)`);
      glow.addColorStop(0.55, `hsl(${primary} / 0.1)`);
      glow.addColorStop(1, `hsl(${primary} / 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < projected.length; i += 1) {
        const point = projected[i];
        const nextSegment = projected.find(
          (candidate) =>
            candidate.ring === point.ring &&
            candidate.segment === (point.segment + 1) % segments,
        );
        const nextRing = projected.find(
          (candidate) =>
            candidate.ring === point.ring + 1 && candidate.segment === point.segment,
        );

        for (const next of [nextSegment, nextRing]) {
          if (!next) continue;
          const alpha = Math.max(0.04, Math.min(0.26, 0.1 + (point.z + next.z) * 0.04));
          const color = point.z > 0.55 && next.z > 0.55 ? highlight : primary;
          ctx.strokeStyle = `hsl(${color} / ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }
      }

      for (const point of projected) {
        const alpha = Math.max(0.08, Math.min(0.34, 0.15 + point.z * 0.055));
        const color = point.z > 0.6 ? highlight : primary;
        ctx.fillStyle = `hsl(${color} / ${alpha})`;
        ctx.fillRect(point.x, point.y, 1.1, 1.1);
      }

      if (!reduceMotion) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
