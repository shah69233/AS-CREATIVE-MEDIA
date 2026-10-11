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
  AttendanceStatus,
} from '../types';

export const initialSettings: CompanySettings = {
  companyName: 'AS Creative Media',
  companyTagline: 'Smart Workforce & Attendance Platform · Built by AS Creative Media',
  workSchedule: {
    shiftStart: '09:00',
    shiftEnd: '18:00',
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    fullDayRequiredHours: 8.0,
    overtimeMinimumMinutes: 30,
  },
  breakPolicies: {
    lunchLimitMinutes: 45,
    lunchIsPaid: false,
    teaLimitMinutes: 15,
    teaIsPaid: true,
    personalLimitMinutes: 20,
    personalIsPaid: false,
  },
  geofence: {
    enabled: true,
    officeLat: 37.7749,
    officeLng: -122.4194,
    radiusMeters: 250,
  },
  notificationsEnabled: {
    lateArrival: true,
    breakOverlimit: true,
    missingCheckout: true,
    leaveApprovalNeeded: true,
    correctionApprovalNeeded: true,
  },
};

export const initialEmployees: Employee[] = [
  {
    id: 'EMP-101',
    name: 'Sarah Sterling',
    email: 'sarah.sterling@apex.io',
    phone: '+1 (555) 234-5678',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'Executive',
    designation: 'Chief Executive Officer',
    role: 'super_admin',
    joiningDate: '2023-01-15',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 6, sick: 10, annual: 18, unpaid: 0 },
  },
  {
    id: 'EMP-102',
    name: 'Marcus Vance',
    email: 'marcus.vance@apex.io',
    phone: '+1 (555) 345-6789',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    designation: 'Engineering Team Lead',
    role: 'manager',
    managerId: 'EMP-101',
    joiningDate: '2023-03-01',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 5, sick: 8, annual: 15, unpaid: 0 },
  },
  {
    id: 'EMP-103',
    name: 'Elena Rostova',
    email: 'elena.rostova@apex.io',
    phone: '+1 (555) 456-7890',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Design',
    designation: 'Senior Product Designer',
    role: 'employee',
    managerId: 'EMP-102',
    joiningDate: '2023-06-12',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 7, sick: 9, annual: 14, unpaid: 0 },
  },
  {
    id: 'EMP-104',
    name: 'David Chen',
    email: 'david.chen@apex.io',
    phone: '+1 (555) 567-8901',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    designation: 'Full Stack Engineer',
    role: 'employee',
    managerId: 'EMP-102',
    joiningDate: '2023-08-20',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 4, sick: 6, annual: 12, unpaid: 0 },
  },
  {
    id: 'EMP-105',
    name: 'Amira Patel',
    email: 'amira.patel@apex.io',
    phone: '+1 (555) 678-9012',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Marketing',
    designation: 'Head of Growth & Brand',
    role: 'manager',
    managerId: 'EMP-101',
    joiningDate: '2023-04-10',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 6, sick: 7, annual: 16, unpaid: 0 },
  },
  {
    id: 'EMP-106',
    name: 'Julian Thorne',
    email: 'julian.thorne@apex.io',
    phone: '+1 (555) 789-0123',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    department: 'Marketing',
    designation: 'Content & Campaign Specialist',
    role: 'employee',
    managerId: 'EMP-105',
    joiningDate: '2024-02-01',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 5, sick: 8, annual: 10, unpaid: 0 },
  },
  {
    id: 'EMP-107',
    name: 'Chloe Kim',
    email: 'chloe.kim@apex.io',
    phone: '+1 (555) 890-1234',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: 'Operations',
    designation: 'HR & People Operations Manager',
    role: 'manager',
    managerId: 'EMP-101',
    joiningDate: '2023-02-15',
    employmentStatus: 'active',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 8, sick: 10, annual: 18, unpaid: 0 },
  },
  {
    id: 'EMP-108',
    name: 'Liam Gallagher',
    email: 'liam.gallagher@apex.io',
    phone: '+1 (555) 901-2345',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    department: 'Sales',
    designation: 'Account Executive',
    role: 'employee',
    managerId: 'EMP-107',
    joiningDate: '2024-05-10',
    employmentStatus: 'probation',
    dailyWorkingHours: 8,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    weeklyOffDays: [0, 6],
    leaveBalance: { casual: 3, sick: 5, annual: 7, unpaid: 0 },
  },
];

export const initialHolidays: Holiday[] = [
  { id: 'h-1', date: '2026-01-01', name: "New Year's Day", type: 'national' },
  { id: 'h-2', date: '2026-01-19', name: 'Martin Luther King Jr. Day', type: 'national' },
  { id: 'h-3', date: '2026-05-25', name: 'Memorial Day', type: 'national' },
  { id: 'h-4', date: '2026-07-04', name: 'Independence Day', type: 'national' },
  { id: 'h-5', date: '2026-09-07', name: 'Labor Day', type: 'national' },
  { id: 'h-6', date: '2026-11-26', name: 'Thanksgiving Day', type: 'national' },
  { id: 'h-7', date: '2026-12-25', name: 'Christmas Day', type: 'national' },
];

