import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { offlineQueue, OfflineSyncState } from '../../services/offlineQueue';
import { WifiOff, Wifi, RefreshCw, ChevronRight } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const OfflineStatusBanner: React.FC = () => {
  const [syncState, setSyncState] = useState<OfflineSyncState>(offlineQueue.getState());

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  if (!syncState.isOffline && syncState.queue.length === 0) {
    return null;
  }

  const handleSyncClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    store.openModal('offline_queue');
  };

  return (
    <div
      onClick={handleSyncClick}
      className={`mx-3.5 sm:mx-4 mb-2 p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
        syncState.isOffline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/15'
          : 'bg-[#D8FF4F]/10 border-[#D8FF4F]/30 text-[#D8FF4F] hover:bg-[#D8FF4F]/15'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1 rounded-lg bg-black/40 shrink-0">
          {syncState.isOffline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <RefreshCw className={`w-3.5 h-3.5 text-[#D8FF4F] ${syncState.isSyncing ? 'animate-spin' : ''}`} />
          )}
        </div>
        <div className="min-w-0 truncate">
          <p className="font-semibold text-white leading-tight">
            {syncState.isOffline
              ? 'Çevrimdışı Çalışma Modu Aktif'
              : `${syncState.queue.length} İşlem Eşitlenmeyi Bekliyor`}
          </p>
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
            {syncState.isOffline
              ? `${syncState.queue.length} işlem yerel hafızada saklanıyor. Bağlantı geldiğinde otomatik iletilecek.`
              : 'Buluta iletim için dokunun.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold">
        <span>Kuyruk ({syncState.queue.length})</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
