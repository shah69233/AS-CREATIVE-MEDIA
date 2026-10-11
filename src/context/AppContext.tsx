import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Employee,
  AttendanceRecord,
  BreakSession,
  ActivityLog,
  LeaveRequest,
  Holiday,
  AuditLog,
  AppNotification,
  CompanySettings,
  ActivityStatus,
  BreakCategory,
  PortalMode,
  LocationRecord,
} from '../types';
import {
  initialEmployees,
  initialSettings,
  initialHolidays,
  generateSeedAttendance,
  initialLeaveRequests,
  initialAuditLogs,
  initialNotifications,
} from '../mockData/initialData';
import { isCheckInLate, isCheckOutEarly, calculateDifferenceInMinutes } from '../utils/calculations';

interface AppContextType {
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  currentUser: Employee;
  switchUser: (employeeId: string) => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  importEmployees: (imported: Employee[]) => void;

  attendanceRecords: AttendanceRecord[];
  todayAttendance: AttendanceRecord | undefined;
  checkIn: (
    location: LocationRecord,
    method?: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified',
    scannedQrCode?: string,
    selfieUrl?: string
  ) => void;
  checkOut: (
    location: LocationRecord,
    method?: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified',
    scannedQrCode?: string,
    selfieUrl?: string
  ) => void;
  submitCorrection: (recordId: string, checkIn: string, checkOut: string, reason: string) => void;
  reviewCorrection: (correctionId: string, status: 'approved' | 'rejected', reviewComment?: string) => void;

  breaks: BreakSession[];
  activeBreak: BreakSession | undefined;
  startBreak: (category: BreakCategory, notes?: string) => void;
  endBreak: () => void;

  activityLogs: ActivityLog[];
  currentActivityStatus: ActivityStatus;
  setActivityStatus: (status: ActivityStatus, reason?: string) => void;

