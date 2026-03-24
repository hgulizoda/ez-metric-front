import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Download, Filter, X } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { useEmployees } from '@/services/hooks/useEmployees';
import { useThemeStore } from '@/app/store/themeStore';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';
import { StatusBadge, DeptBadge } from '@/components/shared/Badges';
import type { Employee, EmployeeFilters } from '@/types';

const DEPARTMENTS = ['all', 'Mechanical Floor', 'Office', 'Parts', 'Management'] as const;
const STATUSES = ['all', 'active', 'punched-in', 'archived'] as const;

export default function Employees() {
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const filters: Partial<EmployeeFilters> = {
    search: debouncedSearch,
    department: dept as EmployeeFilters['department'],
    status: status as EmployeeFilters['status'],
  };

  const { data, isLoading } = useEmployees(filters, page, 10);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDept('all');
    setStatus('all');
    setPage(1);
  };

  const hasActiveFilters = debouncedSearch || dept !== 'all' || status !== 'all';

  const columns = [
    {
      key: 'fullName',
      label: 'Employee',
      sortable: true,
      render: (_: unknown, row: Employee) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/employees/${row.id}`)}>
          <div
            className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          >
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </div>
          <div>
            <div className={clsx('text-sm font-medium hover:text-indigo-400 transition-colors', isDark ? 'text-gray-200' : 'text-gray-800')}>
              {row.fullName}
            </div>
            <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (_: unknown, row: Employee) => <DeptBadge dept={row.department} />,
    },
    {
      key: 'shift',
      label: 'Shift',
      sortable: true,
      render: (_: unknown, row: Employee) => (
        <span className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{row.shift}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: Employee) => <StatusBadge status={row.status} />,
    },
    {
      key: 'weeklyHours',
      label: 'Hrs This Week',
      sortable: true,
      render: (_: unknown, row: Employee) => (
        <div>
          <span className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>
            {row.weeklyHours.toFixed(2)}h
          </span>
          {row.overtimeHours > 0 && (
            <span className="ml-1 text-xs text-yellow-400">+{row.overtimeHours}h OT</span>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (_: unknown, row: Employee) => (
        <span className={clsx('text-xs capitalize', isDark ? 'text-gray-400' : 'text-gray-500')}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: Employee) => (
        <button
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          onClick={() => navigate(`/employees/${row.id}`)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Employees
          </h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {data?.total ?? 0} total employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
              isDark ? 'bg-white/5 text-gray-300 hover:bg-white/8' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
            onClick={() => notifications.show({ title: 'Export', message: 'Employee list exported to CSV', color: 'green' })}
          >
            <Download size={15} />
            Export
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity"
            onClick={() => notifications.show({ title: 'Create Employee', message: 'Employee creation form would open here', color: 'indigo' })}
          >
            <UserPlus size={15} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search employees..."
                  className={clsx(
                    'w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all',
                    isDark
                      ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
                      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400'
                  )}
                />
                {search && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                  showFilters
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : isDark
                    ? 'bg-white/5 text-gray-400 hover:text-gray-200'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                )}
              >
                <Filter size={14} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-indigo-400 rounded-full" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                {/* Department filter */}
                <div>
                  <label className={clsx('block text-xs mb-1', isDark ? 'text-gray-500' : 'text-gray-400')}>Department</label>
                  <select
                    value={dept}
                    onChange={(e) => { setDept(e.target.value); setPage(1); }}
                    className={clsx(
                      'text-sm px-3 py-1.5 rounded-lg outline-none',
                      isDark
                        ? 'bg-white/5 text-gray-300 border border-white/8'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    )}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label className={clsx('block text-xs mb-1', isDark ? 'text-gray-500' : 'text-gray-400')}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className={clsx(
                      'text-sm px-3 py-1.5 rounded-lg outline-none',
                      isDark
                        ? 'bg-white/5 text-gray-300 border border-white/8'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    )}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <DataTable<Employee>
            columns={columns}
            data={data?.data ?? []}
            total={data?.total ?? 0}
            page={page}
            pageSize={10}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
            isLoading={isLoading}
            keyExtractor={(row) => row.id}
            emptyMessage="No employees found matching your filters."
          />
    </div>
  );
}
