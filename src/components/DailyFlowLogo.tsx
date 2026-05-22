interface DailyFlowLogoProps {
  size?: number;
  variant?: "dark" | "light";
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function DailyFlowIcon({ size = 40, variant = "dark" }: Pick<DailyFlowLogoProps, "size" | "variant">) {
  const rx = Math.round(size * 0.22);
  const pad = Math.round(size * 0.19);
  const barH = Math.round(size * 0.094);
  const bar1W = size - pad * 2;
  const bar2W = Math.round(bar1W * 0.69);
  const bar3W = Math.round(bar1W * 0.43);
  const gap = Math.round(size * 0.094 + size * 0.03);
  const bar1Y = pad + Math.round(size * 0.05);
  const bar2Y = bar1Y + gap;
  const bar3Y = bar2Y + gap;
  const dotR = Math.round(barH * 0.5);
  const dotCX = pad + bar1W - dotR;
  const dotCY = bar3Y + barH / 2;
  const gradId = `df-grad-${size}`;
  const bgColor = variant === "dark" ? "#0F172A" : "#F8FAFC";
  const bar2Fill = variant === "dark" ? "#ffffff" : "#0F172A";
  const bar2Opacity = variant === "dark" ? 0.9 : 0.85;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect width={size} height={size} rx={rx} fill={bgColor} />
      <rect x={pad} y={bar1Y} width={bar1W} height={barH} rx={barH / 2} fill={`url(#${gradId})`} />
      <rect x={pad} y={bar2Y} width={bar2W} height={barH} rx={barH / 2} fill={bar2Fill} opacity={bar2Opacity} />
      <rect x={pad} y={bar3Y} width={bar3W} height={barH} rx={barH / 2} fill={`url(#${gradId})`} opacity={0.52} />
      <circle cx={dotCX} cy={dotCY} r={dotR} fill={`url(#${gradId})`} />
    </svg>
  );
}

export function DailyFlowLogo({ size = 40, showTagline = false }: DailyFlowLogoProps) {
  const fontSize = Math.round(size * 0.45);
  const tagSize = Math.round(size * 0.275);

  return (
    <div className="flex items-center gap-3">
      <DailyFlowIcon size={size} />
      <div>
        <div style={{ fontSize, lineHeight: 1.2 }}>
          <span className="font-light text-foreground">daily</span>
          <span className="font-semibold text-foreground">Flow</span>
        </div>
        {showTagline && (
          <p style={{ fontSize: tagSize }} className="text-muted-foreground leading-none mt-0.5">
            Intelligent productivity
          </p>
        )}
      </div>
    </div>
  );
}
