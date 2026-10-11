import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Shield,
  Clock,
  Coffee,
  MapPin,
  Bell,
  Save,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { CompanySettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, auditLogs, resetToDemoData, currentUser } = useApp();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Settings & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure company branding, shifts, break limits, geofence parameters, and view audit history.
          </p>
        </div>

        <button
          onClick={resetToDemoData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Settings */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Shield className="w-4 h-4 text-indigo-600" />
            Company Branding
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Tagline / Header Description
              </label>
              <input
                type="text"
                value={formData.companyTagline}
                onChange={(e) => setFormData({ ...formData, companyTagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Work Schedule & Punctuality Policy */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-indigo-600" />
            Working Hours & Shift Policy
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={formData.workSchedule.shiftStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workSchedule: { ...formData.workSchedule, shiftStart: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={formData.workSchedule.shiftEnd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workSchedule: { ...formData.workSchedule, shiftEnd: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Morning Grace Period (mins)
              </label>
              <input
                type="number"
                value={formData.workSchedule.gracePeriodMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workSchedule: {
                      ...formData.workSchedule,
                      gracePeriodMinutes: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Required Shift Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.workSchedule.fullDayRequiredHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workSchedule: {
                      ...formData.workSchedule,
                      fullDayRequiredHours: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Break Management Policies */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Coffee className="w-4 h-4 text-indigo-600" />
            Break Allowances & Paid / Unpaid Configuration
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">Lunch Break</div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Allowed Limit (minutes)</label>
                <input
                  type="number"
                  value={formData.breakPolicies.lunchLimitMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: {
                        ...formData.breakPolicies,
                        lunchLimitMinutes: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.breakPolicies.lunchIsPaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: { ...formData.breakPolicies, lunchIsPaid: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600"
                />
                Count as Paid Work
              </label>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">Tea Break</div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Allowed Limit (minutes)</label>
                <input
                  type="number"
                  value={formData.breakPolicies.teaLimitMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: {
                        ...formData.breakPolicies,
                        teaLimitMinutes: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.breakPolicies.teaIsPaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: { ...formData.breakPolicies, teaIsPaid: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600"
                />
                Count as Paid Work
              </label>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">Personal Break</div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Allowed Limit (minutes)</label>
                <input
                  type="number"
                  value={formData.breakPolicies.personalLimitMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: {
                        ...formData.breakPolicies,
                        personalLimitMinutes: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.breakPolicies.personalIsPaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakPolicies: { ...formData.breakPolicies, personalIsPaid: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600"
                />
                Count as Paid Work
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save Configuration Changes
          </button>
          {isSaved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings successfully saved!
            </span>
          )}
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          System Audit Trail & Compliance Log
        </h2>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Actor</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    {log.actorName}
                  </td>
                  <td className="py-2 px-3 font-sans text-indigo-600 dark:text-indigo-400">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 font-sans capitalize text-slate-500">
                    {log.category}
                  </td>
                  <td className="py-2 px-4 font-sans text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
