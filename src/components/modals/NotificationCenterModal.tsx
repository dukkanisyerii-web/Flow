import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  Coffee,
  Clock,
  Megaphone,
  UserCheck,
  Check,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { AppNotification } from '../../types';

export const NotificationCenterModal: React.FC = () => {
  const { notifications, notificationSoundEnabled, activeModal, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'important' | 'urgent'>('important');

  if (activeModal !== 'notifications') return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'priority') return n.priority === 'urgent' || n.priority === 'important';
    return true;
  });

  const handleClose = () => {
    haptics.tap();
    store.closeModal();
  };

  const handleNotificationClick = (notif: AppNotification) => {
    haptics.tap();
    store.markNotificationAsRead(notif.id);
    if (notif.relatedTaskId) {
      store.setSelectedTaskId(notif.relatedTaskId);
      store.setActiveTab('tasks');
      store.closeModal();
    } else if (notif.relatedIssueId) {
      store.setActiveTab('overview');
      store.closeModal();
    }
  };

  const handleRequestPush = async () => {
    const res = await store.requestPushPermission();
    setPushStatus(res);
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'task_waiting_approval':
        return <Camera className="w-4 h-4 text-amber-300" />;
      case 'task_approved':
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-300" />;
      case 'task_returned':
        return <RotateCcw className="w-4 h-4 text-rose-300" />;
      case 'issue_reported':
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'shift_break':
        return <Coffee className="w-4 h-4 text-amber-200" />;
      case 'shift_clock_in':
        return <Clock className="w-4 h-4 text-sky-300" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-[#D8FF4F]" />;
      case 'employee_registered':
        return <UserCheck className="w-4 h-4 text-purple-300" />;
      case 'system_sync':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-[#D8FF4F]" />;
    }
  };

  return (
    <div
      id="notification-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[88vh] bg-[#0E121B] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090C12]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 flex items-center justify-center text-[#D8FF4F]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Restoran Bildirimleri
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D8FF4F] text-black">
                    {unreadCount} yeni
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8F9CAE]">
                Görev atamaları, onaylar, arıza ve anlık uyarılar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={store.toggleNotificationSound}
              className={`p-2 rounded-xl border transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                notificationSoundEnabled
                  ? 'bg-white/5 border-white/10 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-zinc-500'
              }`}
              title={notificationSoundEnabled ? 'Sesli Uyarı Açık' : 'Sesli Uyarı Kapalı'}
            >
              {notificationSoundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Test Generator */}
        <div className="px-4 py-3 bg-[#0A0E16] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                haptics.tap();
                setFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#D8FF4F] text-black font-semibold'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Tümü ({notifications.length})
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setFilter('unread');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#D8FF4F] text-black font-semibold'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Okunmamış ({unreadCount})
            </button>
            <button
              onClick={() => {
                haptics.tap();
                setFilter('priority');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === 'priority'
                  ? 'bg-[#D8FF4F] text-black font-semibold'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Kritik / Öncelikli
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={store.markAllNotificationsAsRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-all text-[11px] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tümünü Oku</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={store.clearAllNotifications}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                title="Tüm Bildirimleri Temizle"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Push notification banner if supported */}
        {typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission !== 'granted' && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D8FF4F] shrink-0" />
                <span className="text-xs text-white">
                  Telefonunuza anlık kilit ekranı bildirimleri almak ister misiniz?
                </span>
              </div>
              <button
                onClick={handleRequestPush}
                className="px-3 py-1.5 rounded-lg bg-[#D8FF4F] hover:bg-[#cbf738] text-black font-bold text-xs shrink-0 cursor-pointer"
              >
                İzin Ver
              </button>
            </div>
          )}

        {/* Operational Broadcast Bar */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <Megaphone className="w-3.5 h-3.5 text-[#D8FF4F]" />
              <span className="font-semibold">Ekip Anonsu & Telsiz Bildirimi</span>
            </div>
            <button
              onClick={() => {
                haptics.tap();
                setShowBroadcastForm(!showBroadcastForm);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#D8FF4F]/10 hover:bg-[#D8FF4F]/20 text-xs text-[#D8FF4F] font-bold border border-[#D8FF4F]/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{showBroadcastForm ? 'Kapat' : '+ Anons Oluştur'}</span>
            </button>
          </div>

          {showBroadcastForm && (
            <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5 animate-in fade-in">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Ör: 2 nolu masa siparişleri hazır, salon ekibi desteğe gelsin..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(['normal', 'important', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBroadcastPriority(p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        broadcastPriority === p
                          ? p === 'urgent'
                            ? 'bg-rose-500 text-white'
                            : p === 'important'
                            ? 'bg-amber-500 text-black'
                            : 'bg-[#D8FF4F] text-black'
                          : 'bg-white/5 text-zinc-400'
                      }`}
                    >
                      {p === 'urgent' ? 'Acil' : p === 'important' ? 'Önemli' : 'Normal'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!broadcastMessage.trim()) return;
                    haptics.notification(broadcastPriority === 'urgent' ? 'urgent' : 'important');
                    store.dispatchNotification({
                      type: 'announcement',
                      title:
                        broadcastPriority === 'urgent'
                          ? '🚨 ACİL EKİP ÇAĞRISI'
                          : '📢 Restoran Ekip Anonsu',
                      message: `${currentUser.name}: ${broadcastMessage.trim()}`,
                      priority: broadcastPriority,
                    });
                    setBroadcastMessage('');
                    setShowBroadcastForm(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#D8FF4F] hover:bg-[#cbf738] text-black font-bold text-xs cursor-pointer shadow-md shadow-[#D8FF4F]/20"
                >
                  Yayınla
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-white/5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-500 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">Bildirim Bulunmuyor</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {filter === 'unread'
                  ? 'Tüm bildirimleri okudunuz.'
                  : 'Yeni bir görev, onay veya acil anons paylaşıldığında burada listelenecektir.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                  notif.read ? 'hover:bg-white/[0.03] opacity-80' : 'bg-white/[0.04] hover:bg-white/[0.07]'
                }`}
              >
                {/* Icon Container with Priority Color */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    notif.priority === 'urgent'
                      ? 'bg-rose-500/20 border-rose-500/40'
                      : notif.priority === 'important'
                      ? 'bg-amber-500/20 border-amber-500/40'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#D8FF4F] shrink-0" />
                      )}
                      <h4
                        className={`text-xs font-semibold truncate ${
                          notif.read ? 'text-zinc-300' : 'text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {notif.timeFormatted}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8F9CAE] leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Actions / metadata badge */}
                  <div className="flex items-center gap-2 mt-2">
                    {notif.priority === 'urgent' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ACİL
                      </span>
                    )}
                    {notif.priority === 'important' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ÖNEMLİ
                      </span>
                    )}
                    {(notif.relatedTaskId || notif.relatedIssueId) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D8FF4F] hover:underline">
                        <span>{notif.actionLabel || 'Detaya Git'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.deleteNotification(notif.id);
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
