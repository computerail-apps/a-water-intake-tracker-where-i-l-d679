interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ value, max, size = 220, strokeWidth = 16 }: ProgressRingProps) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-display tabular-nums text-foreground">{value}</span>
        <span className="text-small text-muted-foreground tabular-nums">of {max} glasses</span>
        <span className="mt-1 text-micro text-muted-foreground">{Math.round(pct * 100)}% of goal</span>
      </div>
    </div>
  );
}
