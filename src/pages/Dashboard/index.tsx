import { Users, Clock, AlertTriangle, BarChart2, CalendarCheck, Activity } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { HoursBarChart } from '@/components/charts/HoursBarChart';
import { OvertimeLineChart } from '@/components/charts/OvertimeLineChart';
import { PunchDonutChart } from '@/components/charts/PunchDonutChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import ClockInOutCard from '@/components/shared/ClockInOutCard';
import {
  useDashboardMetrics,
  useHoursBarData,
  useOvertimeLineData,
  usePunchDonutData,
} from '@/services/hooks/useMetrics';
import { useThemeStore } from '@/app/store/themeStore';
import clsx from 'clsx';

function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  const { isDark } = useThemeStore();
  return (
    <div
      className={clsx('rounded-2xl p-5', className)}
      style={{
        backgroundColor: isDark ? 'var(--bg-card)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {title && (
        <h3
          className={clsx('text-sm font-semibold mb-4', isDark ? 'text-gray-200' : 'text-gray-700')}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function getPayPeriodLabel(): string {
  const now = new Date();
  // Bi-weekly pay period: find the Monday of the current 2-week period
  const dayOfWeek = now.getDay();
  const mondayOffset = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export default function Dashboard() {
  const { isDark } = useThemeStore();
  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics();
  const { data: hoursBar, isLoading: hoursLoading } = useHoursBarData();
  const { data: overtimeLine, isLoading: overtimeLoading } = useOvertimeLineData();
  const { data: donutData, isLoading: donutLoading } = usePunchDonutData();

  const kpis = [
    {
      label: 'Total Workers',
      value: metrics?.totalEmployees ?? 0,
      icon: <Users size={18} />,
      color: '#6366f1',
      bgColor: 'rgba(99,102,241,0.15)',
      delay: 0,
    },
    {
      label: 'Clocked In',
      value: metrics?.punchedInCount ?? 0,
      icon: <Activity size={18} />,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.15)',
      delay: 100,
    },
    {
      label: 'Open Records',
      value: metrics?.missedPunches ?? 0,
      icon: <AlertTriangle size={18} />,
      color: '#ef4444',
      bgColor: 'rgba(239,68,68,0.15)',
      delay: 200,
    },
    {
      label: 'Hours This Week',
      value: metrics?.hoursThisWeek ?? 0,
      icon: <Clock size={18} />,
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.15)',
      suffix: 'hrs',
      isDecimal: true,
      delay: 300,
    },
    {
      label: 'Approaching OT',
      value: metrics?.approachingOvertime ?? 0,
      icon: <BarChart2 size={18} />,
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.15)',
      delay: 400,
    },
    {
      label: 'Active Shifts',
      value: metrics?.devicesOnline ?? 0,
      icon: <CalendarCheck size={18} />,
      color: '#3b82f6',
      bgColor: 'rgba(59,130,246,0.15)',
      delay: 500,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Dashboard
          </h1>
          <p className={clsx('text-sm mt-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Week: {getPayPeriodLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="pulse-dot" />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Live</span>
        </div>
      </div>

      {/* Error state */}
      {metricsError && (
        <ErrorState message="Failed to load dashboard data. Check that the backend is running." />
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) =>
          metricsLoading ? (
            <div
              key={kpi.label}
              className="rounded-2xl p-5 h-28 shimmer"
              style={{ backgroundColor: isDark ? 'var(--bg-card)' : '#fff' }}
            />
          ) : (
            <KPICard key={kpi.label} {...kpi} />
          )
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hours by Day */}
        <div className="lg:col-span-2">
          <SectionCard title="Hours Breakdown — This Week">
            {hoursLoading ? (
              <div className="h-60 shimmer rounded-xl" />
            ) : (hoursBar ?? []).length === 0 ? (
              <EmptyState description="No clock records this week yet." />
            ) : (
              <HoursBarChart data={hoursBar ?? []} />
            )}
          </SectionCard>
        </div>

        {/* Punch Distribution Donut */}
        <SectionCard title="Who is IN / OUT">
          {donutLoading ? (
            <div className="h-60 shimmer rounded-xl" />
          ) : (
            <>
              <PunchDonutChart data={donutData ?? []} />
              <div className="flex gap-4 justify-center mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Clocked In: {metrics?.punchedInCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className={clsx('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Clocked Out: {metrics?.punchedOutCount ?? 0}
                  </span>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Overtime trend + Clock In/Out */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overtime trend */}
        <div className="lg:col-span-2">
          <SectionCard title="Hours Trend — Last 14 Days">
            {overtimeLoading ? (
              <div className="h-60 shimmer rounded-xl" />
            ) : (
              <OvertimeLineChart data={overtimeLine ?? []} />
            )}
          </SectionCard>
        </div>

        {/* Clock In / Out */}
        <SectionCard title="Clock In / Out">
          <ClockInOutCard />
        </SectionCard>
      </div>

      {/* Open Clock Records Alert */}
      {(metrics?.missedPunches ?? 0) > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <span className={clsx('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>
            <strong>{metrics?.missedPunches} workers</strong> have open clock records (clocked in without clocking out).
            Review the{' '}
            <a href="/punches" className="underline hover:no-underline">
              Punch Records
            </a>{' '}
            page.
          </span>
        </div>
      )}
    </div>
  );
}
