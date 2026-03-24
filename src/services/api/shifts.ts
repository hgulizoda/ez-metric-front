import client, { unwrap } from './client';

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'missed';
  created_at: string;
}

export interface CreateShiftPayload {
  name: string;
  start_time: string;
  end_time: string;
}

export interface UpdateShiftPayload {
  name?: string;
  start_time?: string;
  end_time?: string;
  status?: 'active' | 'completed' | 'missed';
}

export function apiGetShifts(status?: string): Promise<Shift[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  return unwrap(client.get('/shifts', { params }));
}

export function apiGetShift(id: number): Promise<Shift> {
  return unwrap(client.get(`/shifts/${id}`));
}

export function apiCreateShift(payload: CreateShiftPayload): Promise<Shift> {
  return unwrap(client.post('/shifts', payload));
}

export function apiUpdateShift(id: number, payload: UpdateShiftPayload): Promise<Shift> {
  return unwrap(client.put(`/shifts/${id}`, payload));
}

export function apiDeleteShift(id: number): Promise<void> {
  return unwrap(client.delete(`/shifts/${id}`));
}
