import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Scan,
  X,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  Sparkles,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import jsQR from 'jsqr';

export const QrScannerModal: React.FC = () => {
  const { activeModal, modalPayload, zones, selectedTaskId, tasks } = useAppStore();

  const taskId = (modalPayload?.taskId as string) || selectedTaskId;
  const task = tasks.find((t) => t.id === taskId);
  const targetZone = zones.find((z) => z.id === task?.zoneId);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    success: boolean;
    message: string;
    zoneName?: string;
    zoneCode?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Process a detected raw string
  const handleCodeDetected = useCallback(
    (rawCode: string) => {
      if (isProcessing) return;
      const cleanCode = rawCode.trim();

      // Find if code matches or contains any known zone code
      const matchedZone = zones.find(
        (z) =>
          z.code.toLowerCase() === cleanCode.toLowerCase() ||
          cleanCode.toLowerCase().includes(z.code.toLowerCase()) ||
          cleanCode.toLowerCase().includes(z.id.toLowerCase())
      );

      const zoneCodeFound = matchedZone?.code || cleanCode;

      // If tied to a specific task requiring this zone:
      if (targetZone) {
        if (matchedZone && matchedZone.id !== targetZone.id) {
          haptics.alert();
          setIsProcessing(true);
          setScannedResult({
            success: false,
            message: `Hatalı Bölge! Görev "${targetZone.name}" (${targetZone.code}) alanına aittir. Taranan: "${matchedZone.name}".`,
          });
          setTimeout(() => setIsProcessing(false), 2500);
          return;
        }
      }

      // Valid or general scan
      setIsProcessing(true);
      haptics.qrScanned();

      if (task) {
        store.verifyTaskLocation(task.id, zoneCodeFound);
        setScannedResult({
          success: true,
          message: `Konum Doğrulandı: ${matchedZone?.name || zoneCodeFound} ✓`,
          zoneName: matchedZone?.name,
          zoneCode: zoneCodeFound,
        });

        setTimeout(() => {
          stopCamera();
          store.closeModal();
        }, 1200);
      } else {
        // Free scan without task context
        setScannedResult({
          success: true,
          message: `Alan Okundu: ${matchedZone?.name || zoneCodeFound}`,
          zoneName: matchedZone?.name,
          zoneCode: zoneCodeFound,
        });
      }
    },
    [isProcessing, zones, targetZone, task, stopCamera]
  );

  // Continuous frame scanner loop using jsQR
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrCode && qrCode.data) {
        handleCodeDetected(qrCode.data);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleCodeDetected]);

  // Start Camera Stream
  useEffect(() => {
    if (activeModal !== 'scan_qr') {
      stopCamera();
      return;
    }

    let isMounted = true;
    setCameraError(null);
    setScannedResult(null);
    setIsProcessing(false);

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tarayıcınız kamera akışını desteklemiyor.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Check torch capabilities
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack?.getCapabilities?.() as { torch?: boolean } | undefined;
        setHasTorch(Boolean(capabilities?.torch));

        setHasCamera(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.warn('Live camera unavailable or blocked:', err);
        setHasCamera(false);
        setCameraError(
          'Kameraya erişilemedi veya izin verilmedi. Aşağıdan QR fotoğrafı yükleyebilir ya da alan seçebilirsiniz.'
        );
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [activeModal, facingMode, scanVideoFrame, stopCamera]);

  // Flip Camera Front/Back
  const toggleFacingMode = () => {
    haptics.tap();
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle Flash/Torch
  const toggleTorch = async () => {
    haptics.tap();
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint error', e);
      }
    }
  };

  // Handle uploaded QR image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptics.tap();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleCodeDetected(code.data);
          } else {
            haptics.alert();
            setScannedResult({
              success: false,
              message: 'Yüklenen görselde geçerli bir QR kod okunamadı. Lütfen net bir fotoğraf seçin.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Handle manual code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (activeModal !== 'scan_qr') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl glass-panel-elevated border border-white/20 p-4.5 overflow-hidden shadow-2xl flex flex-col items-center max-h-[94vh]">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/20 text-[#D8FF4F] border border-[#D8FF4F]/30">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Canlı QR Alan Tarayıcısı</h3>
              <p className="text-[10px] text-[#8E98A8]">
                {targetZone ? `Beklenen Alan: ${targetZone.name}` : 'Restoran Alan Doğrulama'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              store.closeModal();
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Camera Viewfinder Box */}
        <div className="relative w-full aspect-square max-w-[280px] rounded-2xl border-2 border-[#D8FF4F]/60 bg-black/80 flex items-center justify-center overflow-hidden shadow-inner">
          {hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-4 text-center flex flex-col items-center justify-center space-y-2">
              <Camera className="w-10 h-10 text-white/30" />
              <p className="text-xs text-zinc-400">Kamera kapalı veya izin bekleniyor</p>
            </div>
          )}

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Reticle Overlay */}
          <div className="absolute inset-4 border border-dashed border-[#D8FF4F]/50 rounded-xl pointer-events-none">
            {/* Animated Laser Beam */}
            <div className="w-full h-0.5 bg-[#D8FF4F] shadow-[0_0_12px_#D8FF4F] animate-pulse absolute top-1/2 -translate-y-1/2" />
            {/* 4 Corner Markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#D8FF4F]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#D8FF4F]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#D8FF4F]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#D8FF4F]" />
          </div>

          {/* Quick Floating Controls (Flip, Torch, File) */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2 py-1 bg-black/70 backdrop-blur-md rounded-xl border border-white/15">
            <button
              onClick={toggleFacingMode}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] flex items-center gap-1 cursor-pointer transition-all"
              title="Kamerayı Çevir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Çevir</span>
            </button>

            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-all ${
                  torchOn ? 'bg-[#D8FF4F] text-black font-bold' : 'bg-white/10 text-white'
                }`}
                title="Flaş / Fener"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px]">Fener</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#D8FF4F] text-[11px] flex items-center gap-1 cursor-pointer transition-all"
              title="QR Fotoğrafı Yükle"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="text-[10px]">Görsel Seç</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Real-Time Scan Status Alert */}
        {scannedResult && (
          <div
            className={`w-full p-2.5 my-2.5 rounded-xl text-xs font-semibold text-center border animate-in zoom-in-95 duration-150 ${
              scannedResult.success
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              {scannedResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{scannedResult.message}</span>
            </div>
            {scannedResult.zoneCode && (
              <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 text-white">
                Kod: {scannedResult.zoneCode}
              </span>
            )}
          </div>
        )}

        {cameraError && !scannedResult && (
          <p className="text-[11px] text-amber-300/90 text-center my-1.5 px-2 bg-amber-500/10 border border-amber-500/20 py-1.5 rounded-lg">
            {cameraError}
          </p>
        )}

        {/* Manual Code Entry Form */}
        <form onSubmit={handleManualSubmit} className="w-full flex items-center gap-1.5 my-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Manuel QR Kod (örn: ZONE-KITCHEN-01)"
            className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F] font-mono"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs cursor-pointer transition-all shrink-0"
          >
            Doğrula
          </button>
        </form>

        {/* Registered Restaurant Zones Directory with Verified Badges */}
        <div className="w-full mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E98A8]">
              Restoran Alan Listesi (Hızlı Eşleşme)
            </span>
            <button
              onClick={() => store.openModal('qr_zone_viewer')}
              className="text-[10px] text-[#D8FF4F] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Printer className="w-3 h-3" />
              <span>QR Kartları</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar w-full pr-0.5">
            {zones.map((zone) => {
              const isTarget = targetZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleCodeDetected(zone.code)}
                  className={`w-full py-2 px-2.5 rounded-xl border flex items-center justify-between text-xs transition-all text-left cursor-pointer active:scale-98 ${
                    isTarget
                      ? 'bg-[#D8FF4F]/10 border-[#D8FF4F]/40 shadow-sm shadow-[#D8FF4F]/10'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-3.5 h-3.5 ${isTarget ? 'text-[#D8FF4F]' : 'text-zinc-400'}`}
                    />
                    <div>
                      <span className="text-zinc-200 font-semibold text-xs">{zone.name}</span>
                      {isTarget && (
                        <span className="ml-1.5 text-[9px] font-bold text-[#D8FF4F] px-1 py-0.2 rounded bg-[#D8FF4F]/15">
                          Hedef Bölge
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                    {zone.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
