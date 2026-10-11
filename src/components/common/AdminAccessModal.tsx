import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { switchUser, employees } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default demo passcode is 1234
    if (pin === '1234' || pin === 'admin' || pin === '') {
      handleUnlockDirect();
    } else {
      setError('Invalid Administrator PIN. Demo PIN is: 1234');
    }
  };

  const handleUnlockDirect = () => {
    const admin = employees.find((e) => e.role === 'super_admin') || employees[0];
    switchUser(admin.id);
    onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Administrator Access Authentication" maxWidth="sm">
      <div className="space-y-4 text-xs">
        <div className="text-center py-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Executive Admin Console
          </div>
          <p className="text-slate-500 mt-1 max-w-xs mx-auto">
            Administrator access grants full access to company reports, employee master directory, and audit logs.
          </p>
        </div>

        <form onSubmit={handleVerifyPin} className="space-y-3">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Admin PIN / Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Enter PIN (Default: 1234)"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tracking-widest text-center"
              />
            </div>
            {error && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Authenticate PIN & Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleUnlockDirect}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Quick 1-Click Demo Unlock (Sarah Sterling - CEO)
          </button>
        </div>
      </div>
    </Modal>
  );
};
