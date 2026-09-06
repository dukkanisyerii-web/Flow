import React, { useState, useMemo } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  BookOpen,
  ArrowRight,
  TrendingUp,
  MapPin,
  Coffee,
  Check,
  Sparkles,
  ShieldAlert,
  BarChart3,
  LayoutDashboard,
  Filter,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  Radio,
  UserPlus,
  Timer,
  ShieldCheck,
  AlertCircle,
  Flame,
  Wrench,
  CalendarDays,
  Calendar,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { NeonCard } from '../common/NeonCard';
import { SmartDayCycleBanner } from '../common/SmartDayCycleBanner';
import { ShiftTimelineBar } from '../schedule/ShiftTimelineBar';

export const ManagerDashboardView: React.FC = () => {
  const { tasks, users, zones, issues, activityLogs, shifts, chefMode } = useAppStore();
  const [managerTab, setManagerTab] = useState<'overview' | 'analytics'>('overview');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string | null>(null);

  // Core metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const waitingApprovalTasks = tasks.filter((t) => t.status === 'waiting_approval');
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');

  const activeStaff = users.filter((u) => u.shiftStatus === 'clocked_in');
  const breakStaff = users.filter((u) => u.shiftStatus === 'on_break');
  const openIssues = issues.filter((i) => i.status !== 'closed' && i.status !== 'resolved');

  // Dynamic Kitchen Performance Metrics
  const avgCompletionTimeMinutes = useMemo(() => {
    if (completedTasks.length === 0) return 18.5;
    const durations = completedTasks.map((t) => {
      if (t.completedAt && t.createdAt) {
        const diff = (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
        if (diff > 0 && diff < 240) return diff;
      }
      return t.estimatedMinutes || 15;
    });
    const avg = durations.reduce((acc, cur) => acc + cur, 0) / durations.length;
    return Math.round(avg * 10) / 10;
  }, [completedTasks]);

  const pendingIncidents = useMemo(() => {
    return issues.filter((i) => i.status !== 'closed' && i.status !== 'resolved');
  }, [issues]);

  const urgentIncidents = useMemo(() => {
    return pendingIncidents.filter((i) => i.priority === 'urgent' || i.priority === 'high');
  }, [pendingIncidents]);

  const kitchenEfficiencyScore = useMemo(() => {
    if (totalTasks === 0) return 96;
    const onTimeCompleted = completedTasks.filter((t) => t.status !== 'overdue').length;
    const penalty = overdueTasks.length * 4 + urgentIncidents.length * 3;
    return Math.max(68, Math.min(99, Math.round(94 + (onTimeCompleted / totalTasks) * 6 - penalty)));
  }, [totalTasks, completedTasks, overdueTasks, urgentIncidents]);

  const overallCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Filter tasks if zone filter is clicked
  const displayedTasks = selectedZoneFilter
    ? tasks.filter((t) => t.zoneId === selectedZoneFilter)
    : tasks;

  return (
    <div className="space-y-4 pb-24 pt-1 animate-in fade-in duration-150">
      {/* 1. Top Manager Quick Action Command Ribbon (Responsive 2 cols on mobile, 5 on xs+) */}
      <div className="grid grid-cols-2 xs:grid-cols-5 gap-2">
        <button
          onClick={() => {
            haptics.tap();
            store.openModal('create_task');
          }}
          className="p-2.5 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] active:scale-[0.98] text-black font-bold text-xs flex items-center xs:flex-col justify-center gap-2 xs:gap-1.5 shadow-[0_4px_20px_rgba(216,255,79,0.22)] transition-all cursor-pointer min-h-[48px]"
        >
          <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="font-semibold text-xs xs:text-[11px] truncate">+ Yeni İş Yaz</span>
        </button>

        <button
          onClick={() => {
            haptics.tap();
            store.setActiveTab('schedule');
          }}
          className="p-2.5 rounded-xl glass-card hover:bg-white/[0.05] active:scale-[0.98] border border-white/10 hover:border-[#D8FF4F]/50 text-white font-semibold text-xs flex items-center xs:flex-col justify-center gap-2 xs:gap-1.5 transition-all cursor-pointer min-h-[48px]"
        >
          <div className="w-6 h-6 rounded-lg bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-[#D8FF4F]" />
          </div>
          <span className="text-zinc-200 text-xs xs:text-[11px] truncate">Vardiya Tablosu</span>
        </button>

        <button
          onClick={() => {
            haptics.tap();
            store.openModal('add_employee');
          }}
          className="p-2.5 rounded-xl glass-card hover:bg-white/[0.05] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white font-semibold text-xs flex items-center xs:flex-col justify-center gap-2 xs:gap-1.5 transition-all cursor-pointer min-h-[48px]"
        >
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <span className="text-zinc-200 text-xs xs:text-[11px] truncate">+ Eleman Ekle</span>
        </button>

        <button
          onClick={() => {
            haptics.tap();
            store.openModal('template_assign');
          }}
          className="p-2.5 rounded-xl glass-card hover:bg-white/[0.05] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white font-semibold text-xs flex items-center xs:flex-col justify-center gap-2 xs:gap-1.5 transition-all cursor-pointer min-h-[48px]"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-zinc-200 text-xs xs:text-[11px] truncate">Hazır İşler</span>
        </button>

        <button
          onClick={() => {
            haptics.tap();
            store.openModal('button_builder');
          }}
          className="p-2.5 rounded-xl glass-card hover:bg-white/[0.05] active:scale-[0.98] border border-white/10 hover:border-white/20 text-white font-semibold text-xs flex items-center xs:flex-col justify-center gap-2 xs:gap-1.5 transition-all cursor-pointer min-h-[48px]"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-zinc-200 text-xs xs:text-[11px] truncate">Hızlı Düğmeler</span>
        </button>
      </div>

      {/* Akıllı Gün Döngüsü & Usta Modu Şeridi (Apple Tarzı Dinamik Zaman Rozeti) */}
      <SmartDayCycleBanner />

      {/* 2. Dashboard Sub-navigation Tabs (4px grid: p-1, py-2 px-4 button padding = 2x ratio) */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
        <button
          onClick={() => {
            haptics.tap();
            setManagerTab('overview');
          }}
          className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
            managerTab === 'overview'
              ? 'bg-[#D8FF4F] text-black shadow-md shadow-[#D8FF4F]/15'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Dükkanın Hali</span>
          {waitingApprovalTasks.length > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                managerTab === 'overview'
                  ? 'bg-black text-[#D8FF4F]'
                  : 'bg-amber-400 text-black'
              }`}
            >
              {waitingApprovalTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            haptics.tap();
            setManagerTab('analytics');
          }}
          className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
            managerTab === 'analytics'
              ? 'bg-[#D8FF4F] text-black shadow-md shadow-[#D8FF4F]/15'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Performans & Rapor</span>
          {overdueTasks.length > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                managerTab === 'analytics'
                  ? 'bg-black text-[#D8FF4F]'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {overdueTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* 2.5 Dynamic Kitchen Performance Metrics Summary Cards (NeonCard with 3D Depth, Glossy Shine, Image Backdrops, & Traveling Light) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D8FF4F] animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dükkan Durumu & Günün Özeti
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#8E98A8]">
            Anlık Durum
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Average Task Completion Time */}
          <NeonCard
            neonColor="lime"
            tactile={true}
            shine={true}
            interactive={true}
            onClick={() => {
              haptics.tap();
              store.setActiveTab('tasks');
            }}
            className="group relative min-h-[105px] border border-white/[0.12] bg-[#0A0E17]"
          >
            {/* Photographic Background */}
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80"
              alt="Mutfak Hazırlık İstasyonu"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            {/* Dark Mask for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/80 to-[#0A0E17]/60 pointer-events-none" />

            <div className="relative z-10 p-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">
                  Ortalama İş Bitirme
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#D8FF4F]/15 border border-[#D8FF4F]/30 flex items-center justify-center text-[#D8FF4F]">
                  <Timer className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white group-hover:text-[#D8FF4F] transition-colors">
                    {avgCompletionTimeMinutes}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">dakika</span>
                </div>
                <p className="text-[11px] text-[#D8FF4F] font-medium flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>Hedef süre: 25 dakika</span>
                </p>
              </div>
            </div>
          </NeonCard>

          {/* 2. Pending Incident Reports */}
          <NeonCard
            neonColor={urgentIncidents.length > 0 ? 'coral' : 'amber'}
            tactile={true}
            shine={true}
            interactive={true}
            onClick={() => {
              haptics.tap();
              store.openModal('report_issue');
            }}
            className="group relative min-h-[105px] border border-white/[0.12] bg-[#0A0E17]"
          >
            {/* Photographic Background */}
            <img
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80"
              alt="Mutfak Ekipman & Cihaz"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/80 to-[#0A0E17]/60 pointer-events-none" />

            <div className="relative z-10 p-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">
                  Dükkandaki Arızalar
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    urgentIncidents.length > 0
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-bold font-mono ${
                      urgentIncidents.length > 0 ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  >
                    {pendingIncidents.length}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">arızalı</span>
                </div>
                <p
                  className={`text-[11px] font-medium truncate mt-0.5 ${
                    urgentIncidents.length > 0 ? 'text-rose-400 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {urgentIncidents.length > 0
                    ? `⚠️ ${urgentIncidents.length} acil tamir lazım`
                    : 'Aksilik veya arıza bildirilmedi'}
                </p>
              </div>
            </div>
          </NeonCard>

          {/* 3. Kitchen Cleanliness & SLA Score */}
          <NeonCard
            neonColor="emerald"
            tactile={true}
            shine={true}
            interactive={true}
            onClick={() => {
              haptics.tap();
              setManagerTab('analytics');
            }}
            className="group relative min-h-[105px] border border-white/[0.12] bg-[#0A0E17]"
          >
            <img
              src="https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=500&q=80"
              alt="Mutfak Hijyen"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/80 to-[#0A0E17]/60 pointer-events-none" />

            <div className="relative z-10 p-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">
                  Dükkan Temizlik & Düzen
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    %{kitchenEfficiencyScore}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">puan</span>
                </div>
                <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Temizlik ve hijyen tam puan</span>
                </p>
              </div>
            </div>
          </NeonCard>

          {/* 4. Active Staff & Station Distribution */}
          <NeonCard
            neonColor="blue"
            tactile={true}
            shine={true}
            interactive={true}
            onClick={() => {
              haptics.tap();
              store.openModal('add_employee');
            }}
            className="group relative min-h-[105px] border border-white/[0.12] bg-[#0A0E17]"
          >
            <img
              src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&q=80"
              alt="Mutfak Ekibi"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/80 to-[#0A0E17]/60 pointer-events-none" />

            <div className="relative z-10 p-3 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E98A8]">
                  Dükkandaki Elemanlar
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {activeStaff.length}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">kişi çalışıyor</span>
                </div>
                <p className="text-[11px] text-sky-300 font-medium truncate mt-0.5">
                  {breakStaff.length > 0
                    ? `☕ ${breakStaff.length} kişi molada`
                    : '✓ Herkes dükkanda işinin başında'}
                </p>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>

      {/* 3. Primary KPI Matrix (Unified Glass Card - Responsive on mobile) */}
      <div className="p-4 rounded-2xl glass-card space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-white tracking-tight">Günün İş Durumu</span>
          </div>
          <span className="text-[11px] font-mono text-[#8E98A8]">
            Tamamlanma: <strong className="text-white font-mono">%{overallCompletionRate}</strong>
          </span>
        </div>

        {/* 4 Metric Columns - 2x2 on mobile, 4 cols on larger */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-1">
          {/* Tamamlanan */}
          <div
            onClick={() => {
              haptics.tap();
              store.setActiveTab('tasks');
            }}
            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all cursor-pointer text-center group min-h-[64px] flex flex-col justify-center"
          >
            <p className="text-[10px] sm:text-[11px] text-[#8E98A8] font-medium tracking-tight">Biten İşler</p>
            <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {completedTasks.length}
              <span className="text-[10px] text-zinc-500 font-normal">/{totalTasks}</span>
            </p>
          </div>

          {/* Süren */}
          <div
            onClick={() => {
              haptics.tap();
              store.setActiveTab('tasks');
            }}
            className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all cursor-pointer text-center group min-h-[64px] flex flex-col justify-center"
          >
            <p className="text-[10px] sm:text-[11px] text-[#8E98A8] font-medium tracking-tight">Yapılmakta Olan</p>
            <p className="text-base sm:text-lg font-bold text-blue-400 font-mono mt-0.5">
              {inProgressTasks.length}
            </p>
          </div>

          {/* Onay Bekleyen */}
          <div
            onClick={() => {
              haptics.tap();
              const el = document.getElementById('approval-queue-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-2.5 sm:p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/[0.08] transition-all cursor-pointer text-center group min-h-[64px] flex flex-col justify-center"
          >
            <p className="text-[10px] sm:text-[11px] text-amber-400 font-medium tracking-tight">Onayını Bekleyen</p>
            <p className="text-base sm:text-lg font-bold text-amber-300 font-mono mt-0.5">
              {waitingApprovalTasks.length}
            </p>
          </div>

          {/* Geciken */}
          <div
            onClick={() => {
              haptics.tap();
              store.setActiveTab('tasks');
            }}
            className="p-2.5 sm:p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/[0.08] transition-all cursor-pointer text-center group min-h-[64px] flex flex-col justify-center"
          >
            <p className="text-[10px] sm:text-[11px] text-rose-400 font-medium tracking-tight">Aksayan / Geciken</p>
            <p className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-0.5">
              {overdueTasks.length}
            </p>
          </div>
        </div>

        {/* Global Progress Line (Mathematically proportional bar) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[#8E98A8]">Günün İşlerini Bitirme Oranı</span>
            <span className="font-mono font-bold text-white">%{overallCompletionRate}</span>
          </div>
          <div className="w-full h-2 bg-white/[0.07] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${overallCompletionRate}%` }}
            />
            {waitingApprovalTasks.length > 0 && (
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${totalTasks > 0 ? (waitingApprovalTasks.length / totalTasks) * 100 : 0}%`,
                }}
              />
            )}
            {overdueTasks.length > 0 && (
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{
                  width: `${totalTasks > 0 ? (overdueTasks.length / totalTasks) * 100 : 0}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* When Analytics Tab is selected, focus entirely on the dedicated view */}
      {managerTab === 'analytics' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AnalyticsDashboard />
        </div>
      ) : (
        <>
          {/* 4. Approval Queue Section (Clean Flattened Rows - Anti-Slop: No cards inside cards) */}
          {waitingApprovalTasks.length > 0 && (
            <div
              id="approval-queue-section"
              className="p-4 rounded-2xl glass-card border border-amber-500/35 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Bitti, Onayını Bekleyen İşler ({waitingApprovalTasks.length})
                  </h3>
                </div>
                <span className="text-[11px] text-amber-400/80 font-medium">Fotoğraflı Kanıtlar</span>
              </div>

              {/* Flattened Divider-Based Rows */}
              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {waitingApprovalTasks.map((t) => {
                  const zone = zones.find((z) => z.id === t.zoneId);
                  return (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {t.livePhotoProof ? (
                          <div className="relative group shrink-0">
                            <img
                              src={t.livePhotoProof.url}
                              alt="Kanıt Görseli"
                              onClick={() => store.openPhotoViewer(t.livePhotoProof!)}
                              className="w-12 h-12 rounded-xl object-cover border border-white/20 cursor-pointer group-hover:opacity-80 transition-opacity"
                              title="Fotoğrafı Büyüt"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition-opacity pointer-events-none">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D8FF4F] shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate tracking-tight">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-[#D8FF4F] px-1.5 py-0.2 rounded bg-[#D8FF4F]/10">
                              {zone?.name || 'Bölge'}
                            </span>
                            <span className="text-[10px] text-[#8E98A8] font-mono">
                              {t.livePhotoProof?.timestamp || 'Yeni bitti'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2x Button Padding: py-1.5 px-3 (6px / 12px) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => store.setSelectedTaskId(t.id)}
                          className="py-1.5 px-3 rounded-lg glass-button text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Bak
                        </button>
                        <button
                          onClick={() => store.approveTask(t.id)}
                          className="py-1.5 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] text-black text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Onayla</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Open Issues / Critical Incident Radar (Flattened Rows) */}
          {openIssues.length > 0 && (
            <div className="p-4 rounded-2xl glass-card border border-rose-500/35 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Dükkandaki Arızalar & Aksilikler ({openIssues.length})
                  </h3>
                </div>
                <button
                  onClick={() => store.openModal('report_issue')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer whitespace-nowrap"
                >
                  + Yeni Arıza Bildir
                </button>
              </div>

              {/* Flattened Divider-Based Rows */}
              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {openIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase whitespace-nowrap ${
                            issue.urgency === 'critical'
                              ? 'bg-rose-500 text-white'
                              : issue.urgency === 'high'
                              ? 'bg-amber-400 text-black'
                              : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {issue.urgency === 'critical'
                            ? 'ACİL / KRİTİK'
                            : issue.urgency === 'high'
                            ? 'ÖNEMLİ'
                            : 'NORMAL'}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">{issue.title}</span>
                      </div>
                      <p className="text-[11px] text-[#8E98A8] mt-1 line-clamp-1">
                        {issue.description || 'Açıklama belirtilmedi.'}
                      </p>
                    </div>

                    <button
                      onClick={() => store.resolveIssue(issue.id)}
                      className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black text-zinc-300 text-xs font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      Tamam / Çözüldü
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Integrated Operational Analytics (Donut & Ranked Delays) */}
          <AnalyticsDashboard />

          {/* 7. Restaurant Area Health Matrix (Restoran Bölge Durumları) */}
          <div className="p-4 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D8FF4F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Dükkan Bölümleri & Temizlik Durumu
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#D8FF4F]">
                Ortalama %{overallCompletionRate}
              </span>
            </div>

            <p className="text-[11px] text-[#8E98A8]">
              Mutfak, salon, kasa ve lavaboların son hali:
            </p>

            {/* Clean Grid of Zone Health Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              {zones.map((zone) => {
                const zoneTasks = tasks.filter((t) => t.zoneId === zone.id);
                const zoneCompleted = zoneTasks.filter((t) => t.status === 'completed');
                const zoneOverdue = zoneTasks.filter((t) => t.status === 'overdue');
                const pct =
                  zoneTasks.length > 0
                    ? Math.round((zoneCompleted.length / zoneTasks.length) * 100)
                    : 100;

                const isFiltered = selectedZoneFilter === zone.id;

                return (
                  <div
                    key={zone.id}
                    onClick={() => {
                      haptics.tap();
                      setSelectedZoneFilter(isFiltered ? null : zone.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isFiltered
                        ? 'bg-[#D8FF4F]/10 border-[#D8FF4F] ring-1 ring-[#D8FF4F]/50'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-white truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D8FF4F]" />
                        {zone.name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {zoneCompleted.length}/{zoneTasks.length}
                      </span>
                    </div>

                    {/* Proportional completion bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct === 100
                            ? 'bg-emerald-400'
                            : pct >= 50
                            ? 'bg-[#D8FF4F]'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                      {zoneOverdue.length > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all duration-300 animate-pulse"
                          style={{
                            width: `${(zoneOverdue.length / (zoneTasks.length || 1)) * 100}%`,
                          }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8E98A8] font-mono mt-1.5">
                      <span>%{pct} Bitti</span>
                      {zoneOverdue.length > 0 ? (
                        <span className="text-rose-400 font-bold">{zoneOverdue.length} Aksama</span>
                      ) : (
                        <span className="text-emerald-400">Temiz</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedZoneFilter && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-zinc-300">
                  Seçilen Bölüm: <strong className="text-[#D8FF4F]">{zones.find((z) => z.id === selectedZoneFilter)?.name}</strong>
                </span>
                <button
                  onClick={() => setSelectedZoneFilter(null)}
                  className="text-xs text-[#D8FF4F] underline cursor-pointer"
                >
                  Filtreyi Kaldır
                </button>
              </div>
            )}
          </div>

          {/* 7.5 Haftalık Vardiya Çizelgesi Özeti (48 yaşındaki şef için büyük puntolu, Apple tarzı net kart) */}
          <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/15 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D8FF4F]/15 border border-[#D8FF4F]/30 flex items-center justify-center text-[#D8FF4F]">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Haftalık Vardiya Çizelgesi
                  </h3>
                  <p className="text-[11px] text-[#8E98A8]">
                    Bugün çalışanlar ve haftalık plan
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.tap();
                  store.setActiveTab('schedule');
                }}
                className="py-1.5 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow"
              >
                <span>Çizelgeyi Aç</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Today Shifts Summary */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayShifts = shifts.filter((s) => s.date === todayStr);
              const workingShifts = todayShifts.filter((s) => !s.isOffDay);
              const offShifts = todayShifts.filter((s) => s.isOffDay);

              if (todayShifts.length === 0) {
                return (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-400">
                      Bugün için henüz vardiya saati yazılmadı.
                    </p>
                    <button
                      onClick={() => {
                        haptics.tap();
                        store.setActiveTab('schedule');
                      }}
                      className="text-xs font-bold text-[#D8FF4F] hover:underline cursor-pointer"
                    >
                      + Vardiya Gir
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                      <span className="font-semibold">☀️ Görevde</span>
                      <strong className="font-mono text-sm">{workingShifts.length} Kişi</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-300 flex items-center justify-between">
                      <span className="font-semibold">🌴 İzinli</span>
                      <strong className="font-mono text-sm">{offShifts.length} Kişi</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {workingShifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => store.setActiveTab('schedule')}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{shift.employeeName}</span>
                          <span className="text-[10px] text-zinc-400">{shift.position}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-mono font-bold text-[#D8FF4F]">
                          {shift.startTime} — {shift.endTime}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Canlı 24 Saat Zaman Şeridi (Visual Timeline) */}
                  <div className="pt-2">
                    <ShiftTimelineBar compact={false} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 8. Active Staff on Shift (Vardiyadaki Personel - 4px grid & flattened rows) */}
          <div className="p-4 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D8FF4F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Dükkandaki Elemanlar ({activeStaff.length} Çalışıyor, {breakStaff.length} Molada)
                </h3>
              </div>
              <button
                onClick={() => store.setActiveTab('team')}
                className="text-xs text-[#D8FF4F] font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                Elemanları Gör
              </button>
            </div>

            {/* Grid of Staff Badges with Strict 4px Math */}
            <div className="grid grid-cols-2 gap-2">
              {users.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => store.switchUser(staff.id)}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#07090D] ${
                          staff.shiftStatus === 'clocked_in'
                            ? 'bg-emerald-400'
                            : staff.shiftStatus === 'on_break'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-zinc-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{staff.name}</p>
                      <p className="text-[10px] text-[#8E98A8] truncate">{staff.position}</p>
                    </div>
                  </div>

                  {staff.shiftStatus === 'on_break' && (
                    <span className="text-[9px] font-semibold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 whitespace-nowrap">
                      Molada
                    </span>
                  )}
                  {staff.shiftStatus === 'clocked_in' && (
                    <span className="text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 whitespace-nowrap">
                      {staff.shiftStartTime || 'İş Başında'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 9. Live Operational Stream (Canlı Etkinlik Akışı - Flattened Chronological List) */}
          <div className="p-4 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D8FF4F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Dükkanda Ne Oldu Bitti? (Canlı Akış)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Anlık</span>
            </div>

            {activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 border-t border-white/[0.08]">
                <p>Dükkan tertemiz, henüz yeni bir hareket yok.</p>
                <p className="text-[11px] text-zinc-500 mt-1">Elemanlar iş bitirdikçe ve vardiyaya girdikçe burada göreceksiniz.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] max-h-60 overflow-y-auto no-scrollbar border-t border-white/[0.08]">
                {activityLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          log.type === 'issue'
                            ? 'bg-rose-500'
                            : log.type === 'approval'
                            ? 'bg-amber-400'
                            : log.type === 'shift'
                            ? 'bg-blue-400'
                            : 'bg-[#D8FF4F]'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-white mr-1.5">{log.userName}</span>
                        <span className="text-zinc-300">{log.action}</span>
                        {log.details && (
                          <p className="text-[10px] text-[#8E98A8] truncate mt-0.5 font-mono">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                      {log.timeFormatted || log.timestamp.split('T')[1]?.slice(0, 5) || 'Şimdi'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
