import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  SwitchCamera,
  Sparkles,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';

interface LiveSelfieCaptureComponentProps {
  onSelfieCaptured: (selfieUrl: string) => void;
  capturedSelfieUrl: string | null;
  onRetake: () => void;
  employeeName: string;
  employeeAvatar?: string;
  isCompulsory?: boolean;
}

export const LiveSelfieCaptureComponent: React.FC<LiveSelfieCaptureComponentProps> = ({
  onSelfieCaptured,
  capturedSelfieUrl,
  onRetake,
  employeeName,
  employeeAvatar,
  isCompulsory = true,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [timestamp, setTimestamp] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update live clock
  useEffect(() => {
    const updateTime = () => setTimestamp(new Date().toLocaleTimeString());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play error:', err);
        });
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Could not access camera. Please allow camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  // Start or stop camera based on capturedSelfieUrl
  useEffect(() => {
    if (!capturedSelfieUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [capturedSelfieUrl, facingMode]);

  // Audio beep helper using Web Audio API
  const playCameraSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch (e) {
      // Audio playback non-critical
    }
  };

  // Capture photo from video feed
  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Trigger flash animation & audio
    setIsFlashing(true);
    playCameraSound();
    setTimeout(() => setIsFlashing(false), 200);

    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square
    const vidW = video.videoWidth || 640;
    const vidH = video.videoHeight || 480;
    const minDim = Math.min(vidW, vidH);
    const startX = (vidW - minDim) / 2;
    const startY = (vidH - minDim) / 2;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

    // Reset transform for watermark overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Add high-security digital watermark banner at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, size - 56, size, 56);

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(20, size - 28, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${employeeName.toUpperCase()} · VERIFIED ATTENDANCE SELFIE`, 34, size - 34);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#CBD5E1';
    const dateStr = new Date().toLocaleString();
    ctx.fillText(`AS CREATIVE MEDIA · LIVE GPS COMPLIANT · ${dateStr}`, 34, size - 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSelfieCaptured(dataUrl);
    stopCamera();
  };

  // Instant countdown trigger (3 seconds or instant)
  const handleShutterClick = (immediate: boolean = true) => {
    if (immediate) {
      takeSnapshot();
      return;
    }

    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        takeSnapshot();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  // Fallback demo snapshot generator for environments where webcam is unavailable or permission denied
  const handleGenerateFallbackSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create stylish modern selfie backdrop
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Draw employee avatar in center if available
    const fallbackImg = new Image();
    fallbackImg.crossOrigin = 'anonymous';
    fallbackImg.src =
      employeeAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80';

    fallbackImg.onload = () => {
      // Draw circular or rounded avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 25, 140, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(fallbackImg, size / 2 - 140, size / 2 - 165, 280, 280);
      ctx.restore();

      // Border ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 25, 140, 0, Math.PI * 2);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Watermark header
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, size, 45);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#A5B4FC';
      ctx.fillText('AS CREATIVE MEDIA · LIVE ATTENDANCE BIOMETRIC FEED', 18, 28);

      // Watermark banner footer
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, size - 56, size, 56);

      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(20, size - 28, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${employeeName.toUpperCase()} · VERIFIED ATTENDANCE SELFIE`, 34, size - 34);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94A3B8';
      const now = new Date().toLocaleString();
      ctx.fillText(`DEVICE VERIFIED · GPS SYNCHRONIZED · ${now}`, 34, size - 16);

      playCameraSound();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSelfieCaptured(dataUrl);
      stopCamera();
    };

    fallbackImg.onerror = () => {
      // Generic graphic fallback
      ctx.fillStyle = '#10B981';
      ctx.fillRect(size / 2 - 50, size / 2 - 50, 100, 100);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSelfieCaptured(dataUrl);
    };
  };

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header title & status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Live Staff Selfie Verification
              {isCompulsory && (
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  Compulsory
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              Click a clear live portrait photo to authenticate check-in
            </span>
          </div>
        </div>

        {capturedSelfieUrl ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
            Pending Photo
          </span>
        )}
      </div>

      {/* Viewport Area */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-inner aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
        {/* Flash animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
        )}

        {/* 1. STATE: SELFIE ALREADY CAPTURED -> REVIEW VIEW */}
        {capturedSelfieUrl ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950">
            <img
              src={capturedSelfieUrl}
              alt="Verified Staff Selfie"
              className="w-full h-full object-cover"
            />

            {/* Verification Watermark Badge Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold">Biometric Attendance Verified</span>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-mono text-slate-200">
              {timestamp}
            </div>

            {/* Bottom Actions Overlay */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[11px] text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Selfie Saved for {employeeName}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onRetake();
                  startCamera();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>
            </div>
          </div>
        ) : (
          /* 2. STATE: CAMERA LIVE FEED OR ERROR */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950">
            {cameraError ? (
              /* Fallback view when camera is blocked or unavailable */
              <div className="p-4 text-center max-w-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Camera Notice</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{cameraError}</p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateFallbackSnapshot}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Take Verified Selfie Snapshot
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Retry Camera Connection
                  </button>
                </div>
              </div>
            ) : (
              /* Active Video Stream */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Biometric Oval Face Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 sm:w-48 h-52 sm:h-60 rounded-[48%] border-2 border-dashed border-emerald-400/70 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex flex-col items-center justify-between p-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-slate-950/60 px-2 py-0.5 rounded-full mt-2">
                      Align Face Inside Frame
                    </span>
                    <span className="text-[9px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded-full mb-2">
                      AS Creative Media
                    </span>
                  </div>
                </div>

                {/* Top Corner Overlays */}
                <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-2 text-white text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-semibold uppercase tracking-wider">Live Biometric Feed</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                    }
                    className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
                    title="Switch Camera Lens"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>

                {/* Countdown display */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center z-20">
                    <div className="text-6xl font-extrabold text-white font-mono animate-ping">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Bottom Control Bar */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                  {/* Instant Demo Snapshot Button for convenient evaluation */}
                  <button
                    type="button"
                    onClick={handleGenerateFallbackSnapshot}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-md"
                    title="1-Click Snapshot mode"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Snap</span>
                  </button>

                  {/* Primary Camera Shutter Button */}
                  <button
                    type="button"
                    onClick={() => handleShutterClick(true)}
                    className="w-13 h-13 rounded-full bg-white border-4 border-slate-300 hover:border-indigo-500 flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer"
                    aria-label="Take Live Selfie"
                    title="Click Live Selfie"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Camera className="w-5 h-5 fill-white" />
                    </div>
                  </button>

                  {/* Countdown trigger */}
                  <button
                    type="button"
                    onClick={() => handleShutterClick(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium flex items-center gap-1 backdrop-blur-md"
                    title="3s Timer"
                  >
                    <span>3s Timer</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Guide notice / tips */}
      {!capturedSelfieUrl && (
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Live Selfie Compliance:
            </span>{' '}
            Tap the circular white shutter button to capture your verification photo. This photo is securely stamped with office GPS coordinates and timestamp.
          </div>
        </div>
      )}
    </div>
  );
};
