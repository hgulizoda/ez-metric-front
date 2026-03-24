import client, { unwrap } from './client';

export interface WorkerEfficiency {
  worker_id: number;
  worker_name: string;
  position: string;
  total_hours: number;
  billed_hours: number;
  efficiency: number;
  bonus_eligible: boolean;
}

export interface BonusRule {
  id: number;
  position: string;
  formula: string;
  min_efficiency_threshold: number;
  created_at: string;
}

export interface Bonus {
  id: number;
  worker_id: number;
  amount: number;
  type: 'formula' | 'manual';
  period: string;
  note: string | null;
  created_at: string;
  worker?: { id: number; name: string; base_id: string };
}

export interface CreateBonusRulePayload {
  position: string;
  formula: string;
  min_efficiency_threshold: number;
}

export interface CreateManualBonusPayload {
  worker_id: number;
  amount: number;
  period: string;
  note?: string;
}

export function apiGetAllEfficiency(from: string, to: string): Promise<WorkerEfficiency[]> {
  return unwrap(client.get('/efficiency', { params: { from, to } }));
}

export function apiGetWorkerEfficiency(workerId: number, from: string, to: string): Promise<WorkerEfficiency> {
  return unwrap(client.get(`/efficiency/${workerId}`, { params: { from, to } }));
}

export function apiGetBonusRules(): Promise<BonusRule[]> {
  return unwrap(client.get('/bonus-rules'));
}

export function apiCreateBonusRule(payload: CreateBonusRulePayload): Promise<BonusRule> {
  return unwrap(client.post('/bonus-rules', payload));
}

export function apiUpdateBonusRule(id: number, payload: Partial<CreateBonusRulePayload>): Promise<BonusRule> {
  return unwrap(client.put(`/bonus-rules/${id}`, payload));
}

export function apiDeleteBonusRule(id: number): Promise<void> {
  return unwrap(client.delete(`/bonus-rules/${id}`));
}

export function apiGetBonuses(workerId?: number, period?: string): Promise<Bonus[]> {
  const params: Record<string, string | number> = {};
  if (workerId) params.worker_id = workerId;
  if (period) params.period = period;
  return unwrap(client.get('/bonuses', { params }));
}

export function apiCreateManualBonus(payload: CreateManualBonusPayload): Promise<Bonus> {
  return unwrap(client.post('/bonuses/manual', payload));
}
