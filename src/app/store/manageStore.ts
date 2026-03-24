import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Device {
  id: string;
  name: string;
  serial: string;
  type: 'biometric' | 'kiosk' | 'mobile';
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  createdAt: string;
}

export interface ShiftType {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  color: string;
  employeeCount: number;
  createdAt: string;
}

export interface Job {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface ManageStore {
  devices: Device[];
  shiftTypes: ShiftType[];
  departments: Department[];
  jobs: Job[];

  addDevice: (d: Omit<Device, 'id' | 'createdAt'>) => void;
  updateDevice: (id: string, d: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  addShiftType: (s: Omit<ShiftType, 'id' | 'createdAt'>) => void;
  updateShiftType: (id: string, s: Partial<ShiftType>) => void;
  deleteShiftType: (id: string) => void;

  addDepartment: (d: Omit<Department, 'id' | 'createdAt'>) => void;
  updateDepartment: (id: string, d: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  addJob: (j: Omit<Job, 'id' | 'createdAt'>) => void;
  updateJob: (id: string, j: Partial<Job>) => void;
  deleteJob: (id: string) => void;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const now = () => new Date().toISOString();

const SEED_DEVICES: Device[] = [
  { id: 'dev-1', name: 'Front Entrance', serial: 'BIO-001', type: 'biometric', location: 'Main Gate', status: 'online', lastSeen: now(), createdAt: now() },
  { id: 'dev-2', name: 'Shop Floor Kiosk', serial: 'KSK-001', type: 'kiosk', location: 'Mechanical Floor', status: 'online', lastSeen: now(), createdAt: now() },
  { id: 'dev-3', name: 'Office Tablet', serial: 'MOB-001', type: 'mobile', location: 'Office', status: 'offline', lastSeen: now(), createdAt: now() },
];

const SEED_SHIFT_TYPES: ShiftType[] = [
  { id: 'st-1', name: 'Morning Shift', startTime: '06:00', endTime: '14:00', color: '#f59e0b', isDefault: true, createdAt: now() },
  { id: 'st-2', name: 'Day Shift', startTime: '08:00', endTime: '17:00', color: '#3b82f6', isDefault: false, createdAt: now() },
  { id: 'st-3', name: 'Night Shift', startTime: '22:00', endTime: '06:00', color: '#8b5cf6', isDefault: false, createdAt: now() },
];

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Mechanical Floor', code: 'MECH', manager: 'Justin Naranjo', color: '#6366f1', employeeCount: 12, createdAt: now() },
  { id: 'dept-2', name: 'Office', code: 'OFC', manager: 'Zafar Khatamov', color: '#3b82f6', employeeCount: 4, createdAt: now() },
  { id: 'dept-3', name: 'Parts', code: 'PRT', manager: 'Marco Hernandez', color: '#10b981', employeeCount: 3, createdAt: now() },
  { id: 'dept-4', name: 'Management', code: 'MGT', manager: 'Ash Rojas', color: '#f59e0b', employeeCount: 2, createdAt: now() },
];

const SEED_JOBS: Job[] = [
  { id: 'job-1', name: 'Main Work', code: 'MW', department: 'Mechanical Floor', description: 'Primary mechanical repair work', isActive: true, createdAt: now() },
  { id: 'job-2', name: 'Lunch Break', code: 'LB', department: 'All', description: 'Lunch break time', isActive: true, createdAt: now() },
  { id: 'job-3', name: 'Diagnostics', code: 'DG', department: 'Mechanical Floor', description: 'Vehicle diagnostic work', isActive: true, createdAt: now() },
  { id: 'job-4', name: 'Parts Inventory', code: 'PI', department: 'Parts', description: 'Parts counting and inventory management', isActive: true, createdAt: now() },
  { id: 'job-5', name: 'Admin Tasks', code: 'AT', department: 'Office', description: 'Administrative and paperwork tasks', isActive: true, createdAt: now() },
  { id: 'job-6', name: 'Training', code: 'TR', department: 'All', description: 'Employee training sessions', isActive: false, createdAt: now() },
];

export const useManageStore = create<ManageStore>()(
  persist(
    (set) => ({
      devices: SEED_DEVICES,
      shiftTypes: SEED_SHIFT_TYPES,
      departments: SEED_DEPARTMENTS,
      jobs: SEED_JOBS,

      addDevice: (d) => set((s) => ({ devices: [{ ...d, id: uid(), createdAt: now() }, ...s.devices] })),
      updateDevice: (id, d) => set((s) => ({ devices: s.devices.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      deleteDevice: (id) => set((s) => ({ devices: s.devices.filter((x) => x.id !== id) })),

      addShiftType: (st) => set((s) => ({ shiftTypes: [{ ...st, id: uid(), createdAt: now() }, ...s.shiftTypes] })),
      updateShiftType: (id, st) => set((s) => ({ shiftTypes: s.shiftTypes.map((x) => (x.id === id ? { ...x, ...st } : x)) })),
      deleteShiftType: (id) => set((s) => ({ shiftTypes: s.shiftTypes.filter((x) => x.id !== id) })),

      addDepartment: (d) => set((s) => ({ departments: [{ ...d, id: uid(), createdAt: now() }, ...s.departments] })),
      updateDepartment: (id, d) => set((s) => ({ departments: s.departments.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      deleteDepartment: (id) => set((s) => ({ departments: s.departments.filter((x) => x.id !== id) })),

      addJob: (j) => set((s) => ({ jobs: [{ ...j, id: uid(), createdAt: now() }, ...s.jobs] })),
      updateJob: (id, j) => set((s) => ({ jobs: s.jobs.map((x) => (x.id === id ? { ...x, ...j } : x)) })),
      deleteJob: (id) => set((s) => ({ jobs: s.jobs.filter((x) => x.id !== id) })),
    }),
    { name: 'ez-metric-manage' }
  )
);
