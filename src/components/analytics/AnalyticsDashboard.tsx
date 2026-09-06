import React, { useState, useMemo } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface StatusSlice {
  name: string;
  value: number;
  color: string;
  key: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const { tasks, zones } = useAppStore();
  const [timeRange, setTimeRange] = useState<'shift' | 'weekly' | 'monthly'>('shift');

  // Compute Task Completion Distribution for Recharts Donut
  const chartData = useMemo<StatusSlice[]>(() => {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const waitingApproval = tasks.filter((t) => t.status === 'waiting_approval').length;
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    const assigned = tasks.filter((t) => t.status === 'assigned').length;

    const data: StatusSlice[] = [
      { name: 'Tamamlandı', value: completed, color: '#10B981', key: 'completed' },
      { name: 'Devam Eden', value: inProgress, color: '#3B82F6', key: 'in_progress' },
      { name: 'Onay Bekleyen', value: waitingApproval, color: '#F59E0B', key: 'waiting_approval' },
      { name: 'Geciken', value: overdue, color: '#F43F5E', key: 'overdue' },
    ];

    if (assigned > 0) {
      data.push({ name: 'Planlanan', value: assigned, color: '#71717A', key: 'assigned' });
    }

    return data.filter((d) => d.value > 0);
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const overallCompletionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Compute Ranked List of "Most Delayed Areas" (En Çok Geciken Alanlar)
  const rankedDelayedAreas = useMemo(() => {
    const areaStats = zones.map((zone) => {
      const zoneTasks = tasks.filter((t) => t.zoneId === zone.id);
      const zoneOverdue = zoneTasks.filter((t) => t.status === 'overdue').length;
      const zoneCompleted = zoneTasks.filter((t) => t.status === 'completed').length;
      const zoneWaiting = zoneTasks.filter((t) => t.status === 'waiting_approval').length;
      const zoneInProgress = zoneTasks.filter((t) => t.status === 'in_progress').length;

      const totalZone = zoneTasks.length;
      const delayRate = totalZone > 0 ? Math.round((zoneOverdue / totalZone) * 100) : 0;
      const completionRate = totalZone > 0 ? Math.round((zoneCompleted / totalZone) * 100) : 100;

      // Delayed severity calculation score
      const delayScore = zoneOverdue * 10 + zoneWaiting * 2 + (100 - completionRate) * 0.5;

      return {
        zone,
        totalZone,
        zoneOverdue,
        zoneCompleted,
        zoneWaiting,
        zoneInProgress,
        delayRate,
        completionRate,
        delayScore,
      };
    });

    // Rank from most delayed to least delayed
    return areaStats.sort((a, b) => b.delayScore - a.delayScore);
  }, [zones, tasks]);

  // Custom obsidian tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalTasks > 0 ? Math.round((data.value / totalTasks) * 100) : 0;
      return (
        <div className="rounded-xl bg-[#0D1016]/95 border border-white/20 p-2.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="text-xs font-bold text-white">{data.name}</span>
          </div>
          <p className="text-xs font-mono font-semibold text-zinc-300 mt-1">
            {data.value} Görev <span className="text-zinc-500 font-normal">({percent}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 1. Operational Analytics & Donut Distribution (4px grid: p-4, gap-3, outer >= inner padding) */}
      <div className="p-4 rounded-2xl glass-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#D8FF4F]/10 border border-[#D8FF4F]/25 text-[#D8FF4F]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Operasyonel Analitik & SLA
              </h3>
              <p className="text-[11px] text-[#8E98A8]">
                Canlı görev dağılımı ve SLA başarı oranları
              </p>
            </div>
          </div>

          {/* Time range selector (2x button padding: py-1.5 px-3) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <button
              onClick={() => {
                haptics.tap();
                setTimeRange('shift');
              }}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === 'shift'
                  ? 'bg-[#D8FF4F] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vardiya
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setTimeRange('weekly');
              }}
              className={`py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                timeRange === 'weekly'
                  ? 'bg-[#D8FF4F] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Haftalık
            </button>
          </div>
        </div>

        {/* Donut Chart & Legend Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-white/[0.08]">
          {/* Donut Chart Container */}
          <div className="relative h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Value with Mathematical Hierarchy */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                %{overallCompletionRate}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#8E98A8] tracking-wider mt-0.5">
                Tamamlandı
              </span>
            </div>
          </div>

          {/* Metric Status Breakdown (Clean Flattened Rows - No Nested Cards) */}
          <div className="divide-y divide-white/[0.06] border-y sm:border-t-0 sm:border-y-0 border-white/[0.08]">
            {chartData.map((slice) => {
              const pct = totalTasks > 0 ? Math.round((slice.value / totalTasks) * 100) : 0;
              return (
                <div
                  key={slice.key}
                  className="flex items-center justify-between py-2 px-1 text-xs hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-semibold text-zinc-200">{slice.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-white">{slice.value} adet</span>
                    <span className="text-[10px] text-zinc-400">%{pct}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Micro-KPI Bar (Divided Stat Matrix - 4px grid) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold tracking-tight whitespace-nowrap">
              Zamanında Teslim
            </p>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">%95.8</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold tracking-tight whitespace-nowrap">
              Ort. Süre
            </p>
            <p className="text-sm font-bold text-[#D8FF4F] font-mono mt-0.5">14.2 dk</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold tracking-tight whitespace-nowrap">
              Fotoğraf Kanıtı
            </p>
            <p className="text-sm font-bold text-blue-400 font-mono mt-0.5">%100</p>
          </div>
        </div>
      </div>

      {/* 2. Most Delayed Areas Section (En Çok Geciken Alanlar - Flattened Ranked List) */}
      <div className="p-4 rounded-2xl glass-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              En Çok Geciken Alanlar (Bölge Darboğaz Analizi)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Risk Sıralaması</span>
        </div>

        <p className="text-[11px] text-[#8E98A8]">
          Geciken ve aksayan görev yoğunluğuna göre operasyonel risk taşıyan bölgeler:
        </p>

        {/* Flattened Divider-Based Rows (Anti-Slop: No nested cards) */}
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {rankedDelayedAreas.map((stat, idx) => {
            const rank = idx + 1;
            const isHighestRisk = rank === 1 && stat.zoneOverdue > 0;
            const isMediumRisk = rank === 2 && stat.zoneOverdue > 0;

            let rankBadgeColor = 'bg-white/10 text-zinc-300 border-white/15';
            let statusText = 'Normal';
            let statusColor = 'text-emerald-400';

            if (stat.zoneOverdue > 0) {
              if (isHighestRisk) {
                rankBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                statusText = `${stat.zoneOverdue} Gecikme`;
                statusColor = 'text-rose-400 font-bold';
              } else if (isMediumRisk) {
                rankBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                statusText = `${stat.zoneOverdue} Gecikme`;
                statusColor = 'text-amber-400 font-bold';
              } else {
                rankBadgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                statusText = `${stat.zoneOverdue} Gecikme`;
                statusColor = 'text-amber-300 font-semibold';
              }
            } else if (stat.completionRate < 100) {
              statusText = `%${stat.completionRate} Tamam`;
              statusColor = 'text-blue-300 font-semibold';
            } else {
              statusText = 'Sorunsuz %100';
              statusColor = 'text-emerald-400 font-semibold';
            }

            return (
              <div
                key={stat.zone.id}
                onClick={() => {
                  haptics.tap();
                  store.setActiveTab('tasks');
                }}
                className={`py-3 flex flex-col gap-2 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                  isHighestRisk ? 'bg-rose-500/[0.02]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Rank Indicator */}
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold border ${rankBadgeColor} shrink-0`}
                    >
                      #{rank}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {stat.zone.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#D8FF4F] px-1.5 py-0.2 rounded bg-[#D8FF4F]/10">
                          {stat.zone.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {stat.totalZone} Görevden {stat.zoneCompleted} tamamlandı
                      </p>
                    </div>
                  </div>

                  {/* Delay Status Pill */}
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-mono ${statusColor} block`}>
                      {statusText}
                    </span>
                    <span className="text-[10px] text-zinc-500 hover:text-white flex items-center justify-end gap-1 mt-0.5 font-medium">
                      Görevleri Aç <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizing completion vs delay */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${stat.completionRate}%` }}
                    title={`Tamamlandı: %${stat.completionRate}`}
                  />
                  {stat.zoneOverdue > 0 && (
                    <div
                      className="h-full bg-rose-500 transition-all duration-300 animate-pulse"
                      style={{
                        width: `${stat.totalZone > 0 ? (stat.zoneOverdue / stat.totalZone) * 100 : 0}%`,
                      }}
                      title={`Geciken: ${stat.zoneOverdue}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
