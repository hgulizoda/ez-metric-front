import type { Punch, PunchFilters, PaginatedResponse, Department } from '@/types';
import client, { unwrap } from './client';

// Mock punch data used by report sub-pages
function genMockPunches() {
  const employees = [
    { id: 'emp-002', name: 'Naranjo, Justin', dept: 'Mechanical Floor' as Department },
    { id: 'emp-003', name: 'Garcia, Jesus', dept: 'Mechanical Floor' as Department },
    { id: 'emp-004', name: 'Grossi, Bernardo', dept: 'Mechanical Floor' as Department },
    { id: 'emp-005', name: 'Lopez, Miguel', dept: 'Mechanical Floor' as Department },
    { id: 'emp-006', name: 'Retana, Jose', dept: 'Mechanical Floor' as Department },
    { id: 'emp-007', name: 'Khatamov, Zafar', dept: 'Office' as Department },
    { id: 'emp-008', name: 'abdurahmanov, islomjon', dept: 'Mechanical Floor' as Department },
    { id: 'emp-009', name: 'TURDIMURODOV, Oybek', dept: 'Mechanical Floor' as Department },
    { id: 'emp-010', name: 'Delgado, Josue', dept: 'Mechanical Floor' as Department },
    { id: 'emp-011', name: 'Martinez, Luis', dept: 'Parts' as Department },
    { id: 'emp-012', name: 'Chen, David', dept: 'Office' as Department },
  ];
  const punches: Punch[] = [];
  const baseDate = new Date();
  for (let day = 0; day < 7; day++) {
    for (const emp of employees) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - day);
      const inH = 6 + Math.floor(Math.random() * 2);
      const inM = Math.floor(Math.random() * 30);
      const clockIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), inH, inM);
      const hoursWorked = 7.5 + Math.random() * 3;
      const clockOut = new Date(clockIn.getTime() + hoursWorked * 3600000);
      const dateStr = `${String(clockIn.getMonth() + 1).padStart(2, '0')}/${String(clockIn.getDate()).padStart(2, '0')}/${clockIn.getFullYear()}`;
      const punchId = `mock-${emp.id}-${day}`;
      punches.push({
        id: `${punchId}-in`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.dept,
        type: 'IN',
        timestamp: clockIn.toISOString(),
        date: dateStr,
        time: clockIn.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        source: 'Device',
      });
      punches.push({
        id: `${punchId}-out`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.dept,
        type: 'OUT',
        timestamp: clockOut.toISOString(),
        date: dateStr,
        time: clockOut.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        source: 'Device',
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        isOvertime: hoursWorked > 8,
      });
    }
  }
  return punches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MOCK_PUNCHES = genMockPunches();

interface BackendClockRecord {
  id: number;
  worker_id: number;
  shift_id: number;
  clock_in: string;
  clock_out: string | null;
  is_manual_edit: boolean;
  edit_note: string | null;
  grace_period_applied: boolean;
  created_at: string;
  worker: { id: number; name: string; base_id: string; position: string };
  shift: { id: number; name: string };
}

function formatTime12(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getSource(r: BackendClockRecord): Punch['source'] {
  if (r.is_manual_edit) return 'Manual';
  return 'App';
}

function mapClockRecordToPunches(r: BackendClockRecord): Punch[] {
  const punches: Punch[] = [];
  const nameParts = r.worker.name.split(' ');
  const lastName = nameParts.slice(1).join(' ') || nameParts[0];
  const firstName = nameParts[0];
  const displayName = `${lastName}, ${firstName}`;
  const dept = (r.worker.position || r.shift.name) as Punch['department'];
  const source = getSource(r);

  // Clock IN punch
  punches.push({
    id: `clk-${r.id}-in`,
    employeeId: `emp-${r.worker_id}`,
    employeeName: displayName,
    department: dept,
    type: 'IN',
    timestamp: r.clock_in,
    date: formatDate(r.clock_in),
    time: formatTime12(r.clock_in),
    source,
    isCorrected: r.is_manual_edit,
    notes: r.edit_note || undefined,
    clockRecordId: r.id,
  });

  // Clock OUT punch (if exists)
  if (r.clock_out) {
    const hoursWorked = (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / (1000 * 60 * 60);
    punches.push({
      id: `clk-${r.id}-out`,
      employeeId: `emp-${r.worker_id}`,
      employeeName: displayName,
      department: dept,
      type: 'OUT',
      timestamp: r.clock_out,
      date: formatDate(r.clock_out),
      time: formatTime12(r.clock_out),
      source,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      isOvertime: hoursWorked > 8,
      isCorrected: r.is_manual_edit,
      notes: r.edit_note || undefined,
      clockRecordId: r.id,
    });
  }

  return punches;
}

export async function apiGetPunches(
  filters?: Partial<PunchFilters>,
  page = 1,
  pageSize = 15
): Promise<PaginatedResponse<Punch>> {
  const params: Record<string, string> = {};
  if (filters?.employeeId) {
    // Extract numeric id from "emp-X" format
    const numId = filters.employeeId.replace('emp-', '');
    params.worker_id = numId;
  }
  if (filters?.dateFrom) params.from = filters.dateFrom;
  if (filters?.dateTo) params.to = filters.dateTo;

  const records = await unwrap<BackendClockRecord[]>(client.get('/clock/records', { params }));
  let punches = records.flatMap(mapClockRecordToPunches);

  // Client-side filtering
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    punches = punches.filter(
      (p) =>
        p.employeeName.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.date.includes(q)
    );
  }

  if (filters?.type && filters.type !== 'all') {
    punches = punches.filter((p) => p.type === filters.type);
  }

  if (filters?.department && filters.department !== 'all') {
    punches = punches.filter((p) => p.department === filters.department);
  }

  if (filters?.corrected !== undefined && filters.corrected !== 'all') {
    punches = punches.filter((p) => !!p.isCorrected === filters.corrected);
  }

  punches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = punches.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = punches.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
}
