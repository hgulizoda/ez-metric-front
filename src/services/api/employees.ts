import type { Employee, PaginatedResponse, EmployeeFilters } from '@/types';
import client, { unwrap } from './client';

interface BackendWorker {
  id: number;
  base_id: string;
  name: string;
  picture_url: string | null;
  resume_url: string | null;
  salary_type: 'hourly' | 'percentage' | 'flat';
  position: string;
  language: string;
  created_at: string;
  updated_at: string;
}

function mapWorkerToEmployee(w: BackendWorker): Employee {
  const parts = w.name.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return {
    id: String(w.id),
    firstName,
    lastName,
    fullName: lastName ? `${lastName}, ${firstName}` : firstName,
    username: w.base_id.toLowerCase(),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@eztruckrepair.com`,
    role: 'Employee',
    department: (w.position as Employee['department']) || 'Mechanical Floor',
    shift: 'Main Shift 1',
    status: 'active',
    isPunchedIn: false,
    weeklyHours: 0,
    overtimeHours: 0,
    hireDate: w.created_at.split('T')[0],
    phone: undefined,
  };
}

export async function apiGetEmployees(
  filters?: Partial<EmployeeFilters>,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<Employee>> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.department && filters.department !== 'all') params.position = filters.department;

  const workers = await unwrap<BackendWorker[]>(client.get('/workers', { params }));
  const employees = workers.map(mapWorkerToEmployee);

  // Client-side filtering for fields not supported by backend
  let filtered = employees;
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((e) => e.status === filters.status);
  }
  if (filters?.role && filters.role !== 'all') {
    filtered = filtered.filter((e) => e.role === filters.role);
  }
  if (filters?.shift && filters.shift !== 'all') {
    filtered = filtered.filter((e) => e.shift === filters.shift);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
}

export async function apiGetEmployee(id: string): Promise<Employee> {
  const worker = await unwrap<BackendWorker>(client.get(`/workers/${id}`));
  return mapWorkerToEmployee(worker);
}
