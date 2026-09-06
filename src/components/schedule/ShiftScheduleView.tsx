import React, { useState, useMemo } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { Shift, User } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sun,
  Moon,
  Coffee,
  Star,
  Palmtree,
  Clock,
  Users,
  UserCheck,
  Sparkles,
  Edit3,
  CalendarDays,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import {
  WeekDayInfo,
  getMondayOfWeek,
  getWeekDays,
  formatDateToYMD,
  formatReadableDate,
  SHIFT_PRESETS,
} from '../../utils/shiftUtils';
import { ShiftTimelineBar } from './ShiftTimelineBar';

export const ShiftScheduleView: React.FC = () => {
  const { users, shifts, currentUser } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  // Current selected Monday reference
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Active view mode: 'daily' (Bugün / Günün Kadrosu - big readable format), 'weekly' (Haftalık Çizelge), 'by_person' (Personele Göre)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'by_person'>('daily');

  // Selected day for 'daily' view
  const todayStr = formatDateToYMD(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  // Selected filter employee
  const [filterUserId, setFilterUserId] = useState<string>('all');

  // Weekdays info
  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);

  // Selected week range string (e.g. "1 - 7 Eylül 2026")
  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.dayNumber} ${start.monthName} — ${end.dayNumber} ${end.monthName}`;
  }, [weekDays]);

  // Navigation between weeks
  const handlePrevWeek = () => {
    haptics.tap();
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
    const newDays = getWeekDays(prev);
    setSelectedDayStr(newDays[0].dateStr);
  };

  const handleNextWeek = () => {
    haptics.tap();
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
    const newDays = getWeekDays(next);
    setSelectedDayStr(newDays[0].dateStr);
  };

  const handleResetToCurrentWeek = () => {
    haptics.tap();
    const mon = getMondayOfWeek(new Date());
    setCurrentMonday(mon);
    setSelectedDayStr(todayStr);
  };

  // Open modal to add or edit shift
  const handleOpenAddShift = (dateStr?: string, userId?: string) => {
    haptics.tap();
    store.openModal('shift_sheet', {
      dateStr: dateStr || selectedDayStr,
      userId: userId || (users[0]?.id ?? ''),
    });
  };

  const handleOpenEditShift = (shift: Shift) => {
    haptics.tap();
    store.openModal('shift_sheet', {
      shift,
      dateStr: shift.date,
      userId: shift.employeeId,
    });
  };

  // Helper to get shifts for a specific date and employee
  const getShiftFor = (userId: string, dateStr: string): Shift | undefined => {
    return shifts.find((s) => s.employeeId === userId && s.date === dateStr);
  };

  // Filtered users
  const displayedUsers = useMemo(() => {
    if (filterUserId === 'all') return users;
    return users.filter((u) => u.id === filterUserId);
  }, [users, filterUserId]);

  // Daily view data for selectedDayStr
  const dailyShifts = useMemo(() => {
    return shifts.filter((s) => s.date === selectedDayStr);
  }, [shifts, selectedDayStr]);

  const morningShifts = dailyShifts.filter(
    (s) => !s.isOffDay && (s.shiftType === 'morning' || s.startTime.startsWith('08') || s.startTime.startsWith('07') || s.startTime.startsWith('09'))
  );
  const eveningShifts = dailyShifts.filter(
    (s) => !s.isOffDay && (s.shiftType === 'evening' || s.shiftType === 'mid' || s.startTime.startsWith('15') || s.startTime.startsWith('16') || s.startTime.startsWith('17'))
  );
  const fullShifts = dailyShifts.filter(
    (s) => !s.isOffDay && s.shiftType === 'full'
  );
  const offShifts = dailyShifts.filter((s) => s.isOffDay);

  // Other shifts not in above categories
  const otherShifts = dailyShifts.filter(
    (s) =>
      !morningShifts.includes(s) &&
      !eveningShifts.includes(s) &&
      !fullShifts.includes(s) &&
      !offShifts.includes(s)
  );

  // Helper for shift badge styling
  const renderShiftBadge = (shift?: Shift, isLarge: boolean = false) => {
    if (!shift) {
      return (
        <span className="text-zinc-600 text-xs font-mono italic">
          — Vardiya Yazılmadı
        </span>
      );
    }

    if (shift.isOffDay) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-400 font-bold ${
            isLarge ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
          }`}
        >
          <Palmtree className="w-4 h-4 text-zinc-400" />
          <span>Haftalık İzin</span>
        </span>
      );
    }

    let colorClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
    let Icon = Clock;

    if (shift.shiftType === 'morning') {
      colorClass = 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      Icon = Sun;
    } else if (shift.shiftType === 'evening') {
      colorClass = 'bg-sky-500/15 border-sky-500/30 text-sky-300';
      Icon = Moon;
    } else if (shift.shiftType === 'mid') {
      colorClass = 'bg-purple-500/15 border-purple-500/30 text-purple-300';
      Icon = Coffee;
    } else if (shift.shiftType === 'full') {
      colorClass = 'bg-[#D8FF4F]/15 border-[#D8FF4F]/30 text-[#D8FF4F]';
      Icon = Star;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-bold font-mono tracking-tight ${colorClass} ${
          isLarge ? 'text-base sm:text-xl' : 'text-xs sm:text-sm'
        }`}
      >
        <Icon className={isLarge ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3.5 h-3.5'} />
        <span>{shift.startTime} — {shift.endTime}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-24 pt-1 animate-in fade-in duration-150">
      {/* Top Header & Fast Action */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#D8FF4F]" />
            <span>Vardiya Çizelgesi</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#8E98A8] mt-0.5">
            Gözü yormayan, net ve büyük puntolu haftalık çalışma tablosu
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => handleOpenAddShift()}
            className="py-2.5 px-3.5 rounded-2xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Vardiya Ekle</span>
          </button>
        )}
      </div>

      {/* Week Navigator (Apple Style Ribbon) */}
      <div className="p-3 sm:p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3">
        <button
          onClick={handlePrevWeek}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
          title="Önceki Hafta"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              {weekRangeLabel}
            </span>
            <button
              onClick={handleResetToCurrentWeek}
              className="px-2 py-0.5 rounded-full bg-[#D8FF4F]/15 border border-[#D8FF4F]/30 text-[#D8FF4F] text-[11px] font-bold hover:bg-[#D8FF4F]/25 transition-all cursor-pointer"
            >
              Bu Hafta
            </button>
          </div>
          <p className="text-xs text-[#8E98A8] mt-0.5">
            {shifts.length > 0 ? `${shifts.length} vardiya kaydı mevcut` : 'Bu haftaya henüz vardiya girilmedi'}
          </p>
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
          title="Sonraki Hafta"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Autofill Helper for Chef (If shifts are empty or few) */}
      {isManager && shifts.length < users.length * 3 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#D8FF4F]/10 to-emerald-500/10 border border-[#D8FF4F]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#D8FF4F]/20 text-[#D8FF4F] shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Haftalık Çizelgeyi Tek Tıkla Doldur</p>
              <p className="text-xs text-[#8E98A8] mt-0.5">
                Vakit kaybetmeden mevcut kadronuz için dengeli sabah, akşam ve izin günlerini otomatik dağıtın.
              </p>
            </div>
          </div>
          <button
            onClick={() => store.populateAutoWeeklySchedule(currentMonday)}
            className="py-2.5 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs sm:text-sm whitespace-nowrap shadow-md transition-all cursor-pointer"
          >
            ⚡ Bu Haftayı Otomatik Oluştur
          </button>
        </div>
      )}

      {/* Apple-style Segmented View Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.04] rounded-2xl border border-white/10">
        <button
          onClick={() => {
            haptics.tap();
            setViewMode('daily');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            viewMode === 'daily'
              ? 'bg-[#D8FF4F] text-black shadow-md'
              : 'text-[#8E98A8] hover:text-white'
          }`}
        >
          ☀️ Günün Kadrosu (Büyük Boy)
        </button>

        <button
          onClick={() => {
            haptics.tap();
            setViewMode('weekly');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            viewMode === 'weekly'
              ? 'bg-[#D8FF4F] text-black shadow-md'
              : 'text-[#8E98A8] hover:text-white'
          }`}
        >
          📅 Haftalık Tablo
        </button>

        <button
          onClick={() => {
            haptics.tap();
            setViewMode('by_person');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            viewMode === 'by_person'
              ? 'bg-[#D8FF4F] text-black shadow-md'
              : 'text-[#8E98A8] hover:text-white'
          }`}
        >
          👤 Personele Göre
        </button>
      </div>

      {/* Horizontal Day Selector Ribbon (Pzt, Sal, Çar, Per, Cum, Cmt, Paz) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDayStr;
          const dayShifts = shifts.filter((s) => s.date === day.dateStr);
          const workingCount = dayShifts.filter((s) => !s.isOffDay).length;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => {
                haptics.tap('selection');
                setSelectedDayStr(day.dateStr);
              }}
              className={`p-2 sm:p-2.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-between min-h-[72px] sm:min-h-[84px] cursor-pointer ${
                isSelected
                  ? 'bg-white/15 border-[#D8FF4F] ring-2 ring-[#D8FF4F] shadow-lg'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              } ${day.isToday ? 'relative overflow-hidden' : ''}`}
            >
              {day.isToday && (
                <span className="text-[9px] font-bold text-[#D8FF4F] uppercase tracking-tighter">
                  Bugün
                </span>
              )}
              <span className={`text-[11px] sm:text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#8E98A8]'}`}>
                {day.shortDayName}
              </span>
              <span className={`text-base sm:text-xl font-bold font-mono ${isSelected ? 'text-[#D8FF4F]' : 'text-white'}`}>
                {day.dayNumber}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {workingCount > 0 ? `${workingCount} kişi` : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: DAILY FOCUS (48 YAŞINDAKİ ŞEF İÇİN DEV VE NET GÖRÜNÜM) */}
      {viewMode === 'daily' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Canlı 24 Saat Zaman Şeridi (Visual Timeline) */}
          <ShiftTimelineBar dateStr={selectedDayStr} />

          {/* Selected Day Large Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0F141C] to-[#0A0D14] border border-white/15 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D8FF4F]">
                {selectedDayStr === todayStr ? '⭐ BUGÜNÜN ÇALIŞMA PLANI' : 'SEÇİLİ GÜNÜN ÇALIŞMA PLANI'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatReadableDate(selectedDayStr)}
              </h3>
              <p className="text-xs sm:text-sm text-[#8E98A8] mt-0.5">
                {dailyShifts.filter((s) => !s.isOffDay).length} personel görevde · {dailyShifts.filter((s) => s.isOffDay).length} personel izinli
              </p>
            </div>

            {isManager && (
              <button
                onClick={() => handleOpenAddShift(selectedDayStr)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D8FF4F]" />
                <span>Bu Güne Ekle</span>
              </button>
            )}
          </div>

          {/* Section: Morning Shift (Sabahçılar) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>Sabah Vardiyası (Açılış & Hazırlık)</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono">{morningShifts.length} Kişi</span>
            </div>

            {morningShifts.length > 0 ? (
              <div className="space-y-2.5">
                {morningShifts.map((shift) => {
                  const user = users.find((u) => u.id === shift.employeeId);
                  return (
                    <div
                      key={shift.id}
                      onClick={() => isManager && handleOpenEditShift(shift)}
                      className={`p-4 rounded-2xl glass-panel border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between gap-3 ${
                        isManager ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={shift.employeeName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/40 shrink-0"
                        />
                        <div>
                          <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {shift.employeeName}
                          </p>
                          <p className="text-xs sm:text-sm text-[#8E98A8]">
                            {shift.position} {shift.note && `· ${shift.note}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {renderShiftBadge(shift, true)}
                        {isManager && (
                          <span className="block text-[11px] text-[#8E98A8] mt-1">
                            Düzenlemek için tıkla
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                Bu sabah için yazılmış personel yok.
              </div>
            )}
          </div>

          {/* Section: Evening Shift (Akşamcılar) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm sm:text-base font-bold text-sky-300 flex items-center gap-2">
                <Moon className="w-5 h-5 text-sky-400" />
                <span>Akşam Vardiyası (Yoğun Saat & Kapanış)</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono">{eveningShifts.length} Kişi</span>
            </div>

            {eveningShifts.length > 0 ? (
              <div className="space-y-2.5">
                {eveningShifts.map((shift) => {
                  const user = users.find((u) => u.id === shift.employeeId);
                  return (
                    <div
                      key={shift.id}
                      onClick={() => isManager && handleOpenEditShift(shift)}
                      className={`p-4 rounded-2xl glass-panel border border-white/10 hover:border-sky-400/40 transition-all flex items-center justify-between gap-3 ${
                        isManager ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={shift.employeeName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-sky-400/40 shrink-0"
                        />
                        <div>
                          <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {shift.employeeName}
                          </p>
                          <p className="text-xs sm:text-sm text-[#8E98A8]">
                            {shift.position} {shift.note && `· ${shift.note}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {renderShiftBadge(shift, true)}
                        {isManager && (
                          <span className="block text-[11px] text-[#8E98A8] mt-1">
                            Düzenlemek için tıkla
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                Bu akşam için yazılmış personel yok.
              </div>
            )}
          </div>

          {/* Section: Full Day / Tam Gün */}
          {fullShifts.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm sm:text-base font-bold text-[#D8FF4F] flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#D8FF4F]" />
                  <span>Tam Gün (Açılış-Kapanış)</span>
                </span>
                <span className="text-xs text-zinc-400 font-mono">{fullShifts.length} Kişi</span>
              </div>

              <div className="space-y-2.5">
                {fullShifts.map((shift) => {
                  const user = users.find((u) => u.id === shift.employeeId);
                  return (
                    <div
                      key={shift.id}
                      onClick={() => isManager && handleOpenEditShift(shift)}
                      className={`p-4 rounded-2xl glass-panel border border-white/10 hover:border-[#D8FF4F]/40 transition-all flex items-center justify-between gap-3 ${
                        isManager ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={shift.employeeName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#D8FF4F]/40 shrink-0"
                        />
                        <div>
                          <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {shift.employeeName}
                          </p>
                          <p className="text-xs sm:text-sm text-[#8E98A8]">
                            {shift.position} {shift.note && `· ${shift.note}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {renderShiftBadge(shift, true)}
                        {isManager && (
                          <span className="block text-[11px] text-[#8E98A8] mt-1">
                            Düzenlemek için tıkla
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Off-days / İzinliler */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm sm:text-base font-bold text-zinc-400 flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-zinc-400" />
                <span>Bugün İzinli Olanlar</span>
              </span>
              <span className="text-xs text-zinc-500 font-mono">{offShifts.length} Kişi</span>
            </div>

            {offShifts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {offShifts.map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => isManager && handleOpenEditShift(shift)}
                    className={`p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between gap-3 ${
                      isManager ? 'cursor-pointer hover:border-white/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">
                        {shift.employeeName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-300">{shift.employeeName}</p>
                        <p className="text-xs text-zinc-500">{shift.position}</p>
                      </div>
                    </div>
                    {renderShiftBadge(shift)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                Bugün izinli olan personel bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY TABLE (TÜM HAFTANIN GÜN GÜN LİSTESİ) */}
      {viewMode === 'weekly' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {weekDays.map((day) => {
            const dayShifts = shifts.filter((s) => s.date === day.dateStr);

            return (
              <div
                key={day.dateStr}
                className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-white font-mono">
                      {day.dayName}, {day.dayNumber} {day.monthName}
                    </span>
                    {day.isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D8FF4F] text-black text-[10px] font-black uppercase">
                        Bugün
                      </span>
                    )}
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleOpenAddShift(day.dateStr)}
                      className="text-xs font-semibold text-[#D8FF4F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Vardiya Ekle</span>
                    </button>
                  )}
                </div>

                {/* Day shifts list */}
                {dayShifts.length > 0 ? (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => isManager && handleOpenEditShift(shift)}
                        className={`p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 ${
                          isManager ? 'hover:bg-white/[0.06] cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                            {shift.employeeName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{shift.employeeName}</p>
                            <p className="text-xs text-[#8E98A8]">
                              {shift.position} {shift.note && `· ${shift.note}`}
                            </p>
                          </div>
                        </div>

                        <div>{renderShiftBadge(shift)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-zinc-500 italic">
                    Bu gün için henüz vardiya girilmedi.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: BY PERSON (HER PERSONELİN HAFTALIK PLANI) */}
      {viewMode === 'by_person' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {displayedUsers.map((user) => {
            const userShifts = shifts.filter((s) => s.employeeId === user.id);

            return (
              <div
                key={user.id}
                className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 space-y-4 shadow-lg"
              >
                {/* Person Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-white">{user.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-semibold">
                          {user.position}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E98A8] mt-0.5">
                        {user.phone} · {user.code}
                      </p>
                    </div>
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleOpenAddShift(selectedDayStr, user.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#D8FF4F] font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Vardiya Ekle"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden xs:inline">Ekle</span>
                    </button>
                  )}
                </div>

                {/* 7-Day Matrix for this user */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {weekDays.map((day) => {
                    const shift = getShiftFor(user.id, day.dateStr);

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => {
                          if (isManager) {
                            if (shift) {
                              handleOpenEditShift(shift);
                            } else {
                              handleOpenAddShift(day.dateStr, user.id);
                            }
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                          shift
                            ? 'bg-white/[0.04] border-white/10 hover:border-white/20'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 border-dashed'
                        } ${day.isToday ? 'ring-1 ring-[#D8FF4F]/40' : ''} ${
                          isManager ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-8 text-xs font-bold font-mono ${
                              day.isToday ? 'text-[#D8FF4F]' : 'text-zinc-400'
                            }`}
                          >
                            {day.shortDayName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {day.dayNumber} {day.monthName}
                          </span>
                        </div>

                        <div>{renderShiftBadge(shift)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
