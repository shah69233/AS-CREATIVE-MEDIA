export type UserRole = 'super_admin' | 'manager' | 'employee';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'paid_leave'
  | 'unpaid_leave'
  | 'weekly_off'
  | 'holiday'
  | 'wfh';

export type ActivityStatus =
  | 'active'
  | 'idle'
  | 'lunch'
  | 'short_break'
  | 'meeting'
  | 'field_work'
  | 'wfh'
  | 'checked_out'
  | 'on_leave'
  | 'off_duty';

export type BreakCategory = 'lunch' | 'tea' | 'personal' | 'official';

export interface BreakSession {
  id: string;
  employeeId: string;
  category: BreakCategory;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationMinutes: number; // calculated or live
  isPaid: boolean;
  isOverLimit: boolean;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  previousStatus: ActivityStatus;
  newStatus: ActivityStatus;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  reason?: string;
  source: 'employee_action' | 'system_idle_rule' | 'manager_override';
}

export type PortalMode = 'admin' | 'staff';

export interface LocationRecord {
  lat: number;
  lng: number;
  accuracy?: number;
  address: string;
  distanceMeters: number;
  isWithinGeofence: boolean;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  grossDurationMinutes: number;
  unpaidBreakMinutes: number;
  netWorkingMinutes: number;
  overtimeMinutes: number;
  isLateArrival: boolean;
  isEarlyDeparture: boolean;
  isMissingCheckOut: boolean;
  checkInLocation?: LocationRecord;
  checkOutLocation?: LocationRecord;
  checkInMethod?: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified';
  checkOutMethod?: 'gps_live_location' | 'manual' | 'qr_code' | 'qr_and_gps_verified';
  scannedQrCode?: string;
  checkInSelfieUrl?: string;
  checkOutSelfieUrl?: string;
  notes?: string;
  corrections?: AttendanceCorrection[];
}

export interface AttendanceCorrection {
  id: string;
  recordId: string;
  employeeId: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Employee {
  id: string; // EMP-101
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  department: string;
  designation: string;
  role: UserRole;
  managerId?: string;
  joiningDate: string; // YYYY-MM-DD
  employmentStatus: 'active' | 'probation' | 'on_leave' | 'inactive';
  dailyWorkingHours: number; // typically 8 or 9
  shiftStart: string; // "09:00"
  shiftEnd: string; // "18:00"
  weeklyOffDays: number[]; // 0 for Sunday, 6 for Saturday
  personalEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  residentialAddress?: string;
  city?: string;
  leaveBalance: {
    casual: number;
    sick: number;
    annual: number;
    unpaid: number;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'casual' | 'sick' | 'annual' | 'unpaid';
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'first_half' | 'second_half';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'company' | 'optional';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  category: 'attendance' | 'employee' | 'leave' | 'policy' | 'system';
  details: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  linkTab?: string;
  targetRole?: UserRole | 'all';
}

export interface CompanySettings {
  companyName: string;
  companyTagline: string;
  workSchedule: {
    shiftStart: string; // "09:00"
    shiftEnd: string; // "18:00"
    gracePeriodMinutes: number; // 15 mins
    halfDayThresholdHours: number; // 4.5
    fullDayRequiredHours: number; // 8.0
    overtimeMinimumMinutes: number; // 30 mins
  };
  breakPolicies: {
    lunchLimitMinutes: number; // 45
    lunchIsPaid: boolean; // false
    teaLimitMinutes: number; // 15
    teaIsPaid: boolean; // true
    personalLimitMinutes: number; // 20
    personalIsPaid: boolean; // false
  };
  geofence: {
    enabled: boolean;
    officeLat: number;
    officeLng: number;
    radiusMeters: number; // 200
  };
  notificationsEnabled: {
    lateArrival: boolean;
    breakOverlimit: boolean;
    missingCheckout: boolean;
    leaveApprovalNeeded: boolean;
    correctionApprovalNeeded: boolean;
  };
}
