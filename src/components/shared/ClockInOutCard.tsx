import { useState, useMemo } from "react";
import { LogIn, LogOut, Users } from "lucide-react";
import { useThemeStore } from "@/app/store/themeStore";
import { useClockStatus } from "@/services/hooks/useMetrics";
import clsx from "clsx";

type ClockFilter = "all" | "clocked-in" | "clocked-out";

const FILTERS: { value: ClockFilter; label: string; icon: typeof Users; activeColor: string; activeBg: string }[] = [
  { value: "all", label: "All", icon: Users, activeColor: "#6366f1", activeBg: "rgba(99,102,241,0.15)" },
  { value: "clocked-in", label: "In", icon: LogIn, activeColor: "#10b981", activeBg: "rgba(16,185,129,0.15)" },
  { value: "clocked-out", label: "Out", icon: LogOut, activeColor: "#8b5cf6", activeBg: "rgba(139,92,246,0.15)" },
];

export default function ClockInOutCard() {
  const { isDark } = useThemeStore();
  const [filter, setFilter] = useState<ClockFilter>("all");
  const { data: workers = [], isLoading } = useClockStatus();

  const filtered = useMemo(() => {
    if (filter === "clocked-in") return workers.filter((w) => w.is_clocked_in);
    if (filter === "clocked-out") return workers.filter((w) => !w.is_clocked_in);
    return workers;
  }, [filter, workers]);

  const inCount = workers.filter((w) => w.is_clocked_in).length;
  const outCount = workers.length - inCount;

  const countMap: Record<ClockFilter, number> = {
    all: workers.length,
    "clocked-in": inCount,
    "clocked-out": outCount,
  };

  if (isLoading) {
    return <div className="h-64 shimmer rounded-xl" />;
  }

  return (
    <>
      {/* Segmented filter */}
      <div
        className="flex rounded-xl p-1 mb-4 gap-1"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
        }}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                isActive
                  ? "shadow-sm"
                  : "text-gray-500 hover:text-gray-300",
              )}
              style={
                isActive
                  ? {
                      backgroundColor: f.activeBg,
                      color: f.activeColor,
                      boxShadow: `0 1px 3px ${f.activeBg}`,
                    }
                  : undefined
              }
            >
              <Icon size={11} />
              {f.label}
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  isActive
                    ? "bg-white/15"
                    : isDark ? "bg-white/5" : "bg-black/5",
                )}
              >
                {countMap[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Worker list */}
      <div
        className="divide-y overflow-y-auto max-h-64 scrollbar-thin pr-1"
        style={{
          "--tw-divide-color": isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.05)",
        } as React.CSSProperties}
      >
        {filtered.length === 0 && (
          <div className={clsx("text-center py-6 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
            No workers found
          </div>
        )}
        {filtered.map((worker) => {
          const isIn = worker.is_clocked_in;
          const initials = worker.name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div key={worker.id} className="flex items-center gap-3 py-2.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {initials}
              </div>

              {/* Name + position */}
              <div className="flex-1 min-w-0">
                <div
                  className={clsx(
                    "text-xs font-medium truncate",
                    isDark ? "text-gray-200" : "text-gray-800",
                  )}
                >
                  {worker.name}
                </div>
                <div className={clsx("text-[10px] mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
                  {worker.position}
                </div>
              </div>

              {/* Clock status */}
              <div
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0",
                  isIn
                    ? "bg-emerald-500/12 text-emerald-400"
                    : "bg-indigo-500/12 text-indigo-400",
                )}
              >
                {isIn ? <LogIn size={10} /> : <LogOut size={10} />}
                {isIn ? "In" : "Out"}
              </div>

              {/* Hours */}
              <div className="text-right flex-shrink-0">
                <div
                  className={clsx(
                    "text-xs font-semibold",
                    isDark ? "text-gray-300" : "text-gray-700",
                  )}
                >
                  {worker.weekly_hours.toFixed(1)}h
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <button
        className="w-full mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1"
        onClick={() => window.location.href = '/employees'}
      >
        View all employees &rarr;
      </button>
    </>
  );
}
