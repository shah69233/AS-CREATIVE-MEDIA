import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { ShieldCheck, UserCheck, User } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { employees, currentUser, switchUser } = useApp();

  const handleSelect = (id: string) => {
    switchUser(id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch User Role & Persona" maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select any registered employee or persona below to instantly experience the application from their perspective (Super Admin, Team Manager, or Employee self-service).
        </p>

        <div className="space-y-2">
          {employees.map((emp) => {
            const isSelected = emp.id === currentUser.id;
            const roleBadge = {
              super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
              manager: { label: 'Manager', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
              employee: { label: 'Employee', icon: User, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800' },
            }[emp.role];

            const Icon = roleBadge.icon;

            return (
              <button
                key={emp.id}
                onClick={() => handleSelect(emp.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatarUrl}
                    alt={emp.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {emp.name}
                      {isSelected && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                          (Current Active)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {emp.designation} · {emp.department}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{roleBadge.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
