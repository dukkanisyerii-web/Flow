import React from 'react';
import { useAppStore, store } from '../../store/appStore';
import { NowCard } from '../home/NowCard';
import { QuickActionDock } from '../home/QuickActionDock';
import { VoiceTaskCreator } from '../home/VoiceTaskCreator';
import { TaskCard } from '../tasks/TaskCard';
import {
  Clock,
  Sparkles,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Calendar,
  CalendarDays,
  Flame,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { SmartDayCycleBanner } from '../common/SmartDayCycleBanner';

export const EmployeeHomeView: React.FC = () => {
  const { currentUser, tasks, zones, shifts, announcements, activityLogs } = useAppStore();

  const userTasks = tasks.filter(
    (t) =>
      t.assignedTo.includes(currentUser.id) ||
      t.assignedToRole === currentUser.position
  );

  const pendingTasks = userTasks.filter((t) => t.status !== 'completed');
  const completedTasks = userTasks.filter((t) => t.status === 'completed');

  // Next up task: first pending task (prioritize urgent or in_progress)
  const upNextTask =
    pendingTasks.find((t) => t.status === 'in_progress') ||
    pendingTasks.find((t) => t.priority === 'urgent') ||
    pendingTasks[0];

  const upNextZone = zones.find((z) => z.id === upNextTask?.zoneId);

  const currentShift = shifts.find((s) => s.employeeId === currentUser.id);
  const activeAnnouncement = announcements[0];

  const completionRate =
    userTasks.length > 0
      ? Math.round((completedTasks.length / userTasks.length) * 100)
      : 100;

  return (
    <div className="space-y-4 pb-20 pt-2 animate-in fade-in duration-150">
      {/* Shift & Status Header Capsule */}
      <div className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D8FF4F]/30"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#07090D] ${
                currentUser.shiftStatus === 'clocked_in'
                  ? 'bg-emerald-400'
                  : currentUser.shiftStatus === 'on_break'
                  ? 'bg-amber-400'
                  : 'bg-zinc-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">İyi Çalışmalar, {currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] font-mono text-[#D8FF4F] px-1 rounded bg-[#D8FF4F]/10">
                {currentUser.position}
              </span>
            </div>
            <p className="text-[11px] text-[#8E98A8] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[#D8FF4F]" />
              {currentShift ? `Vardiya: ${currentShift.startTime} - ${currentShift.endTime}` : '08:00 - 17:00'}
            </p>
          </div>
        </div>

        {/* Break Toggle Button */}
        <button
          onClick={() => store.toggleBreak(currentUser.id)}
          className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            currentUser.shiftStatus === 'on_break'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{currentUser.shiftStatus === 'on_break' ? 'Moladasın' : 'Mola Al'}</span>
        </button>
      </div>

      {/* Akıllı Gün Döngüsü & Usta Modu */}
      <SmartDayCycleBanner />

      {/* Active Manager Announcement Banner */}
      {activeAnnouncement && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-rose-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <Megaphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                {activeAnnouncement.title}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeAnnouncement.createdAt}
              </span>
            </div>
            <p className="text-xs text-zinc-200 mt-0.5 leading-snug">
              {activeAnnouncement.content}
            </p>
          </div>
        </div>
      )}

      {/* NOW CARD: HERO UP NEXT */}
      <NowCard task={upNextTask} zone={upNextZone} />

      {/* Employee Shift Card (Bugünkü Vardiyam & Haftalık Çizelge) */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 flex items-center justify-center text-[#D8FF4F] shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">Bugünkü Vardiyam</span>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold font-mono text-white">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayShift = shifts.find((s) => s.employeeId === currentUser.id && s.date === todayStr);
                  if (!todayShift) return '08:00 — 16:00 (Sabah)';
                  if (todayShift.isOffDay) return 'İzinli (Dinlenme Günü)';
                  return `${todayShift.startTime} — ${todayShift.endTime}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            haptics.tap();
            store.setActiveTab('schedule');
          }}
          className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#D8FF4F] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Tüm Hafta</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Daily Progress Stats Capsule */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl glass-panel border border-white/10 text-center">
          <p className="text-[10px] text-[#8E98A8] uppercase tracking-wider font-semibold">
            Kalan Görev
          </p>
          <p className="text-lg font-bold text-white font-mono mt-0.5">
            {pendingTasks.length} <span className="text-xs text-[#8E98A8]">/ {userTasks.length}</span>
          </p>
        </div>

        <div className="p-3 rounded-xl glass-panel border border-white/10 text-center">
          <p className="text-[10px] text-[#8E98A8] uppercase tracking-wider font-semibold">
            Tamamlama
          </p>
          <p className="text-lg font-bold text-[#D8FF4F] font-mono mt-0.5">
            %{completionRate}
          </p>
        </div>

        <div className="p-3 rounded-xl glass-panel border border-white/10 text-center">
          <p className="text-[10px] text-[#8E98A8] uppercase tracking-wider font-semibold">
            Kalite Skoru
          </p>
          <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" />
            98
          </p>
        </div>
      </div>

      {/* VOICE TASK CREATOR WITH AUDIO WAVEFORM */}
      <VoiceTaskCreator />

      {/* QUICK ACTION DOCK */}
      <QuickActionDock />

      {/* Remaining Tasks Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
            Bugünün Diğer Görevleri ({pendingTasks.length})
          </h3>
          <button
            onClick={() => store.setActiveTab('tasks')}
            className="text-xs text-[#D8FF4F] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Tümünü Gör</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {pendingTasks
            .filter((t) => t.id !== upNextTask?.id)
            .slice(0, 3)
            .map((task) => {
              const zone = zones.find((z) => z.id === task.zoneId);
              return <TaskCard key={task.id} task={task} zone={zone} />;
            })}

          {pendingTasks.length <= 1 && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-[#8E98A8]">
              Sıradaki tüm öncelikli görevler yukarıdaki Now Card üzerinde gösterilmektedir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
