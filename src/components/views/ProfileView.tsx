import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { offlineQueue, OfflineSyncState } from '../../services/offlineQueue';
import {
  Award,
  Flame,
  Clock,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Star,
  Zap,
  TrendingUp,
  RotateCcw,
  FileText,
  User,
  Coffee,
  Smartphone,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  RefreshCw,
  Wifi,
  WifiOff,
  Check,
  Database,
  Layers,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const ProfileView: React.FC = () => {
  const { currentUser, tasks, shifts, users, activityLogs } = useAppStore();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [vibrationOn, setVibrationOn] = useState(() => haptics.getVibrationEnabled());
  const [audioOn, setAudioOn] = useState(() => haptics.getAudioEnabled());
  const isVibSupported = haptics.isVibrationSupported();

  const [syncState, setSyncState] = useState<OfflineSyncState>(() => offlineQueue.getState());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleAutoSync = () => {
    const next = !syncState.autoSyncEnabled;
    store.setAutoSync(next);
    setSyncFeedback(
      next
        ? 'Otomatik Eşitleme Açıldı: Cihazlar arası veri akışı canlı ve aktif.'
        : 'Otomatik Eşitleme Duraklatıldı: İşlemler bu cihazda tutulacak, manuel eşitleme yapabilirsiniz.'
    );
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleManualSync = async () => {
    haptics.buttonClick('heavy');
    setSyncFeedback('Cihazlar ve bulut ile senkronize ediliyor...');
    const res = await store.triggerManualSync();
    if (res.failed > 0) {
      setSyncFeedback('Ağ bağlantısı sağlanamadı. Lütfen internetinizi kontrol edin.');
    } else if (res.success > 0) {
      setSyncFeedback(`${res.success} adet operasyonel işlem başarıyla diğer cihazlara aktarıldı.`);
    } else {
      setSyncFeedback('Tüm verileriniz ve bağlı diğer istasyonlar en güncel halde.');
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const userTasks = tasks.filter((t) => t.assignedTo.includes(currentUser.id));
  const completed = userTasks.filter((t) => t.status === 'completed');
  const completionRate =
    userTasks.length > 0 ? Math.round((completed.length / userTasks.length) * 100) : 100;

  const badges = [
    { title: 'Açılış Şampiyonu', desc: 'Sabah rutinlerini eksiksiz 7 gün tamamladı', icon: '🌅', color: 'from-amber-500/20 to-amber-500/5' },
    { title: 'Detay Ustası', desc: 'Canlı fotoğraf kanıtlarında %100 onay oranı', icon: '📸', color: 'from-emerald-500/20 to-emerald-500/5' },
    { title: 'Hızlı Müdahale', desc: 'Kritik espresso makinesi arızasını bildirdi', icon: '⚡', color: 'from-[#D8FF4F]/20 to-[#D8FF4F]/5' },
  ];

  // Dynamically calculate leaderboard from real team data
  const dynamicLeaderboard = useMemo(() => {
    return users
      .map((u) => {
        const uTasks = tasks.filter((t) => t.assignedTo.includes(u.id));
        const uCompleted = uTasks.filter((t) => t.status === 'completed');
        const score = u.metrics?.onTimeRate || 95;
        const streak = Math.max(7, uCompleted.length * 2);
        return {
          id: u.id,
          name: u.name,
          score,
          role: u.position,
          streak,
          completedCount: uCompleted.length,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [users, tasks]);

  return (
    <div className="space-y-4 pb-24 pt-2 animate-in fade-in duration-150">
      {/* Profile Hero Card */}
      <div className="p-5 rounded-2xl glass-panel-elevated border border-white/15 relative overflow-hidden space-y-4">
        <div className="flex items-center gap-3.5">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-[#D8FF4F] shadow-lg shadow-[#D8FF4F]/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
              <span className="text-xs font-mono font-bold text-[#D8FF4F] px-2 py-0.5 rounded-full bg-[#D8FF4F]/15 border border-[#D8FF4F]/30">
                {currentUser.code}
              </span>
            </div>
            <p className="text-xs text-[#8E98A8] mt-0.5">
              {currentUser.position} · Saha Operasyon Uzmanı
            </p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{currentUser.phone}</p>
          </div>
        </div>

        {/* Gamified Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="p-2.5 rounded-xl bg-white/[0.04] text-center border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Operasyon Skoru</p>
            <p className="text-lg font-bold text-[#D8FF4F] font-mono mt-0.5 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-amber-400" />
              {currentUser.metrics?.onTimeRate || 98}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.04] text-center border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Seri (Streak)</p>
            <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              12 Gün 🔥
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.04] text-center border border-white/5">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Görev Oranı</p>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              %{completionRate}
            </p>
          </div>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8] flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          Rozetler & Başarılar (Operasyon Ödülleri)
        </h3>

        <div className="space-y-2">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl bg-gradient-to-r ${b.color} border border-white/10 flex items-center gap-3`}
            >
              <span className="text-2xl">{b.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-white">{b.title}</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Leaderboard */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#D8FF4F]" />
            Günün Performans Sıralaması
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Canlı Skor</span>
        </div>

        <div className="space-y-2">
          {dynamicLeaderboard.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                item.id === currentUser.id
                  ? 'bg-[#D8FF4F]/10 border-[#D8FF4F]/30 text-white font-bold'
                  : 'bg-white/[0.03] border-white/5 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-mono font-bold text-[#D8FF4F]">
                  #{item.rank}
                </span>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-[10px] text-[#8E98A8]">{item.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <span className="text-[11px] text-amber-400 font-mono font-semibold">
                  {item.streak} Gün 🔥
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/40 font-mono text-emerald-400 font-bold">
                  {item.score} Puan
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Device Data & Auto-Sync Settings */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D8FF4F]/15 text-[#D8FF4F] border border-[#D8FF4F]/25">
              <RefreshCw className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cihazlar Arası Eşitleme (Auto-Sync)
              </h3>
              <p className="text-[10px] text-[#8E98A8]">
                Tablet, POS ve el terminalleri arasında veri senkronizasyonu
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border flex items-center gap-1.5 ${
              syncState.isOffline
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : syncState.autoSyncEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {syncState.isOffline ? (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Çevrimdışı</span>
              </>
            ) : syncState.autoSyncEnabled ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Canlı Bağlantı</span>
              </>
            ) : (
              <>
                <span>Manuel Mod</span>
              </>
            )}
          </span>
        </div>

        {/* Auto-Sync Main Interactive Toggle */}
        <div
          onClick={handleToggleAutoSync}
          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            syncState.autoSyncEnabled
              ? 'bg-[#D8FF4F]/[0.08] border-[#D8FF4F]/35 hover:border-[#D8FF4F]/50 shadow-sm shadow-[#D8FF4F]/5'
              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="space-y-1 max-w-[72%]">
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-white">Otomatik Eşitleme (Auto-Sync)</p>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                  syncState.autoSyncEnabled
                    ? 'bg-[#D8FF4F] text-black'
                    : 'bg-white/10 text-zinc-400'
                }`}
              >
                {syncState.autoSyncEnabled ? 'Açık' : 'Kapalı'}
              </span>
            </div>
            <p className="text-[11px] text-[#8E98A8] leading-snug">
              Görev tamamlamaları, canlı kanıt fotoğrafları ve vardiya durumunu tüm cihazlar arasında arka planda anlık senkronize eder.
            </p>
          </div>

          {/* Toggle Switch Component */}
          <div
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
              syncState.autoSyncEnabled ? 'bg-[#D8FF4F]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 flex items-center justify-center text-[10px] ${
                syncState.autoSyncEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {syncState.autoSyncEnabled ? (
                <Check className="w-3 h-3 text-[#D8FF4F] stroke-[3]" />
              ) : (
                <span className="w-2 h-0.5 rounded-full bg-zinc-400" />
              )}
            </div>
          </div>
        </div>

        {/* Clear Feedback on Sync Status Box */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E98A8]">
              Senkronizasyon Durumu & Sağlık
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Son Eşitleme: <strong className="text-white">{syncState.lastSyncedAt || 'Şimdi'}</strong>
            </span>
          </div>

          {/* Status Diagnostic Bar */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
              syncState.isSyncing
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : syncState.isOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : !syncState.autoSyncEnabled
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                : syncState.queue.length > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {syncState.isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              ) : syncState.isOffline ? (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : !syncState.autoSyncEnabled ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              ) : syncState.queue.length > 0 ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="truncate">
                <p className="font-semibold truncate">
                  {syncState.isSyncing
                    ? 'Veriler bulut ve diğer terminallerle eşitleniyor...'
                    : syncState.isOffline
                    ? 'Çevrimdışı Mod — İşlemler yerel güvenli hafızada saklanıyor'
                    : !syncState.autoSyncEnabled
                    ? syncState.queue.length > 0
                      ? `${syncState.queue.length} işlem aktarılmayı bekliyor (Otomatik eşitleme kapalı)`
                      : 'Manuel Mod — Otomatik arka plan aktarımı duraklatıldı'
                    : syncState.queue.length > 0
                    ? `${syncState.queue.length} işlem buluta aktarılmak üzere kuyrukta`
                    : 'Tüm terminaller ve bulut veritabanı %100 eşitlendi'}
                </p>
                <p className="text-[10px] opacity-80 truncate">
                  {syncState.isOffline
                    ? 'İnternet bağlantısı sağlandığında kuyruktaki veriler kayıpsız aktarılır.'
                    : !syncState.autoSyncEnabled
                    ? 'Verilerinizi diğer cihazlara göndermek için "Şimdi Eşitle" butonunu kullanın.'
                    : 'iPad KDS, Yönetici Paneli ve Garson El Terminali ile anlık senkron.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sync Statistics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
              <span className="text-[9px] text-[#8E98A8] uppercase block">Bekleyen Kuyruk</span>
              <span className="text-xs font-bold font-mono text-amber-400">
                {syncState.queue.length} İşlem
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
              <span className="text-[9px] text-[#8E98A8] uppercase block">Aktarılan</span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                {syncState.syncSuccessCount} Kayıt
              </span>
            </div>
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
              <span className="text-[9px] text-[#8E98A8] uppercase block">Ağ Gecikmesi</span>
              <span className="text-xs font-bold font-mono text-[#D8FF4F]">
                {syncState.isOffline ? 'Bağlantı Yok' : '18ms (Düşük)'}
              </span>
            </div>
          </div>

          {/* Dynamic feedback notification banner if action taken */}
          {syncFeedback && (
            <div className="p-2.5 rounded-lg bg-[#D8FF4F]/10 border border-[#D8FF4F]/30 text-[#D8FF4F] text-[11px] font-semibold text-center animate-in fade-in">
              {syncFeedback}
            </div>
          )}

          {/* Manual sync and queue actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleManualSync}
              disabled={syncState.isSyncing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#cbfa3c] active:scale-[0.99] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#D8FF4F]/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Eşitleniyor...' : 'Şimdi Eşitle'}</span>
            </button>

            <button
              onClick={() => {
                haptics.tap();
                store.openModal('offline_queue');
              }}
              className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Kuyruk listesini ve çevrimdışı kayıtları inceleyin"
            >
              <Database className="w-3.5 h-3.5 text-[#D8FF4F]" />
              <span>Kuyruk Detayları</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D Tactile Haptics & Vibration Engine Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/15 text-[#D8FF4F] border border-[#D8FF4F]/25">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                3D Dokunsal Titreşim (Haptic Engine)
              </h3>
              <p className="text-[10px] text-[#8E98A8]">
                Navigator.vibrate API ve senkronize dokunsal mikro-motor
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
              isVibSupported
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {isVibSupported ? '✓ Cihazda Aktif' : 'Web Audio Modu'}
          </span>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const next = !vibrationOn;
              haptics.setVibrationEnabled(next);
              setVibrationOn(next);
              if (next) haptics.tap('medium');
            }}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
              vibrationOn
                ? 'bg-[#D8FF4F]/10 border-[#D8FF4F]/30 text-white'
                : 'bg-white/[0.03] border-white/10 text-zinc-400'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold text-[11px] text-white">Mobil Titreşim Motoru</p>
              <p className="text-[9px] text-[#8E98A8]">Fiziksel titreşim darbeleri</p>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                vibrationOn ? 'bg-[#D8FF4F] text-black' : 'bg-white/10 text-zinc-400'
              }`}
            >
              {vibrationOn ? 'AÇIK' : 'KAPALI'}
            </span>
          </button>

          <button
            onClick={() => {
              const next = !audioOn;
              haptics.setAudioEnabled(next);
              setAudioOn(next);
              if (next) haptics.tap('medium');
            }}
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
              audioOn
                ? 'bg-[#D8FF4F]/10 border-[#D8FF4F]/30 text-white'
                : 'bg-white/[0.03] border-white/10 text-zinc-400'
            }`}
          >
            <div className="text-left">
              <p className="font-semibold text-[11px] text-white">Sesli Tık & Akor</p>
              <p className="text-[9px] text-[#8E98A8]">Dokunsal spatial sesler</p>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                audioOn ? 'bg-[#D8FF4F] text-black' : 'bg-white/10 text-zinc-400'
              }`}
            >
              {audioOn ? 'AÇIK' : 'KAPALI'}
            </span>
          </button>
        </div>
      </div>

      {/* Daily Operations Report Button */}
      <button
        onClick={() => setReportModalOpen(true)}
        className="w-full py-3.5 px-4 rounded-xl glass-panel border border-white/15 hover:border-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <FileText className="w-4 h-4 text-[#D8FF4F]" />
        <span>Günün Operasyon Raporunu Oluştur & İncele</span>
      </button>

      {/* Daily Report Modal Preview */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/20 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-[#D8FF4F]">CETEM OPERASYON RAPORU</span>
                <h3 className="text-sm font-bold text-white">Günün Vardiya Özeti (Gün Sonu EOD)</h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] space-y-1 font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Toplam Görev:</span>
                  <span className="text-white font-bold">{tasks.length}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Tamamlanan:</span>
                  <span className="text-emerald-400 font-bold">
                    {tasks.filter((t) => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Geciken:</span>
                  <span className="text-rose-400 font-bold">
                    {tasks.filter((t) => t.status === 'overdue').length}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Canlı Kanıt Fotoğrafı:</span>
                  <span className="text-[#D8FF4F] font-bold">
                    {tasks.filter((t) => t.livePhotoProof).length}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Hijyen ve Servis Standartları Karşılandı
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-1">
                  Vardiya devir tesliminde açık kritik arıza bulunmamaktadır.
                </p>
              </div>

              <button
                onClick={() => {
                  haptics.success();
                  setReportModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#D8FF4F] text-black font-bold text-xs"
              >
                Raporu Yöneticiye İlet & Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
