import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserCheck,
  UserX,
  Coffee,
  Clock,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCheckInModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenCheckInModal,
}) => {
  const {
    employees,
    attendanceRecords,
    breaks,
    activityLogs,
    settings,
    todayAttendance,
    currentTime,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const todayStr = currentTime.toISOString().split('T')[0];

  // Today's attendance records
  const todayRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.date === todayStr);
  }, [attendanceRecords, todayStr]);

  // Compute live workforce KPIs
  const totalEmployees = employees.length;
  const presentCount = todayRecords.filter(
    (r) => r.status === 'present' || r.status === 'wfh' || r.status === 'half_day'
  ).length;
  const absentCount = todayRecords.filter((r) => r.status === 'absent').length;
  const leaveCount = todayRecords.filter(
    (r) => r.status === 'paid_leave' || r.status === 'unpaid_leave'
  ).length;

  // Active breaks currently running
  const ongoingBreaks = breaks.filter((b) => !b.endTime && b.startTime.startsWith(todayStr));
  const onBreakCount = ongoingBreaks.length;

  // Currently active workers
  const activeCount = Math.max(0, presentCount - onBreakCount);

  // Missing checkouts
  const missingCheckoutCount = todayRecords.filter((r) => r.isMissingCheckOut).length;

  // Late arrivals today
  const lateCount = todayRecords.filter((r) => r.isLateArrival).length;

  // Average work hours today
  const totalNetMinutesToday = todayRecords.reduce((sum, r) => sum + (r.netWorkingMinutes || 0), 0);
  const avgWorkingMinutes = presentCount > 0 ? Math.round(totalNetMinutesToday / presentCount) : 0;

  // Total overtime minutes
  const totalOvertimeToday = todayRecords.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

  // Attendance rate
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Departments list
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department)));
  }, [employees]);

  // Filtered employee rows with live data
  const employeeRows = useMemo(() => {
    return employees
      .filter((emp) => {
        if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
        if (
          searchQuery &&
          !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !emp.id.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((emp) => {
        const record = todayRecords.find((r) => r.employeeId === emp.id);
        const empOngoingBreak = ongoingBreaks.find((b) => b.employeeId === emp.id);
        const empBreaks = breaks.filter(
          (b) => b.employeeId === emp.id && b.startTime.startsWith(todayStr)
        );

        const lunchMins = empBreaks
          .filter((b) => b.category === 'lunch')
          .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
        const otherBreakMins = empBreaks
          .filter((b) => b.category !== 'lunch')
          .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

        let liveStatus = 'Not Checked In';
        let statusBadge = 'text-slate-500';

        if (empOngoingBreak) {
          liveStatus = empOngoingBreak.category === 'lunch' ? 'On Lunch' : 'On Short Break';
          statusBadge = 'text-amber-600 font-semibold';
        } else if (record?.checkOutTime) {
          liveStatus = 'Checked Out';
          statusBadge = 'text-slate-600';
        } else if (record?.status === 'paid_leave' || record?.status === 'unpaid_leave') {
          liveStatus = 'On Leave';
          statusBadge = 'text-purple-600';
        } else if (record?.status === 'absent') {
          liveStatus = 'Absent';
          statusBadge = 'text-rose-600 font-medium';
        } else if (record?.status === 'wfh') {
          liveStatus = 'WFH Active';
          statusBadge = 'text-indigo-600 font-semibold';
        } else if (record?.checkInTime) {
          liveStatus = 'Active / Working';
          statusBadge = 'text-emerald-600 font-semibold';
        }

        return {
          employee: emp,
          record,
          liveStatus,
          statusBadge,
          lunchMins,
          otherBreakMins,
          netMins: record?.netWorkingMinutes || 0,
        };
      });
  }, [employees, todayRecords, ongoingBreaks, breaks, selectedDept, searchQuery, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Workforce Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time attendance, activity monitoring, and productivity analytics for {settings.companyName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('ai_insights')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Executive Brief
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            Export Reports
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalEmployees}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Enrolled workforce</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {presentCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">{attendanceRate}% attendance</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Active Working</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">At workstations / WFH</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>On Lunch / Break</span>
            <Coffee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {onBreakCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Live break timers</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {lateCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&gt; {settings.workSchedule.gracePeriodMinutes}m grace period</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Avg Work Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatMinutes(avgWorkingMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {formatMinutes(totalOvertimeToday)} OT total
          </div>
        </div>
      </div>

      {/* Live Monitoring Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Today's Live Employee Status
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              ({employeeRows.length} employees)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dense High-Clarity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Live Status</th>
                <th className="py-2.5 px-3 text-right">Lunch</th>
                <th className="py-2.5 px-3 text-right">Other Breaks</th>
                <th className="py-2.5 px-3 text-right">Net Worked</th>
                <th className="py-2.5 px-4 text-center">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {employeeRows.map((row) => (
                <tr
                  key={row.employee.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={row.employee.avatarUrl}
                        alt={row.employee.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {row.employee.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.employee.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                    {row.employee.department}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700 dark:text-slate-300">
                    {formatTimeAmPm(row.record?.checkInTime)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={row.statusBadge}>{row.liveStatus}</span>
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-right text-slate-600 dark:text-slate-400">
                    {formatMinutes(row.lunchMins)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-right text-slate-600 dark:text-slate-400">
                    {formatMinutes(row.otherBreakMins)}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-right font-semibold text-slate-900 dark:text-white">
                    {formatMinutes(row.netMins)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans text-[11px]">
                    {row.record?.isLateArrival ? (
                      <span className="text-rose-600 font-medium">Late (+20m)</span>
                    ) : row.record?.isMissingCheckOut ? (
                      <span className="text-amber-600 font-medium">Missing Out</span>
                    ) : (
                      <span className="text-slate-400">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
