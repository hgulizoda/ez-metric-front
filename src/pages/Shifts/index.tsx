import { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useThemeStore } from '@/app/store/themeStore';
import clsx from 'clsx';
import {
  apiGetShifts,
  apiCreateShift,
  apiUpdateShift,
  apiDeleteShift,
} from '@/services/api/shifts';
import type {
  Shift,
  CreateShiftPayload,
  UpdateShiftPayload,
} from '@/services/api/shifts';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ['all', 'active', 'completed', 'missed'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<Shift['status'], { bg: string; text: string; dot: string }> = {
  active:    { bg: 'rgba(34,197,94,0.12)',  text: 'text-emerald-400', dot: 'bg-emerald-400' },
  completed: { bg: 'rgba(99,102,241,0.12)', text: 'text-indigo-400',  dot: 'bg-indigo-400' },
  missed:    { bg: 'rgba(239,68,68,0.12)',  text: 'text-red-400',     dot: 'bg-red-400' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  // Handle both "HH:mm:ss" and full ISO strings
  const parts = timeStr.includes('T') ? timeStr.split('T')[1]?.split(':') : timeStr.split(':');
  if (!parts || parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function ShiftStatusBadge({ status }: { status: Shift['status'] }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.active;
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize', colors.text)}
      style={{ backgroundColor: colors.bg }}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

interface ShiftModalProps {
  isDark: boolean;
  shift: Shift | null;          // null = create mode
  onClose: () => void;
  onSubmit: (data: CreateShiftPayload | UpdateShiftPayload) => void;
  isSubmitting: boolean;
}

function ShiftModal({ isDark, shift, onClose, onSubmit, isSubmitting }: ShiftModalProps) {
  const [name, setName] = useState(shift?.name ?? '');
  const [startTime, setStartTime] = useState(shift?.start_time?.slice(0, 5) ?? '');
  const [endTime, setEndTime] = useState(shift?.end_time?.slice(0, 5) ?? '');
  const [status, setStatus] = useState<Shift['status']>(shift?.status ?? 'active');

  const isEdit = shift !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) {
      notifications.show({ title: 'Validation', message: 'All fields are required.', color: 'red' });
      return;
    }
    if (isEdit) {
      const payload: UpdateShiftPayload = { name: name.trim(), start_time: startTime, end_time: endTime, status };
      onSubmit(payload);
    } else {
      onSubmit({ name: name.trim(), start_time: startTime, end_time: endTime });
    }
  };

  const inputCls = clsx(
    'w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark
      ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400',
  );

  const labelCls = clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            {isEdit ? 'Edit Shift' : 'New Shift'}
          </h2>
          <button
            onClick={onClose}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
            )}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Shift Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Shift"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Shift['status'])}
                className={inputCls}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm Delete Dialog                                              */
/* ------------------------------------------------------------------ */

interface ConfirmDeleteProps {
  isDark: boolean;
  shiftName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function ConfirmDelete({ isDark, shiftName, onCancel, onConfirm, isDeleting }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-400" />
          </div>
          <h3 className={clsx('text-base font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>
            Delete Shift
          </h3>
          <p className={clsx('text-sm mb-5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Are you sure you want to delete <span className="font-medium text-gray-300">"{shiftName}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={onCancel}
              className={clsx(
                'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function Shifts() {
  const { isDark } = useThemeStore();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  /* ---- Queries ---- */

  const {
    data: shifts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Shift[]>({
    queryKey: ['shifts', statusFilter],
    queryFn: () => apiGetShifts(statusFilter === 'all' ? undefined : statusFilter),
  });

  /* ---- Mutations ---- */

  const createMutation = useMutation({
    mutationFn: (payload: CreateShiftPayload) => apiCreateShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setModalOpen(false);
      notifications.show({ title: 'Shift Created', message: 'New shift has been added successfully.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create shift. Please try again.', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateShiftPayload }) => apiUpdateShift(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setEditingShift(null);
      notifications.show({ title: 'Shift Updated', message: 'Shift has been updated successfully.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to update shift. Please try again.', color: 'red' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setDeletingShift(null);
      notifications.show({ title: 'Shift Deleted', message: 'Shift has been removed.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete shift. Please try again.', color: 'red' });
    },
  });

  /* ---- Handlers ---- */

  const handleCreate = (data: CreateShiftPayload | UpdateShiftPayload) => {
    createMutation.mutate(data as CreateShiftPayload);
  };

  const handleUpdate = (data: CreateShiftPayload | UpdateShiftPayload) => {
    if (!editingShift) return;
    updateMutation.mutate({ id: editingShift.id, payload: data as UpdateShiftPayload });
  };

  const handleConfirmDelete = () => {
    if (!deletingShift) return;
    deleteMutation.mutate(deletingShift.id);
  };

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Shifts
          </h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Manage work shifts, schedules, and assignments
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Shift
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setStatusFilter(opt)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              statusFilter === opt
                ? 'bg-indigo-500/20 text-indigo-300'
                : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-black/5',
            )}
          >
            {opt === 'all' ? 'All Shifts' : opt}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="shimmer h-4 w-32 rounded-lg" />
                <div className="shimmer h-4 w-20 rounded-lg" />
                <div className="shimmer h-4 w-20 rounded-lg" />
                <div className="shimmer h-4 w-16 rounded-lg" />
                <div className="flex-1" />
                <div className="shimmer h-4 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <X size={28} className="text-red-400" />
          </div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>
            Failed to load shifts
          </h3>
          <p className={clsx('text-sm max-w-md mb-4', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Something went wrong while fetching shift data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl gradient-bg text-white hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && shifts.length === 0 && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
          >
            <CalendarClock size={28} className="text-indigo-400" />
          </div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>
            {statusFilter === 'all' ? 'No shifts configured' : `No ${statusFilter} shifts`}
          </h3>
          <p className={clsx('text-sm max-w-md mb-4', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {statusFilter === 'all'
              ? 'Create shifts to define working hours, track attendance status, and manage clock records per shift.'
              : `There are no shifts with status "${statusFilter}" at this time.`}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Create First Shift
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && shifts.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Shift Name', 'Start Time', 'End Time', 'Status', 'Created', ''].map((h) => (
                    <th
                      key={h}
                      className={clsx(
                        'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider',
                        isDark ? 'text-gray-500' : 'text-gray-400',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, idx) => (
                  <tr
                    key={shift.id}
                    className={clsx(
                      'transition-colors',
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50',
                    )}
                    style={idx < shifts.length - 1 ? { borderBottom: `1px solid ${border}` } : undefined}
                  >
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
                        >
                          <Clock size={16} className="text-indigo-400" />
                        </div>
                        <span className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>
                          {shift.name}
                        </span>
                      </div>
                    </td>

                    {/* Start */}
                    <td className="px-5 py-4">
                      <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {formatTime(shift.start_time)}
                      </span>
                    </td>

                    {/* End */}
                    <td className="px-5 py-4">
                      <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {formatTime(shift.end_time)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <ShiftStatusBadge status={shift.status} />
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4">
                      <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {formatDate(shift.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingShift(shift)}
                          className={clsx(
                            'p-2 rounded-lg transition-colors',
                            isDark ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600',
                          )}
                          title="Edit shift"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingShift(shift)}
                          className="p-2 rounded-lg transition-colors text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete shift"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: `1px solid ${border}` }}
          >
            <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {shifts.length} shift{shifts.length !== 1 ? 's' : ''}{statusFilter !== 'all' ? ` (${statusFilter})` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <ShiftModal
          isDark={isDark}
          shift={null}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editingShift && (
        <ShiftModal
          isDark={isDark}
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {deletingShift && (
        <ConfirmDelete
          isDark={isDark}
          shiftName={deletingShift.name}
          onCancel={() => setDeletingShift(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
