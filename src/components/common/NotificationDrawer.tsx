import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { AlertCircle, AlertTriangle, CheckCircle, Info, CheckCheck } from 'lucide-react';
import { formatTimeAmPm } from '../../utils/calculations';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Center" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {notifications.length} alerts & system events
          </span>
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No notifications</div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.linkTab) {
                    onNavigateTab(n.linkTab);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  n.read
                    ? 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
