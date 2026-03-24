import { useThemeStore } from '@/app/store/themeStore';
import clsx from 'clsx';

export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}

export function InputField({ label, value, onChange, type = 'text', hint }: InputFieldProps) {
  const { isDark } = useThemeStore();
  return (
    <div>
      <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all',
          isDark
            ? 'bg-white/5 text-gray-200 border border-white/8 focus:border-indigo-500/50'
            : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-indigo-400'
        )}
      />
      {hint && <p className={clsx('text-xs mt-1', isDark ? 'text-gray-600' : 'text-gray-400')}>{hint}</p>}
    </div>
  );
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  const { isDark } = useThemeStore();
  return (
    <div>
      <label className={clsx('block text-xs font-medium mb-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all',
          isDark
            ? 'bg-white/5 text-gray-200 border border-white/8 focus:border-indigo-500/50'
            : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-indigo-400'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <p className={clsx('text-xs mt-1', isDark ? 'text-gray-600' : 'text-gray-400')}>{hint}</p>}
    </div>
  );
}

export interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  const { isDark } = useThemeStore();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className={clsx('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-700')}>{label}</div>
        {description && <div className={clsx('text-xs mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
          checked ? 'bg-indigo-500' : isDark ? 'bg-white/10' : 'bg-gray-200'
        )}
      >
        <span
          className={clsx(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked ? 'left-5' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();
  return (
    <h3 className={clsx('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}>
      {children}
    </h3>
  );
}

export function Divider() {
  const { isDark } = useThemeStore();
  return <div className="my-5" style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />;
}
