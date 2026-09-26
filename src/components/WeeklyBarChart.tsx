import type { DayTotal } from '@/lib/water';
import { cn } from '@/lib/cn';

interface WeeklyBarChartProps {
  days: DayTotal[];
  goal: number;
}

export function WeeklyBarChart({ days, goal }: WeeklyBarChartProps) {
  const maxValue = Math.max(goal, ...days.map((d) => d.total), 1);

  return (
    <div className="flex items-end justify-between gap-2 px-2 pb-2 pt-4" style={{ height: 180 }}>
      {days.map((d) => {
        const heightPct = Math.max(4, Math.round((d.total / maxValue) * 100));
        const met = goal > 0 && d.total >= goal;
        const isToday = d.date === new Date().toISOString().slice(0, 10);
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-micro tabular-nums text-muted-foreground">{d.total}</span>
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={cn(
                  'w-full max-w-[28px] rounded-t-md transition-all duration-500 ease-out',
                  met ? 'bg-primary' : 'bg-muted'
                )}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span
              className={cn(
                'text-micro',
                isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
