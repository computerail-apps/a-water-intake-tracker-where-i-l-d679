import { useAppData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { EmptyState } from '@/lib/ui/EmptyState';
import { WeeklyBarChart, type DayEntry } from '@/components/WeeklyBarChart';
import { Flame, CalendarDays } from 'lucide-react';

interface Goal {
  daily_glasses: number;
}

function weeklyMock(goal: number): DayEntry[] {
  const days: DayEntry[] = [];
  const glassesPattern = [8, 6, 9, 7, 5, 10, 4];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      glasses: glassesPattern[6 - i],
      goal,
    });
  }
  return days;
}

function computeStreak(days: DayEntry[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].glasses >= days[i].goal) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function WeeklyPage() {
  const {
    data: goal,
    isLoading: goalLoading,
    error: goalError,
  } = useAppData<Goal>({
    key: ['goals', 'current'],
    mock: { daily_glasses: 8 },
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const dailyGoal = goal?.daily_glasses ?? 8;

  const {
    data: days,
    isLoading: daysLoading,
    error: daysError,
    refetch,
  } = useAppData<DayEntry[]>({
    key: ['water_logs', 'weekly', dailyGoal],
    mock: weeklyMock(dailyGoal),
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const isLoading = goalLoading || daysLoading;
  const error = goalError || daysError;

  if (isLoading) {
    return <CenteredSpinner label="Loading weekly trend" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load weekly data</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{(error as Error).message}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const streak = computeStreak(days ?? []);
  const totalGlasses = (days ?? []).reduce((sum, d) => sum + d.glasses, 0);
  const avgGlasses = days && days.length > 0 ? (totalGlasses / days.length).toFixed(1) : '0';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-h1 text-foreground">Weekly trend</h1>
        <p className="mt-1 text-body text-muted-foreground">
          See how consistent you've been over the last 7 days.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-6">
            <div className="flex items-center gap-2 text-warning">
              <Flame size={20} />
              <span className="text-h2 tabular-nums text-foreground">{streak}</span>
            </div>
            <span className="text-small text-muted-foreground">day streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-6">
            <div className="flex items-center gap-2 text-primary">
              <CalendarDays size={20} />
              <span className="text-h2 tabular-nums text-foreground">{avgGlasses}</span>
            </div>
            <span className="text-small text-muted-foreground">avg glasses/day</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 days</CardTitle>
          <CardDescription>
            Bars in green mean you hit your goal of {dailyGoal} glasses; dashed line marks the goal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!days || days.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={20} />}
              title="No history yet"
              description="Log a few glasses on the Today page to see your weekly trend."
            />
          ) : (
            <WeeklyBarChart days={days} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {(days ?? []).map((d) => {
              const met = d.glasses >= d.goal;
              return (
                <li key={d.date} className="flex items-center gap-3 px-6 py-3">
                  <span className="w-12 text-small text-muted-foreground">{d.label}</span>
                  <span className="flex-1 text-body tabular-nums text-foreground">
                    {d.glasses} / {d.goal} glasses
                  </span>
                  <Badge variant={met ? 'success' : 'default'}>{met ? 'Goal met' : 'Missed'}</Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
