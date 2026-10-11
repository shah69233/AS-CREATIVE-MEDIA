import React, { useState } from 'react';
import { Modal } from './Modal';
import { useBackgroundTracking } from '../../hooks/useBackgroundTracking';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Satellite,
  Activity,
  Cpu,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  RefreshCw,
  Power,
  Zap,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface BackgroundTrackingMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundTrackingMonitorModal: React.FC<BackgroundTrackingMonitorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isEnabled,
    isWakeLocked,
    isWatchingGps,
    isWorkerActive,
    lastPingTime,
    totalPings,
    currentLocation,
    gpsAccuracy,
    distanceToOfficeMeters,
    isWithinOfficeGeofence,
    appVisibility,
    toggleBackgroundTracking,
  } = useBackgroundTracking();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Background Live Tracking & PWA Engine"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Status Hero */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isEnabled
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/40 text-white'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                  isEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                }`}
              >
                <Satellite className={`w-6 h-6 ${isEnabled ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">
                    Continuous Background Tracking Engine
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isEnabled ? 'Active in Background' : 'Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Operates even when the screen is locked, tab is minimized, or phone switches apps.
                </p>
              </div>
            </div>

            <button
              onClick={toggleBackgroundTracking}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                isEnabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isEnabled ? 'Pause Tracking' : 'Enable Background Mode'}</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars of Background Resilience Grid */}
        <div>
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            System Subsystems & Live Telemetry
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Continuous Geolocation Watcher */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Satellite className="w-4 h-4 text-emerald-500" />
                  <span>Continuous GPS Watcher</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isWatchingGps
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isWatchingGps ? 'Tracking Active' : 'Standby'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5">
                <div>
                  Lat/Lng:{' '}
                  {currentLocation
                    ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                    : 'Acquiring...'}
                </div>
                <div className="flex justify-between">
                  <span>Accuracy: ±{gpsAccuracy || 8}m</span>
                  <span>Office: {distanceToOfficeMeters !== null ? `${distanceToOfficeMeters}m` : '-'}</span>
                </div>
              </div>
            </div>

            {/* 2. Web Worker Heartbeat (Timer Unthrottler) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>Web Worker Heartbeat</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isWorkerActive
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isWorkerActive ? 'Unthrottled' : 'Idle'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Heartbeat Pings:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{totalPings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Tick:</span>
                  <span>{lastPingTime || 'Waiting...'}</span>
                </div>
              </div>
            </div>

            {/* 3. Screen Wake Lock API */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Screen Wake Lock</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isWakeLocked
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isWakeLocked ? 'Locked / Kept Awake' : 'System Default'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prevents operating system power-saving from sleeping the tracking process.
              </p>
            </div>

            {/* 4. Tab Visibility & Keep-Alive */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>Tab Lifecycle Status</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    appVisibility === 'visible'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {appVisibility === 'visible' ? 'Foreground' : 'Background Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Timestamp drift compensation automatically syncs work seconds upon return.
              </p>
            </div>
          </div>
        </div>

        {/* PWA Mobile Installation Section */}
        <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Run as Mobile App (PWA)
                </h4>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                  {isInstalled
                    ? 'App is currently installed and running in standalone native mode.'
                    : 'Install directly to your home screen for flawless background GPS and zero browser interference.'}
                </p>
              </div>
            </div>

            {isInstalled ? (
              <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Installed
              </span>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                iOS Install
              </button>
            ) : (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                PWA Ready
              </span>
            )}
          </div>

          {/* iOS Safari Guide Accordion */}
          {showIOSInstructions && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-2">
              <div className="font-bold text-indigo-950 dark:text-indigo-200">
                How to install on iPhone & iPad:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari toolbar.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> in top right. Launch from your home screen.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Engineered by AS Creative Media</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </Modal>
  );
};