  leaveRequests: LeaveRequest[];
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'employeeId' | 'status' | 'appliedAt'>) => void;
  reviewLeave: (requestId: string, status: 'approved' | 'rejected', comment?: string) => void;

  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;

  settings: CompanySettings;
  updateSettings: (updates: Partial<CompanySettings>) => void;

  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  auditLogs: AuditLog[];
  currentTime: Date;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('swm_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('swm_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Portal Mode ('admin' vs 'staff')
  const [portalMode, setPortalModeState] = useState<PortalMode>(() => {
    const saved = localStorage.getItem('swm_portal_mode') as PortalMode;
    return saved || 'staff';
  });

  const setPortalMode = (mode: PortalMode) => {
    setPortalModeState(mode);
    localStorage.setItem('swm_portal_mode', mode);
    if (mode === 'admin' && currentUser.role === 'employee') {
      const admin = employees.find((e) => e.role === 'super_admin') || employees[0];
      switchUser(admin.id);
    } else if (mode === 'staff' && currentUser.role === 'super_admin') {
      const staff = employees.find((e) => e.role === 'employee') || employees[2];
      switchUser(staff.id);
    }
  };

  // Company Settings
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('swm_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName === 'Apex Innovations Technologies' || !parsed.companyName) {
          parsed.companyName = 'AS Creative Media';
          parsed.companyTagline = 'Smart Workforce & Attendance Platform · Built by AS Creative Media';
        }
        return parsed;
      } catch {
        return initialSettings;
      }
    }
    return initialSettings;
  });

  useEffect(() => {
    localStorage.setItem('swm_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      logAction('Policy/Settings Updated', 'policy', `Updated settings`);
      return next;
    });
  };

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('swm_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  useEffect(() => {
    localStorage.setItem('swm_employees', JSON.stringify(employees));
  }, [employees]);

  // Current logged in user
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('swm_current_user_id');
    return saved || 'EMP-101'; // Default Sarah Sterling (Super Admin)
  });

  const currentUser = useMemo(() => {
    return employees.find((e) => e.id === currentUserId) || employees[0];
  }, [employees, currentUserId]);

  const switchUser = (employeeId: string) => {
    setCurrentUserId(employeeId);
    localStorage.setItem('swm_current_user_id', employeeId);
  };

  // Initialize seed data if needed
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('swm_attendance');
    if (saved) return JSON.parse(saved);
    const { attendance } = generateSeedAttendance();
    return attendance;
  });

  const [breaks, setBrebreaks] = useState<BreakSession[]>(() => {
    const saved = localStorage.getItem('swm_breaks');
    if (saved) return JSON.parse(saved);
    const { breaks: b } = generateSeedAttendance();
    return b;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('swm_activity');
    if (saved) return JSON.parse(saved);
    const { activityLogs: a } = generateSeedAttendance();
    return a;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('swm_leaves');
    return saved ? JSON.parse(saved) : initialLeaveRequests;
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('swm_holidays');
    return saved ? JSON.parse(saved) : initialHolidays;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('swm_audit');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('swm_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('swm_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);
  useEffect(() => {
    localStorage.setItem('swm_breaks', JSON.stringify(breaks));
  }, [breaks]);
  useEffect(() => {
    localStorage.setItem('swm_activity', JSON.stringify(activityLogs));
  }, [activityLogs]);
  useEffect(() => {
    localStorage.setItem('swm_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem('swm_holidays', JSON.stringify(holidays));
  }, [holidays]);
  useEffect(() => {
    localStorage.setItem('swm_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('swm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Audit logger helper
  const logAction = (action: string, category: AuditLog['category'], details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      action,
      category,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'], linkTab?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
      linkTab,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Today's attendance for current user
  const todayDateStr = currentTime.toISOString().split('T')[0];

  const todayAttendance = useMemo(() => {
    return attendanceRecords.find(
      (r) => r.employeeId === currentUser.id && r.date === todayDateStr
    );
  }, [attendanceRecords, currentUser.id, todayDateStr]);

  // Active break for current user
  const activeBreak = useMemo(() => {
    return breaks.find(
      (b) => b.employeeId === currentUser.id && !b.endTime
    );
  }, [breaks, currentUser.id]);

  // Current activity status for current user
  const currentActivityStatus = useMemo<ActivityStatus>(() => {
    if (activeBreak) {
      return activeBreak.category === 'lunch' ? 'lunch' : 'short_break';
    }
    const todayRec = todayAttendance;
    if (!todayRec || !todayRec.checkInTime) {
      return 'checked_out';
    }
    if (todayRec.checkOutTime) {
      return 'checked_out';
    }
    // Find latest activity log
    const userLogs = activityLogs.filter((a) => a.employeeId === currentUser.id);
    if (userLogs.length > 0) {
      return userLogs[0].newStatus;
    }
    return 'active';
  }, [activeBreak, todayAttendance, activityLogs, currentUser.id]);

  // Check In Handler (Compulsory Live Location & Selfie & Optional Office QR Code)
  const checkIn = (
    location: LocationRecord,
    method: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified' = 'gps_live_location',
    scannedQrCode?: string,
    selfieUrl?: string
  ) => {
    if (todayAttendance?.checkInTime && !todayAttendance.checkOutTime) {
      return; // Already checked in
    }

    const checkInIso = new Date().toISOString();
    const isLate = isCheckInLate(checkInIso, currentUser.shiftStart, settings.workSchedule.gracePeriodMinutes);

    const newRecord: AttendanceRecord = {
      id: `att-${currentUser.id}-${todayDateStr}`,
      employeeId: currentUser.id,
      date: todayDateStr,
      status: 'present',
      checkInTime: checkInIso,
      grossDurationMinutes: 0,
      unpaidBreakMinutes: 0,
      netWorkingMinutes: 0,
      overtimeMinutes: 0,
      isLateArrival: isLate,
      isEarlyDeparture: false,
      isMissingCheckOut: false,
      checkInMethod: method,
      checkInLocation: location,
      scannedQrCode: scannedQrCode,
      checkInSelfieUrl: selfieUrl,
    };

    setAttendanceRecords((prev) => {
      const filtered = prev.filter(
        (r) => !(r.employeeId === currentUser.id && r.date === todayDateStr)
      );
      return [newRecord, ...filtered];
    });

    // Update activity log
    const verificationLabel = method === 'qr_and_gps_verified'
      ? `QR Code (${scannedQrCode || 'Verified'}) + Live GPS + Selfie`
      : selfieUrl
      ? 'Live GPS + Verified Selfie'
      : 'Live GPS';
    setActivityStatus('active', `Employee checked in via ${verificationLabel}`);
    logAction('Check-In Verified', 'attendance', `Checked in at ${new Date().toLocaleTimeString()} [Mode: ${verificationLabel}, GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} - ${location.distanceMeters}m from office, Selfie: ${selfieUrl ? 'Verified' : 'N/A'}]`);

    if (isLate && settings.notificationsEnabled.lateArrival) {
      addNotification(
        'Late Arrival',
        `${currentUser.name} arrived after the scheduled grace period.`,
        'warning',
        'attendance'
      );
    }
  };

  // Check Out Handler (Compulsory Live Location & Optional Selfie & Office QR Code)
  const checkOut = (
    location: LocationRecord,
    method: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified' = 'gps_live_location',
    scannedQrCode?: string,
    selfieUrl?: string
  ) => {
    if (!todayAttendance || !todayAttendance.checkInTime || todayAttendance.checkOutTime) {
      return;
    }

    // End active break if any
    if (activeBreak) {
      endBreak();
    }

    const checkOutIso = new Date().toISOString();
    const isEarly = isCheckOutEarly(checkOutIso, currentUser.shiftEnd);
    const grossMinutes = calculateDifferenceInMinutes(todayAttendance.checkInTime, checkOutIso);

    // Sum unpaid breaks for today
    const userTodayBreaks = breaks.filter(
      (b) => b.employeeId === currentUser.id && b.startTime.startsWith(todayDateStr)
    );
    const unpaidBreakMins = userTodayBreaks
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    const netMinutes = Math.max(0, grossMinutes - unpaidBreakMins);
    const dailyTargetMinutes = (currentUser.dailyWorkingHours || 8) * 60;
    const rawOvertime = netMinutes - dailyTargetMinutes;
    const overtime =
      rawOvertime >= settings.workSchedule.overtimeMinimumMinutes ? rawOvertime : 0;

    const updated: AttendanceRecord = {
      ...todayAttendance,
      checkOutTime: checkOutIso,
      grossDurationMinutes: grossMinutes,
      unpaidBreakMinutes: unpaidBreakMins,
      netWorkingMinutes: netMinutes,
      overtimeMinutes: overtime,
      isEarlyDeparture: isEarly,
      isMissingCheckOut: false,
      checkOutLocation: location,
      checkOutMethod: method,
      scannedQrCode: scannedQrCode || todayAttendance.scannedQrCode,
      checkOutSelfieUrl: selfieUrl || todayAttendance.checkOutSelfieUrl,
    };

    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    const verificationLabel = method === 'qr_and_gps_verified'
      ? `QR Code (${scannedQrCode || 'Verified'}) + Live GPS`
      : 'Live GPS';
    setActivityStatus('checked_out', `Employee checked out via ${verificationLabel}`);
    logAction('Check-Out Verified', 'attendance', `Checked out at ${new Date().toLocaleTimeString()} [Mode: ${verificationLabel}, GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} - ${location.distanceMeters}m, Net: ${Math.round(netMinutes / 60)}h]`);
  };

  // Breaks Management
  const startBreak = (category: BreakCategory, notes?: string) => {
    if (!todayAttendance?.checkInTime || todayAttendance.checkOutTime) {
      alert('You must check in before taking a break.');
      return;
    }
    if (activeBreak) {
      alert('You already have an ongoing break session.');
      return;
    }

    const isPaid =
      category === 'tea'
        ? settings.breakPolicies.teaIsPaid
        : category === 'lunch'
        ? settings.breakPolicies.lunchIsPaid
        : settings.breakPolicies.personalIsPaid;

    const newBreak: BreakSession = {
      id: `brk-${Date.now()}`,
      employeeId: currentUser.id,
      category,
      startTime: new Date().toISOString(),
      durationMinutes: 0,
      isPaid,
      isOverLimit: false,
      notes,
    };

    setBrebreaks((prev) => [newBreak, ...prev]);
    const actStatus = category === 'lunch' ? 'lunch' : 'short_break';
    setActivityStatus(actStatus, `Started ${category} break`);
    logAction('Break Started', 'attendance', `Started ${category} break`);
  };

  const endBreak = () => {
    if (!activeBreak) return;

    const endIso = new Date().toISOString();
    const duration = calculateDifferenceInMinutes(activeBreak.startTime, endIso);

    const limit =
      activeBreak.category === 'lunch'
        ? settings.breakPolicies.lunchLimitMinutes
        : activeBreak.category === 'tea'
        ? settings.breakPolicies.teaLimitMinutes
        : settings.breakPolicies.personalLimitMinutes;

    const isOverLimit = duration > limit;

    const finishedBreak: BreakSession = {
      ...activeBreak,
      endTime: endIso,
      durationMinutes: duration,
      isOverLimit,
    };

    setBrebreaks((prev) =>
      prev.map((b) => (b.id === finishedBreak.id ? finishedBreak : b))
    );

    setActivityStatus('active', 'Break ended, back to work');
    logAction('Break Ended', 'attendance', `Ended ${finishedBreak.category} break (${duration}m)`);

    if (isOverLimit && settings.notificationsEnabled.breakOverlimit) {
      addNotification(
        'Break Exceeded Allowance',
        `${currentUser.name} exceeded ${finishedBreak.category} break limit by ${duration - limit} mins.`,
        'warning',
        'breaks'
      );
    }
  };

  // Activity Status changer
  const setActivityStatus = (status: ActivityStatus, reason?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      employeeId: currentUser.id,
      previousStatus: currentActivityStatus,
      newStatus: status,
      startTime: new Date().toISOString(),
      durationMinutes: 0,
      reason,
      source: 'employee_action',
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Attendance Corrections
  const submitCorrection = (
    recordId: string,
    checkInTime: string,
    checkOutTime: string,
    reason: string
  ) => {
    const correction = {
      id: `corr-${Date.now()}`,
      recordId,
      employeeId: currentUser.id,
      requestedCheckIn: checkInTime,
      requestedCheckOut: checkOutTime,
      reason,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const list = rec.corrections ? [...rec.corrections, correction] : [correction];
          return { ...rec, corrections: list };
        }
        return rec;
      })
    );

    logAction('Correction Requested', 'attendance', `Submitted correction request for ${recordId}`);
    addNotification(
      'Attendance Correction Submitted',
      `${currentUser.name} submitted an attendance correction request.`,
      'info',
      'attendance'
    );
  };

  const reviewCorrection = (
    correctionId: string,
    status: 'approved' | 'rejected',
    reviewComment?: string
  ) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (!rec.corrections) return rec;
        const target = rec.corrections.find((c) => c.id === correctionId);
        if (!target) return rec;

        const updatedCorrections = rec.corrections.map((c) =>
          c.id === correctionId
            ? {
                ...c,
                status,
                reviewedBy: currentUser.name,
                reviewedAt: new Date().toISOString(),
                reviewComment,
              }
            : c
        );

        if (status === 'approved') {
          const gross = calculateDifferenceInMinutes(
            target.requestedCheckIn,
            target.requestedCheckOut
          );
          const net = Math.max(0, gross - rec.unpaidBreakMinutes);
          const overtime = net > 480 ? net - 480 : 0;

          return {
            ...rec,
            checkInTime: target.requestedCheckIn,
            checkOutTime: target.requestedCheckOut,
            grossDurationMinutes: gross,
            netWorkingMinutes: net,
            overtimeMinutes: overtime,
            isMissingCheckOut: false,
            corrections: updatedCorrections,
          };
        }

        return { ...rec, corrections: updatedCorrections };
      })
    );

    logAction(
      `Correction ${status}`,
      'attendance',
      `${status === 'approved' ? 'Approved' : 'Rejected'} correction ${correctionId}`
    );
  };

  // Leave Management
  const applyLeave = (
    leave: Omit<LeaveRequest, 'id' | 'employeeId' | 'status' | 'appliedAt'>
  ) => {
    const newReq: LeaveRequest = {
      ...leave,
      id: `lr-${Date.now()}`,
      employeeId: currentUser.id,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [newReq, ...prev]);
    logAction('Leave Applied', 'leave', `Applied for ${leave.leaveType} leave`);
    addNotification(
      'New Leave Application',
      `${currentUser.name} requested ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate}.`,
      'info',
      'leave'
    );
  };

  const reviewLeave = (
    requestId: string,
    status: 'approved' | 'rejected',
    comment?: string
  ) => {
    setLeaveRequests((prev) =>
      prev.map((lr) =>
        lr.id === requestId
          ? {
              ...lr,
              status,
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString(),
              reviewComment: comment,
            }
          : lr
      )
    );

    // If approved, update attendance record for those dates
    const req = leaveRequests.find((l) => l.id === requestId);
    if (req && status === 'approved') {
      const attendanceStatus =
        req.leaveType === 'unpaid' ? 'unpaid_leave' : req.isHalfDay ? 'half_day' : 'paid_leave';

      const targetEmp = employees.find((e) => e.id === req.employeeId);
      if (targetEmp && req.leaveType !== 'unpaid') {
        const leaveKey = req.leaveType as 'casual' | 'sick' | 'annual';
        const deduction = req.isHalfDay ? 0.5 : 1;
        updateEmployee(targetEmp.id, {
          leaveBalance: {
            ...targetEmp.leaveBalance,
            [leaveKey]: Math.max(0, targetEmp.leaveBalance[leaveKey] - deduction),
          },
        });
      }

      setAttendanceRecords((prev) => [
        {
          id: `att-${req.employeeId}-${req.startDate}`,
          employeeId: req.employeeId,
          date: req.startDate,
          status: attendanceStatus,
          grossDurationMinutes: req.isHalfDay ? 240 : 0,
          unpaidBreakMinutes: 0,
          netWorkingMinutes: req.isHalfDay ? 240 : 0,
          overtimeMinutes: 0,
          isLateArrival: false,
          isEarlyDeparture: false,
          isMissingCheckOut: false,
          notes: `Approved ${req.leaveType} leave: ${req.reason}`,
        },
        ...prev.filter(
          (r) => !(r.employeeId === req.employeeId && r.date === req.startDate)
        ),
      ]);
    }

    logAction(
      `Leave ${status}`,
      'leave',
      `${status === 'approved' ? 'Approved' : 'Rejected'} leave request ${requestId}`
    );
  };

  // Holiday
  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHol: Holiday = { ...holiday, id: `hol-${Date.now()}` };
    setHolidays((prev) => [...prev, newHol]);
    logAction('Holiday Added', 'policy', `Added holiday: ${holiday.name} (${holiday.date})`);
  };

  // Employee Management
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const nextId = `EMP-${100 + employees.length + 1}`;
    const newEmp: Employee = { ...empData, id: nextId };
    setEmployees((prev) => [...prev, newEmp]);
    logAction('Employee Added', 'employee', `Registered employee ${newEmp.name} (${newEmp.id})`);
    addNotification('New Employee Enrolled', `${newEmp.name} joined as ${newEmp.designation}.`, 'info', 'employees');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    logAction('Employee Updated', 'employee', `Updated profile of ${id}`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    logAction('Employee Removed', 'employee', `Removed employee ${id}`);
  };

  const importEmployees = (imported: Employee[]) => {
    setEmployees((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const fresh = imported.filter((e) => !existingIds.has(e.id));
      return [...prev, ...fresh];
    });
    logAction('Bulk Employee Import', 'employee', `Imported ${imported.length} employee records`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const resetToDemoData = () => {
    localStorage.removeItem('swm_employees');
    localStorage.removeItem('swm_settings');
    localStorage.removeItem('swm_attendance');
    localStorage.removeItem('swm_breaks');
    localStorage.removeItem('swm_activity');
    localStorage.removeItem('swm_leaves');
    localStorage.removeItem('swm_audit');
    localStorage.removeItem('swm_notifications');
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        portalMode,
        setPortalMode,
        currentUser,
        switchUser,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        importEmployees,
        attendanceRecords,
        todayAttendance,
        checkIn,
        checkOut,
        submitCorrection,
        reviewCorrection,
        breaks,
        activeBreak,
        startBreak,
        endBreak,
        activityLogs,
        currentActivityStatus,
        setActivityStatus,
        leaveRequests,
        applyLeave,
        reviewLeave,
        holidays,
        addHoliday,
        settings,
        updateSettings,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        auditLogs,
        currentTime,
        theme,
        toggleTheme,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
