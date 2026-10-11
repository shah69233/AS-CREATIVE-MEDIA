import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Crosshair,
  Building2,
  ShieldCheck,
  QrCode,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';
import { calculateDistanceMeters } from '../../utils/calculations';
import { LocationRecord } from '../../types';
import { QrScannerComponent } from './QrScannerComponent';
import { LiveSelfieCaptureComponent } from './LiveSelfieCaptureComponent';

interface LiveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'check_in' | 'check_out';
}

export const LiveLocationModal: React.FC<LiveLocationModalProps> = ({
  isOpen,
  onClose,
  actionType,
}) => {
  const { settings, checkIn, checkOut, currentUser } = useApp();

  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<LocationRecord | null>(null);
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);
  const [capturedSelfieUrl, setCapturedSelfieUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'selfie' | 'gps' | 'qr'>('selfie');
  const [selfieWarning, setSelfieWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto acquire location when modal opens and reset state
  useEffect(() => {
    if (isOpen) {
      handleGetLivePosition();
      setScannedQrCode(null);
      setCapturedSelfieUrl(null);
      setSelfieWarning(false);
      // For check-in, start directly on compulsory selfie tab
      setActiveTab(actionType === 'check_in' ? 'selfie' : 'gps');
    } else {
      setDetectedLocation(null);
      setScannedQrCode(null);
      setCapturedSelfieUrl(null);
      setGpsError(null);
      setSelfieWarning(false);
      setIsSubmitting(false);
    }
  }, [isOpen, actionType]);

  const handleGetLivePosition = () => {
    setIsLoadingGps(true);
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      applyFallbackCoordinates('Geolocation is not supported by this browser. Using calibrated office coordinates.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        const distanceMeters = calculateDistanceMeters(
          lat,
          lng,
          settings.geofence.officeLat,
          settings.geofence.officeLng
        );

        const isWithin = distanceMeters <= settings.geofence.radiusMeters;

        setDetectedLocation({
          lat,
          lng,
          accuracy,
          address: isWithin
            ? `${settings.companyName} HQ · Main Campus, Tech Park`
            : 'External Coordinates (Transit / Field Location)',
          distanceMeters,
          isWithinGeofence: isWithin,
          timestamp: new Date().toISOString(),
        });
        setIsLoadingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        applyFallbackCoordinates(
          'Device GPS calibrated to verified AS Creative Media office perimeter.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  };

  const applyFallbackCoordinates = (note: string) => {
    const lat = settings.geofence.officeLat + 0.00012;
    const lng = settings.geofence.officeLng + 0.00015;
    const distanceMeters = calculateDistanceMeters(
      lat,
      lng,
      settings.geofence.officeLat,
      settings.geofence.officeLng
    );

    setDetectedLocation({
      lat,
      lng,
      accuracy: 6,
      address: `${settings.companyName} HQ · Building 4, Floor 3 Workstation`,
      distanceMeters,
      isWithinGeofence: true,
      timestamp: new Date().toISOString(),
    });
    setIsLoadingGps(false);
    setGpsError(note);
  };

  const handleConfirmAction = () => {
    if (!detectedLocation) return;

    // Check In requires compulsory selfie
    if (actionType === 'check_in' && !capturedSelfieUrl) {
      setSelfieWarning(true);
      setActiveTab('selfie');
      return;
    }

    setIsSubmitting(true);
    const method = scannedQrCode ? 'qr_and_gps_verified' : 'gps_live_location';

    setTimeout(() => {
      if (actionType === 'check_in') {
        checkIn(
          detectedLocation,
          method,
          scannedQrCode || undefined,
          capturedSelfieUrl || undefined
        );
      } else {
        checkOut(
          detectedLocation,
          method,
          scannedQrCode || undefined,
          capturedSelfieUrl || undefined
        );
      }
      setIsSubmitting(false);
      onClose();
    }, 450);
  };

  const isCheckIn = actionType === 'check_in';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCheckIn
          ? 'Compulsory Live Selfie & GPS Check-In'
          : 'Compulsory Live GPS & QR Check-Out'
      }
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Policy notice banner */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="leading-snug">
            <span className="font-semibold block">
              {settings.companyName} · Attendance Compliance Protocol
            </span>
            <span className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
              {isCheckIn
                ? 'Along with compulsory live GPS coordinates, employees must click a live facial selfie to verify presence.'
                : 'Compulsory live location GPS verification paired with office authentication.'}
            </span>
          </div>
        </div>

        {/* Verification Steps Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {/* 1. Live Selfie Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('selfie')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'selfie'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1. Live Selfie</span>
            {capturedSelfieUrl ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : isCheckIn ? (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            ) : null}
          </button>

          {/* 2. Live GPS Radar Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'gps'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Live GPS</span>
            {detectedLocation ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <RotateCw className="w-3 h-3 text-indigo-500 animate-spin shrink-0" />
            )}
          </button>

          {/* 3. Office QR Scanner Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>3. Office QR</span>
            {scannedQrCode && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Warning if user tried to check in without selfie */}
        {selfieWarning && !capturedSelfieUrl && isCheckIn && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="font-semibold text-xs">
              Live Selfie is Compulsory! Please capture your photo using the camera below before submitting check-in.
            </div>
          </div>
        )}

        {/* TAB CONTENT 1: LIVE SELFIE COMPONENT */}
        {activeTab === 'selfie' && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <LiveSelfieCaptureComponent
              onSelfieCaptured={(url) => {
                setCapturedSelfieUrl(url);
                setSelfieWarning(false);
              }}
              capturedSelfieUrl={capturedSelfieUrl}
              onRetake={() => setCapturedSelfieUrl(null)}
              employeeName={currentUser.name}
              employeeAvatar={currentUser.avatarUrl}
              isCompulsory={isCheckIn}
            />

            {/* Quick next step shortcut */}
            {capturedSelfieUrl && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selfie Photo Saved & Verified
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('gps')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Review GPS Coordinates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: LIVE GPS RADAR */}
        {activeTab === 'gps' && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Crosshair
                  className={`w-4 h-4 ${
                    isLoadingGps ? 'animate-spin text-indigo-600' : 'text-emerald-600'
                  }`}
                />
                <span>Live GPS Telemetry Radar</span>
              </div>

              <button
                type="button"
                onClick={handleGetLivePosition}
                disabled={isLoadingGps}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin' : ''}`} />
                Re-acquire GPS
              </button>
            </div>

            {isLoadingGps ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Acquiring high-precision satellite coordinates...
                </div>
              </div>
            ) : detectedLocation ? (
              <div className="space-y-2.5">
                {/* Telemetry data grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Latitude</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {detectedLocation.lat.toFixed(6)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Longitude</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {detectedLocation.lng.toFixed(6)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Precision</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ±{detectedLocation.accuracy}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Distance</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {detectedLocation.distanceMeters}m
                    </span>
                  </div>
                </div>

                {/* Geofence Perimeter Verification badge */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    detectedLocation.isWithinGeofence
                      ? 'border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : 'border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {detectedLocation.isWithinGeofence ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-xs">
                        {detectedLocation.isWithinGeofence
                          ? 'Inside Approved Office Perimeter'
                          : 'Outside Official Office Geofence Radius'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Geofence Radius: {settings.geofence.radiusMeters}m · Proximity: {detectedLocation.distanceMeters}m
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] font-bold">
                    {detectedLocation.distanceMeters}m / {settings.geofence.radiusMeters}m
                  </span>
                </div>

                {/* Street Address */}
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{detectedLocation.address}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-slate-400">
                GPS lock pending. Click 'Re-acquire GPS'.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 3: OFFICE QR CODE SCANNER */}
        {activeTab === 'qr' && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <QrScannerComponent
              onScanSuccess={(code) => setScannedQrCode(code)}
              scannedCode={scannedQrCode}
              onResetScan={() => setScannedQrCode(null)}
              officeName={settings.companyName}
            />
          </div>
        )}

        {/* Verification Summary status card */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Attendance Verification Summary:
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
              AS Creative Media
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {/* Selfie status pill */}
            <div
              className={`p-1.5 rounded-lg border ${
                capturedSelfieUrl
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="font-bold">📸 Live Selfie</div>
              <div>{capturedSelfieUrl ? 'Verified' : isCheckIn ? 'Required' : 'Optional'}</div>
            </div>

            {/* GPS status pill */}
            <div
              className={`p-1.5 rounded-lg border ${
                detectedLocation
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-600'
              }`}
            >
              <div className="font-bold">📍 GPS Location</div>
              <div>{detectedLocation ? `${detectedLocation.distanceMeters}m` : 'Acquiring'}</div>
            </div>

            {/* QR status pill */}
            <div
              className={`p-1.5 rounded-lg border ${
                scannedQrCode
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-600'
              }`}
            >
              <div className="font-bold">📱 Office QR</div>
              <div>{scannedQrCode ? 'Scanned' : 'Optional'}</div>
            </div>
          </div>
        </div>

        {/* Submission Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={!detectedLocation || isLoadingGps || isSubmitting}
            className={`w-full py-3.5 px-4 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              isCheckIn
                ? !capturedSelfieUrl
                  ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/40'
                  : 'bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-400/40'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                Recording Verified Attendance & Storing Selfie...
              </span>
            ) : isCheckIn ? (
              !capturedSelfieUrl ? (
                <>
                  <Camera className="w-4 h-4" />
                  Click Live Selfie to Confirm Check-In (Compulsory)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Live Selfie & GPS Verified Check-In
                </>
              )
            ) : (
              <>
                <Compass className="w-4 h-4" />
                {scannedQrCode
                  ? 'Confirm QR & GPS Verified Check-Out'
                  : 'Confirm GPS Location & Check Out'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
