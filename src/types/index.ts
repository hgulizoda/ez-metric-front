// User and Auth types
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  department?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Employee types
export type EmployeeStatus = 'active' | 'archived' | 'punched-in' | 'punched-out';
export type EmployeeRole = 'Admin' | 'Manager' | 'Employee';
export type Department = 'Mechanical Floor' | 'Office' | 'Parts' | 'Management';
export type Shift = 'Main Shift 1' | 'Main Shift 2' | 'Main Shift 3' | 'Main Shift 4' | 'Night Shift';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  role: EmployeeRole;
  department: Department;
  shift: Shift;
  status: EmployeeStatus;
  isPunchedIn: boolean;
  weeklyHours: number;
  overtimeHours: number;
  hireDate: string;
  pin?: string;
  phone?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Punch types
export type PunchType = 'IN' | 'OUT';
export type PunchSource = 'Device' | 'Manual' | 'App';

export interface Punch {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  type: PunchType;
  timestamp: string;
  date: string;
  time: string;
  source: PunchSource;
  jobCode?: string;
  notes?: string;
  hoursWorked?: number;
  isOvertime?: boolean;
  deviceId?: string;
  isCorrected?: boolean;
  gracePeriodApplied?: boolean;
  clockRecordId?: number;
}

export interface PunchPair {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string;
  punchIn: string;
  punchOut: string | null;
  hoursWorked: number | null;
  jobCode?: string;
  isOvertime: boolean;
}

// Metrics / KPI types
export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  changeLabel?: string;
  icon: string;
  color: string;
  bgColor: string;
  suffix?: string;
  prefix?: string;
  isDecimal?: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface HoursBarData {
  job: string;
  hours: number;
  overtime: number;
  regular: number;
}

export interface OvertimeLineData {
  date: string;
  hours: number;
  overtime: number;
  threshold: number;
}

export interface PunchDonutData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activePunches: number;
  missedPunches: number;
  hoursThisWeek: number;
  approachingOvertime: number;
  devicesOnline: number;
  punchedInCount: number;
  punchedOutCount: number;
}

// Activity feed
export interface ActivityEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  type: PunchType | 'system' | 'alert';
  message: string;
  timestamp: string;
  avatar?: string;
  department?: Department;
}

// Notification types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

// Filter/search types
export interface EmployeeFilters {
  search: string;
  status: EmployeeStatus | 'all';
  department: Department | 'all';
  shift: Shift | 'all';
  role: EmployeeRole | 'all';
}

export interface PunchFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  type: PunchType | 'all';
  department: Department | 'all';
  employeeId: string;
  corrected: boolean | 'all';
}

export interface DateRangeFilter {
  from: Date | null;
  to: Date | null;
}

// Report types
export interface Report {
  id: string;
  title: string;
  description: string;
  type: 'hours' | 'overtime' | 'attendance' | 'payroll' | 'custom';
  icon: string;
  lastGenerated?: string;
  tags: string[];
}

// Settings types
export interface CompanySettings {
  companyName: string;
  timezone: string;
  payPeriodType: 'weekly' | 'biweekly' | 'monthly';
  overtimeThreshold: number;
  autoLogoutMinutes: number;
  requirePinForPunch: boolean;
  allowAppPunch: boolean;
}

export interface PayPolicy {
  id: string;
  name: string;
  overtimeAfterHours: number;
  doubleTimeAfterHours?: number;
  weeklyOvertimeAfterHours: number;
  breakRequiredAfterHours: number;
}

export interface PTOCode {
  id: string;
  code: string;
  name: string;
  color: string;
  isPaid: boolean;
  maxHoursPerYear?: number;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
