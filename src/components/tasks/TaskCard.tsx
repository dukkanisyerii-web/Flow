import React from 'react';
import { Task, Zone } from '../../types';
import { store, useAppStore } from '../../store/appStore';
import {
  Clock,
  MapPin,
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { NeonCard } from '../common/NeonCard';

interface TaskCardProps {
  task: Task;
  zone?: Zone;
  onSelect?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, zone, onSelect }) => {
  const { currentUser } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  const completedCount = task.checklist.filter((c) => c.completed).length;
  const totalCount = task.checklist.length;

  const getTaskBackground = () => {
    const t = task.title.toLowerCase();
    if (t.includes('yer') || t.includes('sil') || t.includes('mop') || t.includes('zemin')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('dolap') || t.includes('ısı') || t.includes('derece') || t.includes('soğuk')) {
      return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('çöp') || t.includes('atık')) {
      return 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('bulaşık') || t.includes('tabak') || t.includes('bardak')) {
      return 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('kahve') || t.includes('bar') || t.includes('espresso')) {
      return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('yağ') || t.includes('fritöz') || t.includes('ocak')) {
      return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('masa') || t.includes('salon') || t.includes('sandalye') || t.includes('servis')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'assigned':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/40">
            Atandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Onay Bekliyor
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" />
            Tamamlandı
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-rose-400" />
            Tekrar İstendi
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Gecikmiş
          </span>
        );
      default:
        return null;
    }
  };

  const handleQuickCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed') return;

    if (task.requireLivePhoto && !task.livePhotoProof) {
      // Prompt camera proof
      store.setSelectedTaskId(task.id);
      store.openModal('camera_live');
      return;
    }

    if (task.requireApproval && !isManager) {
      store.setSelectedTaskId(task.id);
      return;
    }

    store.completeTask(task.id);
  };

  const neonColor =
    task.priority === 'urgent'
      ? 'coral'
      : task.status === 'completed'
      ? 'emerald'
      : task.status === 'waiting_approval'
      ? 'amber'
      : task.status === 'in_progress'
      ? 'blue'
      : 'lime';

  const bgPhoto = getTaskBackground();

  return (
    <NeonCard
      neonColor={neonColor}
      tactile={true}
      shine={true}
      interactive={true}
      onClick={() => {
        store.setSelectedTaskId(task.id);
        onSelect?.();
      }}
      className="group w-full p-3.5 border border-white/[0.1] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden bg-[#0A0D14]"
    >
      {/* Background Photographic Image with gentle 3D depth zoom */}
      <img
        src={bgPhoto}
        alt={task.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-300 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/85 to-[#0A0E17]/70 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getStatusBadge()}
          {task.priority === 'urgent' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
              ACİL
            </span>
          )}
          {zone && (
            <span className="text-[10px] text-[#8E98A8] flex items-center gap-0.5 font-medium">
              <MapPin className="w-2.5 h-2.5 text-[#D8FF4F]" />
              {zone.name}
            </span>
          )}
        </div>

        {/* Due Time */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
          <Clock className="w-3 h-3 text-[#8E98A8]" />
          <span>{task.deadline}</span>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="relative z-10 text-sm font-semibold text-white group-hover:text-[#D8FF4F] transition-colors leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="relative z-10 text-xs text-[#8E98A8] line-clamp-1 mt-0.5">
          {task.description}
        </p>
      )}

      {/* Rejection notice if returned */}
      {task.status === 'rejected' && task.rejectionReason && (
        <div className="relative z-10 mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300">
          <span className="font-semibold">Müdür Notu:</span> {task.rejectionReason}
        </div>
      )}

      {/* Footer Info & Quick Check */}
      <div className="relative z-10 flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06] text-xs">
        {/* Indicators */}
        <div className="flex items-center gap-2 text-[11px] text-[#8E98A8]">
          {task.requireLivePhoto && (
            <span className="flex items-center gap-1 text-emerald-400" title="Canlı Fotoğraf Zorunlu">
              <Camera className="w-3 h-3" />
              <span className="text-[10px] hidden xs:inline">Canlı</span>
            </span>
          )}
          {task.requireQr && (
            <span className="flex items-center gap-1 text-blue-400" title="Alan QR Taraması Zorunlu">
              <QrCode className="w-3 h-3" />
              <span className="text-[10px] hidden xs:inline">QR</span>
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-zinc-400 font-mono text-[10px]">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Quick action button */}
        {task.status === 'waiting_approval' && isManager ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.success();
                store.approveTask(task.id);
              }}
              className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer card-3d-tactile"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Onayla</span>
            </button>
          </div>
        ) : task.status === 'completed' ? (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold px-2 py-1 rounded bg-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tamamlandı</span>
          </span>
        ) : (
          <button
            onClick={handleQuickCheck}
            className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#D8FF4F]/10 hover:bg-[#D8FF4F]/20 active:scale-95 text-[#D8FF4F] border border-[#D8FF4F]/25 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer card-3d-tactile"
          >
            <span>{task.status === 'in_progress' ? 'Detay & Kanıt' : 'Başlat'}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </NeonCard>
  );
};
