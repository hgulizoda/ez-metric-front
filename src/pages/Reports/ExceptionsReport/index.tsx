import { useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Clock, Download, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useThemeStore } from "@/app/store/themeStore";
import { MOCK_PUNCHES } from "@/services/api/punches";
import { groupByDate, tsToMinutes } from "@/utils/punch";
import type { Department } from "@/types";

type ExceptionType = "late-arrival" | "early-departure" | "early-clock-in" | "long-break";

interface ExceptionRecord {
  id: string;
  employeeName: string;
  department: Department;
  date: string;
  type: ExceptionType;
  time: string;
  deviation: string;
  severity: "warning" | "critical";
}

const SHIFT_START = 7 * 60; // 7:00 AM in minutes
const SHIFT_END = 15 * 60 + 30; // 3:30 PM
const OFFICE_START = 8 * 60; // 8:00 AM
const OFFICE_END = 17 * 60; // 5:00 PM

const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  "late-arrival": "Late Arrival",
  "early-departure": "Early Departure",
  "early-clock-in": "Early Clock-In",
  "long-break": "Long Break",
};

const EXCEPTION_COLORS: Record<ExceptionType, string> = {
  "late-arrival": "#ef4444",
  "early-departure": "#f59e0b",
  "early-clock-in": "#8b5cf6",
  "long-break": "#3b82f6",
};

function findExceptions(): ExceptionRecord[] {
  const exceptions: ExceptionRecord[] = [];
  let idCounter = 1;

  const byEmp: Record<string, typeof MOCK_PUNCHES> = {};
  MOCK_PUNCHES.forEach((p) => {
    if (!byEmp[p.employeeName]) byEmp[p.employeeName] = [];
    byEmp[p.employeeName].push(p);
  });

  Object.entries(byEmp).forEach(([name, records]) => {
    const dept = records[0].department;
    const shiftStart = dept === "Office" ? OFFICE_START : SHIFT_START;
    const shiftEnd = dept === "Office" ? OFFICE_END : SHIFT_END;
    const byDate = groupByDate(records);

    Object.entries(byDate).forEach(([date, dayRecs]) => {
      const sorted = [...dayRecs].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const firstIn = sorted.find((r) => r.type === "IN");
      const lastOut = [...sorted].reverse().find((r) => r.type === "OUT");

      if (firstIn) {
        const arrMin = tsToMinutes(firstIn.timestamp);
        if (arrMin > shiftStart + 5) {
          const diff = arrMin - shiftStart;
          exceptions.push({
            id: `exc-${idCounter++}`,
            employeeName: name,
            department: dept,
            date,
            type: "late-arrival",
            time: firstIn.time,
            deviation: `+${diff} min`,
            severity: diff > 15 ? "critical" : "warning",
          });
        }
        if (arrMin < shiftStart - 15) {
          const diff = shiftStart - arrMin;
          exceptions.push({
            id: `exc-${idCounter++}`,
            employeeName: name,
            department: dept,
            date,
            type: "early-clock-in",
            time: firstIn.time,
            deviation: `-${diff} min`,
            severity: "warning",
          });
        }
      }

      if (lastOut) {
        const depMin = tsToMinutes(lastOut.timestamp);
        if (depMin < shiftEnd - 10) {
          const diff = shiftEnd - depMin;
          exceptions.push({
            id: `exc-${idCounter++}`,
            employeeName: name,
            department: dept,
            date,
            type: "early-departure",
            time: lastOut.time,
            deviation: `-${diff} min`,
            severity: diff > 30 ? "critical" : "warning",
          });
        }
      }
    });
  });

  return exceptions.sort((a, b) => b.date.localeCompare(a.date));
}

export default function ExceptionsReport() {
  const { isDark } = useThemeStore();
  const [filterType, setFilterType] = useState<ExceptionType | "all">("all");
  const cardBg = isDark ? "var(--bg-card)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  const allExceptions = findExceptions();
  const exceptions =
    filterType === "all"
      ? allExceptions
      : allExceptions.filter((e) => e.type === filterType);

  const typeCounts = (["late-arrival", "early-departure", "early-clock-in", "long-break"] as ExceptionType[]).map(
    (t) => ({
      type: EXCEPTION_LABELS[t],
      count: allExceptions.filter((e) => e.type === t).length,
      color: EXCEPTION_COLORS[t],
    })
  );

  const criticalCount = allExceptions.filter((e) => e.severity === "critical").length;
  const warningCount = allExceptions.filter((e) => e.severity === "warning").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Exceptions", value: allExceptions.length, color: "#f59e0b" },
          { label: "Critical", value: criticalCount, color: "#ef4444" },
          { label: "Warnings", value: warningCount, color: "#f59e0b" },
          {
            label: "Employees",
            value: [...new Set(allExceptions.map((e) => e.employeeName))].length,
            color: "#6366f1",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
          >
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className={clsx("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-400")}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <h3 className={clsx("text-sm font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
          Exceptions by Type
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={typeCounts} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="type"
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1e2130" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
              {typeCounts.map((t, i) => (
                <Cell key={i} fill={t.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table with filter */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className={clsx("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>
            Exception Records
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ExceptionType | "all")}
                className={clsx(
                  "px-2 py-1 rounded-lg text-xs outline-none transition-all",
                  isDark
                    ? "bg-white/5 text-gray-200 border border-white/8 focus:border-indigo-500/50"
                    : "bg-gray-50 text-gray-700 border border-gray-200 focus:border-indigo-400"
                )}
              >
                <option value="all">All Types</option>
                <option value="late-arrival">Late Arrival</option>
                <option value="early-departure">Early Departure</option>
                <option value="early-clock-in">Early Clock-In</option>
                <option value="long-break">Long Break</option>
              </select>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={clsx("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                <th className="text-left pb-3 font-medium">Employee</th>
                <th className="text-left pb-3 font-medium">Department</th>
                <th className="text-left pb-3 font-medium">Date</th>
                <th className="text-center pb-3 font-medium">Type</th>
                <th className="text-left pb-3 font-medium">Time</th>
                <th className="text-left pb-3 font-medium">Deviation</th>
                <th className="text-center pb-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr
                  key={ex.id}
                  className={clsx("border-t", isDark ? "border-white/5" : "border-gray-100")}
                >
                  <td className={clsx("py-2.5 font-medium", isDark ? "text-gray-200" : "text-gray-700")}>
                    {ex.employeeName}
                  </td>
                  <td className="py-2.5 text-gray-500 text-xs">{ex.department}</td>
                  <td className={clsx("py-2.5", isDark ? "text-gray-300" : "text-gray-600")}>
                    {ex.date}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${EXCEPTION_COLORS[ex.type]}20`,
                        color: EXCEPTION_COLORS[ex.type],
                      }}
                    >
                      <Clock size={10} />
                      {EXCEPTION_LABELS[ex.type]}
                    </span>
                  </td>
                  <td className={clsx("py-2.5", isDark ? "text-gray-300" : "text-gray-600")}>
                    {ex.time}
                  </td>
                  <td className={clsx("py-2.5 font-medium", isDark ? "text-gray-200" : "text-gray-700")}>
                    {ex.deviation}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: ex.severity === "critical" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                        color: ex.severity === "critical" ? "#f87171" : "#fbbf24",
                      }}
                    >
                      <AlertTriangle size={10} />
                      {ex.severity === "critical" ? "Critical" : "Warning"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exceptions.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No exceptions found for this filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}
