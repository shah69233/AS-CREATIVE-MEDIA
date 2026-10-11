import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileBarChart2,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Coffee,
  CheckCircle,
} from 'lucide-react';
import { exportToCsv, triggerPrint } from '../../utils/export';
import { computeAttendanceStats, formatMinutes, formatTimeAmPm } from '../../utils/calculations';

export const ReportCenter: React.FC = () => {
  const { attendanceRecords, breaks, employees, settings, currentTime } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<string>('daily');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [halfYearPreset, setHalfYearPreset] = useState<'h1' | 'h2' | 'custom'>('h1');

  // Date range defaults (current month)
  const today = currentTime.toISOString().split('T')[0];
  const firstDayOfMonth = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);

  // 16 Report Definitions
  const reportOptions = [
    { id: 'daily', name: '1. Daily Attendance Report', category: 'Attendance' },
    { id: 'weekly', name: '2. Weekly Attendance Report', category: 'Attendance' },
    { id: 'monthly', name: '3. Monthly Attendance Report', category: 'Attendance' },
    { id: 'quarterly', name: '4. Quarterly Attendance Report', category: 'Attendance' },
    { id: 'half_yearly', name: '5. Half-Yearly Attendance Report (H1 / H2 / Custom)', category: 'Attendance' },
    { id: 'annual', name: '6. Annual Attendance Report', category: 'Attendance' },
    { id: 'employee_activity', name: '7. Employee-Wise Activity Report', category: 'Activity' },
    { id: 'department_wise', name: '8. Department-Wise Comparison Report', category: 'Analytics' },
    { id: 'late_arrival', name: '9. Late Arrival & Punctuality Report', category: 'Exceptions' },
    { id: 'early_departure', name: '10. Early Departure Report', category: 'Exceptions' },
    { id: 'break_report', name: '11. Lunch & Break Duration Report', category: 'Breaks' },
    { id: 'active_inactive', name: '12. Active & Inactive Duration Report', category: 'Activity' },
    { id: 'overtime', name: '13. Overtime Analysis Report', category: 'Payroll' },
    { id: 'leave_absence', name: '14. Leave & Absence Distribution Report', category: 'Leave' },
    { id: 'correction_audit', name: '15. Attendance Correction & Audit Report', category: 'Audit' },
    { id: 'productivity_trends', name: '16. Productivity Trends & Payroll Summary', category: 'Payroll' },
  ];

  // Adjust dates when report changes or half-year preset changes
  const applyTimeframe = (reportId: string, hPreset = halfYearPreset) => {
    setSelectedReportId(reportId);
    const now = new Date();
    const curYear = now.getFullYear();

    if (reportId === 'daily') {
      setStartDate(today);
      setEndDate(today);
    } else if (reportId === 'weekly') {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (reportId === 'monthly') {
      setStartDate(firstDayOfMonth);
      setEndDate(today);
    } else if (reportId === 'quarterly') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const qStart = new Date(curYear, qMonth, 1).toISOString().split('T')[0];
      setStartDate(qStart);
      setEndDate(today);
    } else if (reportId === 'half_yearly') {
      if (hPreset === 'h1') {
        setStartDate(`${curYear}-01-01`);
        setEndDate(`${curYear}-06-30`);
      } else if (hPreset === 'h2') {
        setStartDate(`${curYear}-07-01`);
        setEndDate(`${curYear}-12-31`);
      }
    } else if (reportId === 'annual') {
      setStartDate(`${curYear}-01-01`);
      setEndDate(`${curYear}-12-31`);
    }
  };

  // Filter records within selected date range, department, and employee
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (r.date < startDate || r.date > endDate) return false;
      if (selectedEmployeeId !== 'all' && r.employeeId !== selectedEmployeeId) return false;
      if (selectedDepartment !== 'all') {
        const emp = employees.find((e) => e.id === r.employeeId);
        if (emp?.department !== selectedDepartment) return false;
      }
      return true;
    });
  }, [attendanceRecords, startDate, endDate, selectedEmployeeId, selectedDepartment, employees]);

  // Aggregate statistics
  const summaryStats = useMemo(() => {
    return computeAttendanceStats(filteredRecords, breaks, settings);
  }, [filteredRecords, breaks, settings]);

  // Department-wise breakdown
  const departmentBreakdown = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department)));
    return depts.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept);
      const deptEmpIds = new Set(deptEmployees.map((e) => e.id));
      const deptRecs = filteredRecords.filter((r) => deptEmpIds.has(r.employeeId));
      const stats = computeAttendanceStats(deptRecs, breaks, settings);
      return {
        department: dept,
        staffCount: deptEmployees.length,
        ...stats,
      };
    });
  }, [employees, filteredRecords, breaks, settings]);

  // Handle Export to CSV
  const handleExportCsv = () => {
    const selectedObj = reportOptions.find((r) => r.id === selectedReportId);
    const filename = `${selectedObj?.name.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_to_${endDate}`;

    const headers = [
      'Date',
      'Employee ID',
      'Employee Name',
      'Department',
      'Status',
      'Check-In',
      'Check-Out',
      'Gross Minutes',
      'Unpaid Break Minutes',
      'Net Minutes',
      'Overtime Minutes',
      'Late Arrival',
    ];

    const rows = filteredRecords.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      return [
        r.date,
        r.employeeId,
        emp?.name || '',
        emp?.department || '',
        r.status,
        formatTimeAmPm(r.checkInTime),
        formatTimeAmPm(r.checkOutTime),
        r.grossDurationMinutes,
        r.unpaidBreakMinutes,
        r.netWorkingMinutes,
        r.overtimeMinutes,
        r.isLateArrival ? 'Yes' : 'No',
      ];
    });

    exportToCsv(filename, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Workforce Report & Analytics Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            16 comprehensive report modes with daily, weekly, monthly, half-yearly (H1/H2), and custom ranges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel CSV
          </button>
        </div>
      </div>

      {/* Report Selection & Filter Control Matrix */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Report Type Selector */}
          <div className="md:col-span-2">
            <label className="block text-slate-500 font-medium mb-1">
              Select Report Perspective (16 Types)
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => applyTimeframe(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Department Filter</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          {/* Individual Employee Filter */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">Employee Filter</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Controls & Half-Year Special Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Reporting Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Half-Yearly Preset buttons */}
          {selectedReportId === 'half_yearly' && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => {
                  setHalfYearPreset('h1');
                  applyTimeframe('half_yearly', 'h1');
                }}
                className={`px-2.5 py-1 rounded-md ${
                  halfYearPreset === 'h1'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                H1 (Jan - Jun)
              </button>
              <button
                onClick={() => {
                  setHalfYearPreset('h2');
                  applyTimeframe('half_yearly', 'h2');
                }}
                className={`px-2.5 py-1 rounded-md ${
                  halfYearPreset === 'h2'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                H2 (Jul - Dec)
              </button>
              <button
                onClick={() => setHalfYearPreset('custom')}
                className={`px-2.5 py-1 rounded-md ${
                  halfYearPreset === 'custom'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Custom 6 Months
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Attendance Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {summaryStats.attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{summaryStats.presentDays} present days</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Punctuality Score</div>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {summaryStats.punctualityRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{summaryStats.lateDays} late entries</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Net Working Hours</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatMinutes(summaryStats.totalNetMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {formatMinutes(summaryStats.totalUnpaidBreakMinutes)} breaks
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Total Overtime</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {formatMinutes(summaryStats.totalOvertimeMinutes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved excess hours</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Leave / Absence</div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
            {summaryStats.leaveDays + summaryStats.absentDays}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{summaryStats.leaveDays} approved leaves</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Missing Checkouts</div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {summaryStats.missingCheckoutCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Audit exceptions</div>
        </div>
      </div>

      {/* Department Comparison Table if Department report or analytics is selected */}
      {(selectedReportId === 'department_wise' || selectedReportId === 'productivity_trends') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Department Performance & Working Hour Distribution
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-3">Staff Size</th>
                  <th className="py-2.5 px-3 text-right">Attendance %</th>
                  <th className="py-2.5 px-3 text-right">Punctuality %</th>
                  <th className="py-2.5 px-3 text-right">Total Net Hours</th>
                  <th className="py-2.5 px-3 text-right">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {departmentBreakdown.map((dept) => (
                  <tr key={dept.department} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                      {dept.department}
                    </td>
                    <td className="py-2.5 px-3">{dept.staffCount} employees</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      {dept.attendanceRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">{dept.punctualityRate}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white">
                      {formatMinutes(dept.totalNetMinutes)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-600">
                      {formatMinutes(dept.totalOvertimeMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Records Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Detailed Data Records ({filteredRecords.length} records)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Range: {startDate} to {endDate}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3 text-right">Gross</th>
                <th className="py-2.5 px-3 text-right">Unpaid Break</th>
                <th className="py-2.5 px-3 text-right">Net Worked</th>
                <th className="py-2.5 px-3 text-right">Overtime</th>
                <th className="py-2.5 px-3 text-center">Late Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredRecords.slice(0, 100).map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-4">{r.date}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                      {emp?.name || r.employeeId}
                    </td>
                    <td className="py-2 px-3 capitalize font-sans">
                      <span className={r.status === 'present' ? 'text-emerald-600' : 'text-slate-600'}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3">{formatTimeAmPm(r.checkInTime)}</td>
                    <td className="py-2 px-3">{formatTimeAmPm(r.checkOutTime)}</td>
                    <td className="py-2 px-3 text-right">{formatMinutes(r.grossDurationMinutes)}</td>
                    <td className="py-2 px-3 text-right">{formatMinutes(r.unpaidBreakMinutes)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatMinutes(r.netWorkingMinutes)}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-600">
                      {r.overtimeMinutes > 0 ? formatMinutes(r.overtimeMinutes) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {r.isLateArrival ? (
                        <span className="text-rose-600 font-semibold">Late</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
