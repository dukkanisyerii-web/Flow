import React from 'react';
import { useAppStore, store } from '../../store/appStore';
import { Clock, Sun, Moon, Coffee, UserCheck, AlertCircle } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface ShiftTimelineBarProps {
  dateStr?: string;
  compact?: boolean;
}

export const ShiftTimelineBar: React.FC<ShiftTimelineBarProps> = ({ dateStr, compact = false }) => {
  const { shifts, users, chefMode } = useAppStore();

  const targetDateStr = dateStr || new Date().toISOString().split('T')[0];
  const dayShifts = shifts.filter((s) => s.date === targetDateStr && !s.isOffDay);

  // Time range: 07:00 (7) to 24:00 (24) -> total 17 hours
  const START_HOUR = 7;
  const END_HOUR = 24;
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  // Calculate current time position
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isToday = targetDateStr === now.toISOString().split('T')[0];
  const currentTimeDecimal = currentHour + currentMinute / 60;
  
  const currentPercent = Math.min(
    100,
    Math.max(0, ((currentTimeDecimal - START_HOUR) / TOTAL_HOURS) * 100)
  );

  // Helper to parse "HH:mm" to decimal hour
  const parseHour = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 8;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Check how many people are currently working right now
  const currentlyWorking = dayShifts.filter((shift) => {
    const s = parseHour(shift.startTime);
    const e = parseHour(shift.endTime);
    return currentTimeDecimal >= s && currentTimeDecimal <= e;
  });

  // Hours marker labels (every 2 hours: 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00)
  const markerHours = [8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div
      id="live-shift-timeline"
      className={`rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all ${
        compact ? 'p-3' : 'p-4 sm:p-5 space-y-4'
      } ${chefMode ? 'ring-1 ring-white/15' : ''}`}
    >
      {/* Header with Glanceable Stats */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/25 flex items-center justify-center text-[#D8FF4F]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4
              className={`font-bold text-white tracking-tight flex items-center gap-2 ${
                chefMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
            >
              <span>Canlı Zaman Şeridi (24 Saat)</span>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                  Canlı Akış
                </span>
              )}
            </h4>
            <p className="text-[11px] text-[#8E98A8]">
              {isToday ? (
                <>
                  Şu an dükkanda:{' '}
                  <strong className="text-white font-mono">{currentlyWorking.length} Kişi</strong> görevde
                </>
              ) : (
                'Günün saat bazlı çalışma yoğunluğu'
              )}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Sabah
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Akşam
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Tam Gün
          </span>
        </div>
      </div>

      {/* Timeline Visual Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Hour Grid Markers Header */}
        <div className="relative h-4 border-b border-white/10 mb-2">
          {markerHours.map((hour) => {
            const leftPercent = ((hour - START_HOUR) / TOTAL_HOURS) * 100;
            return (
              <div
                key={hour}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 font-semibold">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className="w-[1px] h-1.5 bg-white/20 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* Staff Shift Rows (Stacked visually like Apple Fitness / Gantt) */}
        <div className="space-y-2 relative">
          {dayShifts.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 italic">
              Bu gün için henüz aktif vardiya saati girilmedi.
            </div>
          ) : (
            dayShifts.map((shift) => {
              const startDec = parseHour(shift.startTime);
              const endDec = parseHour(shift.endTime);

              const leftPercent = Math.max(
                0,
                Math.min(100, ((startDec - START_HOUR) / TOTAL_HOURS) * 100)
              );
              const widthPercent = Math.max(
                4,
                Math.min(100 - leftPercent, ((endDec - startDec) / TOTAL_HOURS) * 100)
              );

              // Determine shift color archetype
              const isMorning = startDec < 12 && endDec <= 17;
              const isEvening = startDec >= 14;
              const isFullDay = (endDec - startDec) >= 10;

              let colorClasses = 'bg-gradient-to-r from-amber-500/30 to-amber-500/50 border-amber-400/50 text-amber-200';
              if (isEvening) {
                colorClasses = 'bg-gradient-to-r from-indigo-500/30 to-indigo-500/50 border-indigo-400/50 text-indigo-200';
              } else if (isFullDay) {
                colorClasses = 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/50 border-emerald-400/50 text-emerald-200';
              }

              const isCurrentlyActive = isToday && currentTimeDecimal >= startDec && currentTimeDecimal <= endDec;

              return (
                <div key={shift.id} className="relative h-8 sm:h-9 w-full bg-white/[0.02] rounded-xl overflow-hidden">
                  {/* Visual Range Block */}
                  <div
                    onClick={() => {
                      haptics.tap('selection');
                      store.openModal('shift_sheet', { shiftId: shift.id, date: shift.date });
                    }}
                    className={`absolute top-0 bottom-0 rounded-lg border flex items-center px-2.5 transition-all cursor-pointer hover:brightness-125 shadow-sm ${colorClasses} ${
                      isCurrentlyActive ? 'ring-1 ring-[#D8FF4F] shadow-[0_0_12px_rgba(216,255,79,0.25)]' : ''
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    title={`${shift.employeeName} (${shift.startTime} - ${shift.endTime})`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <span className={`font-bold truncate text-white ${chefMode ? 'text-xs' : 'text-[11px]'}`}>
                        {shift.employeeName}
                      </span>
                      <span className="text-[10px] font-mono opacity-80 shrink-0 hidden sm:inline">
                        {shift.startTime}-{shift.endTime}
                      </span>
                      {isCurrentlyActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D8FF4F] animate-ping shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Glowing Vertical "NOW" (Şu An) Marker Line */}
          {isToday && currentPercent >= 0 && currentPercent <= 100 && (
            <div
              className="absolute top-[-24px] bottom-0 w-[2px] bg-[#D8FF4F] pointer-events-none z-10 shadow-[0_0_10px_#D8FF4F]"
              style={{ left: `${currentPercent}%` }}
            >
              {/* Badge on top */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#D8FF4F] text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow font-mono">
                {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
