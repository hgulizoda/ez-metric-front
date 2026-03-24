import { useState } from 'react';
import {
  DollarSign, ClipboardList, Clock, CreditCard, Plus, Trash2, Search,
  Loader2, AlertCircle, Calculator, User, Calendar,
} from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';
import {
  apiGetSalaryRules, apiCreateSalaryRule, apiGetCharges, apiCreateCharge,
  apiDeleteCharge, apiCalculateSalary,
  type SalaryRule, type Charge, type SalaryCalculation,
} from '@/services/api/salary';
import client, { unwrap } from '@/services/api/client';

interface Worker { id: number; name: string; base_id: string; position?: string }

const TABS = [
  { id: 'rules', label: 'Salary Rules', icon: <DollarSign size={15} /> },
  { id: 'overtime', label: 'Overtime', icon: <Clock size={15} /> },
  { id: 'charges', label: 'Charges', icon: <CreditCard size={15} /> },
  { id: 'preview', label: 'Preview', icon: <ClipboardList size={15} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];
const CHARGE_TYPES = ['loan', 'prepayment', 'distribution', 'time_misuse'] as const;
const RULE_TYPES = ['hourly', 'percentage', 'flat'] as const;

// ── Shared helpers ──────────────────────────────────────────────────────────
function useWorkers() {
  return useQuery({ queryKey: ['workers'], queryFn: () => unwrap<Worker[]>(client.get('/workers')) });
}

function TypeBadge({ type, isDark }: { type: string; isDark: boolean }) {
  const colors: Record<string, string> = {
    hourly: 'bg-blue-500/15 text-blue-400', percentage: 'bg-purple-500/15 text-purple-400',
    flat: 'bg-emerald-500/15 text-emerald-400', loan: 'bg-red-500/15 text-red-400',
    prepayment: 'bg-amber-500/15 text-amber-400', distribution: 'bg-cyan-500/15 text-cyan-400',
    time_misuse: 'bg-rose-500/15 text-rose-400',
  };
  return (
    <span className={clsx('px-2 py-0.5 rounded-md text-xs font-medium capitalize', colors[type] ?? (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'))}>
      {type.replace('_', ' ')}
    </span>
  );
}

function Overlay({ onClose, isDark, title, children }: { onClose: () => void; isDark: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
        style={{ backgroundColor: isDark ? '#1e1e2e' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function inputCls(isDark: boolean) {
  return clsx(
    'w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark
      ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400',
  );
}

function labelCls(isDark: boolean) {
  return clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500');
}

function EmptyState({ icon, title, desc, isDark, cardBg, border }: { icon: React.ReactNode; title: string; desc: string; isDark: boolean; cardBg: string; border: string }) {
  return (
    <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>{icon}</div>
      <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>{title}</h3>
      <p className={clsx('text-sm max-w-md', isDark ? 'text-gray-500' : 'text-gray-400')}>{desc}</p>
    </div>
  );
}

// ── Tab: Salary Rules ───────────────────────────────────────────────────────
function RulesTab({ isDark, cardBg, border }: { isDark: boolean; cardBg: string; border: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ worker_id: '', type: 'hourly' as const, rate: '', overtime_multiplier: '1.5', overtime_threshold_hours: '40' });

  const { data: rules = [], isLoading, isError } = useQuery({ queryKey: ['salary-rules'], queryFn: apiGetSalaryRules });
  const { data: workers = [] } = useWorkers();
  const create = useMutation({
    mutationFn: apiCreateSalaryRule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-rules'] }); setShowAdd(false); notifications.show({ title: 'Rule Created', message: 'Salary rule added successfully', color: 'green' }); },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });

  const submit = () => {
    if (!form.worker_id || !form.rate) return;
    create.mutate({
      worker_id: Number(form.worker_id), type: form.type, rate: Number(form.rate),
      overtime_multiplier: Number(form.overtime_multiplier), overtime_threshold_hours: Number(form.overtime_threshold_hours),
    });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>;
  if (isError) return <div className="flex items-center gap-2 justify-center py-16 text-red-400"><AlertCircle size={18} /> Failed to load salary rules</div>;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity">
          <Plus size={15} /> Add Rule
        </button>
      </div>
      {rules.length === 0
        ? <EmptyState isDark={isDark} cardBg={cardBg} border={border} icon={<DollarSign size={28} className="text-indigo-400" />} title="No salary rules configured" desc="Set up hourly, percentage, or flat salary rules for each worker." />
        : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
            <table className="w-full text-sm">
              <thead><tr className={clsx('text-xs uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')} style={{ borderBottom: `1px solid ${border}` }}>
                {['Worker', 'Type', 'Rate', 'OT Multiplier', 'OT Threshold'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className={clsx('px-4 py-3 font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{r.worker?.name ?? `#${r.worker_id}`}</td>
                    <td className="px-4 py-3"><TypeBadge type={r.type} isDark={isDark} /></td>
                    <td className={clsx('px-4 py-3', isDark ? 'text-gray-300' : 'text-gray-700')}>{r.type === 'percentage' ? `${r.rate}%` : `$${r.rate}`}</td>
                    <td className={clsx('px-4 py-3', isDark ? 'text-gray-400' : 'text-gray-500')}>{r.overtime_multiplier}x</td>
                    <td className={clsx('px-4 py-3', isDark ? 'text-gray-400' : 'text-gray-500')}>{r.overtime_threshold_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {showAdd && (
        <Overlay isDark={isDark} title="Add Salary Rule" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls(isDark)}>Worker</label>
              <select value={form.worker_id} onChange={e => setForm(p => ({ ...p, worker_id: e.target.value }))} className={inputCls(isDark)}>
                <option value="">Select worker...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls(isDark)}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))} className={inputCls(isDark)}>
                {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls(isDark)}>Rate</label>
              <input type="number" placeholder="e.g. 25" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} className={inputCls(isDark)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls(isDark)}>OT Multiplier</label>
                <input type="number" step="0.1" value={form.overtime_multiplier} onChange={e => setForm(p => ({ ...p, overtime_multiplier: e.target.value }))} className={inputCls(isDark)} />
              </div>
              <div>
                <label className={labelCls(isDark)}>OT Threshold (hrs)</label>
                <input type="number" value={form.overtime_threshold_hours} onChange={e => setForm(p => ({ ...p, overtime_threshold_hours: e.target.value }))} className={inputCls(isDark)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className={clsx('px-4 py-2 rounded-xl text-sm', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>Cancel</button>
            <button onClick={submit} disabled={create.isPending || !form.worker_id || !form.rate} className="px-4 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50">
              {create.isPending ? 'Saving...' : 'Create Rule'}
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ── Tab: Overtime ───────────────────────────────────────────────────────────
function OvertimeTab({ isDark, cardBg, border }: { isDark: boolean; cardBg: string; border: string }) {
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['salary-rules'], queryFn: apiGetSalaryRules });
  const overtime = rules.filter(r => r.overtime_multiplier > 1);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>;
  if (overtime.length === 0) return <EmptyState isDark={isDark} cardBg={cardBg} border={border} icon={<Clock size={28} className="text-indigo-400" />} title="No overtime rules set" desc="Configure overtime thresholds and multipliers in the Salary Rules tab." />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {overtime.map(r => (
        <div key={r.id} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white text-xs font-bold">{(r.worker?.name ?? '?')[0]}</div>
            <div>
              <div className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{r.worker?.name ?? `Worker #${r.worker_id}`}</div>
              <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{r.worker?.position ?? 'N/A'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Multiplier</div>
              <div className={clsx('text-lg font-bold', isDark ? 'text-amber-400' : 'text-amber-600')}>{r.overtime_multiplier}x</div>
            </div>
            <div className="rounded-xl p-2.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Threshold</div>
              <div className={clsx('text-lg font-bold', isDark ? 'text-blue-400' : 'text-blue-600')}>{r.overtime_threshold_hours}h</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Charges ────────────────────────────────────────────────────────────
function ChargesTab({ isDark, cardBg, border }: { isDark: boolean; cardBg: string; border: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ worker_id: '', type: 'loan' as typeof CHARGE_TYPES[number], amount: '', description: '', distributed_over_periods: '' });

  const typeArg = filter === 'all' ? undefined : filter;
  const { data: charges = [], isLoading, isError } = useQuery({ queryKey: ['charges', typeArg], queryFn: () => apiGetCharges(undefined, typeArg) });
  const { data: workers = [] } = useWorkers();

  const createMut = useMutation({
    mutationFn: apiCreateCharge,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['charges'] }); setShowAdd(false); notifications.show({ title: 'Charge Created', message: 'Charge added', color: 'green' }); },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });
  const deleteMut = useMutation({
    mutationFn: apiDeleteCharge,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['charges'] }); notifications.show({ title: 'Deleted', message: 'Charge removed', color: 'green' }); },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });

  const submitCharge = () => {
    if (!form.worker_id || !form.amount) return;
    createMut.mutate({
      worker_id: Number(form.worker_id), type: form.type, amount: Number(form.amount),
      description: form.description, distributed_over_periods: form.distributed_over_periods ? Number(form.distributed_over_periods) : undefined,
    });
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>;
  if (isError) return <div className="flex items-center gap-2 justify-center py-16 text-red-400"><AlertCircle size={18} /> Failed to load charges</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
          {['all', ...CHARGE_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
              filter === t ? 'bg-indigo-500/20 text-indigo-300' : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
            )}>{t.replace('_', ' ')}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity">
          <Plus size={15} /> Add Charge
        </button>
      </div>
      {charges.length === 0
        ? <EmptyState isDark={isDark} cardBg={cardBg} border={border} icon={<CreditCard size={28} className="text-indigo-400" />} title="No charges recorded" desc="Manage loans, prepayments, distributions, and time misuse charges." />
        : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
            <table className="w-full text-sm">
              <thead><tr className={clsx('text-xs uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')} style={{ borderBottom: `1px solid ${border}` }}>
                {['Worker', 'Type', 'Amount', 'Remaining', 'Description', ''].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {charges.map(c => (
                  <tr key={c.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className={clsx('px-4 py-3 font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{c.worker?.name ?? `#${c.worker_id}`}</td>
                    <td className="px-4 py-3"><TypeBadge type={c.type} isDark={isDark} /></td>
                    <td className={clsx('px-4 py-3', isDark ? 'text-gray-300' : 'text-gray-700')}>${c.amount.toFixed(2)}</td>
                    <td className={clsx('px-4 py-3', isDark ? 'text-gray-400' : 'text-gray-500')}>${c.remaining.toFixed(2)}</td>
                    <td className={clsx('px-4 py-3 max-w-[200px] truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>{c.description || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteMut.mutate(c.id)} disabled={deleteMut.isPending} className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {showAdd && (
        <Overlay isDark={isDark} title="Add Charge" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls(isDark)}>Worker</label>
              <select value={form.worker_id} onChange={e => setForm(p => ({ ...p, worker_id: e.target.value }))} className={inputCls(isDark)}>
                <option value="">Select worker...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls(isDark)}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))} className={inputCls(isDark)}>
                {CHARGE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls(isDark)}>Amount</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputCls(isDark)} />
            </div>
            <div>
              <label className={labelCls(isDark)}>Description</label>
              <input type="text" placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls(isDark)} />
            </div>
            <div>
              <label className={labelCls(isDark)}>Distribute over periods (optional)</label>
              <input type="number" placeholder="e.g. 4" value={form.distributed_over_periods} onChange={e => setForm(p => ({ ...p, distributed_over_periods: e.target.value }))} className={inputCls(isDark)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAdd(false)} className={clsx('px-4 py-2 rounded-xl text-sm', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>Cancel</button>
            <button onClick={submitCharge} disabled={createMut.isPending || !form.worker_id || !form.amount} className="px-4 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50">
              {createMut.isPending ? 'Saving...' : 'Add Charge'}
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ── Tab: Preview ────────────────────────────────────────────────────────────
function PreviewTab({ isDark, cardBg, border }: { isDark: boolean; cardBg: string; border: string }) {
  const [workerId, setWorkerId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: workers = [] } = useWorkers();

  const canCalc = !!workerId && !!from && !!to;
  const { data: calc, isLoading, isError, refetch, isFetched } = useQuery<SalaryCalculation>({
    queryKey: ['salary-calc', workerId, from, to],
    queryFn: () => apiCalculateSalary(Number(workerId), from, to),
    enabled: false,
  });

  const handleCalc = () => { if (canCalc) refetch(); };

  const rows: [string, string][] = calc ? [
    ['Period', `${calc.period.from} to ${calc.period.to}`],
    ['Hours Worked', `${calc.hours_worked.toFixed(2)}h`],
    ['Overtime Hours', `${calc.overtime_hours.toFixed(2)}h`],
    ['Base Salary', `$${calc.base_salary.toFixed(2)}`],
    ['Overtime Pay', `$${calc.overtime_pay.toFixed(2)}`],
    ['Total Charges', `$${calc.total_charges.toFixed(2)}`],
    ['Net Salary', `$${calc.net_salary.toFixed(2)}`],
  ] : [];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className={labelCls(isDark)}><User size={12} className="inline mr-1" />Worker</label>
            <select value={workerId} onChange={e => setWorkerId(e.target.value)} className={inputCls(isDark)}>
              <option value="">Select worker...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls(isDark)}><Calendar size={12} className="inline mr-1" />From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls(isDark)} />
          </div>
          <div>
            <label className={labelCls(isDark)}><Calendar size={12} className="inline mr-1" />To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls(isDark)} />
          </div>
          <button onClick={handleCalc} disabled={!canCalc || isLoading} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50 h-[38px]">
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
            Calculate
          </button>
        </div>
      </div>

      {isError && <div className="flex items-center gap-2 justify-center py-8 text-red-400"><AlertCircle size={18} /> Failed to calculate salary. Check inputs and try again.</div>}

      {calc && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
            <h3 className={clsx('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-800')}>{calc.worker_name} - Salary Breakdown</h3>
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between px-5 py-3" style={{ borderColor: border }}>
                <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</span>
                <span className={clsx('text-sm font-medium', label === 'Net Salary' ? 'text-emerald-400 text-base font-bold' : isDark ? 'text-gray-200' : 'text-gray-800')}>{value}</span>
              </div>
            ))}
          </div>
          {calc.charges.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: `1px solid ${border}` }}>
              <h4 className={clsx('text-xs font-semibold uppercase tracking-wider mb-3', isDark ? 'text-gray-500' : 'text-gray-400')}>Applied Charges</h4>
              <div className="space-y-2">
                {calc.charges.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={c.type} isDark={isDark} />
                      <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>{c.description || '—'}</span>
                    </div>
                    <span className={clsx('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>${c.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!calc && !isLoading && !isError && (
        <EmptyState isDark={isDark} cardBg={cardBg} border={border} icon={<ClipboardList size={28} className="text-indigo-400" />} title="Select a worker to preview salary" desc="Choose a worker and date range, then click Calculate to see the salary breakdown." />
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Salary() {
  const { isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabId>('rules');

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shared = { isDark, cardBg, border };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Salary</h1>
        <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>Configure salary rules, overtime, and manage charges</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300'
              : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-black/5',
          )}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && <RulesTab {...shared} />}
      {activeTab === 'overtime' && <OvertimeTab {...shared} />}
      {activeTab === 'charges' && <ChargesTab {...shared} />}
      {activeTab === 'preview' && <PreviewTab {...shared} />}
    </div>
  );
}
