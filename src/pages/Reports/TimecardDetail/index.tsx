import { useState } from "react";
import { LogIn, LogOut, AlertTriangle, Download } from "lucide-react";
import clsx from "clsx";
import { useThemeStore } from "@/app/store/themeStore";
import { MOCK_PUNCHES } from "@/services/api/punches";
import { computePairs, groupByDate } from "@/utils/punch";

const EMPLOYEES = [...new Set(MOCK_PUNCHES.map((p) => p.employeeName))];

export default function TimecardDetail() {
  const { isDark } = useThemeStore();
  const [selectedEmp, setSelectedEmp] = useState("all");

  const cardBg = isDark ? "var(--bg-card)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const filtered =
    selectedEmp === "all"
      ? MOCK_PUNCHES
      : MOCK_PUNCHES.filter((p) => p.employeeName === selectedEmp);

  const byEmployee = filtered.reduce<Record<string, typeof MOCK_PUNCHES>>(
    (acc, p) => {
      if (!acc[p.employeeName]) acc[p.employeeName] = [];
      acc[p.employeeName].push(p);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          className={clsx(
            "px-3 py-2 rounded-xl text-sm outline-none transition-all",
            isDark
              ? "bg-white/5 text-gray-200 border border-white/8 focus:border-indigo-500/50"
              : "bg-gray-50 text-gray-700 border border-gray-200 focus:border-indigo-400"
          )}
        >
          <option value="all">All Employees</option>
          {EMPLOYEES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* Employee sections */}
      {Object.entries(byEmployee).map(([empName, records]) => {
        const byDate = groupByDate(records);
        const dept = records[0]?.department;
        let totalHours = 0;

        return (
          <div
            key={empName}
            className="rounded-2xl p-5"
            style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className={clsx(
                    "font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {empName}
                </h3>
                <span className="text-xs text-gray-500">{dept}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className={clsx(
                      "text-xs",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-left pb-3 font-medium">Time</th>
                    <th className="text-left pb-3 font-medium">Source</th>
                    <th className="text-right pb-3 font-medium">Hours</th>
                    <th className="text-center pb-3 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, dayRecs]) => {
                      const pairs = computePairs(dayRecs);
                      const dayHours = pairs.reduce(
                        (s, p) => s + (p.hours ?? 0),
                        0
                      );
                      totalHours += dayHours;

                      return dayRecs
                        .sort(
                          (a, b) =>
                            new Date(a.timestamp).getTime() -
                            new Date(b.timestamp).getTime()
                        )
                        .map((r, i) => (
                          <tr
                            key={r.id}
                            className={clsx(
                              "border-t",
                              isDark
                                ? "border-white/5"
                                : "border-gray-100"
                            )}
                          >
                            <td
                              className={clsx(
                                "py-2.5",
                                isDark ? "text-gray-300" : "text-gray-700"
                              )}
                            >
                              {i === 0 ? date : ""}
                            </td>
                            <td className="py-2.5">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={
                                  r.type === "IN"
                                    ? {
                                        backgroundColor:
                                          "rgba(16,185,129,0.12)",
                                        color: "#34d399",
                                      }
                                    : {
                                        backgroundColor:
                                          "rgba(99,102,241,0.12)",
                                        color: "#818cf8",
                                      }
                                }
                              >
                                {r.type === "IN" ? (
                                  <LogIn size={10} />
                                ) : (
                                  <LogOut size={10} />
                                )}
                                {r.type === "IN" ? "IN" : "OUT"}
                              </span>
                            </td>
                            <td
                              className={clsx(
                                "py-2.5 font-medium",
                                isDark ? "text-gray-200" : "text-gray-700"
                              )}
                            >
                              {r.time}
                            </td>
                            <td className="py-2.5 text-gray-500 text-xs">
                              {r.source}
                            </td>
                            <td className="py-2.5 text-right">
                              {r.type === "OUT" && r.hoursWorked ? (
                                <span
                                  className={clsx(
                                    "font-medium",
                                    r.isOvertime
                                      ? "text-amber-400"
                                      : isDark
                                      ? "text-gray-200"
                                      : "text-gray-700"
                                  )}
                                >
                                  {r.hoursWorked.toFixed(2)}h
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {r.isOvertime && (
                                  <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                    OT
                                  </span>
                                )}
                                {r.isCorrected && (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                                    <AlertTriangle size={9} /> Edited
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ));
                    })}
                </tbody>
                <tfoot>
                  <tr
                    className={clsx(
                      "border-t-2",
                      isDark ? "border-white/10" : "border-gray-200"
                    )}
                  >
                    <td
                      colSpan={4}
                      className={clsx(
                        "py-3 font-semibold text-sm",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      Period Total
                    </td>
                    <td
                      className={clsx(
                        "py-3 text-right font-bold text-sm",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      {totalHours.toFixed(2)}h
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
