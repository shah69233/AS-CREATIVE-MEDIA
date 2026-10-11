import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  SwitchCamera,
  ExternalLink,
} from 'lucide-react';

interface QrScannerComponentProps {
  onScanSuccess: (decodedText: string) => void;
  scannedCode: string | null;
  onResetScan: () => void;
  officeName?: string;
}

export const QrScannerComponent: React.FC<QrScannerComponentProps> = ({
  onScanSuccess,
  scannedCode,
  onResetScan,
  officeName = 'AS Creative Media HQ',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showOfficeQrDisplay, setShowOfficeQrDisplay] = useState(false);

  // Play a short pleasant beep on scan success
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio not allowed or unsupported
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let msg = 'Camera access was blocked or is unavailable.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found on this system.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const startScanLoop = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          playBeep();
          stopCamera();
          onScanSuccess(code.data);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Trigger camera start when component mounts if not already scanned
  useEffect(() => {
    if (!scannedCode) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Clean up on unmount or when scannedCode becomes set
  useEffect(() => {
    if (scannedCode) {
      stopCamera();
    }
  }, [scannedCode]);

  const handleSimulateScan = (presetToken: string) => {
    playBeep();
    stopCamera();
    onScanSuccess(presetToken);
  };

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Office QR Code Verification</span>
        </div>

        <button
          type="button"
          onClick={() => setShowOfficeQrDisplay(!showOfficeQrDisplay)}
          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          {showOfficeQrDisplay ? 'Hide Office QR' : 'Display Office QR Code'}
        </button>
      </div>

      {/* Office QR Code Display Modal / Helper Card */}
      {showOfficeQrDisplay && (
        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-center space-y-2">
          <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
            Official Entrance QR Pass ({officeName})
          </div>
          <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 max-w-xs mx-auto">
            Scan this official office QR code using your phone camera, or click "Simulate Scan" below.
          </p>

          <div className="inline-block p-3 bg-white rounded-xl shadow-xs border border-indigo-100">
            {/* SVG Representation of Office QR Code */}
            <svg
              className="w-36 h-36 mx-auto"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="28" height="28" rx="2" fill="#0f172a" />
              <rect x="15" y="15" width="18" height="18" rx="1" fill="white" />
              <rect x="19" y="19" width="10" height="10" rx="1" fill="#4f46e5" />
              {/* Corner 2 */}
              <rect x="62" y="10" width="28" height="28" rx="2" fill="#0f172a" />
              <rect x="67" y="15" width="18" height="18" rx="1" fill="white" />
              <rect x="71" y="19" width="10" height="10" rx="1" fill="#4f46e5" />
              {/* Corner 3 */}
              <rect x="10" y="62" width="28" height="28" rx="2" fill="#0f172a" />
              <rect x="15" y="67" width="18" height="18" rx="1" fill="white" />
              <rect x="19" y="71" width="10" height="10" rx="1" fill="#4f46e5" />
              {/* Data matrix dots */}
              <rect x="42" y="12" width="6" height="6" fill="#0f172a" />
              <rect x="51" y="12" width="6" height="6" fill="#0f172a" />
              <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
              <rect x="51" y="32" width="6" height="6" fill="#0f172a" />
              <rect x="12" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="22" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="32" y="44" width="6" height="6" fill="#4f46e5" />
              <rect x="42" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="52" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="62" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="72" y="44" width="6" height="6" fill="#4f46e5" />
              <rect x="82" y="44" width="6" height="6" fill="#0f172a" />
              <rect x="42" y="54" width="6" height="6" fill="#0f172a" />
              <rect x="52" y="54" width="6" height="6" fill="#0f172a" />
              <rect x="62" y="54" width="6" height="6" fill="#0f172a" />
              <rect x="42" y="64" width="6" height="6" fill="#4f46e5" />
              <rect x="52" y="74" width="6" height="6" fill="#0f172a" />
              <rect x="62" y="74" width="6" height="6" fill="#0f172a" />
              <rect x="72" y="64" width="6" height="6" fill="#0f172a" />
              <rect x="82" y="74" width="6" height="6" fill="#4f46e5" />
              <rect x="72" y="82" width="6" height="6" fill="#0f172a" />
            </svg>
            <div className="font-mono text-[9px] font-bold text-slate-700 mt-1">
              AS-OFFICE-MAIN-GATE-01
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white min-h-[200px] flex flex-col items-center justify-center">
        {scannedCode ? (
          /* Scanned Success View */
          <div className="w-full p-5 bg-emerald-950/40 border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-2 ring-emerald-500/40 animate-pulse">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300">
                Office QR Code Verified
              </div>
              <div className="font-mono text-[11px] text-white/90 bg-emerald-900/60 px-2.5 py-1 rounded-md mt-1 border border-emerald-700/50 inline-block">
                {scannedCode}
              </div>
            </div>
            <div className="text-[10px] text-emerald-200/80">
              Station Match: {officeName} On-Site Terminal
            </div>
            <button
              type="button"
              onClick={() => {
                onResetScan();
                startCamera();
              }}
              className="mt-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              Scan Different QR Code
            </button>
          </div>
        ) : isCameraActive ? (
          /* Live Camera Viewfinder */
          <div className="relative w-full h-56 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Viewfinder Overlay with Reticles */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-44 h-44 rounded-xl border-2 border-indigo-500/70 shadow-2xl">
                {/* Corner markers */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-cyan-400 rounded-tl-sm" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-cyan-400 rounded-tr-sm" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-cyan-400 rounded-bl-sm" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-cyan-400 rounded-br-sm" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-1 right-1 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"
                  style={{
                    animation: 'scannerLaser 2s ease-in-out infinite alternate',
                  }}
                />
              </div>
            </div>

            {/* Top Camera Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Switch Camera (Front / Rear)"
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                title="Turn off camera"
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
              >
                <CameraOff className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Target Caption */}
            <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
              <span className="text-[10px] bg-black/70 px-2.5 py-0.5 rounded-full text-slate-300 font-medium backdrop-blur-xs">
                Align Office QR Code inside viewfinder
              </span>
            </div>
          </div>
        ) : (
          /* Camera Idle / Blocked State */
          <div className="p-5 text-center space-y-3 w-full">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>

            {cameraError ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {cameraError}
                </div>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  You can use the simulated office scan badges below to verify compliance instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-200">
                  Camera QR Scanner Ready
                </div>
                <p className="text-[10px] text-slate-400">
                  Click 'Start Camera Scanner' to point your phone at the entrance badge.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={startCamera}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              Start Camera Scanner
            </button>
          </div>
        )}
      </div>

      {/* Quick Office QR Simulation Badge Buttons (for fast testing on personal phone / dev environment) */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Simulate Office QR Scan (Tap to verify):
          </span>
          <span className="text-[10px] text-slate-400">Compliance checkpoints</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleSimulateScan('AS-OFFICE-MAIN-GATE-01')}
            className={`p-2 rounded-lg border text-left text-[11px] transition-all flex items-center gap-2 ${
              scannedCode === 'AS-OFFICE-MAIN-GATE-01'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold truncate">Main Gate A</div>
              <div className="text-[9px] text-slate-400 font-mono">AS-OFFICE-01</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateScan('AS-OFFICE-FLOOR3-DEV')}
            className={`p-2 rounded-lg border text-left text-[11px] transition-all flex items-center gap-2 ${
              scannedCode === 'AS-OFFICE-FLOOR3-DEV'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold truncate">Floor 3 Workspace</div>
              <div className="text-[9px] text-slate-400 font-mono">AS-DEV-FLOOR</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateScan('AS-OFFICE-RECEPTION')}
            className={`p-2 rounded-lg border text-left text-[11px] transition-all flex items-center gap-2 ${
              scannedCode === 'AS-OFFICE-RECEPTION'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold truncate">Reception Desk</div>
              <div className="text-[9px] text-slate-400 font-mono">AS-RECEPTION</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
