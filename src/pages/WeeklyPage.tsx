import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { EmptyState } from '@/lib/ui/EmptyState';
import { WeeklyBarChart } from '@/components/WeeklyBarChart';
import { Flame, CalendarDays } from 'lucide-react';
import { fetchWeekLogs, fetchGoal, aggregateByDay, computeStreak, type WaterLog, type Goal } from '@/lib/water';

export function WeeklyPage() {
  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<WaterLog[]>({
    queryKey: ['water_logs', 'week'],
    queryFn: fetchWeekLogs,
  });

  const {
    data: goal,
    isLoading: goalLoading,
    error: goalError,
    refetch: refetchGoal,
  } = useQuery<Goal>({
    queryKey: ['goals', 'current'],
    queryFn: fetchGoal,
  });

  const isLoading = logsLoading || goalLoading;
  const error = logsError || goalError;
  const dailyGoal = goal?.daily_glasses ?? 8;

  if (isLoading) {
    return <CenteredSpinner label="Loading weekly trend" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load your weekly data</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{(error as Error).message}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchLogs();
              refetchGoal();
            }}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const days = aggregateByDay(logs ?? []);
  const streak = computeStreak(days, dailyGoal);
  const totalWeek = days.reduce((sum, d) => sum + d.total, 0);
  const hasAnyData = totalWeek > 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-h1 text-foreground">Weekly trend</h1>
        <p className="mt-1 text-body text-muted-foreground">
          The last 7 days of hydration, compared to your goal of{' '}
          <span className="tabular-nums text-foreground">{dailyGoal}</span> glasses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-h2 tabular-nums text-foreground">{streak}</div>
              <div className="text-small text-muted-foreground">day streak</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="text-h2 tabular-nums text-foreground">{totalWeek}</div>
              <div className="text-small text-muted-foreground">glasses this week</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 7 days</CardTitle>
          <CardDescription>Bars in the accent color mark days you hit your goal.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAnyData ? (
            <EmptyState
              icon={<CalendarDays size={20} />}
              title="No logs yet this week"
              description="Head to the Today view and log a glass to start your trend."
            />
          ) : (
            <WeeklyBarChart days={days} goal={dailyGoal} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
