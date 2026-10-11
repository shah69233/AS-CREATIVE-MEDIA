import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Activity,
  CalendarCheck,
  Coffee,
  CalendarDays,
  Users,
  FileBarChart2,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { currentUser, leaveRequests, attendanceRecords } = useApp();

  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const pendingCorrectionsCount = attendanceRecords
    .flatMap((r) => r.corrections || [])
    .filter((c) => c.status === 'pending').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'activity',
      label: 'Live Activity',
      icon: Activity,
      badge: null,
    },
    {
      id: 'attendance',
      label: 'Attendance & Logs',
      icon: CalendarCheck,
      badge: pendingCorrectionsCount > 0 && currentUser.role !== 'employee' ? pendingCorrectionsCount : null,
    },
    {
      id: 'breaks',
      label: 'Breaks & Lunch',
      icon: Coffee,
      badge: null,
    },
    {
      id: 'leave',
      label: 'Leave & Holidays',
      icon: CalendarDays,
      badge: pendingLeavesCount > 0 && currentUser.role !== 'employee' ? pendingLeavesCount : null,
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Report Center',
      icon: FileBarChart2,
      badge: null,
    },
    {
      id: 'ai_insights',
      label: 'Gemini AI Insights',
      icon: Sparkles,
      badge: 'AI',
    },
    {
      id: 'settings',
      label: 'Settings & Audit',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
              AS
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">AS PulseWork</div>
              <div className="text-[10px] text-slate-400 font-medium">AS Creative Media</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:hidden text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      item.badge === 'AI'
                        ? 'bg-indigo-500/30 text-indigo-200'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current User Card at Bottom */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="p-2.5 rounded-lg bg-slate-800/40 flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate capitalize">
                {currentUser.role.replace('_', ' ')} · {currentUser.department}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
