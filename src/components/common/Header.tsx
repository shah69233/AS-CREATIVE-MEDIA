import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Sun, Moon, Users, Clock, ShieldCheck, ChevronDown } from 'lucide-react';
import { formatTimeAmPm } from '../../utils/calculations';
import { BackgroundStatusPill } from './BackgroundStatusPill';

interface HeaderProps {
  currentTab: string;
  onOpenNotifications: () => void;
  onOpenRoleSwitcher: () => void;
  onOpenCheckInModal: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenNotifications,
  onOpenRoleSwitcher,
  onOpenCheckInModal,
  onToggleSidebar,
}) => {
  const { currentUser, todayAttendance, currentTime, theme, toggleTheme, unreadNotificationCount, setPortalMode } =
    useApp();

  const isCheckedIn = Boolean(todayAttendance?.checkInTime && !todayAttendance?.checkOutTime);

  const tabLabels: Record<string, string> = {
    dashboard: 'Workforce Overview',
    activity: 'Live Activity Tracking',
    attendance: 'Attendance & Time Logs',
    breaks: 'Break & Lunch Management',
    leave: 'Leave & Holidays',
    employees: 'Employee Directory',
    reports: 'Report & Analytics Center',
    ai_insights: 'Gemini AI Intelligence',
    settings: 'Company Settings & Audit',
  };

  const roleLabels = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    employee: 'Employee',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-8 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Zone 1: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            AS PulseWork
          </span>
          <span className="hidden sm:inline text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            · AS Creative Media
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-600">/</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {tabLabels[currentTab] || 'Overview'}
          </span>
        </div>
      </div>

      {/* Zone 2: Real-time clock & Live Check-in state */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span>·</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <span>·</span>

        <div className="flex items-center gap-2">
          <span>Status:</span>
          {isCheckedIn ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Checked In ({formatTimeAmPm(todayAttendance?.checkInTime)})
            </span>
          ) : todayAttendance?.checkOutTime ? (
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Checked Out ({formatTimeAmPm(todayAttendance?.checkOutTime)})
            </span>
          ) : (
            <span className="font-medium text-amber-600 dark:text-amber-400">Not Checked In</span>
          )}
        </div>
      </div>

      {/* Zone 3: Actions, Persona Switcher & Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Continuous Background GPS Tracking Pill */}
        <BackgroundStatusPill />

        {/* Switch to Basic Staff App */}
        <button
          onClick={() => setPortalMode('staff')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
          title="Open basic staff mobile/web view"
        >
          <span>Staff App View</span>
        </button>

        {/* Quick Check In / Scanner action */}
        {!isCheckedIn && !todayAttendance?.checkOutTime && (
          <button
            onClick={onOpenCheckInModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Check In (GPS)
          </button>
        )}

        {/* Persona / Role Switcher Button */}
        <button
          onClick={onOpenRoleSwitcher}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          title="Switch Active Persona (Admin, Manager, Employee)"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{roleLabels[currentUser.role]}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Current User Pill */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {currentUser.designation}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
