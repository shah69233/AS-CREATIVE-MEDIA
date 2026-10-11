import { useState, useEffect } from 'react';
import {
  backgroundTracker,
  BackgroundTrackingTelemetry,
} from '../utils/backgroundTracker';
import { useApp } from '../context/AppContext';

export function useBackgroundTracking() {
  const { settings, todayAttendance } = useApp();
  const [telemetry, setTelemetry] = useState<BackgroundTrackingTelemetry>(() =>
    backgroundTracker.getTelemetry()
  );

  // Sync office coordinates from company settings
  useEffect(() => {
    backgroundTracker.setOfficeCoordinates(
      settings.geofence.officeLat,
      settings.geofence.officeLng,
      settings.geofence.radiusMeters,
      settings.companyName
    );
  }, [settings]);

  // Subscribe to telemetry updates
  useEffect(() => {
    const unsubscribe = backgroundTracker.subscribe((data) => {
      setTelemetry(data);
    });
    return unsubscribe;
  }, []);

  // Auto-start continuous background tracking if employee is checked in
  const isCheckedIn = Boolean(
    todayAttendance?.checkInTime && !todayAttendance?.checkOutTime
  );

  useEffect(() => {
    if (isCheckedIn && !telemetry.isEnabled) {
      backgroundTracker.start();
    }
  }, [isCheckedIn]);

  const toggleBackgroundTracking = () => {
    if (telemetry.isEnabled) {
      backgroundTracker.stop();
    } else {
      backgroundTracker.start();
    }
  };

  return {
    ...telemetry,
    toggleBackgroundTracking,
    startTracking: () => backgroundTracker.start(),
    stopTracking: () => backgroundTracker.stop(),
  };
}
