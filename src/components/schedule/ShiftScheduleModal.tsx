import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { Shift, EmployeePosition } from '../../types';
import {
  X,
  Calendar,
  Clock,
  User,
  Sun,
  Moon,
  Coffee,
  Star,
  Palmtree,
  Trash2,
  Check,
  Sparkles,
  Repeat,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import {
  SHIFT_PRESETS,
  ShiftPreset,
  formatDateToYMD,
  formatReadableDate,
  getMondayOfWeek,
  getWeekDays,
} from '../../utils/shiftUtils';

export const ShiftScheduleModal: React.FC = () => {
  const { activeModal, modalPayload, users, shifts } = useAppStore();

  const isModalOpen = activeModal === 'shift_sheet';
  const existingShift = (modalPayload?.shift as Shift | undefined) || null;
  const initialDate = (modalPayload?.dateStr as string | undefined) || formatDateToYMD(new Date());
  const initialUserId = (modalPayload?.userId as string | undefined) || (users[0]?.id ?? '');

  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedPreset, setSelectedPreset] = useState<ShiftPreset['id']>('morning');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [isOffDay, setIsOffDay] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [applyToAllWeek, setApplyToAllWeek] = useState<boolean>(false);

  // Sync state when modal opens or existingShift changes
  useEffect(() => {
    if (isModalOpen) {
      if (existingShift) {
        setSelectedUserId(existingShift.employeeId);
        setSelectedDate(existingShift.date);
        setStartTime(existingShift.startTime);
        setEndTime(existingShift.endTime);
        setIsOffDay(existingShift.isOffDay || false);
        setNote(existingShift.note || '');
        setSelectedPreset(existingShift.shiftType || (existingShift.isOffDay ? 'off' : 'custom'));
        setApplyToAllWeek(false);
      } else {
        setSelectedUserId(initialUserId || users[0]?.id || '');
        setSelectedDate(initialDate);
        const morning = SHIFT_PRESETS.find((p) => p.id === 'morning')!;
        setStartTime(morning.startTime);
        setEndTime(morning.endTime);
        setIsOffDay(false);
        setNote('');
        setSelectedPreset('morning');
        setApplyToAllWeek(false);
      }
    }
  }, [isModalOpen, existingShift, initialDate, initialUserId, users]);

  if (!isModalOpen) return null;

  const targetUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleSelectPreset = (preset: ShiftPreset) => {
    haptics.tap('selection');
    setSelectedPreset(preset.id);
    if (preset.isOffDay) {
      setIsOffDay(true);
      setStartTime('-');
      setEndTime('-');
      if (!note) setNote('Haftalık İzin');
    } else {
      setIsOffDay(false);
      setStartTime(preset.startTime);
      setEndTime(preset.endTime);
      if (note === 'Haftalık İzin') setNote('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetUser) return;

    if (applyToAllWeek) {
      // Apply to all 7 days of the week containing selectedDate
      const refDate = new Date(selectedDate);
      const monday = getMondayOfWeek(refDate);
      const weekDays = getWeekDays(monday);

      const batchShifts: Shift[] = weekDays.map((day) => {
        const isCurrentSelectedDay = day.dateStr === selectedDate;
        return {
          id: `sh-${targetUser.id}-${day.dateStr}`,
          employeeId: targetUser.id,
          employeeName: targetUser.name,
          position: targetUser.position,
          date: day.dateStr,
          dayOfWeek: day.dayIndex,
          startTime: isOffDay ? '-' : startTime,
          endTime: isOffDay ? '-' : endTime,
          status: day.isToday ? 'active' : 'upcoming',
          breakMinutesUsed: 0,
          shiftType: selectedPreset,
          shiftLabel: isOffDay
            ? 'İzinli'
            : selectedPreset === 'custom'
            ? `${startTime} - ${endTime}`
            : SHIFT_PRESETS.find((p) => p.id === selectedPreset)?.name || `${startTime} - ${endTime}`,
          isOffDay,
          note: note.trim() || undefined,
        };
      });

      store.batchSetShifts(batchShifts);
      store.closeModal();
      return;
    }

    const d = new Date(selectedDate);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();

    if (existingShift) {
      store.updateShift(existingShift.id, {
        employeeId: targetUser.id,
        employeeName: targetUser.name,
        position: targetUser.position,
        date: selectedDate,
        dayOfWeek,
        startTime: isOffDay ? '-' : startTime,
        endTime: isOffDay ? '-' : endTime,
        shiftType: selectedPreset,
        shiftLabel: isOffDay
          ? 'İzinli'
          : selectedPreset === 'custom'
          ? `${startTime} - ${endTime}`
          : SHIFT_PRESETS.find((p) => p.id === selectedPreset)?.name || `${startTime} - ${endTime}`,
        isOffDay,
        note: note.trim() || undefined,
      });
    } else {
      store.addShift({
        employeeId: targetUser.id,
        employeeName: targetUser.name,
        position: targetUser.position,
        date: selectedDate,
        dayOfWeek,
        startTime: isOffDay ? '-' : startTime,
        endTime: isOffDay ? '-' : endTime,
        status: 'upcoming',
        breakMinutesUsed: 0,
        shiftType: selectedPreset,
        shiftLabel: isOffDay
          ? 'İzinli'
          : selectedPreset === 'custom'
          ? `${startTime} - ${endTime}`
          : SHIFT_PRESETS.find((p) => p.id === selectedPreset)?.name || `${startTime} - ${endTime}`,
        isOffDay,
        note: note.trim() || undefined,
      });
    }

    store.closeModal();
  };

  const handleDelete = () => {
    if (!existingShift) return;
    haptics.alert();
    if (confirm(`${targetUser?.name || 'Personel'} için bu vardiya kaydını silmek istiyor musunuz?`)) {
      store.deleteShift(existingShift.id);
      store.closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#0C1017] border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple-style Top Pill Handle & Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D8FF4F]" />
                <span>{existingShift ? 'Vardiyayı Düzenle' : 'Yeni Vardiya Belirle'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#8E98A8] mt-0.5">
                48 yaşındaki şefin gözü yorulmadan rahatça okuyup düzenleyebileceği net çizelge
              </p>
            </div>
            <button
              onClick={() => store.closeModal()}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* 1. Personel Seçimi (Büyük & Net) */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8E98A8] flex items-center justify-between">
              <span>1. Çalışacak Personel</span>
              <span className="text-[11px] text-zinc-400 font-normal">Kadro: {users.length} kişi</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      haptics.tap('selection');
                      setSelectedUserId(u.id);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D8FF4F]/10 border-[#D8FF4F] ring-1 ring-[#D8FF4F] shadow-md'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-xs text-[#8E98A8] truncate">{u.position}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#D8FF4F] text-black flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Gün / Tarih Seçimi */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8E98A8]">
              2. Hangi Gün?
            </label>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#D8FF4F] shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-bold text-white font-mono">
                    {formatReadableDate(selectedDate)}
                  </p>
                  <p className="text-[11px] text-[#8E98A8]">Seçili gün için çalışma saatleri</p>
                </div>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#07090D] border border-white/20 text-white rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#D8FF4F]"
              />
            </div>
          </div>

          {/* 3. Hazır Vardiya Şablonları (Apple Tarzı Büyük Butonlar) */}
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8E98A8]">
              3. Vardiya Tipi (Tek Dokunuşla Seç)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {SHIFT_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[82px] cursor-pointer ${
                      isSelected
                        ? `${preset.bgLight} ${preset.borderColor} ring-2 ring-[#D8FF4F]/50 shadow-lg`
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${preset.textColor}`}>
                        {preset.badgeLabel}
                      </span>
                      {preset.iconType === 'sun' && <Sun className="w-4 h-4 text-amber-400" />}
                      {preset.iconType === 'moon' && <Moon className="w-4 h-4 text-sky-400" />}
                      {preset.iconType === 'coffee' && <Coffee className="w-4 h-4 text-purple-400" />}
                      {preset.iconType === 'star' && <Star className="w-4 h-4 text-[#D8FF4F]" />}
                      {preset.iconType === 'off' && <Palmtree className="w-4 h-4 text-zinc-400" />}
                    </div>

                    <div className="mt-1">
                      <p className="text-base sm:text-lg font-bold text-white font-mono">
                        {preset.isOffDay ? 'HAFTALIK İZİN' : `${preset.startTime} - ${preset.endTime}`}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{preset.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Özel Saat Ayarı (İzinli Değilse) */}
          {!isOffDay && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D8FF4F]" />
                  <span>Başlangıç ve Bitiş Saati</span>
                </span>
                <span className="text-[11px] font-mono text-[#8E98A8]">İsteğe göre saatleri değiştirin</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#8E98A8] font-medium">Giriş Saati</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#07090D] border border-white/20 text-white text-base sm:text-lg font-mono font-bold text-center focus:outline-none focus:border-[#D8FF4F]"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#8E98A8] font-medium">Çıkış Saati</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#07090D] border border-white/20 text-white text-base sm:text-lg font-mono font-bold text-center focus:outline-none focus:border-[#D8FF4F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Görev / Not Açıklaması */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8E98A8]">
              Vardiya Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Ocakbaşı & Et Hazırlığı, Salon Servisi, Kasa..."
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
            />
          </div>

          {/* 6. Haftalık Hızlı Kopyalama (Tüm Haftaya Uygula) */}
          {!existingShift && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Repeat className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">Tüm Haftaya Uygula</p>
                  <p className="text-[11px] text-[#8E98A8]">
                    {targetUser?.name || 'Personel'} bu haftanın 7 gününde de bu saatte çalışsın
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={applyToAllWeek}
                onChange={(e) => setApplyToAllWeek(e.target.checked)}
                className="w-5 h-5 accent-[#D8FF4F] rounded cursor-pointer"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {existingShift && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title="Vardiyayı Sil"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden xs:inline">Sil</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => store.closeModal()}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{existingShift ? 'Kaydet & Güncelle' : 'Çizelgeye Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
