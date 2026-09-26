import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Input } from '@/lib/ui/Input';
import { Badge } from '@/lib/ui/Badge';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { ProgressRing } from '@/components/ProgressRing';
import { Plus, Undo2, Pencil, Droplets } from 'lucide-react';
import {
  fetchTodayLogs,
  fetchGoal,
  insertGlass,
  undoLastGlass,
  saveGoal,
  type WaterLog,
  type Goal,
} from '@/lib/water';

export function TodayPage() {
  const qc = useQueryClient();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('8');

  const {
    data: logs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<WaterLog[]>({
    queryKey: ['water_logs', 'today'],
    queryFn: fetchTodayLogs,
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

  const addGlass = useMutation({
    mutationFn: insertGlass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water_logs'] }),
  });

  const undoGlass = useMutation({
    mutationFn: undoLastGlass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water_logs'] }),
  });

  const updateGoal = useMutation({
    mutationFn: (value: number) => saveGoal(value),
    onSuccess: (data) => {
      qc.setQueryData(['goals', 'current'], data);
      setEditingGoal(false);
    },
  });

  const isLoading = logsLoading || goalLoading;
  const error = logsError || goalError;

  const totalGlasses = (logs ?? []).reduce((sum, l) => sum + l.glasses, 0);
  const dailyGoal = goal?.daily_glasses ?? 8;

  function handleSaveGoal() {
    const parsed = parseInt(goalDraft, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      updateGoal.mutate(parsed);
    } else {
      setEditingGoal(false);
    }
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
            <Button
              size="lg"
              onClick={() => addGlass.mutate()}
              disabled={addGlass.isPending}
              className="w-full sm:w-auto"
            >
              <Plus size={16} />
              +1 glass
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => undoGlass.mutate()}
              disabled={totalGlasses === 0 || undoGlass.isPending}
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
              <Button size="sm" onClick={handleSaveGoal} disabled={updateGoal.isPending}>
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
