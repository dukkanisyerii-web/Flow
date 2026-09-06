import { Shift, User } from '../types';

export interface WeekDayInfo {
  dateStr: string; // YYYY-MM-DD
  dayIndex: number; // 1 (Pzt) - 7 (Paz)
  dayName: string; // Pazartesi, Salı...
  shortDayName: string; // Pzt, Sal, Çar...
  dayNumber: number; // 5
  monthName: string; // Eyl
  isToday: boolean;
}

export interface ShiftPreset {
  id: 'morning' | 'evening' | 'mid' | 'full' | 'off' | 'custom';
  name: string;
  badgeLabel: string;
  startTime: string;
  endTime: string;
  isOffDay?: boolean;
  color: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  iconType: 'sun' | 'moon' | 'coffee' | 'star' | 'off' | 'clock';
}

export const SHIFT_PRESETS: ShiftPreset[] = [
  {
    id: 'morning',
    name: 'Sabah Vardiyası',
    badgeLabel: 'Sabahçı',
    startTime: '08:00',
    endTime: '16:00',
    color: 'amber',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-300',
    iconType: 'sun',
  },
  {
    id: 'evening',
    name: 'Akşam Vardiyası',
    badgeLabel: 'Akşamcı',
    startTime: '16:00',
    endTime: '24:00',
    color: 'sky',
    bgLight: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    textColor: 'text-sky-300',
    iconType: 'moon',
  },
  {
    id: 'mid',
    name: 'Öğle & Akşam',
    badgeLabel: 'Öğle-Akşam',
    startTime: '12:00',
    endTime: '22:00',
    color: 'purple',
    bgLight: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    iconType: 'coffee',
  },
  {
    id: 'full',
    name: 'Tam Gün (Açılış-Kapanış)',
    badgeLabel: 'Tam Gün',
    startTime: '08:00',
    endTime: '20:00',
    color: 'lime',
    bgLight: 'bg-[#D8FF4F]/10',
    borderColor: 'border-[#D8FF4F]/30',
    textColor: 'text-[#D8FF4F]',
    iconType: 'star',
  },
  {
    id: 'off',
    name: 'Haftalık İzin (Tatil)',
    badgeLabel: 'İzinli',
    startTime: '-',
    endTime: '-',
    isOffDay: true,
    color: 'zinc',
    bgLight: 'bg-zinc-800/40',
    borderColor: 'border-white/10',
    textColor: 'text-zinc-400',
    iconType: 'off',
  },
];

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_SHORT_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Returns Monday date of the week containing the given date
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns 7 days of the week starting from Monday
 */
export function getWeekDays(mondayDate: Date): WeekDayInfo[] {
  const todayStr = formatDateToYMD(new Date());
  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(mondayDate);
    current.setDate(mondayDate.getDate() + i);

    const dateStr = formatDateToYMD(current);
    const dayOfWeek = current.getDay(); // 0: Sun, 1: Mon...
    const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek; // 1: Mon, 7: Sun

    days.push({
      dateStr,
      dayIndex,
      dayName: TR_DAYS[dayOfWeek],
      shortDayName: TR_SHORT_DAYS[dayOfWeek],
      dayNumber: current.getDate(),
      monthName: TR_MONTHS[current.getMonth()],
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

export function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const dayName = TR_DAYS[d.getDay()];
  const monthName = TR_MONTHS[d.getMonth()];
  return `${d.getDate()} ${monthName} ${dayName}`;
}

/**
 * Generates an auto-balanced weekly schedule for given employees
 */
export function generateAutoWeeklySchedule(
  users: User[],
  mondayDate: Date
): Shift[] {
  const weekDays = getWeekDays(mondayDate);
  const generatedShifts: Shift[] = [];

  users.forEach((user, uIndex) => {
    // Determine off-day based on index to spread days (e.g. uIndex % 7)
    // 0: Pazar, 1: Pazartesi, 2: Salı, etc.
    const offDayIndex = (uIndex % 6) + 1; // 1 to 6 (avoid everyone off on Sunday)

    weekDays.forEach((day) => {
      const isOff = day.dayIndex === offDayIndex;
      const isMorning = (day.dayIndex + uIndex) % 2 === 0;

      let preset = isOff
        ? SHIFT_PRESETS.find((p) => p.id === 'off')!
        : isMorning
        ? SHIFT_PRESETS.find((p) => p.id === 'morning')!
        : SHIFT_PRESETS.find((p) => p.id === 'evening')!;

      // If user is owner/manager like Mehmet Usta, give him Tam Gün / Sabah
      if (user.role === 'owner' || user.role === 'manager') {
        preset = isOff
          ? SHIFT_PRESETS.find((p) => p.id === 'off')!
          : SHIFT_PRESETS.find((p) => p.id === 'full')!;
      }

      generatedShifts.push({
        id: `sh-${user.id}-${day.dateStr}`,
        employeeId: user.id,
        employeeName: user.name,
        position: user.position,
        date: day.dateStr,
        dayOfWeek: day.dayIndex,
        startTime: preset.startTime,
        endTime: preset.endTime,
        status: day.isToday ? 'active' : 'upcoming',
        breakMinutesUsed: 0,
        shiftType: preset.id,
        shiftLabel: preset.name,
        isOffDay: preset.isOffDay || false,
        note: preset.isOffDay ? 'Haftalık Dinlenme Günü' : `${user.position} Görev Yeri`,
      });
    });
  });

  return generatedShifts;
}
