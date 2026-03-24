import { useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useManageStore, type Job } from '@/app/store/manageStore';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';

interface ModalProps {
  isDark: boolean;
  job: Job | null;
  departments: string[];
  onClose: () => void;
  onSubmit: (data: Omit<Job, 'id' | 'createdAt'>) => void;
}

function JobModal({ isDark, job, departments, onClose, onSubmit }: ModalProps) {
  const [name, setName] = useState(job?.name ?? '');
  const [code, setCode] = useState(job?.code ?? '');
  const [department, setDepartment] = useState(job?.department ?? '');
  const [description, setDescription] = useState(job?.description ?? '');
  const [isActive, setIsActive] = useState(job?.isActive ?? true);

  const inputCls = clsx('w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400');
  const labelCls = clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { notifications.show({ title: 'Validation', message: 'Name and code required.', color: 'red' }); return; }
    onSubmit({ name: name.trim(), code: code.trim().toUpperCase(), department, description: description.trim(), isActive });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{job ? 'Edit Job' : 'New Job'}</h2>
          <button onClick={onClose} className={clsx('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Work" className={inputCls} autoFocus /></div>
            <div><label className={labelCls}>Code</label><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MW" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className={inputCls}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this job involves..." className={clsx(inputCls, 'resize-none h-20')} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
            <span className={clsx('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100')}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90">{job ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { isDark } = useThemeStore();
  const { jobs, departments, addJob, updateJob, deleteJob } = useManageStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const deptNames = [...new Set(departments.map(d => d.name))];

  let filtered = jobs;
  if (statusFilter === 'active') filtered = filtered.filter(j => j.isActive);
  if (statusFilter === 'inactive') filtered = filtered.filter(j => !j.isActive);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(j => j.name.toLowerCase().includes(q) || j.code.toLowerCase().includes(q) || j.department.toLowerCase().includes(q));
  }

  const handleSubmit = (data: Omit<Job, 'id' | 'createdAt'>) => {
    if (editing) { updateJob(editing.id, data); notifications.show({ title: 'Updated', message: 'Job updated', color: 'green' }); setEditing(null); }
    else { addJob(data); notifications.show({ title: 'Created', message: 'Job created', color: 'green' }); setModalOpen(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Jobs</h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>Manage job codes for time tracking</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90"><Plus size={16} />New Job</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
            className={clsx('w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all',
              isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
                : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400')} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
          {(['all', 'active', 'inactive'] as const).map(o => (
            <button key={o} onClick={() => setStatusFilter(o)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', statusFilter === o ? 'bg-indigo-500/20 text-indigo-300' : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
              {o}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center text-center" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}><Briefcase size={28} className="text-indigo-400" /></div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>{search || statusFilter !== 'all' ? 'No jobs match' : 'No jobs created'}</h3>
          <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>Create job codes to categorize employee work time.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full text-sm">
            <thead><tr className={clsx('text-xs uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')} style={{ borderBottom: `1px solid ${border}` }}>
              {['Job', 'Code', 'Department', 'Status', 'Description', ''].map(h => <th key={h} className="px-5 py-3.5 text-left font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((j, i) => (
                <tr key={j.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} style={i < filtered.length - 1 ? { borderBottom: `1px solid ${border}` } : undefined}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}><Briefcase size={16} className="text-indigo-400" /></div>
                    <span className={clsx('font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{j.name}</span>
                  </div></td>
                  <td className={clsx('px-5 py-4 font-mono text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{j.code}</td>
                  <td className="px-5 py-4"><span className={clsx('text-xs px-2 py-1 rounded-lg', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}>{j.department || 'All'}</span></td>
                  <td className="px-5 py-4">
                    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      j.isActive ? 'text-emerald-400' : 'text-gray-400')} style={{ backgroundColor: j.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)' }}>
                      <span className={clsx('w-1.5 h-1.5 rounded-full', j.isActive ? 'bg-emerald-400' : 'bg-gray-400')} />
                      {j.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={clsx('px-5 py-4 max-w-[200px] truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>{j.description || '—'}</td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(j)} className={clsx('p-2 rounded-lg', isDark ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400')}><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(j)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
            <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{filtered.length} job{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {(modalOpen || editing) && <JobModal isDark={isDark} job={editing} departments={deptNames} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-400" /></div>
              <h3 className={clsx('text-base font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>Delete Job</h3>
              <p className={clsx('text-sm mb-5', isDark ? 'text-gray-500' : 'text-gray-400')}>Delete <strong>"{deleting.name}"</strong> ({deleting.code})?</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setDeleting(null)} className={clsx('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600')}>Cancel</button>
                <button onClick={() => { deleteJob(deleting.id); notifications.show({ title: 'Deleted', message: 'Job removed', color: 'green' }); setDeleting(null); }} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
