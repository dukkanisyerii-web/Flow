import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { PhotoProof } from '../../types';
import { Camera, X, RefreshCw, Check, Upload, Zap, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const CameraModal: React.FC = () => {
  const { activeModal, modalPayload, selectedTaskId, tasks, zones, currentUser } = useAppStore();
  const taskId = (modalPayload?.taskId as string) || selectedTaskId;
  const task = tasks.find((t) => t.id === taskId);
  const zone = zones.find((z) => z.id === task?.zoneId);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (activeModal !== 'camera_live') {
      stopCamera();
      return;
    }

    let isMounted = true;
    setCapturedImage(null);
    setCameraError(null);

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC kamera desteği bulunamadı.');
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
      } catch (err) {
        if (!isMounted) return;
        console.warn('Camera access unavailable or iframe blocked', err);
        setHasCamera(false);
        setCameraError(
          'Canlı kamera akışı açılamadı. Aşağıdaki butonla telefonunuzun kamerasını doğrudan açabilir veya galeriden fotoğraf seçebilirsiniz.'
        );
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [activeModal, facingMode, stopCamera]);

  if (activeModal !== 'camera_live') return null;

  // Toggle front/back camera
  const toggleFacingMode = () => {
    haptics.tap();
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    haptics.tap();
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const next = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: next }],
        });
        setTorchOn(next);
      } catch (e) {
        console.warn('Torch constraint failed', e);
      }
    }
  };

  // Stamp official watermark onto a canvas
  const stampWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeStr: string
  ) => {
    // Watermark banner background
    ctx.fillStyle = 'rgba(7, 9, 13, 0.85)';
    ctx.fillRect(16, 16, 360, 52);
    ctx.strokeStyle = 'rgba(216, 255, 79, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, 360, 52);

    // Accent line
    ctx.fillStyle = '#D8FF4F';
    ctx.fillRect(16, 16, 4, 52);

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#D8FF4F';
    ctx.fillText(`CETEM FLOW · ${timeStr} · DOĞRULANMIŞ KANIT`, 28, 38);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${zone?.name || 'Operasyon Alanı'} · ${currentUser.name}`, 28, 56);

    // Bottom Right Seal
    ctx.fillStyle = 'rgba(7, 9, 13, 0.75)';
    ctx.fillRect(width - 180, height - 36, 164, 24);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10B981';
    ctx.fillText('✓ LIVE VERIFIED PROOF', width - 170, height - 20);
  };

  // Handle capture from live video stream
  const handleCapture = () => {
    haptics.cameraShutter();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (hasCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        stampWatermark(ctx, canvas.width, canvas.height, nowStr);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        return;
      }
    }

    // Fallback: trigger file input directly if camera not ready
    fileInputRef.current?.click();
  };

  // Handle file selected from device camera/gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptics.cameraShutter();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          stampWatermark(ctx, canvas.width, canvas.height, nowStr);
          const stampedUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(stampedUrl);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetake = () => {
    haptics.tap();
    setCapturedImage(null);
  };

  const handleUsePhoto = () => {
    if (!capturedImage) return;
    haptics.taskComplete();

    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const proof: PhotoProof = {
      url: capturedImage,
      timestamp: nowStr,
      locationName: zone?.name || 'Kontrol Alanı',
      overlayText: `CETEM FLOW · ${nowStr} · ${zone?.name || 'Operasyon'}`,
      type: 'live',
    };

    if (task) {
      store.completeTask(task.id, proof);
    }
    stopCamera();
    store.closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/20 overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-[#07090D]/80">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-[#D8FF4F] uppercase tracking-wider block font-bold">
                CANLI FOTOĞRAF KANITI (LIVE PROOF)
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[260px]">
              {task?.title || 'Operasyonel Fotoğraf Çekimi'}
            </h3>
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

        {/* Viewfinder Canvas / Video */}
        <div className="relative w-full aspect-4/3 bg-[#0A0D14] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured Proof" className="w-full h-full object-cover" />
          ) : hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#D8FF4F]/10 border border-[#D8FF4F]/30 flex items-center justify-center text-[#D8FF4F]">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Canlı Kamera Vizörü</p>
                <p className="text-xs text-[#8E98A8] max-w-xs mt-1">
                  Kamerayı açarak veya doğrudan telefonunuzdan çekim yaparak kanıt oluşturabilirsiniz.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 rounded-xl bg-[#D8FF4F] text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-[#D8FF4F]/20"
              >
                <Upload className="w-4 h-4" />
                <span>Cihaz Kamerasını Aç / Fotoğraf Seç</span>
              </button>
            </div>
          )}

          {/* Real-time Stamped Preview Overlay */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#D8FF4F]/30 text-[10px] font-mono text-[#D8FF4F] pointer-events-none shadow-lg">
            CETEM FLOW · {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {zone?.name || 'Kontrol'}
          </div>

          {/* Viewfinder Controls if live camera is active */}
          {!capturedImage && hasCamera && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={toggleFacingMode}
                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 cursor-pointer transition-all"
                title="Kamerayı Çevir"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-lg backdrop-blur-md border border-white/15 cursor-pointer transition-all ${
                    torchOn ? 'bg-[#D8FF4F] text-black' : 'bg-black/60 text-white'
                  }`}
                  title="Fener"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Hidden canvas for stamp rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden Native Device File/Camera Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-[#07090D]/90 border-t border-white/10 flex items-center justify-around">
          {capturedImage ? (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tekrar Çek</span>
              </button>

              <button
                onClick={handleUsePhoto}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Kanıtı Onayla & Görevi Bitir</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between px-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                title="Cihazdan Fotoğraf Seç"
              >
                <ImageIcon className="w-4 h-4 text-[#D8FF4F]" />
                <span>Galeri / Kamera</span>
              </button>

              {/* Shutter Button */}
              <div className="flex flex-col items-center">
                <button
                  id="camera-shutter-btn"
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full border-4 border-white/30 bg-[#D8FF4F] text-black flex items-center justify-center shadow-xl shadow-[#D8FF4F]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Fotoğraf Çek"
                >
                  <Camera className="w-7 h-7" />
                </button>
                <span className="text-[10px] text-[#8E98A8] mt-1.5 font-mono">Deklanşör</span>
              </div>

              <div className="w-[100px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
