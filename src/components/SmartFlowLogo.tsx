interface SmartFlowLogoProps {
  size?: number;
  showTagline?: boolean;
}

export function SmartFlowIcon({ size = 40 }: Readonly<Pick<SmartFlowLogoProps, "size">>) {
  const width = Math.round((size * 4) / 3);
  return (
    <img
      src="/logo.svg"
      alt="ABA logo"
      width={width}
      height={size}
      className="block object-contain"
    />
  );
}

export function SmartFlowLogo({ size = 40, showTagline = false }: Readonly<SmartFlowLogoProps>) {
  const fontSize = Math.round(size * 0.45);
  const tagSize = Math.round(size * 0.275);

  return (
    <div className="flex items-center gap-3">
      <SmartFlowIcon size={size} />
      <div>
        <div style={{ fontSize, lineHeight: 1.2 }}>
          <span className="font-light text-foreground">Smart</span>
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
