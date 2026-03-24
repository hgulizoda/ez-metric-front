import client, { unwrap } from './client';

export interface DashboardSummaryData {
  total_workers: number;
  active_today: number;
  total_shifts: number;
  active_shifts: number;
  open_clock_records: number;
  hours_this_week: number;
  approaching_overtime: number;
}

export interface WorkedHoursData {
  today: number;
  this_week: number;
  this_month: number;
  daily_breakdown: { date: string; hours: number; overtime: number }[];
}

export interface BonusProgressData {
  worker_id: number;
  worker_name: string;
  position: string;
  efficiency: number;
  threshold: number;
  progress_percent: number;
  bonus_eligible: boolean;
}

export function apiGetDashboardSummary(): Promise<DashboardSummaryData> {
  return unwrap(client.get('/dashboard/summary'));
}

export function apiGetWorkedHours(): Promise<WorkedHoursData> {
  return unwrap(client.get('/dashboard/worked-hours'));
}

export function apiGetBonusProgress(): Promise<BonusProgressData[]> {
  return unwrap(client.get('/dashboard/bonus-progress'));
}
