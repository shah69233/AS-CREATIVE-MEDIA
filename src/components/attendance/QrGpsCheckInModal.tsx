import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { QrCode, MapPin, Laptop, CheckCircle2, AlertCircle } from 'lucide-react';

interface QrGpsCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrGpsCheckInModal: React.FC<QrGpsCheckInModalProps> = ({ isOpen, onClose }) => {
  const { checkIn, settings, currentUser } = useApp();
  const [activeMode, setActiveMode] = useState<'qr' | 'gps' | 'wfh' | 'direct'>('direct');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [wfhReason, setWfhReason] = useState('');

  const handleExecuteCheckIn = (method: 'manual' | 'qr_code' | 'gps_geofence') => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedSuccess(true);
      checkIn(
        {
          lat: settings.geofence.officeLat,
          lng: settings.geofence.officeLng,
          accuracy: 5,
          address: 'Apex HQ - Building 4, Floor 3',
          distanceMeters: 15,
          isWithinGeofence: true,
          timestamp: new Date().toISOString(),
        },
        method === 'qr_code' ? 'qr_code' : 'gps_live_location'
      );
      setTimeout(() => {
        setVerifiedSuccess(false);
        onClose();
      }, 1000);
    }, 700);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Check-In Verification" maxWidth="md">
      <div className="space-y-5">
        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveMode('direct')}
            className={`py-2 px-1 text-center rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'direct'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveMode('qr')}
            className={`py-2 px-1 text-center rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'qr'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Office QR
          </button>
          <button
            onClick={() => setActiveMode('gps')}
            className={`py-2 px-1 text-center rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'gps'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            GPS Fence
          </button>
          <button
            onClick={() => setActiveMode('wfh')}
            className={`py-2 px-1 text-center rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'wfh'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            WFH
          </button>
        </div>

        {/* Tab contents */}
        {activeMode === 'direct' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Standard Desk Check-In
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Recording attendance for {currentUser.name} at {settings.companyName}.
              </p>
            </div>
            <button
              onClick={() => handleExecuteCheckIn('manual')}
              disabled={isVerifying || verifiedSuccess}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {isVerifying ? 'Verifying...' : verifiedSuccess ? 'Verified & Checked In!' : 'Confirm Check-In'}
            </button>
          </div>
        )}

        {activeMode === 'qr' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 inline-block mx-auto">
              {/* Simulated QR Code graphic */}
              <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center mx-auto">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-900 rounded">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${(i * 7) % 3 === 0 ? 'bg-white' : 'bg-transparent'} rounded-xs`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Official Apex HQ Terminal QR Code · Validated for Today
            </div>
            <button
              onClick={() => handleExecuteCheckIn('qr_code')}
              disabled={isVerifying || verifiedSuccess}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {isVerifying ? 'Scanning Terminal...' : verifiedSuccess ? 'QR Matched! Checked In' : 'Simulate Scan Office Terminal QR'}
            </button>
          </div>
        )}

        {activeMode === 'gps' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Configured Office:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Apex HQ Building 4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Geofence Radius:</span>
                <span className="font-mono text-slate-900 dark:text-white">{settings.geofence.radiusMeters}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Detected Distance:</span>
                <span className="font-mono text-emerald-600 font-semibold">18m (Within perimeter)</span>
              </div>
            </div>
            <button
              onClick={() => handleExecuteCheckIn('gps_geofence')}
              disabled={isVerifying || verifiedSuccess}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {isVerifying ? 'Locking GPS Coordinates...' : verifiedSuccess ? 'Perimeter Verified! Checked In' : 'Verify Location & Check In'}
            </button>
          </div>
        )}

        {activeMode === 'wfh' && (
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                Work From Home Note (optional)
              </label>
              <input
                type="text"
                value={wfhReason}
                onChange={(e) => setWfhReason(e.target.value)}
                placeholder="e.g. Remote sprint focus day, client call"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => handleExecuteCheckIn('manual')}
              disabled={isVerifying || verifiedSuccess}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Laptop className="w-4 h-4" />
              {isVerifying ? 'Submitting WFH status...' : verifiedSuccess ? 'WFH Checked In!' : 'Check In as Work From Home'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
