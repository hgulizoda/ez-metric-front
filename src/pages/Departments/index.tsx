import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useManageStore, type Department } from '@/app/store/manageStore';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

interface ModalProps {
  isDark: boolean;
  dept: Department | null;
  onClose: () => void;
  onSubmit: (data: Omit<Department, 'id' | 'createdAt'>) => void;
}

function DeptModal({ isDark, dept, onClose, onSubmit }: ModalProps) {
  const [name, setName] = useState(dept?.name ?? '');
  const [code, setCode] = useState(dept?.code ?? '');
  const [manager, setManager] = useState(dept?.manager ?? '');
  const [color, setColor] = useState(dept?.color ?? COLORS[0]);
  const [employeeCount, setEmployeeCount] = useState(dept?.employeeCount ?? 0);

  const inputCls = clsx('w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400');
  const labelCls = clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { notifications.show({ title: 'Validation', message: 'Name and code are required.', color: 'red' }); return; }
    onSubmit({ name: name.trim(), code: code.trim().toUpperCase(), manager: manager.trim(), color, employeeCount });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{dept ? 'Edit Department' : 'New Department'}</h2>
          <button onClick={onClose} className={clsx('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mechanical Floor" className={inputCls} autoFocus /></div>
            <div><label className={labelCls}>Code</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MECH" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Manager</label><input value={manager} onChange={e => setManager(e.target.value)} placeholder="Department manager name" className={inputCls} /></div>
          <div><label className={labelCls}>Employee Count</label><input type="number" min={0} value={employeeCount} onChange={e => setEmployeeCount(Number(e.target.value))} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={clsx('w-8 h-8 rounded-lg transition-all', color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : 'opacity-60 hover:opacity-100')} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90">{dept ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Departments() {
  const { isDark } = useThemeStore();
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useManageStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const handleSubmit = (data: Omit<Department, 'id' | 'createdAt'>) => {
    if (editing) { updateDepartment(editing.id, data); notifications.show({ title: 'Updated', message: 'Department updated', color: 'green' }); setEditing(null); }
    else { addDepartment(data); notifications.show({ title: 'Created', message: 'Department created', color: 'green' }); setModalOpen(false); }
  };

  const totalEmployees = departments.reduce((s, d) => s + d.employeeCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Departments</h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>Organize employees by department</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90"><Plus size={16} />New Department</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><Building2 size={18} /></div>
          <div><div className="text-xl font-bold" style={{ color: '#6366f1' }}>{departments.length}</div><div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Departments</div></div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Users size={18} /></div>
          <div><div className="text-xl font-bold" style={{ color: '#10b981' }}>{totalEmployees}</div><div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Total Employees</div></div>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center text-center" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}><Building2 size={28} className="text-indigo-400" /></div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>No departments</h3>
          <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>Create departments to organize your workforce.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full text-sm">
            <thead><tr className={clsx('text-xs uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')} style={{ borderBottom: `1px solid ${border}` }}>
              {['Department', 'Code', 'Manager', 'Employees', 'Color', ''].map(h => <th key={h} className="px-5 py-3.5 text-left font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} style={i < departments.length - 1 ? { borderBottom: `1px solid ${border}` } : undefined}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}><Building2 size={16} style={{ color: d.color }} /></div><span className={clsx('font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{d.name}</span></div></td>
                  <td className={clsx('px-5 py-4 font-mono text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{d.code}</td>
                  <td className={clsx('px-5 py-4', isDark ? 'text-gray-400' : 'text-gray-500')}>{d.manager || '—'}</td>
                  <td className="px-5 py-4"><span className={clsx('text-xs px-2 py-1 rounded-lg', isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600')}>{d.employeeCount}</span></td>
                  <td className="px-5 py-4"><div className="w-5 h-5 rounded-md" style={{ backgroundColor: d.color }} /></td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(d)} className={clsx('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400')}><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(d)} className="p-2 rounded-lg transition-colors text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
            <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{departments.length} department{departments.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {(modalOpen || editing) && <DeptModal isDark={isDark} dept={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-400" /></div>
              <h3 className={clsx('text-base font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>Delete Department</h3>
              <p className={clsx('text-sm mb-5', isDark ? 'text-gray-500' : 'text-gray-400')}>Delete <strong>"{deleting.name}"</strong> ({deleting.employeeCount} employees)?</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setDeleting(null)} className={clsx('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600')}>Cancel</button>
                <button onClick={() => { deleteDepartment(deleting.id); notifications.show({ title: 'Deleted', message: 'Department removed', color: 'green' }); setDeleting(null); }} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
