import { useState } from 'react';
import { Wifi, WifiOff, Plus, Pencil, Trash2, X, Loader2, Monitor, Smartphone, Fingerprint, Wrench } from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useManageStore, type Device } from '@/app/store/manageStore';
import { notifications } from '@mantine/notifications';
import clsx from 'clsx';

const DEVICE_TYPES = ['biometric', 'kiosk', 'mobile'] as const;
const STATUS_OPTIONS = ['all', 'online', 'offline', 'maintenance'] as const;

const STATUS_COLORS: Record<Device['status'], { bg: string; text: string; dot: string }> = {
  online: { bg: 'rgba(34,197,94,0.12)', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  offline: { bg: 'rgba(107,114,128,0.12)', text: 'text-gray-400', dot: 'bg-gray-400' },
  maintenance: { bg: 'rgba(245,158,11,0.12)', text: 'text-amber-400', dot: 'bg-amber-400' },
};

const TYPE_ICON: Record<Device['type'], React.ReactNode> = {
  biometric: <Fingerprint size={16} className="text-indigo-400" />,
  kiosk: <Monitor size={16} className="text-blue-400" />,
  mobile: <Smartphone size={16} className="text-emerald-400" />,
};

function StatusBadge({ status }: { status: Device['status'] }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize', c.text)} style={{ backgroundColor: c.bg }}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  );
}

interface ModalProps {
  isDark: boolean;
  device: Device | null;
  onClose: () => void;
  onSubmit: (data: Omit<Device, 'id' | 'createdAt'>) => void;
}

function DeviceModal({ isDark, device, onClose, onSubmit }: ModalProps) {
  const [name, setName] = useState(device?.name ?? '');
  const [serial, setSerial] = useState(device?.serial ?? '');
  const [type, setType] = useState<Device['type']>(device?.type ?? 'biometric');
  const [location, setLocation] = useState(device?.location ?? '');
  const [status, setStatus] = useState<Device['status']>(device?.status ?? 'online');

  const inputCls = clsx('w-full px-3 py-2 rounded-xl text-sm outline-none transition-all',
    isDark ? 'bg-white/5 text-gray-200 placeholder-gray-600 border border-white/8 focus:border-indigo-500/50'
      : 'bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 focus:border-indigo-400');
  const labelCls = clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serial.trim()) {
      notifications.show({ title: 'Validation', message: 'Name and serial are required.', color: 'red' });
      return;
    }
    onSubmit({ name: name.trim(), serial: serial.trim(), type, location: location.trim(), status, lastSeen: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{device ? 'Edit Device' : 'Add Device'}</h2>
          <button onClick={onClose} className={clsx('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Device Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Entrance" className={inputCls} autoFocus /></div>
          <div><label className={labelCls}>Serial Number</label><input value={serial} onChange={e => setSerial(e.target.value)} placeholder="e.g. BIO-002" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Type</label>
              <select value={type} onChange={e => setType(e.target.value as Device['type'])} className={inputCls}>
                {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Device['status'])} className={inputCls}>
                <option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option>
              </select></div>
          </div>
          <div><label className={labelCls}>Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Gate" className={inputCls} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={clsx('px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity">{device ? 'Save' : 'Add Device'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Devices() {
  const { isDark } = useThemeStore();
  const { devices, addDevice, updateDevice, deleteDevice } = useManageStore();
  const [filter, setFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);

  const cardBg = isDark ? 'var(--bg-card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const filtered = filter === 'all' ? devices : devices.filter(d => d.status === filter);

  const handleSubmit = (data: Omit<Device, 'id' | 'createdAt'>) => {
    if (editing) { updateDevice(editing.id, data); notifications.show({ title: 'Updated', message: 'Device updated', color: 'green' }); setEditing(null); }
    else { addDevice(data); notifications.show({ title: 'Added', message: 'Device added', color: 'green' }); setModalOpen(false); }
  };

  const confirmDelete = () => {
    if (deleting) { deleteDevice(deleting.id); notifications.show({ title: 'Deleted', message: 'Device removed', color: 'green' }); setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Devices</h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>Manage clock-in devices and terminals</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white gradient-bg hover:opacity-90 transition-opacity"><Plus size={16} />Add Device</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online', value: devices.filter(d => d.status === 'online').length, color: '#10b981', icon: <Wifi size={18} /> },
          { label: 'Offline', value: devices.filter(d => d.status === 'offline').length, color: '#6b7280', icon: <WifiOff size={18} /> },
          { label: 'Maintenance', value: devices.filter(d => d.status === 'maintenance').length, color: '#f59e0b', icon: <Wrench size={18} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div><div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div><div className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
        {STATUS_OPTIONS.map(o => (
          <button key={o} onClick={() => setFilter(o)} className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', filter === o ? 'bg-indigo-500/20 text-indigo-300' : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
            {o === 'all' ? 'All' : o}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center text-center" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}><Monitor size={28} className="text-indigo-400" /></div>
          <h3 className={clsx('text-lg font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-700')}>No devices found</h3>
          <p className={clsx('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>Add a device to start tracking clock-ins.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full text-sm">
            <thead><tr className={clsx('text-xs uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')} style={{ borderBottom: `1px solid ${border}` }}>
              {['Device', 'Serial', 'Type', 'Location', 'Status', ''].map(h => <th key={h} className="px-5 py-3.5 text-left font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} style={i < filtered.length - 1 ? { borderBottom: `1px solid ${border}` } : undefined}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>{TYPE_ICON[d.type]}</div><span className={clsx('font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{d.name}</span></div></td>
                  <td className={clsx('px-5 py-4 font-mono text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{d.serial}</td>
                  <td className="px-5 py-4"><span className={clsx('text-xs px-2 py-1 rounded-lg capitalize', isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500')}>{d.type}</span></td>
                  <td className={clsx('px-5 py-4', isDark ? 'text-gray-400' : 'text-gray-500')}>{d.location}</td>
                  <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(d)} className={clsx('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-white/5 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400')}><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(d)} className="p-2 rounded-lg transition-colors text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
            <span className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{filtered.length} device{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {(modalOpen || editing) && <DeviceModal isDark={isDark} device={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-400" /></div>
              <h3 className={clsx('text-base font-semibold mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>Delete Device</h3>
              <p className={clsx('text-sm mb-5', isDark ? 'text-gray-500' : 'text-gray-400')}>Delete <strong>"{deleting.name}"</strong>? This cannot be undone.</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setDeleting(null)} className={clsx('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
