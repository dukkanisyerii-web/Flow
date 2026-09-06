import React, { useState, useEffect, useRef } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { Mic, MicOff, Sparkles, Check, X, Volume2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { NeonCard } from '../common/NeonCard';

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceTaskCreator: React.FC = () => {
  const { zones, currentUser } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedTask, setParsedTask] = useState<{
    title: string;
    zoneId: string;
    zoneName: string;
    priority: 'normal' | 'high' | 'urgent';
    estimatedMinutes: number;
  } | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 30, 60, 40, 75, 50, 85, 45, 65, 35, 20]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans + ' ';
          } else {
            interim += trans;
          }
        }

        if (final) {
          setTranscript((prev) => {
            const full = (prev + ' ' + final).trim();
            parseSpeechToTask(full);
            return full;
          });
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından mikrofonu etkinleştirin.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Ses tanıma uyarısı: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        if (isListening) {
          stopListening();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopListening();
    };
  }, []);

  // Parse spoken text into structured task fields
  const parseSpeechToTask = (text: string) => {
    if (!text.trim()) return;

    const lower = text.toLowerCase();

    // Priority detection
    let priority: 'normal' | 'high' | 'urgent' = 'normal';
    if (lower.includes('acil') || lower.includes('hemen') || lower.includes('derhal') || lower.includes('kritik')) {
      priority = 'urgent';
    } else if (lower.includes('önemli') || lower.includes('hızlı') || lower.includes('çabuk')) {
      priority = 'high';
    }

    // Zone detection
    let matchedZone = zones[0];
    for (const z of zones) {
      const zName = z.name.toLowerCase();
      if (lower.includes(zName) || (z.code && lower.includes(z.code.toLowerCase()))) {
        matchedZone = z;
        break;
      }
    }
    // Specific keyword fallbacks
    if (lower.includes('mutfak') || lower.includes('ocak') || lower.includes('fritöz') || lower.includes('bulaşık')) {
      const kitchen = zones.find((z) => z.id.includes('kitchen') || z.name.toLowerCase().includes('mutfak'));
      if (kitchen) matchedZone = kitchen;
    } else if (lower.includes('bar') || lower.includes('kahve') || lower.includes('buz')) {
      const bar = zones.find((z) => z.id.includes('bar') || z.name.toLowerCase().includes('bar'));
      if (bar) matchedZone = bar;
    } else if (lower.includes('teras') || lower.includes('bahçe')) {
      const teras = zones.find((z) => z.id.includes('terrace') || z.name.toLowerCase().includes('teras'));
      if (teras) matchedZone = teras;
    } else if (lower.includes('salon') || lower.includes('masa')) {
      const hall = zones.find((z) => z.id.includes('hall') || z.id.includes('veranda') || z.name.toLowerCase().includes('salon'));
      if (hall) matchedZone = hall;
    }

    // Estimated duration extraction
    let estimatedMinutes = 15;
    const minMatch = lower.match(/(\d+)\s*(dakika|dk)/);
    if (minMatch && minMatch[1]) {
      const mins = parseInt(minMatch[1], 10);
      if (mins > 0 && mins < 180) estimatedMinutes = mins;
    } else if (lower.includes('yarım saat')) {
      estimatedMinutes = 30;
    } else if (lower.includes('bir saat')) {
      estimatedMinutes = 60;
    }

    // Cleaned up task title (capitalize first letter)
    let cleanTitle = text.trim();
    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    setParsedTask({
      title: cleanTitle,
      zoneId: matchedZone.id,
      zoneName: matchedZone.name,
      priority,
      estimatedMinutes,
    });
  };

  // Start Voice & Waveform
  const startListening = async () => {
    setErrorMsg(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedTask(null);
    setIsSuccess(false);
    haptics.voiceListening('start');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Tarayıcınız sesle komut özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanın.');
      return;
    }

    try {
      // Start browser audio waveform capture
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateWaveform = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              // 11 symmetrical audio frequency buckets for live waveform
              const frequencyBuckets = [
                dataArray[2] || 20,
                dataArray[4] || 35,
                dataArray[6] || 55,
                dataArray[8] || 75,
                dataArray[10] || 90,
                dataArray[12] || 100,
                dataArray[10] || 90,
                dataArray[8] || 75,
                dataArray[6] || 55,
                dataArray[4] || 35,
                dataArray[2] || 20,
              ];
              setAudioLevels(frequencyBuckets.map((v) => Math.max(12, Math.min(100, (v / 255) * 100))));
              animFrameRef.current = requestAnimationFrame(updateWaveform);
            };
            updateWaveform();
          }
        } catch (mediaErr) {
          console.warn('Media stream fallback to synthetic waveform:', mediaErr);
          // Fallback synthetic animated waveform
          startSyntheticWaveform();
        }
      } else {
        startSyntheticWaveform();
      }

      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setErrorMsg('Ses tanıma başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  const startSyntheticWaveform = () => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setAudioLevels([
        20 + Math.sin(tick * 0.4) * 15,
        35 + Math.cos(tick * 0.5) * 20,
        55 + Math.sin(tick * 0.7) * 35,
        75 + Math.cos(tick * 0.3) * 25,
        90 + Math.sin(tick * 0.6) * 10,
        100 + Math.sin(tick * 0.8) * 15,
        85 + Math.cos(tick * 0.4) * 20,
        70 + Math.sin(tick * 0.5) * 30,
        50 + Math.cos(tick * 0.6) * 25,
        30 + Math.sin(tick * 0.3) * 15,
        15 + Math.cos(tick * 0.7) * 10,
      ]);
    }, 80);

    return () => clearInterval(interval);
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevels([15, 30, 60, 40, 75, 50, 85, 45, 65, 35, 20]);
  };

  // Submit Task into Store
  const handleCreateTask = () => {
    if (!parsedTask || !parsedTask.title.trim()) return;

    haptics.taskComplete();
    store.createTask({
      title: parsedTask.title,
      description: `🎙️ Sesli komut ile oluşturuldu ("${transcript.trim()}")`,
      zoneId: parsedTask.zoneId,
      priority: parsedTask.priority,
      estimatedMinutes: parsedTask.estimatedMinutes,
      assignedTo: [currentUser.id],
      assignedToRole: currentUser.position,
      requireApproval: true,
      requirePhoto: parsedTask.priority === 'urgent',
    });

    store.dispatchNotification({
      type: 'task_assigned',
      title: '🎙️ Sesli Görev Oluşturuldu',
      message: `"${parsedTask.title}" (${parsedTask.zoneName}) görev listenize eklendi.`,
      priority: parsedTask.priority,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setParsedTask(null);
      setTranscript('');
      setInterimTranscript('');
      setIsSuccess(false);
    }, 2500);
  };

  return (
    <NeonCard
      neonColor={isListening ? 'lime' : 'blue'}
      tactile={true}
      shine={true}
      interactive={false}
      className="p-3.5 sm:p-4 rounded-2xl bg-[#0B0F17] border border-white/[0.12] shadow-lg relative overflow-hidden"
    >
      {/* Background Subtle Gradient & Light Sweep */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              isListening
                ? 'bg-[#D8FF4F] text-black border-[#D8FF4F] shadow-[0_0_15px_rgba(216,255,79,0.5)] animate-pulse'
                : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">Sesle Hızlı Görev Söyle</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#D8FF4F]/15 text-[#D8FF4F] font-semibold">
                Türkçe AI
              </span>
            </div>
            <p className="text-[11px] text-[#8E98A8]">
              {isListening ? 'Sizi dinliyor, konuşun...' : 'Konuşarak anında yeni görev oluşturun'}
            </p>
          </div>
        </div>

        {/* Action Button: Start / Stop Voice Command */}
        <button
          id="btn-voice-task-toggle"
          onClick={isListening ? stopListening : startListening}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : 'bg-[#D8FF4F] hover:bg-[#c8f244] text-black shadow-[0_2px_12px_rgba(216,255,79,0.25)]'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Durdur</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Mikrofonu Aç</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Feedback Waveform (Oscillating Audio Spectrum) */}
      {isListening && (
        <div className="my-3 p-3 rounded-xl bg-black/40 border border-[#D8FF4F]/25 flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-[280px]">
            {audioLevels.map((level, idx) => (
              <div
                key={idx}
                className="w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-sky-400 via-[#D8FF4F] to-emerald-300 transition-all duration-75"
                style={{
                  height: `${Math.max(15, level)}%`,
                  boxShadow: '0 0 8px rgba(216, 255, 79, 0.4)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Dinleniyor... Görevi, süreyi ve önceliği belirtin</span>
          </div>
        </div>
      )}

      {/* Live Spoken Transcript */}
      {(transcript || interimTranscript) && !isSuccess && (
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 mb-2.5">
          <p className="text-[10px] uppercase font-bold text-[#8E98A8] tracking-wider mb-1 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[#D8FF4F]" />
            Algılanan Ses:
          </p>
          <p className="text-xs text-white leading-relaxed">
            <span className="font-semibold text-[#D8FF4F]">{transcript}</span>
            <span className="text-zinc-400 italic"> {interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Parsed Task Confirmation Card */}
      {parsedTask && !isSuccess && (
        <div className="p-3 rounded-xl bg-[#0F172A]/90 border border-sky-500/30 space-y-2 animate-in fade-in-50 duration-150">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider">
                Hazırlanan Görev
              </span>
              <h4 className="text-xs font-bold text-white mt-0.5">{parsedTask.title}</h4>
            </div>
            <button
              onClick={() => {
                setParsedTask(null);
                setTranscript('');
              }}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {/* Zone Tag */}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 font-medium">
              📍 {parsedTask.zoneName}
            </span>

            {/* Priority Tag */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                parsedTask.priority === 'urgent'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : parsedTask.priority === 'high'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {parsedTask.priority === 'urgent'
                ? '⚡ Acil Öncelik'
                : parsedTask.priority === 'high'
                ? '🔥 Yüksek'
                : '✓ Normal'}
            </span>

            {/* Duration Tag */}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 font-mono">
              ⏱️ ~{parsedTask.estimatedMinutes} dk
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <button
              id="btn-confirm-voice-task"
              onClick={handleCreateTask}
              className="flex-1 py-2 rounded-lg bg-[#D8FF4F] hover:bg-[#cbf738] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Listeme Ekle ve Başlat</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in zoom-in-95 duration-150">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Görev başarıyla eklendi! Listeniz güncellendi.</span>
        </div>
      )}

      {/* Error / Fallback info */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-[11px] mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </NeonCard>
  );
};
