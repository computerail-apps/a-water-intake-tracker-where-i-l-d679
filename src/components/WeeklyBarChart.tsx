import { cn } from '@/lib/cn';

export interface DayEntry {
  date: string;
  label: string;
  glasses: number;
  goal: number;
}

export function WeeklyBarChart({ days }: { days: DayEntry[] }) {
  const maxScale = Math.max(...days.map((d) => Math.max(d.glasses, d.goal)), 1);

  return (
    <div className="flex items-end justify-between gap-3 px-2 pt-8 pb-2" style={{ height: 220 }}>
      {days.map((d) => {
        const heightPct = (d.glasses / maxScale) * 100;
        const goalPct = (d.goal / maxScale) * 100;
        const met = d.glasses >= d.goal;
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-full w-full items-end justify-center">
              <div
                className="absolute w-full border-t border-dashed border-border"
                style={{ bottom: `${goalPct}%` }}
              />
              <div
                className={cn(
                  'w-full max-w-[28px] rounded-t-sm transition-all duration-500 ease-out',
                  met ? 'bg-success' : 'bg-primary'
                )}
                style={{ height: `${Math.max(heightPct, d.glasses > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-micro tabular-nums text-muted-foreground">{d.glasses}</span>
            <span className="text-micro text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
