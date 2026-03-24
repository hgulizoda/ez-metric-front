import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, LogIn, LogOut, Loader2, Calendar } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { useThemeStore } from '@/app/store/themeStore';
import { useAuthStore } from '@/app/store/authStore';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetPunches } from '@/services/api/punches';
import { apiClockIn, apiClockOut, apiEditClockRecord } from '@/services/api/clock';
import { apiGetShifts } from '@/services/api/shifts';
import client, { unwrap } from '@/services/api/client';
import clsx from 'clsx';
import type { Punch, PunchFilters } from '@/types';
import { getPunchColumns } from './columns';

interface Worker { id: number; name: string; base_id: string; position: string }

const DEPARTMENTS = ['all', 'Mechanical Floor', 'Office', 'Parts', 'Management', 'Driver', 'Dispatcher', 'Loader'] as const;
const CLOCK_TYPES = ['all', 'IN', 'OUT'] as const;
const CORRECTED_OPTS = [
  { value: 'all', label: 'All' },
  { value: 'false', label: 'Normal' },
  { value: 'true', label: 'Corrected' },
] as const;

export default function ClockRecords() {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [clockType, setClockType] = useState<string>('all');
  const [corrected, setCorrected] = useState<string>('all');
  const [dept, setDept] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clock in/out modal state
  const [showClockModal, setShowClockModal] = useState<'in' | 'out' | null>(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  // Edit modal state
  const [editingPunch, setEditingPunch] = useState<Punch | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editNote, setEditNote] = useState('');

  // Fetch workers and shifts for clock in/out
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => unwrap<Worker[]>(client.get('/workers')),
  });
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => apiGetShifts(),
  });

  const filters: Partial<PunchFilters> = {
    search: debouncedSearch,
    type: clockType as PunchFilters['type'],
    department: dept as PunchFilters['department'],
    corrected: corrected === 'all' ? 'all' : corrected === 'true',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['clocks', filters, page],
    queryFn: () => apiGetPunches(filters, page, 15),
    staleTime: 30 * 1000,
  });

  const clockInMut = useMutation({
    mutationFn: (p: { worker_id: number; shift_id: number }) => apiClockIn(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clocks'] });
      notifications.show({ title: 'Clocked In', message: `Worker clocked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, color: 'green' });
      closeClockModal();
    },
    onError: (e: Error) => notifications.show({ title: 'Clock In Failed', message: e.message, color: 'red' }),
  });

  const clockOutMut = useMutation({
    mutationFn: (p: { worker_id: number; shift_id: number }) => apiClockOut(p.worker_id, p.shift_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clocks'] });
      notifications.show({ title: 'Clocked Out', message: `Worker clocked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, color: 'indigo' });
      closeClockModal();
    },
    onError: (e: Error) => notifications.show({ title: 'Clock Out Failed', message: e.message, color: 'red' }),
  });

  const editMut = useMutation({
    mutationFn: (p: { id: number; clock_in?: string; clock_out?: string; edit_note: string }) => {
      const { id, ...payload } = p;
      return apiEditClockRecord(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clocks'] });
      notifications.show({ title: 'Record Updated', message: 'Clock record has been edited successfully.', color: 'green' });
      closeEditModal();
    },
    onError: (e: Error) => notifications.show({ title: 'Edit Failed', message: e.message, color: 'red' }),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setClockType('all'); setCorrected('all'); setDept('all'); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const closeClockModal = () => {
    setShowClockModal(null); setSelectedWorker(''); setSelectedShift('');
  };

  const openEditModal = (punch: Punch) => {
    setEditingPunch(punch);
    // Convert display time back to datetime-local format from the timestamp
    const inDate = new Date(punch.timestamp);
    setEditClockIn(toDatetimeLocal(inDate));
    setEditClockOut('');
    setEditNote('');
  };

  const closeEditModal = () => {
    setEditingPunch(null); setEditClockIn(''); setEditClockOut(''); setEditNote('');
  };

  const submitClock = () => {
    if (!selectedWorker || !selectedShift) {
      notifications.show({ title: 'Required', message: 'Select a worker and shift.', color: 'red' });
      return;
    }
    const payload = { worker_id: Number(selectedWorker), shift_id: Number(selectedShift) };
    if (showClockModal === 'in') clockInMut.mutate(payload);
    else clockOutMut.mutate(payload);
  };

  const submitEdit = () => {
    if (!editingPunch?.clockRecordId) return;
    if (!editNote.trim()) {
      notifications.show({ title: 'Required', message: 'A note is required for manual edits.', color: 'red' });
      return;
    }
    const payload: { id: number; edit_note: string; clock_in?: string; clock_out?: string } = {
      id: editingPunch.clockRecordId,
      edit_note: editNote.trim(),
    };
    if (editClockIn) payload.clock_in = new Date(editClockIn).toISOString();
    if (editClockOut) payload.clock_out = new Date(editClockOut).toISOString();
    editMut.mutate(payload);
  };

  const hasActiveFilters = debouncedSearch || clockType !== 'all' || dept !== 'all' || corrected !== 'all' || dateFrom || dateTo;
  const isSubmitting = clockInMut.isPending || clockOutMut.isPending;

  const cardStyle = {
    backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  };
  const inputCls = clsx('w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400');

  const columns = getPunchColumns(isDark, navigate, { isAdmin, onEdit: openEditModal });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Clock Records</h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {data?.total ?? 0} records
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button onClick={() => setShowClockModal('in')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
            <LogIn size={14} /> Clock In
          </button>
          <button onClick={() => setShowClockModal('out')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            <LogOut size={14} /> Clock Out
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-3" style={cardStyle}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search employee or date..."
            className={clsx('w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all',
              isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
                : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400')} />
          {search && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"><X size={13} /></button>}
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}` }}>
          {CLOCK_TYPES.map((t) => (
            <button key={t} onClick={() => { setClockType(t); setPage(1); }}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1',
                clockType === t ? 'gradient-bg text-white' : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'IN' && <LogIn size={10} />}{t === 'OUT' && <LogOut size={10} />}
              {t === 'all' ? 'All Types' : t === 'IN' ? 'Clock In' : 'Clock Out'}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}` }}>
          {CORRECTED_OPTS.map((o) => (
            <button key={o.value} onClick={() => { setCorrected(o.value); setPage(1); }}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors',
                corrected === o.value ? o.value === 'true' ? 'bg-yellow-500/20 text-yellow-300' : 'gradient-bg text-white'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
              {o.label}
            </button>
          ))}
        </div>
        <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}
          className={clsx('text-sm px-3 py-2 rounded-xl outline-none', isDark ? 'bg-white/5 text-gray-300 border border-white/8' : 'bg-gray-50 text-gray-700 border border-gray-200')}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className={clsx('pl-7 pr-2 py-2 rounded-xl text-xs outline-none transition-all w-[140px]',
                isDark ? 'bg-white/5 text-gray-300 border border-white/8 focus:border-indigo-500/50'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 focus:border-indigo-400')}
              title="From date"
            />
          </div>
          <span className={clsx('text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>to</span>
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className={clsx('pl-7 pr-2 py-2 rounded-xl text-xs outline-none transition-all w-[140px]',
                isDark ? 'bg-white/5 text-gray-300 border border-white/8 focus:border-indigo-500/50'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 focus:border-indigo-400')}
              title="To date"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable<Punch>
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={15}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={isLoading}
        keyExtractor={(row) => row.id}
        emptyMessage="No clock records found."
      />

      {/* Clock In/Out Modal */}
      {showClockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeClockModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                {showClockModal === 'in' ? 'Clock In' : 'Clock Out'}
              </h2>
              <button onClick={closeClockModal} className={clsx('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>Worker</label>
                <select value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} className={inputCls}>
                  <option value="">Select worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.base_id})</option>)}
                </select>
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>Shift</label>
                <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className={inputCls}>
                  <option value="">Select shift...</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={closeClockModal} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')}>Cancel</button>
                <button onClick={submitClock} disabled={isSubmitting || !selectedWorker || !selectedShift}
                  className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50',
                    showClockModal === 'in' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')}>
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {showClockModal === 'in' ? 'Clock In' : 'Clock Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Clock Record Modal (Admin only) */}
      {editingPunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                Edit Clock Record
              </h2>
              <button onClick={closeEditModal} className={clsx('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}><X size={16} /></button>
            </div>

            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <p className={clsx('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>{editingPunch.employeeName}</p>
              <p className={clsx('text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {editingPunch.type === 'IN' ? 'Clock In' : 'Clock Out'} — {editingPunch.date} at {editingPunch.time}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>Clock In Time</label>
                <input
                  type="datetime-local"
                  value={editClockIn}
                  onChange={e => setEditClockIn(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>Clock Out Time</label>
                <input
                  type="datetime-local"
                  value={editClockOut}
                  onChange={e => setEditClockOut(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Edit Note <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Reason for editing this record..."
                  rows={3}
                  className={clsx(inputCls, 'resize-none')}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={closeEditModal} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')}>
                  Cancel
                </button>
                <button
                  onClick={submitEdit}
                  disabled={editMut.isPending || !editNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-opacity disabled:opacity-50"
                >
                  {editMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toDatetimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}
