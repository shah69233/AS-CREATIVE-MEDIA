import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Clock,
  Coffee,
  CheckCircle2,
  LogOut,
  Calendar,
  Square,
  Shield,
  ShieldAlert,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  User,
  Compass,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';
import { Modal } from '../common/Modal';
import { LiveLocationModal } from '../attendance/LiveLocationModal';
import { QuickActionFloatingMenu } from '../dashboard/QuickActionFloatingMenu';
import { ActivityTracker } from '../activity/ActivityTracker';
import { BackgroundStatusPill } from '../common/BackgroundStatusPill';
import { ActivityStatus, BreakCategory } from '../../types';

interface StaffBasicPortalProps {
  onSwitchToAdmin: () => void;
}

export const StaffBasicPortal: React.FC<StaffBasicPortalProps> = ({ onSwitchToAdmin }) => {
  const {
    currentUser,
    switchUser,
    employees,
    todayAttendance,
    breaks,
    activeBreak,
    startBreak,
    endBreak,
    currentActivityStatus,
    setActivityStatus,
    attendanceRecords,
    applyLeave,
    currentTime,
    settings,
    theme,
    toggleTheme,
  } = useApp();

  // Location Modal State
  const [locationModalAction, setLocationModalAction] = useState<'check_in' | 'check_out' | null>(null);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'annual' | 'unpaid'>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveIsHalfDay, setLeaveIsHalfDay] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  // Staff Switcher dropdown
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

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

  // Live work duration elapsed for today
  const workElapsedSec = isCheckedIn && todayAttendance?.checkInTime
    ? Math.max(0, Math.floor((Date.now() - new Date(todayAttendance.checkInTime).getTime()) / 1000))
    : 0;

  const todayStr = currentTime.toISOString().split('T')[0];

  const todayBreaks = breaks.filter(
    (b) => b.employeeId === currentUser.id && b.startTime.startsWith(todayStr)
  );
  const totalBreakMinutesToday = todayBreaks.reduce(
    (sum, b) => sum + (b.durationMinutes || 0),
    0
  );

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

  const recentRecords = attendanceRecords
    .filter((r) => r.employeeId === currentUser.id)
    .slice(0, 5);

  const staffEmployees = employees.filter((e) => e.role === 'employee' || e.role === 'manager');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header for Staff Portal */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
            AS
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              AS PulseWork
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              AS Creative Media · Staff Portal
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Staff Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
              />
              <span className="hidden sm:inline font-semibold">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isStaffMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400">
                  Select Staff Persona
                </div>
                {staffEmployees.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      switchUser(staff.id);
                      setIsStaffMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      staff.id === currentUser.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <img
                      src={staff.avatarUrl}
                      alt={staff.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="truncate">
                      <div className="truncate leading-tight">{staff.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{staff.designation}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Background Live Tracking Status Pill */}
          <BackgroundStatusPill />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Switch to Admin Mode Button */}
          <button
            onClick={onSwitchToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Switch to Executive Admin Portal"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Admin Access</span>
          </button>
        </div>
      </header>

      {/* Main Staff Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Welcome Card & Shift Hours */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{currentUser.designation}</span>
                <span>·</span>
                <span className="font-mono">Shift: {currentUser.shiftStart} - {currentUser.shiftEnd}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            Apply Leave
          </button>
        </div>

        {/* PRIMARY COMPULSORY GPS ATTENDANCE CARD */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-5 text-center">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Live Location Attendance
            </span>
            <span className="font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Time & Session Clock */}
          <div>
            <div className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
              {isCheckedIn
                ? `${Math.floor(workElapsedSec / 3600)}h ${Math.floor((workElapsedSec % 3600) / 60)}m`
                : isCheckedOut
                ? formatMinutes(todayAttendance?.netWorkingMinutes || 0)
                : '0h 00m'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isCheckedIn
                ? `Active Session · Checked in at ${formatTimeAmPm(todayAttendance?.checkInTime)}`
                : isCheckedOut
                ? `Shift Completed · Checked out at ${formatTimeAmPm(todayAttendance?.checkOutTime)}`
                : 'Not Checked In Yet'}
            </div>
          </div>

          {/* Location Telemetry on Recorded Attendance */}
          {todayAttendance?.checkInLocation && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Check-In GPS Record:</span>
                <span className="text-emerald-600 font-semibold">Verified On-Site</span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300">
                Coordinates: {todayAttendance.checkInLocation.lat.toFixed(4)}° N, {todayAttendance.checkInLocation.lng.toFixed(4)}° W
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Distance: {todayAttendance.checkInLocation.distanceMeters}m from Office Centroid</span>
                <span>Accuracy: ±{todayAttendance.checkInLocation.accuracy || 8}m</span>
              </div>

              {todayAttendance.checkOutLocation && (
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Check-Out GPS Record:</span>
                    <span className="text-indigo-600 font-semibold">Verified On-Site</span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">
                    Coordinates: {todayAttendance.checkOutLocation.lat.toFixed(4)}° N, {todayAttendance.checkOutLocation.lng.toFixed(4)}° W
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Distance: {todayAttendance.checkOutLocation.distanceMeters}m from Office Centroid
                  </div>
                </div>
              )}

              {todayAttendance.checkInSelfieUrl && (
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={todayAttendance.checkInSelfieUrl}
                      alt="Verified Live Selfie"
                      className="w-10 h-10 rounded-lg object-cover ring-2 ring-emerald-500 shadow-xs"
                    />
                    <div className="text-left font-sans">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Live Selfie Authenticated
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Biometric GPS stamping verified
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-sans">
                    ✓ Selfie Verified
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Primary Big GPS Action Buttons */}
          <div className="pt-2">
            {!isCheckedIn && !isCheckedOut && (
              <button
                onClick={() => setLocationModalAction('check_in')}
                className="w-full py-4 px-6 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-98"
              >
                <Compass className="w-5 h-5" />
                Check In with Live GPS (Compulsory)
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={() => setLocationModalAction('check_out')}
                className="w-full py-4 px-6 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-98"
              >
                <LogOut className="w-5 h-5" />
                Check Out with Live GPS (Compulsory)
              </button>
            )}

            {isCheckedOut && (
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800 text-center rounded-xl text-xs text-slate-600 dark:text-slate-300 font-semibold">
                Shift Successfully Completed for Today
              </div>
            )}
          </div>
        </div>

        {/* LIVE BREAK STATION */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Break & Lunch Tracker
            </span>
            <span className="font-mono">{formatMinutes(totalBreakMinutesToday)} total today</span>
          </div>

          {activeBreak ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-2">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase font-mono">
                Currently on {activeBreak.category} Break
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-900 dark:text-amber-100">
                {Math.floor(breakElapsedSec / 60)}:
                {String(breakElapsedSec % 60).padStart(2, '0')}
              </div>
              <button
                onClick={endBreak}
                className="mt-3 w-full py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                End Break & Resume Shift
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => startBreak('lunch')}
                disabled={!isCheckedIn}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
              >
                <Coffee className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Lunch</div>
                <div className="text-[10px] text-slate-500">{settings.breakPolicies.lunchLimitMinutes}m limit</div>
              </button>

              <button
                onClick={() => startBreak('tea')}
                disabled={!isCheckedIn}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
              >
                <Coffee className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Tea Break</div>
                <div className="text-[10px] text-slate-500">{settings.breakPolicies.teaLimitMinutes}m limit</div>
              </button>

              <button
                onClick={() => startBreak('personal')}
                disabled={!isCheckedIn}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center disabled:opacity-40 transition-colors"
              >
                <Clock className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Personal</div>
                <div className="text-[10px] text-slate-500">{settings.breakPolicies.personalLimitMinutes}m limit</div>
              </button>
            </div>
          )}
        </div>

        {/* WORK STATUS & LEAVE QUOTAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Current Activity Status
            </label>
            <select
              value={currentActivityStatus}
              onChange={(e) => setActivityStatus(e.target.value as ActivityStatus)}
              disabled={!isCheckedIn || Boolean(activeBreak)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="active">Active / Working</option>
              <option value="meeting">In Meeting</option>
              <option value="field_work">On Field Work</option>
              <option value="wfh">Work from Home</option>
              <option value="idle">Idle / Step Away</option>
            </select>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Available Leave Balances
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold font-mono">{currentUser.leaveBalance.casual}d</div>
                <div className="text-[10px] text-slate-500">Casual</div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold font-mono">{currentUser.leaveBalance.sick}d</div>
                <div className="text-[10px] text-slate-500">Sick</div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold font-mono">{currentUser.leaveBalance.annual}d</div>
                <div className="text-[10px] text-slate-500">Annual</div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ATTENDANCE TIMESHEET */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            My Recent Attendance & GPS Verification
          </div>
          <div className="space-y-2">
            {recentRecords.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{r.date}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${r.status === 'present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    In: {formatTimeAmPm(r.checkInTime)} · Out: {formatTimeAmPm(r.checkOutTime)}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {formatMinutes(r.netWorkingMinutes)}
                  </div>
                  {r.checkInLocation && (
                    <div className="text-[10px] text-emerald-600 font-sans flex items-center gap-0.5 justify-end">
                      <MapPin className="w-3 h-3" />
                      <span>GPS Verified</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center py-4 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-400">
          <span>AS PulseWork · Developed by </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">AS Creative Media</span>
        </div>
      </main>

      {/* COMPULSORY LOCATION MODAL */}
      <LiveLocationModal
        isOpen={Boolean(locationModalAction)}
        onClose={() => setLocationModalAction(null)}
        actionType={locationModalAction || 'check_in'}
      />

      {/* LEAVE APPLICATION MODAL */}
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
              <option value="casual">Casual Leave ({currentUser.leaveBalance.casual}d remaining)</option>
              <option value="sick">Sick Leave ({currentUser.leaveBalance.sick}d remaining)</option>
              <option value="annual">Annual Leave ({currentUser.leaveBalance.annual}d remaining)</option>
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
              id="staff_halfday"
              checked={leaveIsHalfDay}
              onChange={(e) => setLeaveIsHalfDay(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label htmlFor="staff_halfday" className="text-slate-700 dark:text-slate-300">
              Half-day leave (0.5 day)
            </label>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="State reason for leave application..."
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

      {/* Activity Tracker Modal for Staff */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Live Activity & Status Tracking Module"
        maxWidth="3xl"
      >
        <div className="py-2">
          <ActivityTracker />
        </div>
      </Modal>

      {/* Quick Action Floating Menu for Staff Dashboard */}
      <QuickActionFloatingMenu
        onNavigateToActivity={() => setIsActivityModalOpen(true)}
      />
    </div>
  );
};
