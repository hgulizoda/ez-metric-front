import client, { unwrap } from './client';

export interface GracePeriodRule {
  id: number;
  name: string;
  minutes_allowed: number;
  created_at: string;
}

export interface Manager {
  id: number;
  username: string;
  role: 'manager';
  created_at: string;
}

// Grace Period Rules
export function apiGetGracePeriodRules(): Promise<GracePeriodRule[]> {
  return unwrap(client.get('/grace-period-rules'));
}

export function apiCreateGracePeriodRule(payload: { name: string; minutes_allowed: number }): Promise<GracePeriodRule> {
  return unwrap(client.post('/grace-period-rules', payload));
}

export function apiUpdateGracePeriodRule(id: number, payload: { name?: string; minutes_allowed?: number }): Promise<GracePeriodRule> {
  return unwrap(client.put(`/grace-period-rules/${id}`, payload));
}

export function apiDeleteGracePeriodRule(id: number): Promise<void> {
  return unwrap(client.delete(`/grace-period-rules/${id}`));
}

// Manager Management
export function apiGetManagers(): Promise<Manager[]> {
  return unwrap(client.get('/managers'));
}

export function apiCreateManager(payload: { username: string; password: string }): Promise<Manager> {
  return unwrap(client.post('/managers', payload));
}

export function apiUpdateManager(id: number, payload: { password?: string }): Promise<Manager> {
  return unwrap(client.put(`/managers/${id}`, payload));
}

export function apiDeleteManager(id: number): Promise<void> {
  return unwrap(client.delete(`/managers/${id}`));
}
