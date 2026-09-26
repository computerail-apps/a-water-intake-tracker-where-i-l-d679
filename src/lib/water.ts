import { supabase } from '@/lib/supabase';

export interface WaterLog {
  id: string;
  logged_at: string;
  glasses: number;
}

export interface Goal {
  id?: string;
  daily_glasses: number;
}

export interface DayTotal {
  date: string; // YYYY-MM-DD
  label: string; // short weekday label
  total: number;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function fetchTodayLogs(): Promise<WaterLog[]> {
  const start = startOfDay(new Date());
  const { data, error } = await supabase
    .from('water_logs')
    .select('id, logged_at, glasses')
    .gte('logged_at', start.toISOString())
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WaterLog[];
}

export async function fetchGoal(): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, daily_glasses')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Goal) ?? { daily_glasses: 8 };
}

export async function insertGlass(): Promise<void> {
  const { error } = await supabase.from('water_logs').insert({ glasses: 1 });
  if (error) throw error;
}

export async function undoLastGlass(): Promise<void> {
  const start = startOfDay(new Date());
  const { data, error } = await supabase
    .from('water_logs')
    .select('id, logged_at')
    .gte('logged_at', start.toISOString())
    .order('logged_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data && data.length > 0) {
    const { error: delErr } = await supabase.from('water_logs').delete().eq('id', data[0].id);
    if (delErr) throw delErr;
  }
}

export async function saveGoal(value: number): Promise<Goal> {
  const { data: existing, error: selErr } = await supabase
    .from('goals')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing && existing.id) {
    const { data, error } = await supabase
      .from('goals')
      .update({ daily_glasses: value })
      .eq('id', existing.id)
      .select('id, daily_glasses')
      .single();
    if (error) throw error;
    return data as Goal;
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({ daily_glasses: value })
    .select('id, daily_glasses')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function fetchWeekLogs(): Promise<WaterLog[]> {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - 6);
  const { data, error } = await supabase
    .from('water_logs')
    .select('id, logged_at, glasses')
    .gte('logged_at', start.toISOString())
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WaterLog[];
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function aggregateByDay(logs: WaterLog[]): DayTotal[] {
  const days: DayTotal[] = [];
  const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    days.push({ date: dateKey, label: WEEKDAY_LABELS[d.getDay()], total: 0 });
  }
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const log of logs) {
    const key = log.logged_at.slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.total += log.glasses;
  }
  return days;
}

export function computeStreak(days: DayTotal[], goal: number): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total >= goal && goal > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
