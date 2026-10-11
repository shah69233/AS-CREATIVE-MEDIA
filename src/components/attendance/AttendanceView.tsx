import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  FileCheck2,
} from 'lucide-react';
import { formatMinutes, formatTimeAmPm } from '../../utils/calculations';
import { AttendanceStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Camera, ShieldCheck } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    employees,
    currentUser,
    reviewCorrection,
    currentTime,
  } = useApp();

  const [viewMode, setViewMode] = useState<'daily' | 'calendar' | 'corrections'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    currentTime.toISOString().split('T')[0]
  );
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewSelfieUrl, setPreviewSelfieUrl] = useState<string | null>(null);

  // Daily records for selected date
  const filteredDailyRecords = useMemo(() => {
    return employees
      .filter((emp) => {
        if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
        if (
          searchQuery &&
          !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !emp.id.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((emp) => {
        const record = attendanceRecords.find(
          (r) => r.employeeId === emp.id && r.date === selectedDate
        );
        return {
          employee: emp,
          record,
        };
      })
      .filter((item) => {
        if (selectedStatus === 'all') return true;
        return item.record?.status === selectedStatus;
      });
  }, [employees, attendanceRecords, selectedDate, selectedDept, selectedStatus, searchQuery]);

  // All pending and historic corrections
  const allCorrections = useMemo(() => {
    return attendanceRecords.flatMap((r) =>
      (r.corrections || []).map((c) => ({
        ...c,
        recordDate: r.date,
        employee: employees.find((e) => e.id === c.employeeId),
      }))
    );
  }, [attendanceRecords, employees]);

  // Calendar month dates generator
  const calendarDays = useMemo(() => {
    const current = new Date(selectedDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr });
    }
    return days;
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with View Switcher */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance & Time Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Check-ins, timestamps, working hour calculations, overtime, and manager correction approvals.
          </p>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Daily Log
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Monthly Calendar
          </button>
          <button
            onClick={() => setViewMode('corrections')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'corrections'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <span>Corrections</span>
            {allCorrections.filter((c) => c.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      </div>

      {/* Daily Log View */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Date Picker & Filter Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                onClick={handleNextDay}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Department and Status Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-44"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="wfh">Work from Home</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
                <option value="paid_leave">Paid Leave</option>
                <option value="weekly_off">Weekly Off</option>
              </select>
            </div>
          </div>

          {/* Detailed Attendance Records Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-medium">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3 text-right">Gross Hours</th>
                    <th className="py-2.5 px-3 text-right">Unpaid Break</th>
                    <th className="py-2.5 px-3 text-right">Net Hours</th>
                    <th className="py-2.5 px-3 text-right">Overtime</th>
                    <th className="py-2.5 px-3 text-center">Live Selfie</th>
                    <th className="py-2.5 px-4 text-center">Punctuality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredDailyRecords.map(({ employee, record }) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={employee.avatarUrl}
                            alt={employee.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {employee.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {employee.id} · {employee.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans capitalize">
                        {record ? (
                          <span
                            className={
                              record.status === 'present'
                                ? 'text-emerald-600 font-semibold'
                                : record.status === 'wfh'
                                ? 'text-indigo-600 font-semibold'
                                : record.status === 'absent'
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-600'
                            }
                          >
                            {record.status.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">No Record</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {formatTimeAmPm(record?.checkInTime)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {formatTimeAmPm(record?.checkOutTime)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatMinutes(record?.grossDurationMinutes || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatMinutes(record?.unpaidBreakMinutes || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                        {formatMinutes(record?.netWorkingMinutes || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">
                        {(record?.overtimeMinutes || 0) > 0
                          ? formatMinutes(record!.overtimeMinutes)
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {record?.checkInSelfieUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewSelfieUrl(record.checkInSelfieUrl!)}
                            className="inline-flex items-center gap-1 group cursor-pointer hover:opacity-85"
                            title="Click to view full verified selfie"
                          >
                            <img
                              src={record.checkInSelfieUrl}
                              alt="Selfie"
                              className="w-7 h-7 rounded-md object-cover ring-1 ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline">
                              View
                            </span>
                          </button>
                        ) : record?.checkInTime ? (
                          <span className="text-[10px] text-slate-400 font-mono">GPS Only</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-sans text-[11px]">
                        {record?.isLateArrival ? (
                          <span className="text-rose-600 font-medium">Late Arrival</span>
                        ) : record?.isMissingCheckOut ? (
                          <span className="text-amber-600 font-medium">Missing Out</span>
                        ) : record?.checkInTime ? (
                          <span className="text-emerald-600">On Time</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Calendar View */}
      {viewMode === 'calendar' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Attendance Calendar for {currentUser.name}
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Month of {new Date(selectedDate).toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 font-semibold text-slate-400 text-[11px]">
                {day}
              </div>
            ))}

            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="p-2 min-h-16 rounded-lg bg-slate-50/20 dark:bg-slate-800/20" />;
              }

              const rec = attendanceRecords.find(
                (r) => r.employeeId === currentUser.id && r.date === item.dateStr
              );

              return (
                <div
                  key={item.dateStr}
                  onClick={() => {
                    setSelectedDate(item.dateStr);
                    setViewMode('daily');
                  }}
                  className={`p-2 min-h-16 rounded-lg border text-left cursor-pointer transition-all ${
                    rec?.status === 'present'
                      ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : rec?.status === 'wfh'
                      ? 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : rec?.status === 'weekly_off'
                      ? 'border-slate-200/50 bg-slate-100/50 dark:bg-slate-800/40 text-slate-400'
                      : rec?.status === 'absent'
                      ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.dayNumber}
                    </span>
                    {rec?.isLateArrival && (
                      <span className="text-[9px] text-rose-600 font-bold">Late</span>
                    )}
                  </div>
                  {rec && rec.status !== 'weekly_off' && (
                    <div className="mt-1 text-[10px] font-mono leading-tight">
                      <div className="font-semibold capitalize text-slate-900 dark:text-white">
                        {rec.status.replace('_', ' ')}
                      </div>
                      {rec.netWorkingMinutes > 0 && (
                        <div className="text-slate-500">{formatMinutes(rec.netWorkingMinutes)}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Corrections Queue View */}
      {viewMode === 'corrections' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Attendance Corrections & Adjustment Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of requested check-in/checkout amendments with reviewer approval status.
              </p>
            </div>
          </div>

          {allCorrections.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No correction requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {allCorrections.map((corr) => (
                <div
                  key={corr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={corr.employee?.avatarUrl}
                        alt={corr.employee?.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {corr.employee?.name}
                        </span>
                        <span className="text-slate-400 font-mono ml-2">
                          (Target Date: {corr.recordDate})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                        corr.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : corr.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {corr.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Requested Check-In</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatTimeAmPm(corr.requestedCheckIn)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Requested Check-Out</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatTimeAmPm(corr.requestedCheckOut)}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300 italic">
                    Reason: "{corr.reason}"
                  </div>

                  {corr.status === 'pending' && currentUser.role !== 'employee' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => reviewCorrection(corr.id, 'rejected', 'Declined by reviewer')}
                        className="px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => reviewCorrection(corr.id, 'approved', 'Approved')}
                        className="px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                      >
                        Approve & Amend
                      </button>
                    </div>
                  )}

                  {corr.status !== 'pending' && corr.reviewedBy && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Reviewed by {corr.reviewedBy} on {new Date(corr.reviewedAt || '').toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selfie Zoom & Digital Verification Modal */}
      <Modal
        isOpen={Boolean(previewSelfieUrl)}
        onClose={() => setPreviewSelfieUrl(null)}
        title="Live Selfie Attendance Verification"
        maxWidth="md"
      >
        <div className="space-y-3 p-1">
          {previewSelfieUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-xl">
              <img
                src={previewSelfieUrl}
                alt="Verified Selfie"
                className="w-full aspect-square object-cover"
              />
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-white space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Biometric Facial Presence Verified</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Stamping verified by AS Creative Media. Captured directly via device camera during compulsory check-in.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
