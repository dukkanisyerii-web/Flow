import React from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Sun,
  Flame,
  Moon,
  Sparkles,
  Glasses,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Coffee,
  Calendar,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const SmartDayCycleBanner: React.FC = () => {
  const { chefMode, tasks, shifts, users } = useAppStore();

  const now = new Date();
  const hour = now.getHours();

  // Determine current cycle
  // 1. Morning: 06:00 - 11:30
  // 2. Service: 11:30 - 21:00
  // 3. Night / Closing: 21:00 - 05:59
  let cycleType: 'morning' | 'service' | 'night' = 'service';
  if (hour >= 6 && hour < 12) {
    cycleType = 'morning';
  } else if (hour >= 12 && hour < 21) {
    cycleType = 'service';
  } else {
    cycleType = 'night';
  }

  const cycleConfig = {
    morning: {
      title: 'Açılış & Hazırlık Döngüsü',
      timeSpan: '06:00 – 12:00',
      badge: 'Sabah Hazırlığı',
      description: 'Fırın & ocak kontrolleri, soğuk depo dereceleri ve malzeme kabulü',
      icon: Sun,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      actionText: 'Hazır Sabah İşleri',
      actionHandler: () => {
        haptics.tap();
        store.openModal('template_assign');
      },
    },
    service: {
      title: 'Yoğun Servis & Mola Takibi',
      timeSpan: '12:00 – 21:00',
      badge: 'Servis Temposu',
      description: 'Mutfak hızı, personel mola saatleri ve acil aksaklık çözümleri',
      icon: Flame,
      iconColor: 'text-[#D8FF4F]',
      borderColor: 'border-[#D8FF4F]/30',
      bgGradient: 'from-[#D8FF4F]/10 via-[#D8FF4F]/5 to-transparent',
      actionText: 'Hızlı Düğmeler',
      actionHandler: () => {
        haptics.tap();
        store.openModal('button_builder');
      },
    },
    night: {
      title: 'Kapanış & Yarının Kadrosu',
      timeSpan: '21:00 – 06:00',
      badge: 'Gece Kapanışı',
      description: 'Tezgah hijyeni, kasa kapatma ve yarın sabah kim açacak kontrolü',
      icon: Moon,
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      bgGradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      actionText: 'Yarının Vardiyası',
      actionHandler: () => {
        haptics.tap();
        store.setActiveTab('schedule');
      },
    },
  }[cycleType];

  const Icon = cycleConfig.icon;

  // Active breaks count
  const onBreakCount = users.filter((u) => u.shiftStatus === 'on_break').length;
  // Urgent tasks count
  const urgentTasksCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div
      id="smart-day-cycle-banner"
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${cycleConfig.borderColor} ${cycleConfig.bgGradient} p-3.5 sm:p-4 transition-all shadow-md ${
        chefMode ? 'p-4 sm:p-5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 ${cycleConfig.iconColor}`}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white">
                {cycleConfig.badge}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {cycleConfig.timeSpan}
              </span>

              {urgentTasksCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  {urgentTasksCount} Acil İş
                </span>
              )}
              {onBreakCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {onBreakCount} Molada
                </span>
              )}
            </div>

            <h3
              className={`font-bold text-white tracking-tight ${
                chefMode ? 'text-base sm:text-lg font-black' : 'text-sm sm:text-base'
              }`}
            >
              {cycleConfig.title}
            </h3>

            <p
              className={`text-zinc-300 leading-snug ${
                chefMode ? 'text-xs sm:text-sm font-medium' : 'text-xs text-zinc-400'
              }`}
            >
              {cycleConfig.description}
            </p>
          </div>
        </div>

        {/* Usta Modu (Chef Mode) Quick Toggle Pill */}
        <button
          onClick={() => store.toggleChefMode()}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
            chefMode
              ? 'bg-[#D8FF4F] text-black border-[#D8FF4F] shadow-[0_0_15px_rgba(216,255,79,0.3)]'
              : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
          }`}
          title={chefMode ? 'Usta Modu Aktif (Büyük Font)' : 'Usta Modunu Aç'}
        >
          <Glasses className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden xs:inline">{chefMode ? 'Usta Modu Açık' : 'Usta Modu'}</span>
        </button>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          Dükkan temposuna göre önerilen hızlı aksiyon:
        </span>

        <button
          onClick={cycleConfig.actionHandler}
          className="ml-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>{cycleConfig.actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#D8FF4F]" />
        </button>
      </div>
    </div>
  );
};
