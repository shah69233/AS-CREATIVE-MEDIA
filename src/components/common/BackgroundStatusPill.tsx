import React, { useState } from 'react';
import { useBackgroundTracking } from '../../hooks/useBackgroundTracking';
import { BackgroundTrackingMonitorModal } from './BackgroundTrackingMonitorModal';
import { Satellite, ShieldCheck, Power } from 'lucide-react';

interface BackgroundStatusPillProps {
  className?: string;
}

export const BackgroundStatusPill: React.FC<BackgroundStatusPillProps> = ({
  className = '',
}) => {
  const { isEnabled, isWatchingGps, gpsAccuracy, distanceToOfficeMeters } =
    useBackgroundTracking();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all shadow-xs cursor-pointer ${
          isEnabled
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
        } ${className}`}
        title="Background Live Tracking Status & Diagnostics"
      >
        <span className="relative flex h-2 w-2">
          {isEnabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </span>

        <Satellite className="w-3.5 h-3.5 shrink-0" />

        <span className="hidden md:inline font-bold">
          {isEnabled ? 'Background GPS Live' : 'Background GPS Standby'}
        </span>

        {isEnabled && distanceToOfficeMeters !== null && (
          <span className="hidden lg:inline text-[10px] font-mono opacity-80 border-l border-emerald-300 dark:border-emerald-700 pl-1.5">
            {distanceToOfficeMeters}m
          </span>
        )}
      </button>

      <BackgroundTrackingMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
