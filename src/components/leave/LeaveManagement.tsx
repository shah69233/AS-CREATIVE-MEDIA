import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { LeaveRequest } from '../../types';

export const LeaveManagement: React.FC = () => {
  const {
    currentUser,
    leaveRequests,
    applyLeave,
    reviewLeave,
    holidays,
    addHoliday,
    employees,
  } = useApp();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Leave Form
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'annual' | 'unpaid'>('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');

  // Holiday Form
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState<'national' | 'company' | 'optional'>('national');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;
    applyLeave({
      leaveType,
      startDate,
      endDate,
      isHalfDay,
      reason,
    });
    setIsApplyModalOpen(false);
    setReason('');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) return;
    addHoliday({
      name: holidayName,
      date: holidayDate,
      type: holidayType,
    });
    setIsAddHolidayModalOpen(false);
    setHolidayName('');
    setHolidayDate('');
  };

  const filteredRequests = leaveRequests
    .map((r) => ({
      ...r,
      applicant: employees.find((e) => e.id === r.employeeId),
    }))
    .filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Leave & Holiday Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Leave balance quotas, formal applications, manager approvals, and official corporate holiday calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser.role === 'super_admin' && (
            <button
              onClick={() => setIsAddHolidayModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Holiday
            </button>
          )}
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Strip for current user */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <h2 className="text-xs font-semibold text-slate-500 mb-3">
          Your Current Leave Allowances ({currentUser.name})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currentUser.leaveBalance.casual}
            </div>
            <div className="text-xs text-slate-500 mt-1">Casual Leave</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currentUser.leaveBalance.sick}
            </div>
            <div className="text-xs text-slate-500 mt-1">Sick Leave</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currentUser.leaveBalance.annual}
            </div>
            <div className="text-xs text-slate-500 mt-1">Annual Paid Leave</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currentUser.leaveBalance.unpaid}
            </div>
            <div className="text-xs text-slate-500 mt-1">Unpaid Days Taken</div>
          </div>
        </div>
      </div>

      {/* Grid: Leave Requests & Holiday Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Requests Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Leave Requests & History
            </h2>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-medium">
                  <th className="py-2.5 px-4">Applicant</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  {currentUser.role !== 'employee' && (
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <img
                        src={r.applicant?.avatarUrl}
                        alt={r.applicant?.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      {r.applicant?.name}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-700 dark:text-slate-300">
                      {r.leaveType}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {r.startDate} to {r.endDate}
                      {r.isHalfDay && ' (0.5d)'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {r.reason}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded font-mono ${
                          r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    {currentUser.role !== 'employee' && (
                      <td className="py-2.5 px-4 text-right">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => reviewLeave(r.id, 'rejected')}
                              className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => reviewLeave(r.id, 'approved')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.reviewedBy || 'Reviewed'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Holiday Calendar List */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Upcoming Public Holidays
          </h2>
          <div className="space-y-2.5 text-xs max-h-96 overflow-y-auto">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {h.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{h.date}</div>
                </div>
                <span className="text-[10px] uppercase font-mono text-slate-500">
                  {h.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Apply Leave */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Submit Leave Application"
        maxWidth="md"
      >
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="casual">Casual Leave ({currentUser.leaveBalance.casual} left)</option>
              <option value="sick">Sick Leave ({currentUser.leaveBalance.sick} left)</option>
              <option value="annual">Annual Leave ({currentUser.leaveBalance.annual} left)</option>
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfday_modal"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label htmlFor="halfday_modal" className="text-slate-700 dark:text-slate-300">
              Half-day leave (0.5 day deduction)
            </label>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for this leave request..."
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Submit Application
          </button>
        </form>
      </Modal>

      {/* Modal: Add Holiday */}
      <Modal
        isOpen={isAddHolidayModalOpen}
        onClose={() => setIsAddHolidayModalOpen(false)}
        title="Add Company Holiday"
        maxWidth="md"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Holiday Name
            </label>
            <input
              type="text"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="e.g. Founders Day, New Year"
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Date
            </label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Type
            </label>
            <select
              value={holidayType}
              onChange={(e) => setHolidayType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="national">National Holiday</option>
              <option value="company">Company Holiday</option>
              <option value="optional">Optional / Floating Holiday</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Save Holiday
          </button>
        </form>
      </Modal>
    </div>
  );
};
