import client, { unwrap } from './client';

export interface PayrollSummary {
  worker_id: number;
  worker_name: string;
  position: string;
  hours_worked: number;
  overtime_hours: number;
  base_pay: number;
  overtime_pay: number;
  bonuses: number;
  charges: number;
  net_pay: number;
}

export interface WeeklyStatement {
  worker_id: number;
  worker_name: string;
  position: string;
  days: { date: string; hours: number; overtime: number }[];
  total_hours: number;
  total_overtime: number;
}

export interface WorkerReport {
  worker_id: number;
  worker_name: string;
  position: string;
  clock_records: {
    date: string;
    clock_in: string;
    clock_out: string | null;
    hours: number;
  }[];
  total_marked_hours: number;
  total_billed_hours: number;
  efficiency: number;
  salary_breakdown: {
    base_pay: number;
    overtime_pay: number;
    bonuses: number;
    charges: number;
    net_pay: number;
  };
}

export interface StatementSummary {
  worker_id: number;
  worker_name: string;
  position: string;
  period: { from: string; to: string };
  gross_pay: number;
  deductions: number;
  net_pay: number;
}

export function apiGetReports(from: string, to: string, workerId?: number, position?: string): Promise<PayrollSummary[]> {
  const params: Record<string, string | number> = { from, to };
  if (workerId) params.worker_id = workerId;
  if (position) params.position = position;
  return unwrap(client.get('/reports', { params }));
}

export function apiExportExcel(from: string, to: string, workerId?: number, position?: string): Promise<Blob> {
  const params: Record<string, string | number> = { from, to };
  if (workerId) params.worker_id = workerId;
  if (position) params.position = position;
  return client.get('/reports/export', { params, responseType: 'blob' }).then(r => r.data);
}

export function apiGetWeeklyReport(weekStart: string): Promise<WeeklyStatement[]> {
  return unwrap(client.get('/reports/weekly', { params: { week_start: weekStart } }));
}

export function apiGetWorkerReport(workerId: number, from: string, to: string): Promise<WorkerReport> {
  return unwrap(client.get(`/reports/${workerId}`, { params: { from, to } }));
}

export function apiGetStatements(from: string, to: string): Promise<StatementSummary[]> {
  return unwrap(client.get('/reports/statements', { params: { from, to } }));
}

export function apiGetStatement(workerId: number, from: string, to: string): Promise<StatementSummary> {
  return unwrap(client.get(`/reports/statements/${workerId}`, { params: { from, to } }));
}

export function apiSendStatementGmail(workerId: number): Promise<{ sent: boolean; message: string }> {
  return unwrap(client.post(`/reports/statements/${workerId}/gmail`));
}
