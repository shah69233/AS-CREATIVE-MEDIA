import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RoleSwitcherModal } from './components/common/RoleSwitcherModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LiveLocationModal } from './components/attendance/LiveLocationModal';
import { AdminAccessModal } from './components/common/AdminAccessModal';
import { StaffBasicPortal } from './components/staff/StaffBasicPortal';

import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { ActivityTracker } from './components/activity/ActivityTracker';
import { AttendanceView } from './components/attendance/AttendanceView';
import { BreakManager } from './components/breaks/BreakManager';
import { LeaveManagement } from './components/leave/LeaveManagement';
import { EmployeeDirectory } from './components/employees/EmployeeDirectory';
import { ReportCenter } from './components/reports/ReportCenter';
import { AiWorkforceInsights } from './components/ai/AiWorkforceInsights';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { currentUser, portalMode, setPortalMode } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [locationModalAction, setLocationModalAction] = useState<'check_in' | 'check_out' | null>(null);

  // If in Basic Staff Portal mode, render the dedicated Staff App
  if (portalMode === 'staff') {
    return (
      <>
        <StaffBasicPortal onSwitchToAdmin={() => setIsAdminAuthOpen(true)} />
        <AdminAccessModal
          isOpen={isAdminAuthOpen}
          onClose={() => setIsAdminAuthOpen(false)}
          onSuccess={() => setPortalMode('admin')}
        />
      </>
    );
  }

  // Admin Portal Views
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (currentUser.role === 'super_admin') {
          return (
            <AdminDashboard
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenCheckInModal={() => setLocationModalAction('check_in')}
            />
          );
        }
        if (currentUser.role === 'manager') {
          return <ManagerDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
        }
        return (
          <EmployeeDashboard
            onOpenCheckInModal={() => setLocationModalAction('check_in')}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );

      case 'activity':
        return <ActivityTracker />;

      case 'attendance':
        return <AttendanceView />;

      case 'breaks':
        return <BreakManager />;

      case 'leave':
        return <LeaveManagement />;

      case 'employees':
        return <EmployeeDirectory />;

      case 'reports':
        return <ReportCenter />;

      case 'ai_insights':
        return <AiWorkforceInsights />;

      case 'settings':
        return <SettingsView />;

      default:
        return (
          <AdminDashboard
            onNavigateTab={setCurrentTab}
            onOpenCheckInModal={() => setLocationModalAction('check_in')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenNotifications={() => setIsNotifOpen(true)}
          onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
          onOpenCheckInModal={() => setLocationModalAction('check_in')}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Compulsory GPS & QR Verification Modal */}
      <LiveLocationModal
        isOpen={Boolean(locationModalAction)}
        onClose={() => setLocationModalAction(null)}
        actionType={locationModalAction || 'check_in'}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
