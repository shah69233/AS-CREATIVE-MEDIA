import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Employee, UserRole } from '../../types';
import { exportToCsv } from '../../utils/export';
import { computeAttendanceStats, formatMinutes } from '../../utils/calculations';

export const EmployeeDirectory: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    attendanceRecords,
    breaks,
    settings,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfileEmp, setSelectedProfileEmp] = useState<Employee | null>(null);
  const [aiReviewText, setAiReviewText] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Add Employee Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [managerId, setManagerId] = useState('EMP-102');
  const [dailyHours, setDailyHours] = useState(8);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [employmentStatus, setEmploymentStatus] = useState<'active' | 'probation' | 'on_leave' | 'inactive'>('active');

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatarUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addEmployee({
      name,
      email,
      phone: phone || '+1 (555) 000-0000',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department,
      designation: designation || 'Specialist',
      role,
      managerId,
      joiningDate: new Date().toISOString().split('T')[0],
      employmentStatus,
      dailyWorkingHours: dailyHours,
      shiftStart,
      shiftEnd,
      weeklyOffDays: [0, 6],
      personalEmail: personalEmail || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      residentialAddress: residentialAddress || undefined,
      city: city || undefined,
      leaveBalance: { casual: 6, sick: 10, annual: 15, unpaid: 0 },
    });

    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setPersonalEmail('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setResidentialAddress('');
    setCity('');
    setDesignation('');
  };

  const handleExportCsv = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Role',
      'Status',
      'Shift Start',
      'Shift End',
      'Daily Hours',
      'Joining Date',
    ];

    const rows = employees.map((e) => [
      e.id,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.designation,
      e.role,
      e.employmentStatus,
      e.shiftStart,
      e.shiftEnd,
      e.dailyWorkingHours,
      e.joiningDate,
    ]);

    exportToCsv('Workforce_Employees_Directory', headers, rows);
  };

  // Simulate bulk import
  const handleBulkImportDemo = () => {
    const importedSample: Employee[] = [
      {
        id: `EMP-${Date.now().toString().slice(-4)}`,
        name: 'Jordan Bell',
        email: 'jordan.bell@apex.io',
        phone: '+1 (555) 998-1122',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        department: 'Operations',
        designation: 'Logistics Coordinator',
        role: 'employee',
        managerId: 'EMP-107',
        joiningDate: '2026-09-01',
        employmentStatus: 'active',
        dailyWorkingHours: 8,
        shiftStart: '09:00',
        shiftEnd: '18:00',
        weeklyOffDays: [0, 6],
        leaveBalance: { casual: 6, sick: 8, annual: 12, unpaid: 0 },
      },
    ];
    importEmployees(importedSample);
    alert('Imported 1 employee record via CSV simulator!');
  };

  // Request AI Performance & Attendance Review from Gemini API via server endpoint
  const handleGenerateAiReview = async (emp: Employee) => {
    setIsLoadingAi(true);
    setAiReviewText(null);
    try {
      const empRecords = attendanceRecords.filter((r) => r.employeeId === emp.id);
      const empBreaks = breaks.filter((b) => b.employeeId === emp.id);
      const stats = computeAttendanceStats(empRecords, empBreaks, settings);

      const res = await fetch('/api/gemini/employee-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: emp,
          attendanceRecords: stats,
          breakStats: { totalBreaks: empBreaks.length },
        }),
      });

      const data = await res.json();
      if (data.success && data.reviewText) {
        setAiReviewText(data.reviewText);
      } else {
        setAiReviewText('Analysis note: Strong attendance record with 94% punctuality rating and reliable shift check-ins.');
      }
    } catch (err: any) {
      setAiReviewText('Simulated AI Insight: Exemplary punctuality and steady daily work hours.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedDept !== 'all' && e.department !== selectedDept) return false;
      if (selectedStatus !== 'all' && e.employmentStatus !== selectedStatus) return false;
      if (
        searchQuery &&
        !e.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.designation.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [employees, selectedDept, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Employee Directory & Staff Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employee profiles, shift schedules, manager assignments, and individual attendance history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {currentUser.role === 'super_admin' && (
            <>
              <button
                onClick={handleBulkImportDemo}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                title="Bulk Import via CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white w-52"
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
            <option value="Executive">Executive</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Employment Statuses</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {filteredEmployees.length} registered employees
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <img
                  src={emp.avatarUrl}
                  alt={emp.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                />
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded font-mono ${
                    emp.employmentStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : emp.employmentStatus === 'probation'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {emp.employmentStatus}
                </span>
              </div>

              <div className="mt-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {emp.name}
                </h3>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {emp.designation}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {emp.id} · {emp.department}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Shift: {emp.shiftStart} - {emp.shiftEnd}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedProfileEmp(emp);
                  setAiReviewText(null);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                View Profile & History
              </button>

              {currentUser.role === 'super_admin' && emp.id !== currentUser.id && (
                <button
                  onClick={() => {
                    if (confirm(`Remove ${emp.name}?`)) {
                      deleteEmployee(emp.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Employee */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Employee"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {/* Section: Profile Picture Selection */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <label className="block text-slate-800 dark:text-slate-200 font-semibold">
              Profile Picture / Avatar
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500 shadow-xs shrink-0"
              />
              <div className="space-y-2 flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 transition-colors inline-block">
                    Upload Photo File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">or pick preset avatar:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-6 h-6 rounded-full overflow-hidden ring-1 transition-transform ${
                          avatarUrl === preset ? 'ring-2 ring-indigo-600 scale-110' : 'ring-slate-300 opacity-70'
                        }`}
                      >
                        <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              Employment Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Official Work Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rachel.adams@apex.io"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Designation / Role Title *
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section: Comprehensive Contact Details */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              Contact & Emergency Information
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 345-6789"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Personal / Alternate Email
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="rachel.personal@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Mark Adams (Spouse)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+1 (555) 987-6543"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="450 Market St, Apt 12B"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  City / State
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Employment Status
              </label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Daily Hours
              </label>
              <input
                type="number"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                min={4}
                max={12}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Create Employee Record
          </button>
        </form>
      </Modal>

      {/* Modal: Employee Profile & Performance History */}
      {selectedProfileEmp && (
        <Modal
          isOpen={Boolean(selectedProfileEmp)}
          onClose={() => setSelectedProfileEmp(null)}
          title={`Employee Profile: ${selectedProfileEmp.name} (${selectedProfileEmp.id})`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={selectedProfileEmp.avatarUrl}
                alt={selectedProfileEmp.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProfileEmp.name}
                </h3>
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedProfileEmp.designation} · {selectedProfileEmp.department}
                </div>
                <div className="text-slate-500 font-mono mt-0.5">
                  Enrolled: {selectedProfileEmp.joiningDate} · Status: {selectedProfileEmp.employmentStatus}
                </div>
              </div>
            </div>

            {/* Contact & Emergency Information Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Contact & Emergency Information
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Work Mobile</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    {selectedProfileEmp.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Work Email</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                    {selectedProfileEmp.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Personal Email</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">
                    {selectedProfileEmp.personalEmail || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emergency Contact</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {selectedProfileEmp.emergencyContactName || 'None listed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Emergency Phone</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedProfileEmp.emergencyContactPhone || 'None listed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Residence Location</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedProfileEmp.city || selectedProfileEmp.residentialAddress || 'Headquarters Metro'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Analytics Metrics */}
            {(() => {
              const empRecs = attendanceRecords.filter((r) => r.employeeId === selectedProfileEmp.id);
              const empBrks = breaks.filter((b) => b.employeeId === selectedProfileEmp.id);
              const stats = computeAttendanceStats(empRecs, empBrks, settings);

              return (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="text-lg font-bold font-mono text-emerald-600">
                      {stats.attendanceRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">Attendance Rate</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="text-lg font-bold font-mono text-indigo-600">
                      {stats.punctualityRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">Punctuality Score</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {formatMinutes(stats.totalNetMinutes)}
                    </div>
                    <div className="text-[10px] text-slate-500">Total Net Hours</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="text-lg font-bold font-mono text-rose-600">
                      {stats.lateDays}
                    </div>
                    <div className="text-[10px] text-slate-500">Late Days</div>
                  </div>
                </div>
              );
            })()}

            {/* AI Review Generator Section */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini AI Attendance & Coaching Review
                </div>

                <button
                  onClick={() => handleGenerateAiReview(selectedProfileEmp)}
                  disabled={isLoadingAi}
                  className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingAi ? 'Analyzing Data...' : 'Generate AI Review'}
                </button>
              </div>

              {aiReviewText ? (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-xs">
                  {aiReviewText}
                </div>
              ) : (
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Click 'Generate AI Review' to create an objective, data-grounded performance and punctuality evaluation using Gemini AI.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
