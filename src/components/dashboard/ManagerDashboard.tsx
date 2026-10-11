import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Coffee,
  CheckCheck,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';

interface ManagerDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    employees,
    attendanceRecords,
    breaks,
    leaveRequests,
    reviewLeave,
    reviewCorrection,
    currentTime,
  } = useApp();

  const todayStr = currentTime.toISOString().split('T')[0];

  // Assigned team members (either managed directly or same department)
  const teamMembers = employees.filter(
    (e) => e.managerId === currentUser.id || e.department === currentUser.department
  );

  const teamIds = new Set(teamMembers.map((e) => e.id));

  // Today's records for team
  const todayTeamRecords = attendanceRecords.filter(
    (r) => teamIds.has(r.employeeId) && r.date === todayStr
  );

  const teamPresentCount = todayTeamRecords.filter(
    (r) => r.status === 'present' || r.status === 'wfh' || r.status === 'half_day'
  ).length;

  const teamLateCount = todayTeamRecords.filter((r) => r.isLateArrival).length;

  const ongoingBreaks = breaks.filter(
    (b) => teamIds.has(b.employeeId) && !b.endTime && b.startTime.startsWith(todayStr)
  );

  // Pending leaves for this team
  const pendingLeaves = leaveRequests.filter(
    (l) => teamIds.has(l.employeeId) && l.status === 'pending'
  );

  // Pending corrections for this team
  const pendingCorrections = attendanceRecords
    .filter((r) => teamIds.has(r.employeeId))
    .flatMap((r) =>
      (r.corrections || [])
        .filter((c) => c.status === 'pending')
        .map((c) => ({ ...c, originalRecord: r }))
    );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {currentUser.department} Team Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manager portal for {currentUser.name}. Monitoring {teamMembers.length} team members.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Team Size</div>
          <div className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
            {teamMembers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct & Department reports</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Present Today</div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-600">
            {teamPresentCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {teamMembers.length > 0 ? Math.round((teamPresentCount / teamMembers.length) * 100) : 0}% team attendance
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">On Break / Lunch</div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
            {ongoingBreaks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active break sessions</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500">Late Check-Ins</div>
          <div className="text-2xl font-bold font-mono mt-1 text-rose-600">
            {teamLateCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Arrived past grace period</div>
        </div>
      </div>

      {/* Approvals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Pending Leave Approvals ({pendingLeaves.length})
            </h2>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No pending leave applications for your team.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((lr) => {
                const applicant = employees.find((e) => e.id === lr.employeeId);
                return (
                  <div
                    key={lr.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={applicant?.avatarUrl}
                          alt={applicant?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {applicant?.name}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {lr.leaveType}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300">
                      Dates: <span className="font-mono">{lr.startDate} to {lr.endDate}</span>
                      {lr.isHalfDay && ' (Half Day)'}
                    </div>
                    <div className="text-slate-500 text-[11px] italic">
                      "{lr.reason}"
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => reviewLeave(lr.id, 'rejected', 'Declined by manager')}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => reviewLeave(lr.id, 'approved', 'Approved')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Attendance Corrections */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Pending Attendance Corrections ({pendingCorrections.length})
            </h2>
          </div>

          {pendingCorrections.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No attendance correction requests pending.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCorrections.map((c) => {
                const applicant = employees.find((e) => e.id === c.employeeId);
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={applicant?.avatarUrl}
                          alt={applicant?.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {applicant?.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Date: {c.originalRecord.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        Req Check-In: <span className="font-semibold">{formatTimeAmPm(c.requestedCheckIn)}</span>
                      </div>
                      <div>
                        Req Check-Out: <span className="font-semibold">{formatTimeAmPm(c.requestedCheckOut)}</span>
                      </div>
                    </div>

                    <div className="text-slate-500 text-[11px] italic">
                      "{c.reason}"
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => reviewCorrection(c.id, 'rejected', 'Declined')}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => reviewCorrection(c.id, 'approved', 'Approved')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                      >
                        Approve Adjustment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Roster Status Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Team Activity Status
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 px-3">Team Member</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3 text-right">Net Hours</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {teamMembers.map((emp) => {
                const rec = todayTeamRecords.find((r) => r.employeeId === emp.id);
                const brk = ongoingBreaks.find((b) => b.employeeId === emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <img src={emp.avatarUrl} alt={emp.name} className="w-6 h-6 rounded-full object-cover" />
                      {emp.name}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-500">{emp.designation}</td>
                    <td className="py-2 px-3">{formatTimeAmPm(rec?.checkInTime)}</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {formatMinutes(rec?.netWorkingMinutes || 0)}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      {brk ? (
                        <span className="text-amber-600 font-medium">On {brk.category} break</span>
                      ) : rec?.checkInTime ? (
                        <span className="text-emerald-600 font-medium">Active Working</span>
                      ) : (
                        <span className="text-slate-400">Offline</span>
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
