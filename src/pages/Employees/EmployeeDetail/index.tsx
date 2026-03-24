import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Building, Globe, Briefcase, Calendar,
  Clock, DollarSign, Pencil, Trash2, Save, X, Loader2, User,
  FileText, Hash, BarChart3,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useThemeStore } from '@/app/store/themeStore';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';
import client, { unwrap } from '@/services/api/client';

interface BackendWorker {
  id: number;
  base_id: string;
  name: string;
  picture_url: string | null;
  resume_url: string | null;
  salary_type: 'hourly' | 'percentage' | 'flat';
  position: string;
  language: string;
  created_at: string;
  updated_at: string;
}

interface ClockRecord {
  id: number;
  clock_in: string;
  clock_out: string | null;
}

function buildDailyHours(records: ClockRecord[]): { day: string; hours: number; overtime: number }[] {
  const now = new Date();
  const days: { day: string; hours: number; overtime: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    let totalH = 0;
    for (const r of records) {
      const inDate = r.clock_in.slice(0, 10);
      if (inDate === dateKey && r.clock_out) {
        totalH += (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000;
      }
    }
    const regular = Math.min(totalH, 8);
    const ot = Math.max(0, totalH - 8);
    days.push({ day: label, hours: parseFloat(regular.toFixed(1)), overtime: parseFloat(ot.toFixed(1)) });
  }
  return days;
}

function InfoRow({ icon, label, value, isDark }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
      <div className="text-gray-500 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{label}</div>
        <div className={clsx('text-sm font-medium mt-0.5', isDark ? 'text-gray-200' : 'text-gray-700')}>{value}</div>
      </div>
    </div>
  );
}

