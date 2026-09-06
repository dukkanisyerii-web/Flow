import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  offlineQueue,
  QueuedOperation,
  OfflineSyncState,
} from '../../services/offlineQueue';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  FileCheck,
  Coffee,
  Trash2,
  ShieldCheck,
  Zap,
  Download,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const OfflineQueueModal: React.FC = () => {
  const { activeModal } = useAppStore();
  const [syncState, setSyncState] = useState<OfflineSyncState>(offlineQueue.getState());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  if (activeModal !== 'offline_queue') return null;

  const handleManualSync = async () => {
    haptics.buttonClick('heavy');
    setSyncFeedback('Sunucu ile eşitleniyor...');
    const res = await store.triggerManualSync();
    if (res.success > 0) {
      setSyncFeedback(`${res.success} adet operasyonel işlem başarıyla buluta iletildi!`);
    } else if (res.failed > 0) {
      setSyncFeedback('İşlemler eşitlenemedi, ağ bağlantınızı kontrol ediniz.');
    } else {
      setSyncFeedback('Tüm verileriniz güncel (Bekleyen kayıt yok).');
    }

    setTimeout(() => {
      setSyncFeedback(null);
    }, 3000);
  };

  const handleDownloadBackup = () => {
    haptics.tap();
    const jsonStr = offlineQueue.exportQueueAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cetem-offline-queue-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearQueue = () => {
    haptics.alert();
    if (confirm('Bekleyen tüm çevrimdışı kayıtlar silinecek. Onaylıyor musunuz?')) {
      offlineQueue.clearQueue();
    }
  };

  const getActionLabel = (type: QueuedOperation['type']) => {
    switch (type) {
      case 'COMPLETE_TASK':
        return { label: 'Görev Tamamlama', icon: FileCheck, color: 'text-emerald-400' };
      case 'UPLOAD_PHOTO_PROOF':
        return { label: 'Canlı Fotoğraf Kanıtı', icon: Camera, color: 'text-[#D8FF4F]' };
      case 'REPORT_ISSUE':
        return { label: 'Arıza / Sorun Bildirimi', icon: AlertTriangle, color: 'text-rose-400' };
      case 'UPDATE_TASK_STATUS':
        return { label: 'Görev Durum Güncellemesi', icon: CheckCircle2, color: 'text-blue-400' };
      case 'TOGGLE_SHIFT_BREAK':
        return { label: 'Mola / Vardiya Durumu', icon: Coffee, color: 'text-amber-400' };
      default:
        return { label: 'Operasyonel İşlem', icon: Zap, color: 'text-white' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/20 p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                syncState.isOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {syncState.isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Çevrimdışı Kuyruk & Veri Güvenliği</h3>
              <p className="text-[11px] text-[#8E98A8]">
                Bodrum kat / soğuk hava deposu bağlantı kesintilerini korur
              </p>
            </div>
          </div>

          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Network State Info Banner */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  syncState.isOffline ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              {syncState.isOffline ? 'Çevrimdışı (Yerel Ön Bellek Aktif)' : 'Çevrimiçi (Canlı Ağ Bağlantısı Aktif)'}
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {syncState.isOffline
                ? 'İşlemler cihaz hafızasında güvenle tutuluyor'
                : 'Bulut sunucuyla anlık çift yönlü senkronizasyon açık'}
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#D8FF4F] hover:bg-[#c9f53e] text-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>Şimdi Eşitle</span>
          </button>
        </div>

        {/* Auto-Sync Toggle Control */}
        <div
          onClick={() => {
            store.setAutoSync(!syncState.autoSyncEnabled);
          }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/[0.06] transition-all"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Otomatik Eşitleme (Auto-Sync)</span>
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
            <p className="text-[10px] text-[#8E98A8]">
              {syncState.autoSyncEnabled
                ? 'Arka planda tüm terminaller ile anlık senkronizasyon yapılıyor'
                : 'Otomatik aktarım duraklatıldı, veriler bu cihazda tutuluyor'}
            </p>
          </div>

          <div
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
              syncState.autoSyncEnabled ? 'bg-[#D8FF4F]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ${
                syncState.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Metric Summary Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Kuyrukta Bekleyen</p>
            <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {syncState.queue.length}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Eşitlenenler</p>
            <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {syncState.syncSuccessCount}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[10px] text-[#8E98A8] uppercase font-semibold">Son Eşitleme</p>
            <p className="text-xs font-bold text-zinc-300 font-mono mt-1 truncate">
              {syncState.lastSyncedAt || 'Bekleniyor'}
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="p-2.5 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/30 text-[#D8FF4F] text-xs text-center font-medium animate-in fade-in">
            {syncFeedback}
          </div>
        )}

        {/* Queued Operations List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
              Bekleyen Operasyonlar ({syncState.queue.length})
            </span>
            {syncState.queue.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadBackup}
                  className="text-[11px] text-[#D8FF4F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Yedek İndir</span>
                </button>
                <button
                  onClick={handleClearQueue}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Temizle</span>
                </button>
              </div>
            )}
          </div>

          {syncState.queue.length === 0 ? (
            <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] text-center space-y-1.5">
              <ShieldCheck className="w-8 h-8 text-emerald-400/80 mx-auto" />
              <p className="text-xs font-bold text-white">Tüm Veriler Senkronize</p>
              <p className="text-[11px] text-[#8E98A8]">
                Cihazınızda bekleyen çevrimdışı işlem yok. Tüm görevler ve kanıtlar buluta iletildi.
              </p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1.5">
              {syncState.queue.map((item) => {
                const actionMeta = getActionLabel(item.type);
                const IconComponent = actionMeta.icon;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${actionMeta.color}`} />
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">
                          {item.payload?.taskTitle || actionMeta.label}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {item.timestampFormatted} · {item.id.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          item.status === 'syncing'
                            ? 'bg-blue-500/20 text-blue-300'
                            : item.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.status === 'syncing'
                          ? 'İletiliyor'
                          : item.status === 'failed'
                          ? 'Yeniden Dene'
                          : 'Bekliyor'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
