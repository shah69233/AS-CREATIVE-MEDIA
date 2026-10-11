import { AttendanceRecord, BreakSession, CompanySettings } from '../types';

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function formatTimeAmPm(isoOrTimeStr?: string): string {
  if (!isoOrTimeStr) return '--:--';
  if (isoOrTimeStr.length === 5 && isoOrTimeStr.includes(':')) {
    // Already HH:MM
    const [h, m] = isoOrTimeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  }
  try {
    const d = new Date(isoOrTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrTimeStr;
  }
}

export function calculateDifferenceInMinutes(startIso: string, endIso: string): number {
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMs = end - start;
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
}

export function isCheckInLate(checkInIso: string, shiftStart: string, graceMinutes: number): boolean {
  try {
    const d = new Date(checkInIso);
    const [shiftHour, shiftMin] = shiftStart.split(':').map(Number);
    const scheduledStart = new Date(d);
    scheduledStart.setHours(shiftHour, shiftMin, 0, 0);

    const diffMinutes = (d.getTime() - scheduledStart.getTime()) / (1000 * 60);
    return diffMinutes > graceMinutes;
  } catch {
    return false;
  }
}

export function isCheckOutEarly(checkOutIso: string, shiftEnd: string): boolean {
  try {
    const d = new Date(checkOutIso);
    const [shiftHour, shiftMin] = shiftEnd.split(':').map(Number);
    const scheduledEnd = new Date(d);
    scheduledEnd.setHours(shiftHour, shiftMin, 0, 0);

    const diffMinutes = (scheduledEnd.getTime() - d.getTime()) / (1000 * 60);
    return diffMinutes > 10; // Left more than 10 mins before shift end
  } catch {
    return false;
  }
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function computeAttendanceStats(
  records: AttendanceRecord[],
  breaks: BreakSession[],
  settings: CompanySettings
) {
  let totalGrossMinutes = 0;
  let totalUnpaidBreakMinutes = 0;
  let totalNetMinutes = 0;
  let totalOvertimeMinutes = 0;
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let lateDays = 0;
  let missingCheckoutCount = 0;

  records.forEach((record) => {
    totalGrossMinutes += record.grossDurationMinutes || 0;
    totalUnpaidBreakMinutes += record.unpaidBreakMinutes || 0;
    totalNetMinutes += record.netWorkingMinutes || 0;
    totalOvertimeMinutes += record.overtimeMinutes || 0;

    if (record.status === 'present' || record.status === 'wfh') {
      presentDays += 1;
    } else if (record.status === 'half_day') {
      halfDays += 1;
    } else if (record.status === 'absent') {
      absentDays += 1;
    } else if (record.status === 'paid_leave' || record.status === 'unpaid_leave') {
      leaveDays += 1;
    }

    if (record.isLateArrival) lateDays += 1;
    if (record.isMissingCheckOut) missingCheckoutCount += 1;
  });

  const scheduledWorkDays = records.filter(
    (r) => r.status !== 'weekly_off' && r.status !== 'holiday'
  ).length || 1;

  const presentEquivalent = presentDays + halfDays * 0.5;
  const attendanceRate = Math.min(100, Math.round((presentEquivalent / scheduledWorkDays) * 100));
  const punctualityRate =
    presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100;

  return {
    totalGrossMinutes,
    totalUnpaidBreakMinutes,
    totalNetMinutes,
    totalOvertimeMinutes,
    presentDays,
    halfDays,
    absentDays,
    leaveDays,
    lateDays,
    missingCheckoutCount,
    scheduledWorkDays,
    attendanceRate,
    punctualityRate: Math.max(0, punctualityRate),
  };
}
