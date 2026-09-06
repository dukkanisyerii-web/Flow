import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Search,
  Wifi,
  WifiOff,
  Clock,
  Coffee,
  CheckCircle2,
  ChevronDown,
  User,
  Shield,
  Smartphone,
  Maximize2,
  RotateCcw,
  LogOut,
  UserPlus,
  Bell,
  Download,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface HeaderProps {
  isMobileBezel?: boolean;
  onToggleBezel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileBezel, onToggleBezel }) => {
  const { currentUser, users, isOffline, pendingSyncCount, autoSyncEnabled, notifications } = useAppStore();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#07090D]/90 backdrop-blur-xl border-b border-white/[0.08] px-3 sm:px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Brand & Monogram Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#1A2230] to-[#0D121B] border border-white/10 shadow-inner group cursor-pointer shrink-0"
            onClick={() => {
              haptics.tap();
              store.setActiveTab(
                currentUser.role === 'manager' || currentUser.role === 'owner'
                  ? 'overview'
                  : 'home'
              );
            }}
            title="Ana Sayfaya Dön"
          >
            {/* Minimalist C/F monogram */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#D8FF4F]">
              <path
                d="M19 8C17.5 5.5 14.5 4 11 4C6.58 4 3 7.58 3 12C3 16.42 6.58 20 11 20C14.5 20 17.5 18.5 19 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M10 12H21M10 8H18"
                stroke="#F2F5F8"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D8FF4F] ring-2 ring-[#07090D]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white font-mono">
                CETEM
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#D8FF4F]/10 text-[#D8FF4F] border border-[#D8FF4F]/25 tracking-wide">
                FLOW
              </span>
            </div>
            <p className="text-[10px] text-[#8E98A8] font-medium tracking-wide truncate hidden xs:block">
              Dükkan & İş Takibi
            </p>
          </div>
        </div>

        {/* Right Tools & User Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobil APK / PWA Install Button */}
          <button
            onClick={() => {
              haptics.tap();
              store.openModal('pwa_install');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D8FF4F]/10 hover:bg-[#D8FF4F]/20 border border-[#D8FF4F]/30 text-[#D8FF4F] text-xs font-semibold transition-all min-h-[38px] cursor-pointer"
            title="Uygulamayı Telefona İndir / Yükle"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Telefona Kur</span>
          </button>

          {/* Notifications Center Bell */}
          <button
            onClick={() => {
              haptics.tap();
              store.openModal('notifications');
            }}
            className="relative p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            title="Restoran Bildirimleri"
          >
            <Bell className="w-4 h-4 text-zinc-300" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-[#D8FF4F] text-black font-bold text-[9px] flex items-center justify-center shadow-lg animate-pulse">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Spotlight / Command Palette Button */}
          <button
            onClick={() => store.setCommandPalette(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E98A8] hover:text-white transition-all text-xs min-h-[38px] cursor-pointer"
            title="Hızlı Komut & Arama (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[10px] text-[#8E98A8]">⌘K</span>
          </button>

          {/* Offline Sync Queue Modal Trigger */}
          <button
            onClick={() => store.openModal('offline_queue')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs min-h-[38px] transition-all cursor-pointer ${
              isOffline
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : !autoSyncEnabled
                ? 'bg-zinc-800/80 border-amber-500/30 text-amber-300'
                : 'bg-white/[0.03] border-white/[0.08] text-[#8E98A8] hover:text-white'
            }`}
            title={
              isOffline
                ? 'Çevrimdışı Mod — İşlemler yerel bellekte tutuluyor'
                : !autoSyncEnabled
                ? 'Otomatik Eşitleme Kapalı (Manuel Mod)'
                : 'Otomatik Eşitleme Aktif (Tüm cihazlar bağlı)'
            }
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono hidden md:inline">Çevrimdışı</span>
                {pendingSyncCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
                {!autoSyncEnabled && (
                  <span className="text-[10px] font-mono text-amber-300 hidden md:inline">Manuel</span>
                )}
                {pendingSyncCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#D8FF4F] text-black text-[9px] font-bold flex items-center justify-center">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Viewport Frame Toggle if handler provided */}
          {onToggleBezel && (
            <button
              onClick={onToggleBezel}
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#8E98A8] hover:text-white transition-all cursor-pointer"
              title={isMobileBezel ? 'Geniş Ekran Görünümüne Geç' : 'Mobil Cihaz Çerçevesine Geç'}
            >
              {isMobileBezel ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5 text-[#D8FF4F]" />}
            </button>
          )}

          {/* User & Role Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] transition-all cursor-pointer"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#D8FF4F]/50"
              />
              <div className="text-left hidden xs:block">
                <p className="text-xs font-semibold text-white leading-tight max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[9px] text-[#D8FF4F] font-medium leading-none capitalize">
                  {currentUser.position}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-[#8E98A8]" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel-elevated p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-white/[0.08] mb-1">
                  <p className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider">
                    Hesap Değiştir
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Mehmet Usta veya eleman hesapları arasında hızlı geçiş yapabilirsiniz
                  </p>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          store.switchUser(u.id);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D8FF4F]/15 border border-[#D8FF4F]/30 text-white'
                            : 'hover:bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold text-white">{u.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#8E98A8]">
                              <span className="font-mono text-[9px] text-[#D8FF4F]">{u.code}</span>
                              <span>·</span>
                              <span>{u.position}</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#D8FF4F]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Additional Actions: Add Employee & Logout */}
                <div className="pt-2 mt-1 border-t border-white/[0.08] space-y-1">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      store.openModal('add_employee');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-[#D8FF4F] hover:bg-[#D8FF4F]/10 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Yeni Eleman Ekle (Çırak, Garson...)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      store.logout();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
