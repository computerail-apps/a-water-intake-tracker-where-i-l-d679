interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
}

export function ProgressRing({ value, max, size = 200 }: ProgressRingProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const offset = circumference * (1 - pct);
  const percentLabel = Math.round(pct * 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-display tabular-nums text-foreground">{value}</span>
        <span className="text-small text-muted-foreground tabular-nums">of {max} glasses</span>
        <span className="mt-1 text-micro text-muted-foreground tabular-nums">{percentLabel}%</span>
      </div>
    </div>
  );
}
