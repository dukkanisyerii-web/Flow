import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { Shift, User } from '../../types';
import {
  Users,
  Clock,
  Coffee,
  CheckCircle2,
  Calendar,
  Phone,
  Flame,
  Award,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  Trash2,
  LogIn,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { ShiftScheduleView } from '../schedule/ShiftScheduleView';

export const TeamView: React.FC = () => {
  const { users, shifts, tasks, currentUser } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  const [activeTab, setActiveTab] = useState<'schedule' | 'directory'>('schedule');

  return (
    <div className="space-y-4 pb-24 pt-2 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Ekip & Vardiya</h2>
          <p className="text-xs text-[#8E98A8]">
            {users.length} çalışan kayıtlı · {users.filter((u) => u.shiftStatus === 'clocked_in').length} aktif sahada
          </p>
        </div>

        <button
          onClick={() => {
            haptics.tap();
            store.openModal('add_employee');
          }}
          className="py-2 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Eleman Ekle</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-white/[0.04] rounded-2xl border border-white/10">
        <button
          onClick={() => {
            haptics.tap();
            setActiveTab('schedule');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-[#D8FF4F] text-black shadow-md'
              : 'text-[#8E98A8] hover:text-white'
          }`}
        >
          📅 Haftalık Vardiya Çizelgesi
        </button>
        <button
          onClick={() => {
            haptics.tap();
            setActiveTab('directory');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-[#D8FF4F] text-black shadow-md'
              : 'text-[#8E98A8] hover:text-white'
          }`}
        >
          👤 Personel Kadrosu ({users.length})
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <ShiftScheduleView />
      ) : (
        <div className="space-y-3">
          {/* Quick Notice for Restaurant Official */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Restoran Giriş Yetkilendirmesi</p>
              <p className="text-[11px] text-blue-200/80 mt-0.5">
                Buradaki her çalışan, kendi e-posta adresi ve şifresi ile sisteme doğrudan giriş yapabilir. Yeni personel eklemek için yukarıdaki "Yeni Çalışan Ekle" butonunu kullanabilirsiniz.
              </p>
            </div>
          </div>

          {users.map((staff) => {
            const userTasks = tasks.filter((t) => t.assignedTo.includes(staff.id));
            const completed = userTasks.filter((t) => t.status === 'completed').length;
            const rate = userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 100;
            const pass = staff.password || '123456';

            return (
              <div
                key={staff.id}
                className="p-3.5 rounded-xl glass-panel border border-white/10 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.avatarUrl}
                      alt={staff.name}
                      className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white">{staff.name}</p>
                        <span className="text-[10px] font-mono text-zinc-400">({staff.code})</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-white/10 text-zinc-300">
                          {staff.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E98A8]">{staff.position}</p>
                      <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{staff.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-emerald-400 font-bold text-xs">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>%{rate}</span>
                    </div>
                    <p className="text-[10px] text-[#8E98A8] mt-0.5">
                      {completed}/{userTasks.length} Görev
                    </p>
                  </div>
                </div>

                {/* Login Credentials Bar & Fast Switch */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Mail className="w-3 h-3 text-[#D8FF4F]" />
                      <span>{staff.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Şifre: <strong className="text-white">{pass}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        haptics.tap();
                        store.switchUser(staff.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Giriş Yap</span>
                    </button>

                    {users.length > 1 && staff.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          if (confirm(`"${staff.name}" personelini silmek istediğinize emin misiniz?`)) {
                            store.deleteEmployee(staff.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Personeli Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
