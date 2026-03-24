import client, { unwrap } from './client';

export interface SalaryRule {
  id: number;
  worker_id: number;
  type: 'hourly' | 'percentage' | 'flat';
  rate: number;
  overtime_multiplier: number;
  overtime_threshold_hours: number;
  created_at: string;
  worker?: { id: number; name: string; base_id: string; position: string };
}

export interface CreateSalaryRulePayload {
  worker_id: number;
  type: 'hourly' | 'percentage' | 'flat';
  rate: number;
  overtime_multiplier?: number;
  overtime_threshold_hours?: number;
}

export interface Charge {
  id: number;
  worker_id: number;
  type: 'loan' | 'prepayment' | 'distribution' | 'time_misuse';
  amount: number;
  remaining: number;
  distributed_over_periods: number | null;
  description: string;
  created_at: string;
  updated_at: string;
  worker?: { id: number; name: string; base_id: string };
}

export interface CreateChargePayload {
  worker_id: number;
  type: 'loan' | 'prepayment' | 'distribution' | 'time_misuse';
  amount: number;
  description: string;
  distributed_over_periods?: number;
}

export interface SalaryCalculation {
  worker_id: number;
  worker_name: string;
  period: { from: string; to: string };
  hours_worked: number;
  overtime_hours: number;
  base_salary: number;
  overtime_pay: number;
  total_charges: number;
  net_salary: number;
  charges: Charge[];
}

export function apiGetSalaryRules(): Promise<SalaryRule[]> {
  return unwrap(client.get('/salary/rules'));
}

export function apiGetWorkerSalaryRule(workerId: number): Promise<SalaryRule> {
  return unwrap(client.get(`/salary/rules/${workerId}`));
}

export function apiCreateSalaryRule(payload: CreateSalaryRulePayload): Promise<SalaryRule> {
  return unwrap(client.post('/salary/rules', payload));
}

export function apiGetCharges(workerId?: number, type?: string): Promise<Charge[]> {
  const params: Record<string, string | number> = {};
  if (workerId) params.worker_id = workerId;
  if (type) params.type = type;
  return unwrap(client.get('/charges', { params }));
}

export function apiCreateCharge(payload: CreateChargePayload): Promise<Charge> {
  return unwrap(client.post('/charges', payload));
}

export function apiUpdateCharge(id: number, payload: Partial<CreateChargePayload>): Promise<Charge> {
  return unwrap(client.put(`/charges/${id}`, payload));
}

export function apiDeleteCharge(id: number): Promise<void> {
  return unwrap(client.delete(`/charges/${id}`));
}

export function apiCalculateSalary(workerId: number, from: string, to: string): Promise<SalaryCalculation> {
  return unwrap(client.get(`/salary/calculate/${workerId}`, { params: { from, to } }));
}
