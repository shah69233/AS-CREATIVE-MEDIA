import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  Users,
  Moon,
  Briefcase,
  Coffee,
  Car,
  Home,
  Clock,
  ArrowRight,
  Activity,
  Check,
  X,
  Sparkles,
  ChevronUp,
  AlertCircle,
  Play,
  Square,
} from 'lucide-react';
import { ActivityStatus, BreakCategory } from '../../types';
import { formatTimeAmPm } from '../../utils/calculations';

interface QuickActionFloatingMenuProps {
  onNavigateToActivity?: () => void;
  className?: string;
}

export const QuickActionFloatingMenu: React.FC<QuickActionFloatingMenuProps> = ({
  onNavigateToActivity,
  className = '',
}) => {
  const {
    currentUser,
    currentActivityStatus,
    setActivityStatus,
    activeBreak,
    startBreak,
    endBreak,
    todayAttendance,
    activityLogs,
    currentTime,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [meetingNote, setMeetingNote] = useState('');
  const [showMeetingInput, setShowMeetingInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCheckedIn = Boolean(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowMeetingInput(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowMeetingInput(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Find the latest activity log for current user to calculate elapsed time in current status
  const todayStr = currentTime.toISOString().split('T')[0];
  const userTodayLogs = activityLogs.filter(
    (a) => a.employeeId === currentUser.id && a.startTime.startsWith(todayStr)
  );
  const latestLog = userTodayLogs.length > 0 ? userTodayLogs[0] : null;

  // Live timer for duration in current status
  const [statusElapsedMins, setStatusElapsedMins] = useState(0);
  useEffect(() => {
    const calcElapsed = () => {
      if (!latestLog?.startTime) {
        setStatusElapsedMins(0);
        return;
      }
      const diffMs = Date.now() - new Date(latestLog.startTime).getTime();
      setStatusElapsedMins(Math.max(0, Math.floor(diffMs / 60000)));
    };
    calcElapsed();
    const interval = setInterval(calcElapsed, 15000);
    return () => clearInterval(interval);
  }, [latestLog]);

  // Helper for status styling & friendly badges
  const getStatusDisplay = (status: ActivityStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active / Working',
          shortLabel: 'Active',
          color: 'bg-emerald-500 text-white',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: Briefcase,
        };
      case 'meeting':
        return {
          label: 'In Meeting',
          shortLabel: 'Meeting',
          color: 'bg-blue-600 text-white',
          badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
          icon: Users,
        };
      case 'off_duty':
        return {
          label: 'Off-Duty',
          shortLabel: 'Off-Duty',
          color: 'bg-amber-600 text-white',
          badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          icon: Moon,
        };
      case 'lunch':
      case 'short_break':
        return {
          label: status === 'lunch' ? 'On Lunch' : 'On Break',
          shortLabel: 'Break',
          color: 'bg-amber-500 text-white',
          badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          icon: Coffee,
        };
      case 'field_work':
        return {
          label: 'On Field Work',
          shortLabel: 'Field Work',
          color: 'bg-indigo-600 text-white',
          badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-500',
          icon: Car,
        };
      case 'wfh':
        return {
          label: 'Work From Home',
          shortLabel: 'WFH',
          color: 'bg-purple-600 text-white',
          badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
          dot: 'bg-purple-500',
          icon: Home,
        };
      case 'idle':
        return {
          label: 'Idle / Stepped Away',
          shortLabel: 'Idle',
          color: 'bg-rose-500 text-white',
          badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: Clock,
        };
      default:
        return {
          label: 'Checked Out',
          shortLabel: 'Checked Out',
          color: 'bg-slate-500 text-white',
          badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
          icon: Moon,
        };
    }
  };

  const currentDisplay = getStatusDisplay(currentActivityStatus);
  const StatusIcon = currentDisplay.icon;

  // Actions
  const handleToggleMeeting = () => {
    if (currentActivityStatus === 'meeting') {
      setActivityStatus('active', 'Meeting concluded, resumed work');
      setShowMeetingInput(false);
      setMeetingNote('');
    } else {
      const reason = meetingNote.trim() ? `Meeting: ${meetingNote.trim()}` : 'Quick Team/Client Meeting';
      setActivityStatus('meeting', reason);
      setShowMeetingInput(false);
      setMeetingNote('');
    }
  };

  const handleToggleOffDuty = () => {
    if (currentActivityStatus === 'off_duty') {
      setActivityStatus('active', 'Off-duty ended, resumed duty');
    } else {
      setActivityStatus('off_duty', 'Employee toggled Off-Duty');
    }
  };

  const handleSelectStatus = (status: ActivityStatus, reason?: string) => {
    setActivityStatus(status, reason);
    setShowMeetingInput(false);
  };

  return (
    <div
      ref={menuRef}
      className={`fixed bottom-6 right-6 z-40 flex flex-col items-end select-none ${className}`}
    >
      {/* Floating Panel (Expands upward) */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300">
                <Zap className="w-4 h-4 fill-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  Quick Action Menu
                  <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-indigo-500/40 rounded-full text-indigo-200">
                    Live
                  </span>
                </h4>
                <p className="text-[10px] text-slate-300">
                  Instant status toggle & activity tracking
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Quick Action Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Current Active Status Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentDisplay.color} shadow-sm`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentDisplay.dot} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${currentDisplay.dot}`}></span>
                  </span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Current Status
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentDisplay.label}
                  </div>
                  {latestLog && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{statusElapsedMins > 0 ? `${statusElapsedMins}m in this status` : 'Just updated'}</span>
                    </div>
                  )}
                </div>
              </div>

              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${currentDisplay.badgeBg}`}>
                {currentDisplay.shortLabel}
              </span>
            </div>

            {/* Check-in Reminder Warning if not checked in */}
            {!isCheckedIn && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-semibold">Notice:</span> You are not checked in yet for today. Status toggles will update your activity feed once checked in.
                </div>
              </div>
            )}

            {/* Primary Status Toggle Buttons */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Immediate Status Toggles
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. START / END MEETING */}
                <button
                  onClick={() => {
                    if (currentActivityStatus === 'meeting') {
                      handleToggleMeeting();
                    } else {
                      setShowMeetingInput(!showMeetingInput);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    currentActivityStatus === 'meeting'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/50'
                      : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${currentActivityStatus === 'meeting' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    {currentActivityStatus === 'meeting' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {currentActivityStatus === 'meeting' ? 'In Meeting' : 'Start Meeting'}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${currentActivityStatus === 'meeting' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {currentActivityStatus === 'meeting' ? 'Tap to end meeting' : 'Sync, client or team'}
                    </div>
                  </div>
                </button>

                {/* 2. OFF-DUTY TOGGLE */}
                <button
                  onClick={handleToggleOffDuty}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    currentActivityStatus === 'off_duty'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${currentActivityStatus === 'off_duty' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'}`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    {currentActivityStatus === 'off_duty' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-amber-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {currentActivityStatus === 'off_duty' ? 'Off-Duty (Active)' : 'Off-Duty'}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${currentActivityStatus === 'off_duty' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {currentActivityStatus === 'off_duty' ? 'Tap to resume work' : 'Standby / duty pause'}
                    </div>
                  </div>
                </button>

                {/* 3. RESUME ACTIVE WORK */}
                <button
                  onClick={() => handleSelectStatus('active', 'Resumed standard active work')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    currentActivityStatus === 'active'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${currentActivityStatus === 'active' ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    {currentActivityStatus === 'active' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      Active / Working
                    </div>
                    <div className={`text-[10px] mt-0.5 ${currentActivityStatus === 'active' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      Primary desk/job task
                    </div>
                  </div>
                </button>

                {/* 4. FIELD WORK */}
                <button
                  onClick={() => handleSelectStatus('field_work', 'Client site / Field visit started')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    currentActivityStatus === 'field_work'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
                      : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${currentActivityStatus === 'field_work' ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                      <Car className="w-4 h-4" />
                    </div>
                    {currentActivityStatus === 'field_work' && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-indigo-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      Field Work
                    </div>
                    <div className={`text-[10px] mt-0.5 ${currentActivityStatus === 'field_work' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      On-site client visit
                    </div>
                  </div>
                </button>
              </div>

              {/* Optional Quick Meeting Topic Input Dropdown */}
              {showMeetingInput && currentActivityStatus !== 'meeting' && (
                <div className="mt-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>Meeting Details (Optional)</span>
                    <button
                      onClick={() => setShowMeetingInput(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Design review, Client onboarding"
                    value={meetingNote}
                    onChange={(e) => setMeetingNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleToggleMeeting();
                    }}
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
                      <button
                        type="button"
                        onClick={() => setMeetingNote('Client Call')}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                      >
                        Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingNote('Sprint Standup')}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                      >
                        Standup
                      </button>
                    </div>
                    <button
                      onClick={handleToggleMeeting}
                      className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Start Meeting
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Break Actions or End Break */}
            {activeBreak ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200 capitalize">
                    On {activeBreak.category} Break
                  </div>
                </div>
                <button
                  onClick={endBreak}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1"
                >
                  <Square className="w-3 h-3 fill-white" />
                  End Break
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => startBreak('tea')}
                  disabled={!isCheckedIn}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-500" />
                  Tea Break
                </button>
                <button
                  onClick={() => startBreak('lunch')}
                  disabled={!isCheckedIn}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  Lunch
                </button>
                <button
                  onClick={() => handleSelectStatus('wfh', 'Working remotely from home')}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Home className="w-3.5 h-3.5 text-purple-500" />
                  WFH
                </button>
              </div>
            )}

            {/* DIRECT LINK TO ACTIVITY TRACKING MODULE */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToActivity) {
                    onNavigateToActivity();
                  }
                }}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight flex items-center gap-1">
                      Activity Tracking Module
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    </div>
                    <div className="text-[10px] text-indigo-100">
                      View company monitors & timeline
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Mini Activity Logs Stream (Proof of direct linkage) */}
            {userTodayLogs.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                  <span>Recent Status Log</span>
                  <span className="font-mono">{userTodayLogs.length} today</span>
                </div>
                <div className="space-y-1">
                  {userTodayLogs.slice(0, 2).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-none"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span className="font-semibold capitalize truncate">
                          {log.newStatus.replace('_', ' ')}
                        </span>
                        {log.reason && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            ({log.reason})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTimeAmPm(log.startTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-700 dark:border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        aria-label="Toggle Quick Action Menu"
        title="Quick Action Floating Menu"
      >
        {/* Pulsing indicator ring */}
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentDisplay.dot} opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${currentDisplay.dot}`}
          ></span>
        </span>

        {/* Icon & Label */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-tight">Quick Action</span>
        </div>

        {/* Status pill inside trigger button */}
        <span
          className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
          }`}
        >
          {currentDisplay.shortLabel}
        </span>

        {/* Chevron state */}
        <div
          className={`p-0.5 rounded-full transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'group-hover:-translate-y-0.5'
          }`}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
