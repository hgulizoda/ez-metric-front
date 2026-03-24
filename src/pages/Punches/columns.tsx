import { LogIn, LogOut, Clock, AlertTriangle, Timer, Pencil } from 'lucide-react';
import clsx from 'clsx';
import type { Punch } from '@/types';

export function getPunchColumns(
  isDark: boolean,
  navigate: (path: string) => void,
  options?: { isAdmin?: boolean; onEdit?: (punch: Punch) => void }
) {
  const columns = [
    {
      key: 'id',
      label: 'Record ID',
      render: (_: unknown, row: Punch) => (
        <span className={clsx('text-xs font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>
          #{row.id.replace('clk-', '')}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (_: unknown, row: Punch) => {
        const isIn = row.type === 'IN';
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={isIn
              ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399' }
              : { backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171' }}
          >
            {isIn ? <LogIn size={11} /> : <LogOut size={11} />}
            {isIn ? 'Clock In' : 'Clock Out'}
          </span>
        );
      },
    },
    {
      key: 'employeeName',
      label: 'Employee',
      sortable: true,
      render: (_: unknown, row: Punch) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.employeeName.charAt(0)}
          </div>
          <span className={clsx('text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}>{row.employeeName}</span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (_: unknown, row: Punch) => (
        <span className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{row.department}</span>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      render: (_: unknown, row: Punch) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-gray-500" />
            <span className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>{row.time}</span>
          </div>
          <span className="text-xs text-gray-500 ml-4">{row.date}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: Punch) => (
        <div className="flex flex-col gap-1">
          {row.isCorrected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
              <AlertTriangle size={10} /> Corrected
            </span>
          ) : (
            <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Normal</span>
          )}
          {row.gracePeriodApplied && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
              <Timer size={10} /> Grace Period
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (_: unknown, row: Punch) => (
        <span className={clsx(
          'text-xs px-2 py-0.5 rounded-full',
          row.source === 'Device'
            ? isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
            : row.source === 'Manual'
            ? 'bg-yellow-500/10 text-yellow-400'
            : 'bg-blue-500/10 text-blue-400'
        )}>
          {row.source}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_: unknown, row: Punch) => (
        <div className="flex items-center gap-1">
          {options?.isAdmin && options?.onEdit && (
            <button
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-yellow-500/10"
              onClick={(e) => { e.stopPropagation(); options.onEdit!(row); }}
              title="Edit record"
            >
              <Pencil size={13} />
            </button>
          )}
          <button
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium px-2.5 py-1 rounded-lg hover:bg-indigo-500/10"
            onClick={() => navigate(`/punches/${row.id}`)}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return columns;
}
