import { useState } from 'react';
import { Building, Clock, CreditCard, Leaf, Shield, Bell, Save, Plus, Pencil, Trash2, Users, KeyRound, X, Check } from 'lucide-react';
import { useThemeStore } from '@/app/store/themeStore';
import { useAuthStore } from '@/app/store/authStore';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { InputField, SelectField, ToggleField, SectionTitle, Divider } from '@/components/shared/FormFields';
import {
  apiGetGracePeriodRules,
  apiCreateGracePeriodRule,
  apiUpdateGracePeriodRule,
  apiDeleteGracePeriodRule,
  apiGetManagers,
  apiCreateManager,
  apiUpdateManager,
  apiDeleteManager,
  type GracePeriodRule,
  type Manager,
} from '@/services/api/settings';

const TABS = [
  { id: 'general', label: 'General', icon: <Building size={15} /> },
  { id: 'datetime', label: 'Date & Time', icon: <Clock size={15} /> },
  { id: 'payroll', label: 'Pay Policy', icon: <CreditCard size={15} /> },
  { id: 'pto', label: 'PTO Codes', icon: <Leaf size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'security', label: 'Security', icon: <Shield size={15} /> },
  { id: 'grace', label: 'Grace Periods', icon: <Clock size={15} /> },
  { id: 'managers', label: 'Managers', icon: <Users size={15} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Settings() {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // General settings state
  const [companyName, setCompanyName] = useState('EZ Truck Repair LLC');
  const [companyId, setCompanyId] = useState('43732061d');
  const [maxDailyHours, setMaxDailyHours] = useState('24');
  const [showPayRates, setShowPayRates] = useState(true);

  // Date/time state
  const [timezone, setTimezone] = useState('Eastern Time (UTC-05:00)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');

  // Pay policy state
  const [overtimeAfter, setOvertimeAfter] = useState('40');
  const [payPeriod, setPayPeriod] = useState('weekly');

  // PTO state
  const [ptoVacation, setPtoVacation] = useState(true);
  const [ptoHoliday, setPtoHoliday] = useState(true);
  const [ptoSick, setPtoSick] = useState(true);

  // Notification state
  const [emailMissed, setEmailMissed] = useState(true);
  const [emailOvertime, setEmailOvertime] = useState(true);
  const [emailPeriodEnd, setEmailPeriodEnd] = useState(false);

  // Security state
  const [autoLogout, setAutoLogout] = useState('30');
  const [requirePin, setRequirePin] = useState(false);
  const [allowAppPunch, setAllowAppPunch] = useState(true);

  // Grace period form state
  const [graceAdding, setGraceAdding] = useState(false);
  const [graceNewName, setGraceNewName] = useState('');
  const [graceNewMinutes, setGraceNewMinutes] = useState('');
  const [graceEditingId, setGraceEditingId] = useState<number | null>(null);
  const [graceEditName, setGraceEditName] = useState('');
  const [graceEditMinutes, setGraceEditMinutes] = useState('');

  // Manager form state
  const [managerAdding, setManagerAdding] = useState(false);
  const [managerNewUsername, setManagerNewUsername] = useState('');
  const [managerNewPassword, setManagerNewPassword] = useState('');
  const [managerResetId, setManagerResetId] = useState<number | null>(null);
  const [managerResetPassword, setManagerResetPassword] = useState('');

  // ── Queries ──
  const graceQuery = useQuery({
    queryKey: ['gracePeriodRules'],
    queryFn: apiGetGracePeriodRules,
    enabled: activeTab === 'grace',
  });

  const managersQuery = useQuery({
    queryKey: ['managers'],
    queryFn: apiGetManagers,
    enabled: activeTab === 'managers',
  });

  // ── Grace Period Mutations ──
  const createGraceMutation = useMutation({
    mutationFn: apiCreateGracePeriodRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gracePeriodRules'] });
      setGraceAdding(false);
      setGraceNewName('');
      setGraceNewMinutes('');
      notifications.show({ title: 'Rule Created', message: 'Grace period rule has been added.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create grace period rule.', color: 'red' });
    },
  });

  const updateGraceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; minutes_allowed?: number } }) =>
      apiUpdateGracePeriodRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gracePeriodRules'] });
      setGraceEditingId(null);
      notifications.show({ title: 'Rule Updated', message: 'Grace period rule has been updated.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to update grace period rule.', color: 'red' });
    },
  });

  const deleteGraceMutation = useMutation({
    mutationFn: apiDeleteGracePeriodRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gracePeriodRules'] });
      notifications.show({ title: 'Rule Deleted', message: 'Grace period rule has been removed.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete grace period rule.', color: 'red' });
    },
  });

  // ── Manager Mutations ──
  const createManagerMutation = useMutation({
    mutationFn: apiCreateManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      setManagerAdding(false);
      setManagerNewUsername('');
      setManagerNewPassword('');
      notifications.show({ title: 'Manager Created', message: 'New manager account has been added.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to create manager.', color: 'red' });
    },
  });

  const updateManagerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { password?: string } }) =>
      apiUpdateManager(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      setManagerResetId(null);
      setManagerResetPassword('');
      notifications.show({ title: 'Password Reset', message: 'Manager password has been updated.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to reset password.', color: 'red' });
    },
  });

  const deleteManagerMutation = useMutation({
    mutationFn: apiDeleteManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      notifications.show({ title: 'Manager Deleted', message: 'Manager account has been removed.', color: 'green' });
    },
    onError: () => {
      notifications.show({ title: 'Error', message: 'Failed to delete manager.', color: 'red' });
    },
  });

  const handleSave = () => {
    notifications.show({
      title: 'Settings Saved',
      message: 'Your settings have been updated successfully.',
      color: 'green',
    });
  };

  // ── Helper: border color ──
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const subtleBorder = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  // ── Helper: small action button ──
  const actionBtnClass = clsx(
    'p-1.5 rounded-lg transition-colors',
    isDark ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600',
  );

  const renderGeneral = () => (
    <div className="space-y-5">
      <SectionTitle>Company Information</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Company Name" value={companyName} onChange={setCompanyName} />
        <InputField label="Company ID" value={companyId} onChange={setCompanyId} hint="Assigned by Cloud Biometry. Read-only." />
      </div>
      <Divider />
      <SectionTitle>Work Hours</SectionTitle>
      <div className="max-w-xs">
        <InputField
          label="Max Daily Work Hours"
          value={maxDailyHours}
          onChange={setMaxDailyHours}
          type="number"
          hint="Amount of time from IN to when OUT punch is considered missed."
        />
      </div>
      <Divider />
      <SectionTitle>Display</SectionTitle>
      <div style={{ borderTop: `1px solid ${borderColor}` }}>
        <ToggleField
          label="Show Pay Rates"
          description="Display hourly pay rates in reports and summaries."
          checked={showPayRates}
          onChange={setShowPayRates}
        />
      </div>
    </div>
  );

  const renderDateTime = () => (
    <div className="space-y-5">
      <SectionTitle>Time Zone & Formats</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          options={[
            { value: 'Eastern Time (UTC-05:00)', label: 'Eastern Time (UTC-05:00)' },
            { value: 'Central Time (UTC-06:00)', label: 'Central Time (UTC-06:00)' },
            { value: 'Mountain Time (UTC-07:00)', label: 'Mountain Time (UTC-07:00)' },
            { value: 'Pacific Time (UTC-08:00)', label: 'Pacific Time (UTC-08:00)' },
          ]}
        />
        <SelectField
          label="Date Format"
          value={dateFormat}
          onChange={setDateFormat}
          options={[
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          ]}
        />
        <SelectField
          label="Time Format"
          value={timeFormat}
          onChange={setTimeFormat}
          options={[
            { value: '12h', label: '12-hour (AM/PM)' },
            { value: '24h', label: '24-hour' },
          ]}
        />
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-5">
      <SectionTitle>Pay Policy — PP1</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Overtime After (hours/week)"
          value={overtimeAfter}
          onChange={setOvertimeAfter}
          type="number"
        />
        <SelectField
          label="Pay Period Type"
          value={payPeriod}
          onChange={setPayPeriod}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </div>
    </div>
  );

  const renderPTO = () => (
    <div className="space-y-4">
      <SectionTitle>PTO Codes</SectionTitle>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${borderColor}` }}
      >
        {[
          { label: 'Vacation', value: ptoVacation, set: setPtoVacation, color: '#6366f1' },
          { label: 'Holiday', value: ptoHoliday, set: setPtoHoliday, color: '#10b981' },
          { label: 'Sick', value: ptoSick, set: setPtoSick, color: '#f59e0b' },
        ].map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: i > 0 ? `1px solid ${subtleBorder}` : undefined }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className={clsx('text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}>{item.label}</span>
            </div>
            <ToggleField label="" checked={item.value} onChange={item.set} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-2">
      <SectionTitle>Email Alerts</SectionTitle>
      <div style={{ borderTop: `1px solid ${borderColor}` }}>
        <ToggleField
          label="Missed Punches"
          description="Email when employees have missing IN or OUT punches."
          checked={emailMissed}
          onChange={setEmailMissed}
        />
        <ToggleField
          label="Approaching Overtime"
          description="Notify when employees exceed 38 hours in a pay period."
          checked={emailOvertime}
          onChange={setEmailOvertime}
        />
        <ToggleField
          label="Pay Period End Reminder"
          description="Remind managers to review timesheets before period closes."
          checked={emailPeriodEnd}
          onChange={setEmailPeriodEnd}
        />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <SectionTitle>Access & Authentication</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Auto-logout After"
          value={autoLogout}
          onChange={setAutoLogout}
          options={[
            { value: '15', label: '15 minutes' },
            { value: '30', label: '30 minutes' },
            { value: '60', label: '1 hour' },
            { value: '0', label: 'Never' },
          ]}
        />
      </div>
      <Divider />
      <SectionTitle>Device Security</SectionTitle>
      <div style={{ borderTop: `1px solid ${borderColor}` }}>
        <ToggleField
          label="Require PIN for Punch"
          description="Employees must enter PIN in addition to biometric verification."
          checked={requirePin}
          onChange={setRequirePin}
        />
        <ToggleField
          label="Allow App Punch"
          description="Allow employees to punch via mobile app (GPS required)."
          checked={allowAppPunch}
          onChange={setAllowAppPunch}
        />
      </div>
    </div>
  );

  const renderGracePeriods = () => {
    const rules: GracePeriodRule[] = graceQuery.data ?? [];
    const isLoading = graceQuery.isLoading;

    const handleCreate = () => {
      if (!graceNewName.trim() || !graceNewMinutes.trim()) return;
      createGraceMutation.mutate({ name: graceNewName.trim(), minutes_allowed: Number(graceNewMinutes) });
    };

    const handleUpdate = (id: number) => {
      if (!graceEditName.trim() || !graceEditMinutes.trim()) return;
      updateGraceMutation.mutate({ id, payload: { name: graceEditName.trim(), minutes_allowed: Number(graceEditMinutes) } });
    };

    const startEdit = (rule: GracePeriodRule) => {
      setGraceEditingId(rule.id);
      setGraceEditName(rule.name);
      setGraceEditMinutes(String(rule.minutes_allowed));
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionTitle>Grace Period Rules</SectionTitle>
          {!graceAdding && (
            <button
              onClick={() => setGraceAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              Add Rule
            </button>
          )}
        </div>

        {/* Add form */}
        {graceAdding && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ border: `1px solid ${borderColor}`, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Rule Name</label>
                <input
                  type="text"
                  value={graceNewName}
                  onChange={(e) => setGraceNewName(e.target.value)}
                  placeholder="e.g. Standard Grace"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500',
                  )}
                />
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Minutes Allowed</label>
                <input
                  type="number"
                  value={graceNewMinutes}
                  onChange={(e) => setGraceNewMinutes(e.target.value)}
                  placeholder="e.g. 5"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500',
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setGraceAdding(false); setGraceNewName(''); setGraceNewMinutes(''); }}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createGraceMutation.isPending || !graceNewName.trim() || !graceNewMinutes.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Check size={13} />
                {createGraceMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className={clsx('text-sm py-8 text-center', isDark ? 'text-gray-500' : 'text-gray-400')}>Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className={clsx('text-sm py-8 text-center', isDark ? 'text-gray-500' : 'text-gray-400')}>No grace period rules defined yet.</div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
            {/* Header */}
            <div
              className="grid grid-cols-[1fr_120px_140px_80px] gap-3 px-4 py-2.5"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            >
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Name</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Minutes</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Created</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider text-right', isDark ? 'text-gray-500' : 'text-gray-400')}>Actions</span>
            </div>

            {/* Rows */}
            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className="grid grid-cols-[1fr_120px_140px_80px] gap-3 px-4 py-3 items-center"
                style={{ borderTop: `1px solid ${subtleBorder}` }}
              >
                {graceEditingId === rule.id ? (
                  <>
                    <input
                      type="text"
                      value={graceEditName}
                      onChange={(e) => setGraceEditName(e.target.value)}
                      className={clsx(
                        'px-2 py-1 rounded-lg text-sm outline-none',
                        isDark
                          ? 'bg-white/5 border border-white/10 text-gray-200 focus:border-indigo-500'
                          : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-indigo-500',
                      )}
                    />
                    <input
                      type="number"
                      value={graceEditMinutes}
                      onChange={(e) => setGraceEditMinutes(e.target.value)}
                      className={clsx(
                        'px-2 py-1 rounded-lg text-sm outline-none',
                        isDark
                          ? 'bg-white/5 border border-white/10 text-gray-200 focus:border-indigo-500'
                          : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-indigo-500',
                      )}
                    />
                    <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {new Date(rule.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleUpdate(rule.id)} className={actionBtnClass} title="Save">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setGraceEditingId(null)} className={actionBtnClass} title="Cancel">
                        <X size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>{rule.name}</span>
                    <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>{rule.minutes_allowed} min</span>
                    <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {new Date(rule.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(rule)} className={actionBtnClass} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteGraceMutation.mutate(rule.id)}
                        className={clsx('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500')}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderManagers = () => {
    const managers: Manager[] = managersQuery.data ?? [];
    const isLoading = managersQuery.isLoading;

    const handleCreate = () => {
      if (!managerNewUsername.trim() || !managerNewPassword.trim()) return;
      createManagerMutation.mutate({ username: managerNewUsername.trim(), password: managerNewPassword });
    };

    const handleResetPassword = (id: number) => {
      if (!managerResetPassword.trim()) return;
      updateManagerMutation.mutate({ id, payload: { password: managerResetPassword } });
    };

    const isSelf = (managerId: number) => user && Number(user.id) === managerId;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionTitle>Manager Accounts</SectionTitle>
          {!managerAdding && (
            <button
              onClick={() => setManagerAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              Add Manager
            </button>
          )}
        </div>

        {/* Add form */}
        {managerAdding && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ border: `1px solid ${borderColor}`, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Username</label>
                <input
                  type="text"
                  value={managerNewUsername}
                  onChange={(e) => setManagerNewUsername(e.target.value)}
                  placeholder="e.g. john.smith"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500',
                  )}
                />
              </div>
              <div>
                <label className={clsx('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Password</label>
                <input
                  type="password"
                  value={managerNewPassword}
                  onChange={(e) => setManagerNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500',
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setManagerAdding(false); setManagerNewUsername(''); setManagerNewPassword(''); }}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createManagerMutation.isPending || !managerNewUsername.trim() || !managerNewPassword.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Check size={13} />
                {createManagerMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className={clsx('text-sm py-8 text-center', isDark ? 'text-gray-500' : 'text-gray-400')}>Loading managers...</div>
        ) : managers.length === 0 ? (
          <div className={clsx('text-sm py-8 text-center', isDark ? 'text-gray-500' : 'text-gray-400')}>No managers found.</div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
            {/* Header */}
            <div
              className="grid grid-cols-[1fr_100px_140px_100px] gap-3 px-4 py-2.5"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            >
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Username</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Role</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Created</span>
              <span className={clsx('text-xs font-semibold uppercase tracking-wider text-right', isDark ? 'text-gray-500' : 'text-gray-400')}>Actions</span>
            </div>

            {/* Rows */}
            {managers.map((mgr) => (
              <div key={mgr.id}>
                <div
                  className="grid grid-cols-[1fr_100px_140px_100px] gap-3 px-4 py-3 items-center"
                  style={{ borderTop: `1px solid ${subtleBorder}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>{mgr.username}</span>
                    {isSelf(mgr.id) && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">You</span>
                    )}
                  </div>
                  <span className={clsx('text-sm capitalize', isDark ? 'text-gray-400' : 'text-gray-500')}>{mgr.role}</span>
                  <span className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {new Date(mgr.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => { setManagerResetId(managerResetId === mgr.id ? null : mgr.id); setManagerResetPassword(''); }}
                      className={actionBtnClass}
                      title="Reset Password"
                    >
                      <KeyRound size={14} />
                    </button>
                    {!isSelf(mgr.id) && (
                      <button
                        onClick={() => deleteManagerMutation.mutate(mgr.id)}
                        className={clsx('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500')}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline password reset form */}
                {managerResetId === mgr.id && (
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ borderTop: `1px solid ${subtleBorder}`, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
                  >
                    <input
                      type="password"
                      value={managerResetPassword}
                      onChange={(e) => setManagerResetPassword(e.target.value)}
                      placeholder="New password"
                      className={clsx(
                        'flex-1 max-w-xs px-3 py-1.5 rounded-lg text-sm outline-none transition-colors',
                        isDark
                          ? 'bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500'
                          : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500',
                      )}
                    />
                    <button
                      onClick={() => handleResetPassword(mgr.id)}
                      disabled={updateManagerMutation.isPending || !managerResetPassword.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Check size={13} />
                      {updateManagerMutation.isPending ? 'Saving...' : 'Reset'}
                    </button>
                    <button
                      onClick={() => { setManagerResetId(null); setManagerResetPassword(''); }}
                      className={clsx('px-2 py-1.5 rounded-lg text-xs font-medium transition-colors', isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CONTENT: Record<TabId, React.ReactNode> = {
    general: renderGeneral(),
    datetime: renderDateTime(),
    payroll: renderPayroll(),
    pto: renderPTO(),
    notifications: renderNotifications(),
    security: renderSecurity(),
    grace: renderGracePeriods(),
    managers: renderManagers(),
  };

  const showSaveButton = activeTab !== 'grace' && activeTab !== 'managers';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Settings</h1>
        <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
          Manage company settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar tabs */}
        <div
          className="lg:w-52 flex-shrink-0 rounded-2xl p-2 h-fit"
          style={{
            backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5',
                activeTab === tab.id
                  ? 'gradient-bg text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div
          className="flex-1 rounded-2xl p-6"
          style={{
            backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          {CONTENT[activeTab]}

          {/* Save button — only for static settings tabs */}
          {showSaveButton && (
            <div className="flex justify-end mt-6 pt-5" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-bg text-white hover:opacity-90 transition-opacity shadow-glow"
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
