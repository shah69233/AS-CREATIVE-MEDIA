import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Coffee,
  CheckCircle2,
  LogOut,
  Calendar,
  AlertCircle,
  FileEdit,
  Send,
  Timer,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm, calculateDifferenceInMinutes } from '../../utils/calculations';
import { Modal } from '../common/Modal';
import { BreakCategory, ActivityStatus } from '../../types';
import { LiveLocationModal } from '../attendance/LiveLocationModal';
import { QuickActionFloatingMenu } from './QuickActionFloatingMenu';

interface EmployeeDashboardProps {
  onOpenCheckInModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onOpenCheckInModal,
  onNavigateTab,
}) => {
  const {
    currentUser,
    todayAttendance,
    checkIn,
    checkOut,
    breaks,
    activeBreak,
    startBreak,
    endBreak,
    currentActivityStatus,
    setActivityStatus,
    submitCorrection,
    applyLeave,
    attendanceRecords,
    currentTime,
    settings,
  } = useApp();

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [gpsModalAction, setGpsModalAction] = useState<'check_in' | 'check_out' | null>(null);

  // Correction Form state
  const [corrCheckIn, setCorrCheckIn] = useState('09:00');
  const [corrCheckOut, setCorrCheckOut] = useState('18:00');
  const [corrReason, setCorrReason] = useState('');

  // Leave Form state
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'annual' | 'unpaid'>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveIsHalfDay, setLeaveIsHalfDay] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  const isCheckedIn = Boolean(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);
  const isCheckedOut = Boolean(todayAttendance?.checkOutTime);

  // Live timer for active break
  const [breakElapsedSec, setBreakElapsedSec] = useState(0);
  useEffect(() => {
    if (!activeBreak) {
      setBreakElapsedSec(0);
      return;
    }
    const updateElapsed = () => {
      const diffMs = Date.now() - new Date(activeBreak.startTime).getTime();
      setBreakElapsedSec(Math.max(0, Math.floor(diffMs / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeBreak]);

  // Live gross work duration elapsed for today
  const workElapsedSec = isCheckedIn && todayAttendance?.checkInTime
    ? Math.max(0, Math.floor((Date.now() - new Date(todayAttendance.checkInTime).getTime()) / 1000))
    : 0;

  const todayStr = currentTime.toISOString().split('T')[0];

  // Today's breaks
  const todayBreaks = breaks.filter(
    (b) => b.employeeId === currentUser.id && b.startTime.startsWith(todayStr)
  );

  const totalBreakMinutesToday = todayBreaks.reduce(
    (sum, b) => sum + (b.durationMinutes || 0),
    0
  );

  // Submit Correction Handler
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayAttendance) return;
    const dummyCheckInIso = new Date(`${todayStr}T${corrCheckIn}:00`).toISOString();
    const dummyCheckOutIso = new Date(`${todayStr}T${corrCheckOut}:00`).toISOString();
    submitCorrection(todayAttendance.id, dummyCheckInIso, dummyCheckOutIso, corrReason);
    setIsCorrectionModalOpen(false);
    setCorrReason('');
  };

  // Submit Leave Handler
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) return;
    applyLeave({
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      isHalfDay: leaveIsHalfDay,
      reason: leaveReason,
    });
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  // Recent 7 days attendance records
  const recentRecords = attendanceRecords
    .filter((r) => r.employeeId === currentUser.id)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Welcome & Shift Card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Shift: {currentUser.shiftStart} – {currentUser.shiftEnd}</span>
            <span>·</span>
            <span>Standard: {currentUser.dailyWorkingHours}h/day</span>
            <span>·</span>
            <span>{currentUser.department}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileEdit className="w-3.5 h-3.5" />
            Request Correction
          </button>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Apply Leave
          </button>
        </div>
      </div>

      {/* Primary Interaction Grid: Check-in/out hero & Live Break Station */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Action Center */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Today's Work Session</span>
              <span className="font-mono">{todayStr}</span>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                {isCheckedIn
                  ? `${Math.floor(workElapsedSec / 3600)}h ${Math.floor((workElapsedSec % 3600) / 60)}m`
                  : isCheckedOut
                  ? formatMinutes(todayAttendance?.netWorkingMinutes || 0)
                  : '0h 00m'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isCheckedIn
                  ? 'Elapsed since ' + formatTimeAmPm(todayAttendance?.checkInTime)
                  : isCheckedOut
                  ? 'Total session completed'
                  : 'Not checked in yet'}
              </div>
            </div>

            {/* Status overview */}
            <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Check-In Time:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {formatTimeAmPm(todayAttendance?.checkInTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check-Out Time:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {formatTimeAmPm(todayAttendance?.checkOutTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Punctuality:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {todayAttendance?.isLateArrival ? (
                    <span className="text-rose-600 font-semibold">Late Check-in</span>
                  ) : todayAttendance?.checkInTime ? (
                    <span className="text-emerald-600 font-semibold">On Time</span>
                  ) : (
                    'Pending'
                  )}
                </span>
              </div>

              {todayAttendance?.checkInSelfieUrl && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-500">Live Selfie:</span>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={todayAttendance.checkInSelfieUrl}
                      alt="Verified Selfie"
                      className="w-6 h-6 rounded-md object-cover ring-1 ring-emerald-500"
                    />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      Biometric Stamped
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            {!isCheckedIn && !isCheckedOut && (
              <button
                onClick={() => setGpsModalAction('check_in')}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Check In with Live GPS (Compulsory)
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={() => setGpsModalAction('check_out')}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Check Out with Live GPS (Compulsory)
              </button>
            )}

            {isCheckedOut && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-center rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium">
                Workday Finished · Checked out at {formatTimeAmPm(todayAttendance?.checkOutTime)}
              </div>
            )}
          </div>
        </div>

        {/* Live Break Management Station */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Break Management</span>
              <span className="font-mono">{formatMinutes(totalBreakMinutesToday)} total today</span>
            </div>

            {/* Active Break Timer Display */}
            {activeBreak ? (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 capitalize">
                  Currently on {activeBreak.category} Break
                </div>
                <div className="mt-2 text-3xl font-extrabold font-mono text-amber-900 dark:text-amber-200">
                  {Math.floor(breakElapsedSec / 60)}:
                  {String(breakElapsedSec % 60).padStart(2, '0')}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Allowed limit: {activeBreak.category === 'lunch' ? settings.breakPolicies.lunchLimitMinutes : settings.breakPolicies.teaLimitMinutes}m
                  {Math.floor(breakElapsedSec / 60) >
                    (activeBreak.category === 'lunch'
                      ? settings.breakPolicies.lunchLimitMinutes
                      : settings.breakPolicies.teaLimitMinutes) && (
                    <span className="font-bold text-rose-600 block mt-0.5">Limit Exceeded!</span>
                  )}
                </div>
                <button
                  onClick={endBreak}
                  className="mt-4 w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  End Break & Resume Work
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center py-4 text-xs text-slate-500">
                <Coffee className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                No break in progress. Start one below when needed.
              </div>
            )}

            {/* Quick break trigger buttons */}
            {!activeBreak && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => startBreak('lunch')}
                  disabled={!isCheckedIn}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Lunch</div>
                  <div className="text-[10px] text-slate-500">{settings.breakPolicies.lunchLimitMinutes}m max</div>
                </button>

                <button
                  onClick={() => startBreak('tea')}
                  disabled={!isCheckedIn}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Tea Break</div>
                  <div className="text-[10px] text-slate-500">{settings.breakPolicies.teaLimitMinutes}m max</div>
                </button>

                <button
                  onClick={() => startBreak('personal')}
                  disabled={!isCheckedIn}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Personal</div>
                  <div className="text-[10px] text-slate-500">{settings.breakPolicies.personalLimitMinutes}m max</div>
                </button>
              </div>
            )}
          </div>

          {/* Policy notes */}
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Lunch is {settings.breakPolicies.lunchIsPaid ? 'paid' : 'unpaid (deducted from gross)'} · Tea break is {settings.breakPolicies.teaIsPaid ? 'paid' : 'unpaid'}.
          </div>
        </div>

        {/* Activity Status Selector & Leave Balances */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-6">
          <div>
            <div className="text-xs text-slate-500 mb-2">Live Work Status</div>
            <select
              value={currentActivityStatus}
              onChange={(e) => setActivityStatus(e.target.value as ActivityStatus)}
              disabled={!isCheckedIn || Boolean(activeBreak)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="active">Active / Working</option>
              <option value="meeting">In Meeting</option>
              <option value="off_duty">Off-Duty</option>
              <option value="field_work">On Field Work</option>
              <option value="wfh">Work from Home</option>
              <option value="idle">Idle / Step Away</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Status changes are logged transparently in your activity timeline.
            </p>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-3">Available Leave Balances</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {currentUser.leaveBalance.casual}
                </div>
                <div className="text-[10px] text-slate-500">Casual</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {currentUser.leaveBalance.sick}
                </div>
                <div className="text-[10px] text-slate-500">Sick</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {currentUser.leaveBalance.annual}
                </div>
                <div className="text-[10px] text-slate-500">Annual</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance History Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Your Recent Attendance History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3 text-right">Net Hours</th>
                <th className="py-2.5 px-3 text-right">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {recentRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-900 dark:text-white font-sans">{r.date}</td>
                  <td className="py-2 px-3 capitalize font-sans">
                    <span className={r.status === 'present' ? 'text-emerald-600' : 'text-slate-600'}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3">{formatTimeAmPm(r.checkInTime)}</td>
                  <td className="py-2 px-3">{formatTimeAmPm(r.checkOutTime)}</td>
                  <td className="py-2 px-3 text-right font-semibold">
                    {formatMinutes(r.netWorkingMinutes)}
                  </td>
                  <td className="py-2 px-3 text-right text-indigo-600">
                    {r.overtimeMinutes > 0 ? formatMinutes(r.overtimeMinutes) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Request Attendance Correction */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Submit Attendance Correction Request"
        maxWidth="md"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Forgotten check-in or checkout? Submit corrected timestamps for manager review and approval.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Actual Check-In Time
              </label>
              <input
                type="time"
                value={corrCheckIn}
                onChange={(e) => setCorrCheckIn(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Actual Check-Out Time
              </label>
              <input
                type="time"
                value={corrCheckOut}
                onChange={(e) => setCorrCheckOut(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Reason for Correction
            </label>
            <textarea
              rows={3}
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              placeholder="e.g. Card scanner malfunction, emergency morning client call"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Submit for Manager Approval
          </button>
        </form>
      </Modal>

      {/* Modal: Apply for Leave */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Leave"
        maxWidth="md"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Leave Category
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="casual">Casual Leave ({currentUser.leaveBalance.casual} days left)</option>
              <option value="sick">Sick Leave ({currentUser.leaveBalance.sick} days left)</option>
              <option value="annual">Annual Leave ({currentUser.leaveBalance.annual} days left)</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfday"
              checked={leaveIsHalfDay}
              onChange={(e) => setLeaveIsHalfDay(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label htmlFor="halfday" className="text-slate-700 dark:text-slate-300">
              Half-day leave (0.5 day)
            </label>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Reason / Handover Notes
            </label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="State the reason for leave"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Submit Leave Application
          </button>
        </form>
      </Modal>

      {/* Compulsory Live Location Verification Modal */}
      <LiveLocationModal
        isOpen={Boolean(gpsModalAction)}
        onClose={() => setGpsModalAction(null)}
        actionType={gpsModalAction || 'check_in'}
      />

      {/* Quick Action Floating Menu for Immediate Status Toggling & Activity Module Link */}
      <QuickActionFloatingMenu
        onNavigateToActivity={() => onNavigateTab('activity')}
      />
    </div>
  );
};
