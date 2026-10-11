import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coffee,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Search,
  Filter,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';
import { BreakCategory } from '../../types';

export const BreakManager: React.FC = () => {
  const {
    breaks,
    activeBreak,
    startBreak,
    endBreak,
    todayAttendance,
    employees,
    settings,
    currentUser,
    currentTime,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [breakNotes, setBreakNotes] = useState('');

  const isCheckedIn = Boolean(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);

  // Live timer for active break
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!activeBreak) {
      setElapsedSec(0);
      return;
    }
    const updateElapsed = () => {
      const diffMs = Date.now() - new Date(activeBreak.startTime).getTime();
      setElapsedSec(Math.max(0, Math.floor(diffMs / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeBreak]);

  const activeBreakLimit = activeBreak
    ? activeBreak.category === 'lunch'
      ? settings.breakPolicies.lunchLimitMinutes
      : activeBreak.category === 'tea'
      ? settings.breakPolicies.teaLimitMinutes
      : settings.breakPolicies.personalLimitMinutes
    : 0;

  const isOverLimitLive = Math.floor(elapsedSec / 60) > activeBreakLimit;

  // Filtered breaks history list
  const filteredBreaks = breaks
    .map((b) => ({
      ...b,
      employee: employees.find((e) => e.id === b.employeeId),
    }))
    .filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (
        searchEmployee &&
        !b.employee?.name.toLowerCase().includes(searchEmployee.toLowerCase()) &&
        !b.employeeId.toLowerCase().includes(searchEmployee.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Lunch & Break Management Module
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Live timer tracking, overage warnings, policy allowance enforcement, and paid vs unpaid breakdown.
        </p>
      </div>

      {/* Break Station Card & Live Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer / Start Break Panel */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span className="font-semibold text-slate-900 dark:text-white">
                Personal Break Controller ({currentUser.name})
              </span>
              <span>{isCheckedIn ? 'Status: Checked In' : 'Status: Not Checked In'}</span>
            </div>

            {activeBreak ? (
              <div className="p-6 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-3">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider font-mono">
                  {activeBreak.category} Break In Progress
                </div>
                <div className="text-4xl font-extrabold font-mono text-amber-950 dark:text-amber-100 tracking-tight">
                  {Math.floor(elapsedSec / 60)}m {String(elapsedSec % 60).padStart(2, '0')}s
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  Allowed Duration: {activeBreakLimit} minutes ·{' '}
                  {activeBreak.isPaid ? 'Paid Break' : 'Unpaid (deducted from net working time)'}
                </div>

                {isOverLimitLive && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warning: Break limit exceeded by {Math.floor(elapsedSec / 60) - activeBreakLimit}m!</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={endBreak}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    End Break & Resume Work
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Select a break category to initiate a live tracked session:
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => startBreak('lunch', breakNotes)}
                    disabled={!isCheckedIn}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all disabled:opacity-40"
                  >
                    <Coffee className="w-5 h-5 text-amber-600 mb-2" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Lunch Break</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {settings.breakPolicies.lunchLimitMinutes}m limit · {settings.breakPolicies.lunchIsPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </button>

                  <button
                    onClick={() => startBreak('tea', breakNotes)}
                    disabled={!isCheckedIn}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all disabled:opacity-40"
                  >
                    <Coffee className="w-5 h-5 text-indigo-600 mb-2" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Tea Break</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {settings.breakPolicies.teaLimitMinutes}m limit · {settings.breakPolicies.teaIsPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </button>

                  <button
                    onClick={() => startBreak('personal', breakNotes)}
                    disabled={!isCheckedIn}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-left transition-all disabled:opacity-40"
                  >
                    <Clock className="w-5 h-5 text-purple-600 mb-2" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Personal Break</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {settings.breakPolicies.personalLimitMinutes}m limit · {settings.breakPolicies.personalIsPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={breakNotes}
                    onChange={(e) => setBreakNotes(e.target.value)}
                    placeholder="Optional break note (e.g. quick coffee, cafeteria)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            Safety Guard: Breaks cannot overlap, and cannot be started without an active check-in session.
          </div>
        </div>

        {/* Policy Summary Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
          <h2 className="font-semibold text-slate-900 dark:text-white">Company Break Policies</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200">Lunch Break</div>
              <div className="text-slate-500 mt-0.5">Limit: {settings.breakPolicies.lunchLimitMinutes} mins</div>
              <div className="text-slate-500">Treatment: {settings.breakPolicies.lunchIsPaid ? 'Paid' : 'Unpaid (deducted)'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200">Tea / Coffee Break</div>
              <div className="text-slate-500 mt-0.5">Limit: {settings.breakPolicies.teaLimitMinutes} mins</div>
              <div className="text-slate-500">Treatment: {settings.breakPolicies.teaIsPaid ? 'Paid' : 'Unpaid'}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200">Personal / Other</div>
              <div className="text-slate-500 mt-0.5">Limit: {settings.breakPolicies.personalLimitMinutes} mins</div>
              <div className="text-slate-500">Treatment: {settings.breakPolicies.personalIsPaid ? 'Paid' : 'Unpaid'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Break History Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Break Sessions & Duration Log
          </h2>

          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Search employee..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-40"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="lunch">Lunch</option>
              <option value="tea">Tea</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-medium">
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Start Time</th>
                <th className="py-2.5 px-3">End Time</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-4 text-center">Limit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredBreaks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <img
                      src={b.employee?.avatarUrl}
                      alt={b.employee?.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    {b.employee?.name}
                  </td>
                  <td className="py-2.5 px-3 font-sans capitalize text-slate-700 dark:text-slate-300">
                    {b.category}
                  </td>
                  <td className="py-2.5 px-3">{formatTimeAmPm(b.startTime)}</td>
                  <td className="py-2.5 px-3">{b.endTime ? formatTimeAmPm(b.endTime) : 'Running...'}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {formatMinutes(b.durationMinutes)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {b.isPaid ? (
                      <span className="text-emerald-600">Paid</span>
                    ) : (
                      <span className="text-slate-500">Unpaid (Deducted)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans text-[11px]">
                    {b.isOverLimit ? (
                      <span className="text-rose-600 font-semibold">Exceeded Limit</span>
                    ) : (
                      <span className="text-emerald-600">Within Limit</span>
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