const SALARY_COLORS: Record<string, { bg: string; text: string }> = {
  hourly: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  percentage: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  flat: { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
};

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', language: '', salary_type: 'hourly' as string, base_id: '' });
  const [showDelete, setShowDelete] = useState(false);

  const cardStyle = {
    backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  };
  const inputCls = clsx(
    'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all',
    isDark
      ? 'bg-white/5 text-gray-200 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-indigo-400',
  );
  const labelCls = clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500');
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const { data: worker, isLoading, isError } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => unwrap<BackendWorker>(client.get(`/workers/${id}`)),
    enabled: !!id,
  });

  // Fetch clock records for this worker (last 7 days)
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: clockRecords = [] } = useQuery({
    queryKey: ['clock-records', id],
    queryFn: () => unwrap<ClockRecord[]>(client.get('/clock/records', { params: { worker_id: id, from: sevenDaysAgo } })),
    enabled: !!id,
  });

  const chartData = useMemo(() => buildDailyHours(clockRecords), [clockRecords]);

  const updateMut = useMutation({
    mutationFn: (payload: Partial<BackendWorker>) => unwrap(client.put(`/workers/${id}`, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditing(false);
      notifications.show({ title: 'Updated', message: 'Employee updated successfully', color: 'green' });
    },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });

  const deleteMut = useMutation({
    mutationFn: () => unwrap(client.delete(`/workers/${id}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      notifications.show({ title: 'Deleted', message: 'Employee removed', color: 'green' });
      navigate('/employees');
    },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });

  const startEdit = () => {
    if (!worker) return;
    setForm({ name: worker.name, position: worker.position, language: worker.language, salary_type: worker.salary_type, base_id: worker.base_id });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!form.name.trim()) { notifications.show({ title: 'Required', message: 'Name is required', color: 'red' }); return; }
    updateMut.mutate({ name: form.name.trim(), position: form.position, language: form.language, salary_type: form.salary_type as BackendWorker['salary_type'], base_id: form.base_id });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // Error / Not found
  if (isError || !worker) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/employees')} className={clsx('flex items-center gap-2 text-sm', isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}>
          <ArrowLeft size={16} /> Back to Employees
        </button>
        <div className="rounded-2xl p-12 flex flex-col items-center text-center" style={cardStyle}>
          <User size={32} className="text-gray-500 mb-3" />
          <h3 className={clsx('text-lg font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>Employee not found</h3>
          <p className={clsx('text-sm mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>The employee you're looking for doesn't exist or was removed.</p>
        </div>
      </div>
    );
  }

  const nameParts = worker.name.split(' ');
  const initials = nameParts.map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'user'}@eztruckrepair.com`;
  const salaryColor = SALARY_COLORS[worker.salary_type] || SALARY_COLORS.hourly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/employees')}
          className={clsx('p-2 rounded-xl transition-colors flex-shrink-0', isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900')}
          style={{ border: `1px solid ${border}` }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            {worker.name}
          </h1>
          <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Employee Profile — {worker.base_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button onClick={startEdit} className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors', isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 transition-colors" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={cardStyle}>
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-white text-3xl font-bold shadow-glow">
              {initials}
            </div>

            {/* Name + role */}
            <div className="text-center">
              <div className={clsx('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>{worker.name}</div>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                  <Briefcase size={11} />
                  {worker.position}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <div className="w-full">
              <InfoRow isDark={isDark} icon={<Hash size={14} />} label="Base ID" value={worker.base_id} />
              <InfoRow isDark={isDark} icon={<Mail size={14} />} label="Email" value={email} />
              <InfoRow isDark={isDark} icon={<Globe size={14} />} label="Language" value={worker.language} />
              <InfoRow isDark={isDark} icon={<DollarSign size={14} />} label="Salary Type" value={worker.salary_type.charAt(0).toUpperCase() + worker.salary_type.slice(1)} />
              <InfoRow isDark={isDark} icon={<Calendar size={14} />} label="Joined" value={new Date(worker.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className={clsx('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Quick Info
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Position', value: worker.position, color: '#6366f1' },
                { label: 'Salary Type', value: worker.salary_type, color: salaryColor.text },
                { label: 'Language', value: worker.language, color: '#10b981' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{stat.label}</span>
                  <span className="text-sm font-semibold capitalize" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className={clsx('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
              Documents
            </h3>
            {worker.resume_url ? (
              <a href={worker.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                <FileText size={14} /> View Resume
              </a>
            ) : (
              <p className={clsx('text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>No documents uploaded</p>
            )}
          </div>
        </div>

        {/* Right: Edit form or info panels */}
        <div className="lg:col-span-2 space-y-5">
          {editing ? (
            /* ---- Edit Form ---- */
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={clsx('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                  Edit Employee
                </h3>
                <button onClick={() => setEditing(false)} className={clsx('p-1.5 rounded-lg', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Base ID</label>
                  <input value={form.base_id} onChange={e => setForm(p => ({ ...p, base_id: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Position</label>
                  <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Mechanical Floor" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Language</label>
                  <input value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Salary Type</label>
                  <select value={form.salary_type} onChange={e => setForm(p => ({ ...p, salary_type: e.target.value }))} className={inputCls}>
                    <option value="hourly">Hourly</option>
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setEditing(false)} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')}>Cancel</button>
                <button onClick={saveEdit} disabled={updateMut.isPending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                  {updateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* ---- Info Panels ---- */
            <>
              {/* Employment details */}
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className={clsx('text-sm font-semibold mb-5', isDark ? 'text-gray-200' : 'text-gray-700')}>
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Position', value: worker.position, icon: <Building size={16} />, color: '#6366f1' },
                    { label: 'Salary Type', value: worker.salary_type, icon: <DollarSign size={16} />, color: salaryColor.text },
                    { label: 'Language', value: worker.language, icon: <Globe size={16} />, color: '#10b981' },
                    { label: 'Base ID', value: worker.base_id, icon: <Hash size={16} />, color: '#f59e0b' },
                    { label: 'Joined', value: new Date(worker.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: <Calendar size={16} />, color: '#3b82f6' },
                    { label: 'Last Updated', value: new Date(worker.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: <Clock size={16} />, color: '#8b5cf6' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-4" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: item.color }}>{item.icon}</span>
                        <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{item.label}</span>
                      </div>
                      <div className={clsx('text-sm font-semibold capitalize', isDark ? 'text-gray-200' : 'text-gray-800')}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h3 className={clsx('text-sm font-semibold mb-5', isDark ? 'text-gray-200' : 'text-gray-700')}>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                      <Mail size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Email</div>
                      <div className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>{email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                      <Phone size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Phone</div>
                      <div className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>Not provided</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours Chart */}
              <div className="rounded-2xl p-6" style={cardStyle}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-400" />
                    <h3 className={clsx('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      Working Hours — Last 7 Days
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />
                      <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Regular</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                      <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Overtime</span>
                    </div>
                  </div>
                </div>

                {chartData.every(d => d.hours === 0 && d.overtime === 0) ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <BarChart3 size={28} className={clsx('mb-2', isDark ? 'text-gray-600' : 'text-gray-300')} />
                    <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>No clock records in the last 7 days</p>
                  </div>
                ) : (
                  <>
                    {/* Summary row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {(() => {
                        const totalReg = chartData.reduce((s, d) => s + d.hours, 0);
                        const totalOt = chartData.reduce((s, d) => s + d.overtime, 0);
                        const daysWorked = chartData.filter(d => d.hours > 0 || d.overtime > 0).length;
                        return [
                          { label: 'Total Hours', value: `${(totalReg + totalOt).toFixed(1)}h`, color: '#6366f1' },
                          { label: 'Overtime', value: `${totalOt.toFixed(1)}h`, color: '#f59e0b' },
                          { label: 'Days Worked', value: `${daysWorked} / 7`, color: '#10b981' },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                            <div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{s.label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Chart */}
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: string) => v.split(',')[0] || v.split(' ').slice(0, 2).join(' ')}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `${v}h`}
                            domain={[0, 'auto']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#1a1d2e' : '#fff',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            formatter={(value: unknown, name: unknown) => [`${value}h`, name === 'hours' ? 'Regular' : 'Overtime']}
                            labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 4 }}
                          />
                          <Bar dataKey="hours" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} name="Regular" />
                          <Bar dataKey="overtime" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Overtime" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-400" /></div>
              <h3 className={clsx('text-base font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>Delete Employee</h3>
              <p className={clsx('text-sm mb-5', isDark ? 'text-gray-500' : 'text-gray-400')}>
                Delete <strong>"{worker.name}"</strong>? This will remove all associated records.
              </p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setShowDelete(false)} className={clsx('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>Cancel</button>
                <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                  {deleteMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
