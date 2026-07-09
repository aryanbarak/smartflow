import { cn } from "@/lib/utils";
import { SmartflowAsciiSphere } from "./smartflow-ascii-sphere";
import { SmartflowAsciiTetrahedron } from "./smartflow-ascii-tetrahedron";
import { SmartflowAsciiWave } from "./smartflow-ascii-wave";
import { SmartflowWireMesh } from "./smartflow-wire-mesh";

type SmartflowAsciiVisualVariant = "sphere" | "tetrahedron" | "wave" | "wiremesh";

type SmartflowAsciiVisualProps = {
  variant?: SmartflowAsciiVisualVariant;
  className?: string;
};

const visualByVariant = {
  sphere: SmartflowAsciiSphere,
  tetrahedron: SmartflowAsciiTetrahedron,
  wave: SmartflowAsciiWave,
  wiremesh: SmartflowWireMesh,
} satisfies Record<SmartflowAsciiVisualVariant, () => JSX.Element>;

export function SmartflowAsciiVisual({
  variant = "sphere",
  className,
}: SmartflowAsciiVisualProps) {
  const Visual = visualByVariant[variant];

  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <Visual />
    </div>
  );
}
