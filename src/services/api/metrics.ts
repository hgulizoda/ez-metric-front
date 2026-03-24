import type {
  DashboardMetrics,
  HoursBarData,
  OvertimeLineData,
  PunchDonutData,
} from '@/types';
import client, { unwrap } from './client';

interface SummaryResponse {
  total_workers: number;
  active_today: number;
  total_shifts: number;
  active_shifts: number;
  open_clock_records: number;
  hours_this_week: number;
  approaching_overtime: number;
}

interface WorkedHoursResponse {
  today: number;
  this_week: number;
  this_month: number;
  daily_breakdown: { date: string; hours: number; overtime: number }[];
}

export interface ClockStatusWorker {
  id: number;
  name: string;
  position: string;
  is_clocked_in: boolean;
  weekly_hours: number;
}

export async function apiGetDashboardMetrics(): Promise<DashboardMetrics> {
  const summary = await unwrap<SummaryResponse>(client.get('/dashboard/summary'));
  return {
    totalEmployees: summary.total_workers,
    activePunches: summary.active_today,
    missedPunches: summary.open_clock_records,
    hoursThisWeek: summary.hours_this_week,
    approachingOvertime: summary.approaching_overtime,
    devicesOnline: summary.active_shifts,
    punchedInCount: summary.open_clock_records,
    punchedOutCount: Math.max(0, summary.total_workers - summary.open_clock_records),
  };
}

export async function apiGetHoursBarData(): Promise<HoursBarData[]> {
  const data = await unwrap<WorkedHoursResponse>(client.get('/dashboard/worked-hours'));
  if (data.daily_breakdown && data.daily_breakdown.length > 0) {
    return data.daily_breakdown.map((d) => ({
      job: d.date,
      hours: d.hours + d.overtime,
      regular: d.hours,
      overtime: d.overtime,
    }));
  }
  return [];
}

export async function apiGetOvertimeLineData(): Promise<OvertimeLineData[]> {
  return unwrap<OvertimeLineData[]>(client.get('/dashboard/hours-trend'));
}

export async function apiGetPunchDonutData(): Promise<PunchDonutData[]> {
  const summary = await unwrap<SummaryResponse>(client.get('/dashboard/summary'));
  const clockedIn = summary.open_clock_records;
  const clockedOut = Math.max(0, summary.total_workers - clockedIn);
  return [
    { name: 'Punched In', value: clockedIn, color: '#10b981' },
    { name: 'Punched Out', value: clockedOut, color: '#6366f1' },
  ];
}

export async function apiGetClockStatus(): Promise<ClockStatusWorker[]> {
  return unwrap<ClockStatusWorker[]>(client.get('/dashboard/clock-status'));
}