// Helper to generate realistic historical attendance across months
export function generateSeedAttendance(): {
  attendance: AttendanceRecord[];
  breaks: BreakSession[];
  activityLogs: ActivityLog[];
} {
  const attendance: AttendanceRecord[] = [];
  const breaks: BreakSession[] = [];
  const activityLogs: ActivityLog[] = [];

  const today = new Date();
  
  // Create records for the last 60 days
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

    initialEmployees.forEach((emp) => {
      // Weekly Off
      if (emp.weeklyOffDays.includes(dayOfWeek)) {
        attendance.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status: 'weekly_off',
          grossDurationMinutes: 0,
          unpaidBreakMinutes: 0,
          netWorkingMinutes: 0,
          overtimeMinutes: 0,
          isLateArrival: false,
          isEarlyDeparture: false,
          isMissingCheckOut: false,
        });
        return;
      }

      // Check Holiday
      const hol = initialHolidays.find((h) => h.date === dateStr);
      if (hol) {
        attendance.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status: 'holiday',
          grossDurationMinutes: 0,
          unpaidBreakMinutes: 0,
          netWorkingMinutes: 0,
          overtimeMinutes: 0,
          isLateArrival: false,
          isEarlyDeparture: false,
          isMissingCheckOut: false,
          notes: hol.name,
        });
        return;
      }

      // For today (i === 0), set active live state
      if (i === 0) {
        let isLate = emp.id === 'EMP-104' || emp.id === 'EMP-108'; // intentional demo test case
        let checkInTime = new Date(d);
        checkInTime.setHours(isLate ? 9 : 8, isLate ? 35 : 55, 0, 0);

        if (emp.id === 'EMP-106') {
          // On leave today
          attendance.push({
            id: `att-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            date: dateStr,
            status: 'paid_leave',
            grossDurationMinutes: 0,
            unpaidBreakMinutes: 0,
            netWorkingMinutes: 0,
            overtimeMinutes: 0,
            isLateArrival: false,
            isEarlyDeparture: false,
            isMissingCheckOut: false,
            notes: 'Approved medical leave',
          });
          return;
        }

        const isWfh = emp.id === 'EMP-103';
        attendance.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status: isWfh ? 'wfh' : 'present',
          checkInTime: checkInTime.toISOString(),
          grossDurationMinutes: 320,
          unpaidBreakMinutes: 40,
          netWorkingMinutes: 280,
          overtimeMinutes: 0,
          isLateArrival: isLate,
          isEarlyDeparture: false,
          isMissingCheckOut: false,
          checkInMethod: isWfh ? 'manual' : 'qr_code',
        });

        // Add today's break for Elena & Marcus
        if (emp.id === 'EMP-103') {
          breaks.push({
            id: `brk-${emp.id}-today`,
            employeeId: emp.id,
            category: 'lunch',
            startTime: new Date(d.setHours(12, 30, 0, 0)).toISOString(),
            endTime: new Date(d.setHours(13, 10, 0, 0)).toISOString(),
            durationMinutes: 40,
            isPaid: false,
            isOverLimit: false,
          });
        }
        return;
      }

      // Historical weekdays: realistic distribution
      const rand = (i + emp.id.charCodeAt(5)) % 100;
      let status: AttendanceStatus = 'present';
      let isLate = false;
      let isEarly = false;
      let isMissingOut = false;
      let checkInH = 8;
      let checkInM = 50 + (rand % 12);
      let checkOutH = 18;
      let checkOutM = 5 + (rand % 35);
      let unpaidBreaks = 45;

      if (rand < 5) {
        status = 'absent';
      } else if (rand < 9) {
        status = 'paid_leave';
      } else if (rand < 12) {
        status = 'half_day';
        checkOutH = 13;
        checkOutM = 15;
      } else if (rand < 25) {
        // Late arrival
        isLate = true;
        checkInH = 9;
        checkInM = 20 + (rand % 15);
      } else if (rand === 26) {
        // Missing checkout demo
        isMissingOut = true;
      } else if (rand > 80 && emp.id === 'EMP-103') {
        status = 'wfh';
      }

      const checkInDate = new Date(d);
      checkInDate.setHours(checkInH, checkInM, 0, 0);

      const checkOutDate = new Date(d);
      checkOutDate.setHours(checkOutH, checkOutM, 0, 0);

      if (status === 'absent' || status === 'paid_leave') {
        attendance.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status,
          grossDurationMinutes: 0,
          unpaidBreakMinutes: 0,
          netWorkingMinutes: 0,
          overtimeMinutes: 0,
          isLateArrival: false,
          isEarlyDeparture: false,
          isMissingCheckOut: false,
        });
      } else {
        const gross = isMissingOut ? 480 : Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / 60000);
        const net = Math.max(0, gross - unpaidBreaks);
        const overtime = net > 480 ? net - 480 : 0;

        attendance.push({
          id: `att-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          status,
          checkInTime: checkInDate.toISOString(),
          checkOutTime: isMissingOut ? undefined : checkOutDate.toISOString(),
          grossDurationMinutes: gross,
          unpaidBreakMinutes: unpaidBreaks,
          netWorkingMinutes: net,
          overtimeMinutes: overtime,
          isLateArrival: isLate,
          isEarlyDeparture: isEarly,
          isMissingCheckOut: isMissingOut,
          checkInMethod: status === 'wfh' ? 'manual' : 'qr_code',
        });

        // Add break for past days
        if (i % 2 === 0) {
          breaks.push({
            id: `brk-${emp.id}-${dateStr}-lunch`,
            employeeId: emp.id,
            category: 'lunch',
            startTime: new Date(new Date(d).setHours(13, 0, 0, 0)).toISOString(),
            endTime: new Date(new Date(d).setHours(13, 42, 0, 0)).toISOString(),
            durationMinutes: 42,
            isPaid: false,
            isOverLimit: false,
          });
        }
      }
    });
  }

  // Pre-seed activity logs for today
  initialEmployees.forEach((emp) => {
    let currentStatus = 'active';
    if (emp.id === 'EMP-106') currentStatus = 'on_leave';
    if (emp.id === 'EMP-104') currentStatus = 'short_break';
    if (emp.id === 'EMP-108') currentStatus = 'idle';

    activityLogs.push({
      id: `act-${emp.id}-today`,
      employeeId: emp.id,
      previousStatus: 'checked_out',
      newStatus: currentStatus as any,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      durationMinutes: 180,
      source: 'employee_action',
    });
  });

  return { attendance, breaks, activityLogs };
}

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'lr-101',
    employeeId: 'EMP-104',
    leaveType: 'sick',
    startDate: '2026-10-14',
    endDate: '2026-10-15',
    isHalfDay: false,
    reason: 'Follow-up dental procedure',
    status: 'pending',
    appliedAt: '2026-10-10T14:30:00Z',
  },
  {
    id: 'lr-102',
    employeeId: 'EMP-103',
    leaveType: 'casual',
    startDate: '2026-10-23',
    endDate: '2026-10-23',
    isHalfDay: true,
    halfDayPeriod: 'second_half',
    reason: 'Family appointment in the afternoon',
    status: 'approved',
    appliedAt: '2026-10-08T09:15:00Z',
    reviewedBy: 'Marcus Vance',
    reviewedAt: '2026-10-08T11:00:00Z',
    reviewComment: 'Approved. Enjoy your afternoon.',
  },
  {
    id: 'lr-103',
    employeeId: 'EMP-106',
    leaveType: 'annual',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    isHalfDay: false,
    reason: 'Annual family vacation',
    status: 'pending',
    appliedAt: '2026-10-09T16:20:00Z',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-10T09:12:00Z',
    actorId: 'EMP-101',
    actorName: 'Sarah Sterling',
    action: 'Policy Update',
    category: 'policy',
    details: 'Configured morning grace period to 15 minutes',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-09T14:45:00Z',
    actorId: 'EMP-102',
    actorName: 'Marcus Vance',
    action: 'Correction Approved',
    category: 'attendance',
    details: 'Approved check-out timestamp adjustment for EMP-103',
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-08T11:00:00Z',
    actorId: 'EMP-102',
    actorName: 'Marcus Vance',
    action: 'Leave Approved',
    category: 'leave',
    details: 'Approved half-day casual leave for Elena Rostova',
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    timestamp: '2026-10-11T09:20:00Z',
    title: 'Late Arrival Detected',
    message: 'David Chen & Liam Gallagher checked in after the 15m grace period.',
    type: 'warning',
    read: false,
    linkTab: 'attendance',
    targetRole: 'manager',
  },
  {
    id: 'notif-2',
    timestamp: '2026-10-10T14:35:00Z',
    title: 'New Leave Request',
    message: 'David Chen submitted a 2-day Sick Leave request awaiting review.',
    type: 'info',
    read: false,
    linkTab: 'leave',
    targetRole: 'manager',
  },
  {
    id: 'notif-3',
    timestamp: '2026-10-10T18:30:00Z',
    title: 'Overtime Alert',
    message: 'Marcus Vance completed 1h 15m overtime today.',
    type: 'success',
    read: true,
    linkTab: 'reports',
    targetRole: 'super_admin',
  },
];
