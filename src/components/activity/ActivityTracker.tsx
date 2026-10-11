import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  Clock,
  Coffee,
  Laptop,
  Briefcase,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';
import { ActivityStatus } from '../../types';

export const ActivityTracker: React.FC = () => {
  const { employees, activityLogs, breaks, attendanceRecords, currentTime, setActivityStatus, currentActivityStatus } =
    useApp();

  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = currentTime.toISOString().split('T')[0];

  // Helper for status styling & badges
  const getStatusMeta = (status: ActivityStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active / Working', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
      case 'lunch':
        return { label: 'On Lunch', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
      case 'short_break':
        return { label: 'Short Break', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
      case 'meeting':
        return { label: 'In Meeting', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' };
      case 'field_work':
        return { label: 'Field Work', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' };
      case 'wfh':
        return { label: 'Work From Home', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' };
      case 'idle':
        return { label: 'Idle / Away', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
      case 'off_duty':
        return { label: 'Off-Duty', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300' };
      case 'on_leave':
        return { label: 'On Leave', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300' };
      default:
        return { label: 'Checked Out', color: 'text-slate-500 bg-slate-50 dark:bg-slate-850 border-slate-200' };
    }
  };

  // Map each employee with their current status & today's timeline
  const employeeActivities = useMemo(() => {
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
        const empLogs = activityLogs.filter(
          (a) => a.employeeId === emp.id && a.startTime.startsWith(todayStr)
        );
        const latestLog = empLogs.length > 0 ? empLogs[0] : null;

        const currentStatus = latestLog ? latestLog.newStatus : ('checked_out' as ActivityStatus);

        const empBreaks = breaks.filter(
          (b) => b.employeeId === emp.id && b.startTime.startsWith(todayStr)
        );
        const breakMins = empBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

        const rec = attendanceRecords.find(
          (r) => r.employeeId === emp.id && r.date === todayStr
        );

        const productiveMins = rec?.netWorkingMinutes || 0;

        return {
          employee: emp,
          currentStatus,
          latestLog,
          todayLogs: empLogs,
          breakMins,
          productiveMins,
        };
      })
      .filter((item) => {
        if (selectedStatus !== 'all' && item.currentStatus !== selectedStatus) return false;
        return true;
      });
  }, [employees, activityLogs, breaks, attendanceRecords, selectedDept, selectedStatus, searchQuery, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Live Employee Activity & Status Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status changes, transparent work timelines, and productive vs break hour distribution.
          </p>
        </div>

        {/* Quick Idle Test Simulator for Evaluators */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">My Status:</span>
          <button
            onClick={() => setActivityStatus(currentActivityStatus === 'idle' ? 'active' : 'idle', 'Simulated idle toggle')}
            className="px-3 py-1.5 font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Toggle Idle ({currentActivityStatus === 'idle' ? 'Now Idle' : 'Active'})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-48"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="Sales">Sales</option>
            <option value="Executive">Executive</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active / Working</option>
            <option value="lunch">On Lunch</option>
            <option value="short_break">Short Break</option>
            <option value="meeting">In Meeting</option>
            <option value="off_duty">Off-Duty</option>
            <option value="wfh">Work From Home</option>
            <option value="idle">Idle / Away</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing {employeeActivities.length} active monitors
        </div>
      </div>

      {/* Grid of Employee Live Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employeeActivities.map(({ employee, currentStatus, latestLog, breakMins, productiveMins }) => {
          const statusMeta = getStatusMeta(currentStatus);
          return (
            <div
              key={employee.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {employee.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {employee.id} · {employee.department}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusMeta.color}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              {/* Productive vs Break summary bar */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Productive Work:</span>
                  <span className="font-semibold">{formatMinutes(productiveMins)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Breaks / Lunch:</span>
                  <span>{formatMinutes(breakMins)}</span>
                </div>
                {latestLog?.reason && (
                  <div className="text-[10px] text-slate-400 italic font-sans pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    "{latestLog.reason}"
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span>Last updated: {formatTimeAmPm(latestLog?.startTime)}</span>
                <span className="capitalize">{latestLog?.source?.replace('_', ' ') || 'Manual'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
