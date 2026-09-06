import React from 'react';
import { Task, Zone } from '../../types';
import { store } from '../../store/appStore';
import {
  Camera,
  QrCode,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { NeonCard } from '../common/NeonCard';

interface NowCardProps {
  task: Task | undefined;
  zone: Zone | undefined;
}

export const NowCard: React.FC<NowCardProps> = ({ task, zone }) => {
  if (!task) {
    return (
      <NeonCard
        neonColor="emerald"
        tactile={true}
        shine={true}
        className="w-full p-6 border border-white/10 text-center relative overflow-hidden bg-[#0A0E17]"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Tüm Görevler Tamamlandı</h3>
        <p className="text-xs text-[#8E98A8] max-w-xs mx-auto">
          Şu anda sırada bekleyen acil bir görev yok. Yeni görev atandığında anında burada belirecektir.
        </p>
      </NeonCard>
    );
  }

  const completedChecklistCount = task.checklist.filter((c) => c.completed).length;
  const totalChecklistCount = task.checklist.length;
  const isStarted = task.status === 'in_progress';
  const isWaitingApproval = task.status === 'waiting_approval';

  const cardNeon =
    task.priority === 'urgent'
      ? 'coral'
      : isStarted
      ? 'blue'
      : isWaitingApproval
      ? 'amber'
      : 'lime';

  return (
    <NeonCard
      neonColor={cardNeon}
      tactile={true}
      shine={true}
      interactive={true}
      onClick={() => store.setSelectedTaskId(task.id)}
      className="relative w-full p-5 border border-white/15 shadow-2xl overflow-hidden group bg-[#070A0F]"
    >
      {/* Background Photographic Image with 3D Parallax feel on hover */}
      <img
        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
        alt="Mutfak İstasyonu"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-500 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/80 to-[#0A0E17]/60 pointer-events-none" />

      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-[#D8FF4F]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-36 h-36 bg-blue-500/8 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Eyebrow */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D8FF4F]/15 text-[#D8FF4F] border border-[#D8FF4F]/30 font-mono">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Up Next
          </span>
          {isStarted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              Devam Ediyor
            </span>
          )}
        </div>

        {/* Due Time Capsule */}
        <div className="flex items-center gap-1 text-xs font-mono font-medium text-zinc-300 bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.08]">
          <Clock className="w-3.5 h-3.5 text-[#D8FF4F]" />
          <span>Due: {task.deadline}</span>
        </div>
      </div>

      {/* Main Task Title & Description */}
      <div className="relative z-10 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-[#D8FF4F] transition-colors">
          {task.title}
        </h2>
        <p className="text-xs text-[#8E98A8] mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Meta Requirements Row */}
      <div className="relative z-10 grid grid-cols-2 xs:grid-cols-3 gap-2 mb-4">
        {/* Location / Zone */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="p-1.5 rounded-lg bg-white/[0.06] text-white">
            <MapPin className="w-3.5 h-3.5 text-[#D8FF4F]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#8E98A8] leading-none">Bölge</p>
            <p className="text-xs font-semibold text-white truncate mt-0.5">
              {zone?.name || 'Genel Alan'}
            </p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="p-1.5 rounded-lg bg-white/[0.06] text-white">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-[#8E98A8] leading-none">Öncelik</p>
            <p className="text-xs font-semibold text-amber-400 capitalize mt-0.5">
              {task.priority === 'urgent' ? 'Acil' : task.priority === 'high' ? 'Yüksek' : 'Normal'}
            </p>
          </div>
        </div>

        {/* Requirements Badge */}
        <div className="col-span-2 xs:col-span-1 flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="p-1.5 rounded-lg bg-white/[0.06] text-white">
            {task.requireLivePhoto ? (
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
            ) : task.requireQr ? (
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#8E98A8] leading-none">Gereksinim</p>
            <p className="text-xs font-semibold text-emerald-300 truncate mt-0.5">
              {task.requireLivePhoto ? '📷 Live Photo' : task.requireQr ? 'QR Alan Tarama' : 'Kontrol Listesi'}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Progress Bar */}
      {totalChecklistCount > 0 && (
        <div className="relative z-10 mb-4">
          <div className="flex justify-between items-center text-[11px] mb-1.5">
            <span className="text-[#8E98A8]">Kontrol Listesi</span>
            <span className="font-mono text-zinc-300">
              {completedChecklistCount}/{totalChecklistCount} ({Math.round((completedChecklistCount / totalChecklistCount) * 100)}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D8FF4F] to-[#10B981] transition-all duration-300"
              style={{ width: `${(completedChecklistCount / totalChecklistCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA Button with Tactile Press & High Gloss */}
      <button
        id="now-card-cta-btn"
        onClick={(e) => {
          e.stopPropagation();
          store.setSelectedTaskId(task.id);
        }}
        className="relative z-10 w-full py-3.5 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] active:scale-[0.98] text-[#07090D] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/25 transition-all cursor-pointer card-3d-tactile"
      >
        <span>
          {isWaitingApproval
            ? 'Onay Bekliyor (Detayı Gör)'
            : isStarted
            ? 'Görevi Sürdür & Kanıt Yükle'
            : 'Start Task (Görevi Başlat)'}
        </span>
        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </NeonCard>
  );
};
