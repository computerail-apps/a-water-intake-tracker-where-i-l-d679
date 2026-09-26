import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Input } from '@/lib/ui/Input';
import { Badge } from '@/lib/ui/Badge';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { ProgressRing } from '@/components/ProgressRing';
import { Plus, Undo2, Pencil, Droplets } from 'lucide-react';

interface WaterLog {
  id: string;
  logged_at: string;
  glasses: number;
}

interface Goal {
  daily_glasses: number;
}

function todayLogsMock(): WaterLog[] {
  const now = new Date();
  const entries: WaterLog[] = [];
  const times = [7, 9, 11, 13.5, 16];
  times.forEach((hourOffset, idx) => {
    const d = new Date(now);
    d.setHours(Math.floor(hourOffset), (hourOffset % 1) * 60, 0, 0);
    entries.push({ id: `log-${idx}`, logged_at: d.toISOString(), glasses: 1 });
  });
  return entries;
}

export function TodayPage() {
  const qc = useQueryClient();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('8');

  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useAppData<WaterLog[]>({
    key: ['water_logs', 'today'],
    mock: todayLogsMock(),
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const {
    data: goal,
    isLoading: goalLoading,
    error: goalError,
    refetch: refetchGoal,
  } = useAppData<Goal>({
    key: ['goals', 'current'],
    mock: { daily_glasses: 8 },
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const isLoading = logsLoading || goalLoading;
  const error = logsError || goalError;

  const totalGlasses = (logs ?? []).reduce((sum, l) => sum + l.glasses, 0);
  const dailyGoal = goal?.daily_glasses ?? 8;

  function handleAddGlass() {
    // Optimistic mock update: push directly into the query cache.
    qc.setQueryData<WaterLog[]>(['water_logs', 'today'], (prev) => {
      const next = prev ? [...prev] : [];
      next.push({ id: `log-${Date.now()}`, logged_at: new Date().toISOString(), glasses: 1 });
      return next;
    });
  }

  function handleUndo() {
    qc.setQueryData<WaterLog[]>(['water_logs', 'today'], (prev) => {
      if (!prev || prev.length === 0) return prev;
      const next = [...prev];
      next.pop();
      return next;
    });
  }

  function handleSaveGoal() {
    const parsed = parseInt(goalDraft, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      qc.setQueryData<Goal>(['goals', 'current'], { daily_glasses: parsed });
    }
    setEditingGoal(false);
  }

  if (isLoading) {
    return <CenteredSpinner label="Loading today's progress" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load your hydration data</AlertTitle>
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

  const recentLogs = [...(logs ?? [])].reverse().slice(0, 5);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-h1 text-foreground">Today's hydration</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Keep sipping — every glass counts toward your goal.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <ProgressRing value={totalGlasses} max={dailyGoal} />
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={handleAddGlass} className="w-full sm:w-auto">
              <Plus size={16} />
              +1 glass
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleUndo}
              disabled={totalGlasses === 0}
              className="w-full sm:w-auto"
            >
              <Undo2 size={16} />
              Undo
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border">
          {editingGoal ? (
            <div className="flex w-full items-center gap-2">
              <Input
                type="number"
                min={1}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                className="max-w-[100px]"
              />
              <Button size="sm" onClick={handleSaveGoal}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingGoal(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span className="text-small text-muted-foreground">
                Daily goal: <span className="tabular-nums text-foreground">{dailyGoal} glasses</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setGoalDraft(String(dailyGoal));
                  setEditingGoal(true);
                }}
              >
                <Pencil size={14} />
                Edit goal
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent logs</CardTitle>
          <CardDescription>Your last few entries today.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentLogs.length === 0 ? (
            <div className="px-6 pb-6 text-center text-small text-muted-foreground">
              No glasses logged yet today.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center gap-3 px-6 py-3">
                  <Badge variant="outline">
                    <Droplets size={12} className="mr-1" />
                    +{log.glasses}
                  </Badge>
                  <span className="text-small text-muted-foreground">
                    {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
