import client, { unwrap } from './client';

export interface ClockRecord {
  id: number;
  worker_id: number;
  shift_id: number;
  clock_in: string;
  clock_out: string | null;
  is_manual_edit: boolean;
  edit_note: string | null;
  grace_period_applied: boolean;
  created_at: string;
  worker?: { id: number; name: string; base_id: string; position: string };
  shift?: { id: number; name: string };
}

export interface ClockFilters {
  worker_id?: number;
  shift_id?: number;
  from?: string;
  to?: string;
}

export function apiClockIn(payload: {
  worker_id: number;
  shift_id: number;
}): Promise<ClockRecord> {
  return unwrap(client.post('/clock/in', payload));
}

export function apiClockOut(worker_id: number, shift_id: number): Promise<ClockRecord> {
  return unwrap(client.post('/clock/out', { worker_id, shift_id }));
}

export function apiGetClockRecords(filters?: ClockFilters): Promise<ClockRecord[]> {
  return unwrap(client.get('/clock/records', { params: filters }));
}

export function apiGetClockRecord(id: number): Promise<ClockRecord> {
  return unwrap(client.get(`/clock/records/${id}`));
}

export function apiEditClockRecord(id: number, payload: {
  clock_in?: string;
  clock_out?: string;
  edit_note: string;
}): Promise<ClockRecord> {
  return unwrap(client.put(`/clock/records/${id}`, payload));
}
