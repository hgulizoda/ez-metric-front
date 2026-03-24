import { useState, useMemo } from 'react';
import {
  Gauge,
  Trophy,
  AlertTriangle,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Pencil,
  Trash2,
  Gift,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';
import {
  apiGetAllEfficiency,
  apiGetBonusRules,
  apiCreateBonusRule,
  apiUpdateBonusRule,
  apiDeleteBonusRule,
  apiCreateManualBonus,
} from '@/services/api/efficiency';
import type {
  WorkerEfficiency,
  BonusRule,
  CreateBonusRulePayload,
} from '@/services/api/efficiency';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const d = new Date();
  return fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function today(): string {
  return fmtDate(new Date());
}

function efficiencyColor(val: number) {
  if (val >= 90) return { bar: '#22c55e', text: 'text-green-400', bg: 'rgba(34,197,94,0.15)' };
  if (val >= 70) return { bar: '#eab308', text: 'text-yellow-400', bg: 'rgba(234,179,8,0.15)' };
  return { bar: '#ef4444', text: 'text-red-400', bg: 'rgba(239,68,68,0.15)' };
}

type SortKey = 'worker_name' | 'position' | 'total_hours' | 'billed_hours' | 'efficiency';
type SortDir = 'asc' | 'desc';

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function Efficiency() {
  const { isDark } = useThemeStore();
  const queryClient = useQueryClient();

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  /* ---------- date range ---------- */
  const [from, setFrom] = useState(startOfMonth);
  const [to, setTo] = useState(today);

  /* ---------- sorting ---------- */
  const [sortKey, setSortKey] = useState<SortKey>('efficiency');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  /* ---------- modals ---------- */
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [bonusTarget, setBonusTarget] = useState<WorkerEfficiency | null>(null);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  /* ---------- bonus form state ---------- */
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusNote, setBonusNote] = useState('');

  /* ---------- rule form state ---------- */
  const [rulePosition, setRulePosition] = useState('');
  const [ruleFormula, setRuleFormula] = useState('');
  const [ruleThreshold, setRuleThreshold] = useState('');

  /* ---------- queries ---------- */
  const {
    data: workers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['efficiency', from, to],
    queryFn: () => apiGetAllEfficiency(from, to),
  });

  const { data: bonusRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['bonus-rules'],
    queryFn: apiGetBonusRules,
    enabled: showRulesPanel,
  });

  /* ---------- mutations ---------- */
  const createRuleMut = useMutation({
    mutationFn: (payload: CreateBonusRulePayload) => apiCreateBonusRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-rules'] });
      notifications.show({ title: 'Created', message: 'Bonus rule created', color: 'green' });
      resetRuleForm();
    },
    onError: () => notifications.show({ title: 'Error', message: 'Failed to create rule', color: 'red' }),
  });

  const updateRuleMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBonusRulePayload> }) =>
      apiUpdateBonusRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-rules'] });
      notifications.show({ title: 'Updated', message: 'Bonus rule updated', color: 'green' });
      resetRuleForm();
    },
    onError: () => notifications.show({ title: 'Error', message: 'Failed to update rule', color: 'red' }),
  });

  const deleteRuleMut = useMutation({
    mutationFn: (id: number) => apiDeleteBonusRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonus-rules'] });
      notifications.show({ title: 'Deleted', message: 'Bonus rule removed', color: 'orange' });
    },
    onError: () => notifications.show({ title: 'Error', message: 'Failed to delete rule', color: 'red' }),
  });

  const manualBonusMut = useMutation({
    mutationFn: apiCreateManualBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['efficiency'] });
      notifications.show({ title: 'Bonus Added', message: 'Manual bonus created successfully', color: 'green' });
      closeBonusModal();
    },
    onError: () => notifications.show({ title: 'Error', message: 'Failed to create bonus', color: 'red' }),
  });

  /* ---------- derived ---------- */
  const sorted = useMemo(() => {
    const copy = [...workers];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [workers, sortKey, sortDir]);

  const avgEfficiency =
    workers.length > 0 ? workers.reduce((s, w) => s + w.efficiency, 0) / workers.length : 0;
  const aboveThreshold = workers.filter((w) => w.bonus_eligible).length;
  const belowThreshold = workers.length - aboveThreshold;

  /* ---------- handlers ---------- */
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-400" />
    ) : (
      <ArrowDown size={12} className="text-indigo-400" />
    );
  }

  function closeBonusModal() {
    setBonusTarget(null);
    setBonusAmount('');
    setBonusNote('');
  }

  function resetRuleForm() {
    setShowRuleForm(false);
    setEditingRule(null);
    setRulePosition('');
    setRuleFormula('');
    setRuleThreshold('');
  }

  function openEditRule(rule: BonusRule) {
    setEditingRule(rule);
    setRulePosition(rule.position);
    setRuleFormula(rule.formula);
    setRuleThreshold(String(rule.min_efficiency_threshold));
    setShowRuleForm(true);
  }

  function submitRule() {
    const payload: CreateBonusRulePayload = {
      position: rulePosition,
      formula: ruleFormula,
      min_efficiency_threshold: parseFloat(ruleThreshold),
    };
    if (editingRule) {
      updateRuleMut.mutate({ id: editingRule.id, payload });
    } else {
      createRuleMut.mutate(payload);
    }
  }

  function submitManualBonus() {
    if (!bonusTarget) return;
    manualBonusMut.mutate({
      worker_id: bonusTarget.worker_id,
      amount: parseFloat(bonusAmount),
      period: `${from}/${to}`,
      note: bonusNote || undefined,
    });
  }

  /* ---------- input class ---------- */
  const inputCls = clsx(
    'w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark
      ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400',
  );

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Efficiency
          </h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Track worker efficiency and manage bonus rules
          </p>
        </div>
        <button
          onClick={() => setShowRulesPanel(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"
        >
          <Settings size={16} />
          Bonus Rules
        </button>
      </div>

      {/* ---- Date Range ---- */}
      <div
        className="rounded-2xl p-4 flex flex-wrap items-center gap-4"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-2">
          <label className={clsx('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm outline-none',
              isDark
                ? 'bg-white/5 text-gray-300 border border-white/8'
                : 'bg-gray-50 text-gray-700 border border-gray-200',
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className={clsx('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm outline-none',
              isDark
                ? 'bg-white/5 text-gray-300 border border-white/8'
                : 'bg-gray-50 text-gray-700 border border-gray-200',
            )}
          />
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['efficiency'] })}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            isDark ? 'bg-white/5 text-gray-400 hover:text-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700',
          )}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Avg Efficiency',
            value: workers.length ? `${avgEfficiency.toFixed(1)}%` : '--',
            color: '#6366f1',
            icon: <Gauge size={18} />,
          },
          {
            label: 'Above Threshold',
            value: workers.length ? String(aboveThreshold) : '--',
            color: '#10b981',
            icon: <Trophy size={18} />,
          },
          {
            label: 'Below Threshold',
            value: workers.length ? String(belowThreshold) : '--',
            color: '#ef4444',
            icon: <AlertTriangle size={18} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Loading State ---- */}
      {isLoading && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <Loader2 size={32} className="animate-spin text-indigo-400 mb-3" />
          <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Loading efficiency data...
          </p>
        </div>
      )}

      {/* ---- Error State ---- */}
      {isError && !isLoading && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>
            Failed to load data
          </h3>
          <p className={clsx('text-sm max-w-md', isDark ? 'text-gray-500' : 'text-gray-400')}>
            {(error as Error)?.message || 'An unknown error occurred while fetching efficiency data.'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['efficiency'] })}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ---- Empty State ---- */}
      {!isLoading && !isError && workers.length === 0 && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
          >
            <Gauge size={28} className="text-indigo-400" />
          </div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>
            No efficiency data yet
          </h3>
          <p className={clsx('text-sm max-w-md', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Worker efficiency will be calculated from billed hours vs. total marked hours once clock
            and shift data is available.
          </p>
        </div>
      )}

      {/* ---- Workers Table ---- */}
      {!isLoading && !isError && workers.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={clsx(
                    'text-xs uppercase tracking-wider',
                    isDark ? 'text-gray-500' : 'text-gray-400',
                  )}
                  style={{ borderBottom: `1px solid ${border}` }}
                >
                  {(
                    [
                      ['worker_name', 'Name'],
                      ['position', 'Position'],
                      ['total_hours', 'Total Hours'],
                      ['billed_hours', 'Billed Hours'],
                      ['efficiency', 'Efficiency %'],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      className="px-5 py-3 text-left font-semibold cursor-pointer select-none hover:opacity-80"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-left font-semibold">Bonus Eligible</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w) => {
                  const ec = efficiencyColor(w.efficiency);
                  return (
                    <tr
                      key={w.worker_id}
                      className={clsx(
                        'transition-colors',
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50',
                      )}
                      style={{ borderBottom: `1px solid ${border}` }}
                    >
                      {/* Name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {w.worker_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span
                            className={clsx(
                              'font-medium',
                              isDark ? 'text-gray-200' : 'text-gray-800',
                            )}
                          >
                            {w.worker_name}
                          </span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-5 py-3">
                        <span
                          className={clsx(
                            'text-xs px-2 py-1 rounded-lg',
                            isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {w.position}
                        </span>
                      </td>

                      {/* Total Hours */}
                      <td className="px-5 py-3">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          {w.total_hours.toFixed(1)}h
                        </span>
                      </td>

                      {/* Billed Hours */}
                      <td className="px-5 py-3">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          {w.billed_hours.toFixed(1)}h
                        </span>
                      </td>

                      {/* Efficiency + progress bar */}
                      <td className="px-5 py-3 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div
                              className="h-2 rounded-full overflow-hidden"
                              style={{
                                backgroundColor: isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.06)',
                              }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(w.efficiency, 100)}%`,
                                  backgroundColor: ec.bar,
                                }}
                              />
                            </div>
                          </div>
                          <span className={clsx('text-xs font-semibold w-12 text-right', ec.text)}>
                            {w.efficiency.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Bonus Eligible */}
                      <td className="px-5 py-3">
                        {w.bonus_eligible ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
                            <Trophy size={11} />
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
                            <X size={11} />
                            Not Eligible
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setBonusTarget(w)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                          <Gift size={12} />
                          Add Bonus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  MODAL: Manual Bonus                                             */}
      {/* ================================================================ */}
      {bonusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={closeBonusModal} />

          <div
            className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: isDark ? '#1a1d23' : '#ffffff', border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className={clsx('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                Add Manual Bonus
              </h2>
              <button
                onClick={closeBonusModal}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
                )}
              >
                <X size={16} />
              </button>
            </div>

            <p className={clsx('text-sm mb-4', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Awarding bonus to{' '}
              <span className="font-semibold text-indigo-400">{bonusTarget.worker_name}</span> for
              period {from} to {to}.
            </p>

            <div className="space-y-3">
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="Reason for bonus..."
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={closeBonusModal}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  isDark
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                Cancel
              </button>
              <button
                disabled={!bonusAmount || manualBonusMut.isPending}
                onClick={submitManualBonus}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {manualBonusMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  MODAL: Bonus Rules Panel                                        */}
      {/* ================================================================ */}
      {showRulesPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowRulesPanel(false); resetRuleForm(); }} />

          <div
            className="relative z-10 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col"
            style={{ backgroundColor: isDark ? '#1a1d23' : '#ffffff', border: `1px solid ${border}` }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${border}` }}
            >
              <h2 className={clsx('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                Bonus Rules
              </h2>
              <div className="flex items-center gap-2">
                {!showRuleForm && (
                  <button
                    onClick={() => setShowRuleForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} />
                    Add Rule
                  </button>
                )}
                <button
                  onClick={() => { setShowRulesPanel(false); resetRuleForm(); }}
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
                  )}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Rule Form */}
              {showRuleForm && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
                  }}
                >
                  <h3 className={clsx('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                    {editingRule ? 'Edit Rule' : 'New Bonus Rule'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Position
                      </label>
                      <input
                        type="text"
                        value={rulePosition}
                        onChange={(e) => setRulePosition(e.target.value)}
                        placeholder="e.g. Mechanic"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Formula
                      </label>
                      <input
                        type="text"
                        value={ruleFormula}
                        onChange={(e) => setRuleFormula(e.target.value)}
                        placeholder="e.g. billed * 0.05"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Min Efficiency %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ruleThreshold}
                        onChange={(e) => setRuleThreshold(e.target.value)}
                        placeholder="80"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={!rulePosition || !ruleFormula || !ruleThreshold || createRuleMut.isPending || updateRuleMut.isPending}
                      onClick={submitRule}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {(createRuleMut.isPending || updateRuleMut.isPending) && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      {editingRule ? 'Update' : 'Create'}
                    </button>
                    <button
                      onClick={resetRuleForm}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                        isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rules loading */}
              {rulesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                </div>
              )}

              {/* Rules list */}
              {!rulesLoading && bonusRules.length === 0 && (
                <div className="text-center py-8">
                  <Settings size={28} className={clsx('mx-auto mb-2', isDark ? 'text-gray-600' : 'text-gray-300')} />
                  <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    No bonus rules configured yet.
                  </p>
                </div>
              )}

              {!rulesLoading &&
                bonusRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${border}`,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-lg',
                            isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600',
                          )}
                        >
                          {rule.position}
                        </span>
                        <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                          Min {rule.min_efficiency_threshold}%
                        </span>
                      </div>
                      <p className={clsx('text-sm font-mono', isDark ? 'text-gray-300' : 'text-gray-600')}>
                        {rule.formula}
                      </p>
                      <p className={clsx('text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>
                        Created {new Date(rule.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditRule(rule)}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
                        )}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteRuleMut.mutate(rule.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
