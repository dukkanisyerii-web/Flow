import { useSyncExternalStore } from 'react';
import {
  User,
  UserRole,
  EmployeePosition,
  Zone,
  Task,
  TaskTemplate,
  QuickAction,
  Issue,
  Announcement,
  ChannelMessage,
  Shift,
  ActivityLog,
  PhotoProof,
  AppNotification,
  NotificationType,
} from '../types';
import {
  initialUsers,
  initialZones,
  initialTasks,
  initialQuickActions,
  initialTemplates,
  initialIssues,
  initialAnnouncements,
  initialMessages,
  initialShifts,
  initialActivityLogs,
  initialNotifications,
} from '../data/initialData';
import { haptics } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { offlineQueue } from '../services/offlineQueue';
import { getMondayOfWeek, generateAutoWeeklySchedule } from '../utils/shiftUtils';

export type AppModalType =
  | 'create_task'
  | 'report_issue'
  | 'scan_qr'
  | 'camera_live'
  | 'low_stock'
  | 'button_builder'
  | 'qr_zone_viewer'
  | 'shift_sheet'
  | 'template_assign'
  | 'photo_viewer'
  | 'offline_queue'
  | 'add_employee'
  | 'notifications'
  | 'pwa_install';

interface AppState {
  currentUser: User;
  users: User[];
  zones: Zone[];
  tasks: Task[];
  quickActions: QuickAction[];
  templates: TaskTemplate[];
  issues: Issue[];
  announcements: Announcement[];
  messages: ChannelMessage[];
  shifts: Shift[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  activeToast: AppNotification | null;
  notificationSoundEnabled: boolean;
  isOffline: boolean;
  pendingSyncCount: number;
  autoSyncEnabled: boolean;
  activeTab: string;
  selectedTaskId: string | null;
  selectedPhotoProof: PhotoProof | null;
  activeModal: AppModalType | null;
  modalPayload?: Record<string, unknown>;
  isCommandPaletteOpen: boolean;
  searchQuery: string;
  isAuthenticated: boolean;
  chefMode: boolean;
}

const STORAGE_KEY = 'cetem_flow_esnaf_v3';

function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure existing saved users have default password if missing
      const enrichedUsers: User[] = (parsed.users && parsed.users.length > 0 ? parsed.users : initialUsers).map((u: User) => {
        const foundInitial = initialUsers.find((init) => init.id === u.id);
        return {
          ...u,
          password: u.password || foundInitial?.password || '123',
        };
      });

      return {
        ...parsed,
        users: enrichedUsers,
        currentUser: enrichedUsers.find((u) => u.id === parsed.currentUser?.id) || enrichedUsers[0],
        isAuthenticated: parsed.isAuthenticated !== undefined ? parsed.isAuthenticated : true,
        notifications: parsed.notifications || [],
        tasks: parsed.tasks || [],
        issues: parsed.issues || [],
        announcements: parsed.announcements || [],
        messages: parsed.messages || [],
        shifts: parsed.shifts || [],
        activityLogs: parsed.activityLogs || [],
        activeToast: null,
        notificationSoundEnabled: parsed.notificationSoundEnabled !== undefined ? parsed.notificationSoundEnabled : true,
        // Always reset modal states on fresh load
        activeModal: null,
        selectedTaskId: null,
        selectedPhotoProof: null,
        isCommandPaletteOpen: false,
        isOffline: !offlineQueue.isEffectiveOnline(),
        pendingSyncCount: offlineQueue.getPendingCount(),
        autoSyncEnabled:
          parsed.autoSyncEnabled !== undefined
            ? parsed.autoSyncEnabled
            : offlineQueue.isAutoSyncEnabled(),
        chefMode: parsed.chefMode !== undefined ? parsed.chefMode : true,
      };
    }
  } catch (e) {
    console.warn('Could not load cached state', e);
  }

  return {
    currentUser: initialUsers[0], // Mehmet Usta (Dükkan Sahibi)
    users: initialUsers,
    zones: initialZones,
    tasks: initialTasks,
    quickActions: initialQuickActions,
    templates: initialTemplates,
    issues: initialIssues,
    announcements: initialAnnouncements,
    messages: initialMessages,
    shifts: initialShifts,
    activityLogs: initialActivityLogs,
    notifications: initialNotifications,
    activeToast: null,
    notificationSoundEnabled: true,
    isOffline: !offlineQueue.isEffectiveOnline(),
    pendingSyncCount: offlineQueue.getPendingCount(),
    autoSyncEnabled: offlineQueue.isAutoSyncEnabled(),
    activeTab: 'overview',
    selectedTaskId: null,
    selectedPhotoProof: null,
    activeModal: null,
    isCommandPaletteOpen: false,
    searchQuery: '',
    isAuthenticated: true,
    chefMode: true,
  };
}

let state: AppState = loadInitialState();
const listeners = new Set<() => void>();

function emitChange() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Storage quota exceeded or error', e);
  }
  listeners.forEach((listener) => listener());
}

function updateState(updater: (prev: AppState) => Partial<AppState>) {
  const next = updater(state);
  state = { ...state, ...next };
  emitChange();
}

// Sync listener for offline queue changes
offlineQueue.subscribe((syncState) => {
  if (
    state.isOffline !== syncState.isOffline ||
    state.pendingSyncCount !== syncState.queue.length ||
    state.autoSyncEnabled !== syncState.autoSyncEnabled
  ) {
    state = {
      ...state,
      isOffline: syncState.isOffline,
      pendingSyncCount: syncState.queue.length,
      autoSyncEnabled: syncState.autoSyncEnabled,
    };
    emitChange();
  }
});

// Register background sync handler
offlineQueue.registerSyncHandler(async (op) => {
  // Realistic network flight delay
  await new Promise((resolve) => setTimeout(resolve, 350));
  const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (op.type === 'COMPLETE_TASK') {
    const payload = op.payload as { taskTitle?: string; userName?: string };
    const log: ActivityLog = {
      id: `act-sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      userId: state.currentUser.id,
      userName: payload.userName || state.currentUser.name,
      action: 'Çevrimdışı kanıt sunucuya aktarıldı ✓',
      details: `${payload.taskTitle || 'Görev'} başarıyla bulut ile eşitlendi`,
      type: 'task',
    };
    updateState((prev) => ({
      activityLogs: [log, ...prev.activityLogs],
    }));
  } else if (op.type === 'REPORT_ISSUE') {
    const payload = op.payload as { title?: string; reporterName?: string };
    const log: ActivityLog = {
      id: `act-sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      userId: state.currentUser.id,
      userName: payload.reporterName || state.currentUser.name,
      action: 'Çevrimdışı arıza kaydı sunucuya iletildi ✓',
      details: `${payload.title || 'Arıza kaydı'} sisteme işlendi`,
      type: 'issue',
    };
    updateState((prev) => ({
      activityLogs: [log, ...prev.activityLogs],
    }));
  }

  return true;
});

export const store = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Navigation & UI
  setActiveTab: (tab: string) => {
    haptics.tap('selection');
    updateState(() => ({ activeTab: tab, selectedTaskId: null }));
  },

  setSelectedTaskId: (id: string | null) => {
    if (id) {
      haptics.modalOpen();
    } else {
      haptics.modalClose();
    }
    updateState(() => ({ selectedTaskId: id }));
  },

  openModal: (type: AppModalType, payload?: Record<string, unknown>) => {
    haptics.modalOpen();
    updateState(() => ({ activeModal: type, modalPayload: payload }));
  },

  closeModal: () => {
    haptics.modalClose();
    updateState(() => ({ activeModal: null, modalPayload: undefined }));
  },

  openPhotoViewer: (proof: PhotoProof) => {
    haptics.modalOpen();
    updateState(() => ({ selectedPhotoProof: proof, activeModal: 'photo_viewer' }));
  },

  closePhotoViewer: () => {
    haptics.modalClose();
    updateState(() => ({ selectedPhotoProof: null, activeModal: null }));
  },

  // Notification Engine & Push alerts
  dispatchNotification: (notifData: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: 'normal' | 'important' | 'urgent';
    targetUserId?: string;
    targetRole?: UserRole;
    relatedTaskId?: string;
    relatedIssueId?: string;
    actionLabel?: string;
  }) => {
    const priority = notifData.priority || 'normal';
    if (state.notificationSoundEnabled) {
      haptics.notification(priority);
    }
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: notifData.type,
      title: notifData.title,
      message: notifData.message,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      read: false,
      priority,
      targetUserId: notifData.targetUserId,
      targetRole: notifData.targetRole,
      relatedTaskId: notifData.relatedTaskId,
      relatedIssueId: notifData.relatedIssueId,
      actionLabel: notifData.actionLabel,
    };

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/icon.svg',
          tag: newNotif.id,
        });
      } catch {
        // Fallback for browsers with restricted notification constructors
      }
    }

    updateState((prev) => ({
      notifications: [newNotif, ...prev.notifications].slice(0, 100),
      activeToast: newNotif,
    }));
  },

  dismissToast: () => {
    updateState(() => ({ activeToast: null }));
  },

  markNotificationAsRead: (id: string) => {
    haptics.tap();
    updateState((prev) => ({
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsAsRead: () => {
    haptics.tap();
    updateState((prev) => ({
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  deleteNotification: (id: string) => {
    haptics.tap();
    updateState((prev) => ({
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllNotifications: () => {
    haptics.tap();
    updateState(() => ({
      notifications: [],
      activeToast: null,
    }));
  },

  toggleNotificationSound: () => {
    haptics.tap();
    updateState((prev) => ({
      notificationSoundEnabled: !prev.notificationSoundEnabled,
    }));
  },

  requestPushPermission: async () => {
    haptics.tap();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          store.dispatchNotification({
            type: 'system_sync',
            title: '🎉 Anlık Bildirimler Etkinleştirildi',
            message: 'Artık tüm restoran görev ve acil durum uyarıları cihazınıza iletilecektir.',
            priority: 'normal',
          });
        }
        return perm;
      } catch {
        return 'denied';
      }
    }
    return 'unsupported';
  },

  setCommandPalette: (open: boolean) => {
    if (open) {
      haptics.modalOpen();
    } else {
      haptics.modalClose();
    }
    updateState(() => ({ isCommandPaletteOpen: open }));
  },

  setSearchQuery: (query: string) => {
    updateState(() => ({ searchQuery: query }));
  },

  setOfflineMode: (offline: boolean) => {
    haptics.tap();
    updateState(() => ({
      isOffline: offline,
      pendingSyncCount: offlineQueue.getPendingCount(),
    }));
  },

  setAutoSync: (enabled: boolean) => {
    haptics.tap();
    offlineQueue.setAutoSyncEnabled(enabled);
    updateState(() => ({
      autoSyncEnabled: enabled,
    }));
    store.dispatchNotification({
      type: 'system_sync',
      title: enabled ? '🔄 Otomatik Eşitleme Aktif' : '⏸️ Otomatik Eşitleme Duraklatıldı',
      message: enabled
        ? 'Verileriniz diğer terminaller ve bulut ile gerçek zamanlı eşitleniyor.'
        : 'Otomatik eşitleme kapatıldı. Değişiklikler yerel saklanacak ve manuel eşitleme gerekecektir.',
      priority: 'normal',
    });
  },

  triggerManualSync: async () => {
    haptics.buttonClick('heavy');
    const res = await offlineQueue.manualSync();
    if (res.failed > 0) {
      haptics.alert();
      store.dispatchNotification({
        type: 'system_sync',
        title: '⚠️ Senkronizasyon Aksaklığı',
        message: 'Bazı işlemler sunucuya iletilemedi, ağ bağlantısını kontrol ediniz.',
        priority: 'important',
      });
    } else {
      haptics.success();
      store.dispatchNotification({
        type: 'system_sync',
        title: '✅ Cihazlar Eşitlendi',
        message: res.success > 0
          ? `${res.success} adet operasyonel kayıt başarıyla diğer cihazlara aktarıldı.`
          : 'Tüm verileriniz ve cihaz durumu en güncel halde.',
        priority: 'normal',
      });
    }
    return res;
  },

  // User & Roles & Authentication
  login: (email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Lütfen e-posta adresinizi girin.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Lütfen şifrenizi girin.' };
    }

    const user = state.users.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );

    if (!user) {
      return { success: false, error: 'Bu e-posta adresine kayıtlı çalışan bulunamadı.' };
    }

    const expectedPass = user.password || '123456';
    if (cleanPass !== expectedPass) {
      return { success: false, error: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.' };
    }

    haptics.success();
    const isManagerOrOwner = user.role === 'manager' || user.role === 'owner';
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      userId: user.id,
      userName: user.name,
      action: 'Sisteme giriş yaptı',
      details: `${user.position} (${user.email}) oturum açtı`,
      type: 'shift',
    };

    updateState((prev) => ({
      currentUser: user,
      isAuthenticated: true,
      activeTab: isManagerOrOwner ? 'overview' : 'home',
      selectedTaskId: null,
      activityLogs: [log, ...prev.activityLogs].slice(0, 50),
    }));

    return { success: true };
  },

  logout: () => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      action: 'Oturumu kapattı',
      details: `${state.currentUser.name} sistemden çıkış yaptı`,
      type: 'shift',
    };

    updateState((prev) => ({
      isAuthenticated: false,
      activeModal: null,
      selectedTaskId: null,
      activityLogs: [log, ...prev.activityLogs].slice(0, 50),
    }));
  },

  registerEmployee: (data: {
    name: string;
    email: string;
    password: string;
    position: EmployeePosition;
    role: UserRole;
    phone?: string;
    avatarUrl?: string;
  }): { success: boolean; error?: string; user?: User } => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const cleanPass = data.password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, error: 'Ad Soyad, e-posta ve şifre alanları zorunludur.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Şifre en az 4 karakterden oluşmalıdır.' };
    }

    const exists = state.users.some(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (exists) {
      return { success: false, error: 'Bu e-posta adresi ile kayıtlı bir çalışan zaten mevcut.' };
    }

    const newId = `u-${Date.now().toString(36)}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `CET-${randomNum}`;

    const defaultAvatars: Record<string, string> = {
      Komi: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      Garson: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      Barista: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      Mutfak: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      Şef: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=150&auto=format&fit=crop&q=80',
      Müdür: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      Kasiyer: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      Temizlik: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    };

    const avatarUrl =
      data.avatarUrl ||
      defaultAvatars[data.position] ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newUser: User = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      phone: data.phone?.trim() || '+90 555 ' + Math.floor(100 + Math.random() * 900) + ' ' + Math.floor(1000 + Math.random() * 9000),
      code,
      role: data.role,
      position: data.position,
      avatarUrl,
      shiftStatus: 'clocked_in',
      shiftStartTime: nowStr,
      metrics: {
        tasksCompletedToday: 0,
        tasksTotalToday: 0,
        thisWeekCompleted: 0,
        thisWeekTotal: 0,
        onTimeRate: 100,
        returnedCount: 0,
      },
    };

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted: nowStr,
      userId: state.currentUser?.id || newId,
      userName: state.currentUser?.name || cleanName,
      action: 'Yeni çalışan kaydetti',
      details: `${newUser.name} (${newUser.position}) - E-posta: ${newUser.email}`,
      type: 'shift',
    };

    updateState((prev) => ({
      users: [...prev.users, newUser],
      activityLogs: [log, ...prev.activityLogs].slice(0, 50),
    }));

    store.dispatchNotification({
      type: 'employee_registered',
      title: '👤 Yeni Çalışan Kaydedildi',
      message: `${newUser.name} (${newUser.position}) eklendi. Giriş: ${newUser.email}`,
      priority: 'normal',
    });

    haptics.success();
    return { success: true, user: newUser };
  },

  deleteEmployee: (id: string) => {
    haptics.tap();
    updateState((prev) => {
      const filtered = prev.users.filter((u) => u.id !== id);
      return {
        users: filtered,
        currentUser: prev.currentUser.id === id ? filtered[0] : prev.currentUser,
      };
    });
  },

  switchUser: (userId: string) => {
    haptics.tap();
    const found = state.users.find((u) => u.id === userId);
    if (found) {
      updateState(() => ({
        currentUser: found,
        selectedTaskId: null,
        activeTab: found.role === 'manager' || found.role === 'owner' ? 'overview' : 'home',
      }));
    }
  },

  // Shift & Breaks
  toggleClockIn: (userId: string) => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    updateState((prev) => {
      const updatedUsers: User[] = prev.users.map((u) => {
        if (u.id === userId) {
          const nextStatus: 'clocked_in' | 'clocked_out' =
            u.shiftStatus === 'clocked_in' ? 'clocked_out' : 'clocked_in';
          return {
            ...u,
            shiftStatus: nextStatus,
            shiftStartTime: nextStatus === 'clocked_in' ? nowStr : u.shiftStartTime,
          };
        }
        return u;
      });

      const user = updatedUsers.find((u) => u.id === userId);
      const isClockIn = user?.shiftStatus === 'clocked_in';

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId,
        userName: user?.name || 'Personel',
        action: isClockIn ? 'Vardiyaya başladı (Giriş)' : 'Vardiyayı bitirdi (Çıkış)',
        details: isClockIn ? `Başlangıç: ${nowStr}` : `Bitiş: ${nowStr}`,
        type: 'shift',
      };

      return {
        users: updatedUsers,
        currentUser: prev.currentUser.id === userId ? (user as User) : prev.currentUser,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    const targetUser = state.users.find((u) => u.id === userId);
    store.dispatchNotification({
      type: 'shift_clock_in',
      title: targetUser?.shiftStatus === 'clocked_in' ? '🟢 Vardiya Başlatıldı' : '🔴 Vardiya Kapatıldı',
      message: `${targetUser?.name || 'Personel'} - ${targetUser?.shiftStatus === 'clocked_in' ? 'İyi çalışmalar!' : 'Gününüz tamamlandı.'}`,
      priority: 'normal',
    });
  },

  toggleBreak: (userId: string) => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    let wasOnBreak = false;
    updateState((prev) => {
      const updatedUsers: User[] = prev.users.map((u) => {
        if (u.id === userId) {
          const onBreak = u.shiftStatus === 'on_break';
          wasOnBreak = onBreak;
          const nextStatus: 'clocked_in' | 'on_break' = onBreak ? 'clocked_in' : 'on_break';
          return {
            ...u,
            shiftStatus: nextStatus,
            breakStartTime: onBreak ? undefined : nowStr,
          };
        }
        return u;
      });

      const user = updatedUsers.find((u) => u.id === userId);
      const isOnBreak = user?.shiftStatus === 'on_break';

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId,
        userName: user?.name || 'Personel',
        action: isOnBreak ? 'Molaya çıktı' : 'Moladan döndü',
        details: isOnBreak ? '30 dk dinlenme süresi başladı' : 'Vardiya çalışması devam ediyor',
        type: 'shift',
      };

      return {
        users: updatedUsers,
        currentUser: prev.currentUser.id === userId ? (user as User) : prev.currentUser,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    const userObj = state.users.find((u) => u.id === userId);
    store.dispatchNotification({
      type: 'shift_break',
      title: wasOnBreak ? '⚡ Moladan Dönüldü' : '☕ Mola Başlatıldı (30 dk)',
      message: `${userObj?.name || 'Personel'} ${wasOnBreak ? 'görev başına döndü.' : 'dinlenme molasına çıktı.'}`,
      priority: 'normal',
    });
  },

  // Shift Schedule Management
  addShift: (shiftData: Omit<Shift, 'id'>): { success: boolean; shift?: Shift; error?: string } => {
    haptics.success();
    const newShift: Shift = {
      ...shiftData,
      id: `sh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    updateState((prev) => {
      const filtered = prev.shifts.filter(
        (s) => !(s.employeeId === newShift.employeeId && s.date === newShift.date)
      );
      return {
        shifts: [...filtered, newShift],
      };
    });

    store.dispatchNotification({
      type: 'shift_clock_in',
      title: '📅 Vardiya Belirlendi',
      message: `${newShift.employeeName} için ${newShift.date} tarihli ${newShift.isOffDay ? 'İzin günü' : `${newShift.startTime} - ${newShift.endTime}`} kaydedildi.`,
      priority: 'normal',
    });

    return { success: true, shift: newShift };
  },

  updateShift: (id: string, updates: Partial<Shift>) => {
    haptics.tap();
    updateState((prev) => ({
      shifts: prev.shifts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  deleteShift: (id: string) => {
    haptics.tap();
    updateState((prev) => ({
      shifts: prev.shifts.filter((s) => s.id !== id),
    }));
  },

  batchSetShifts: (shiftsToAdd: Shift[]) => {
    haptics.success();
    updateState((prev) => {
      const map = new Map<string, Shift>();
      prev.shifts.forEach((s) => map.set(`${s.employeeId}_${s.date}`, s));
      shiftsToAdd.forEach((s) => map.set(`${s.employeeId}_${s.date}`, s));
      return {
        shifts: Array.from(map.values()),
      };
    });
  },

  populateAutoWeeklySchedule: (mondayDate: Date = getMondayOfWeek()) => {
    haptics.buttonClick('heavy');
    const autoShifts = generateAutoWeeklySchedule(state.users, mondayDate);
    store.batchSetShifts(autoShifts);
    store.dispatchNotification({
      type: 'shift_clock_in',
      title: '📅 Haftalık Çizelge Hazırlandı',
      message: `Tüm personel için dengeli haftalık vardiya çizelgesi oluşturuldu.`,
      priority: 'normal',
    });
  },

  // Tasks
  startTask: (taskId: string) => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    updateState((prev) => {
      let taskTitle = '';
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          taskTitle = t.title;
          return { ...t, status: 'in_progress' as const };
        }
        return t;
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId: prev.currentUser.id,
        userName: prev.currentUser.name,
        action: 'Görevi başlattı',
        details: taskTitle,
        type: 'task',
      };

      return {
        tasks: updatedTasks,
        activityLogs: [log, ...prev.activityLogs],
      };
    });
  },

  toggleChecklistItem: (taskId: string, itemId: string, val?: string | number | boolean) => {
    let resolvedDone = true;
    updateState((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          const nextChecklist = t.checklist.map((item) => {
            if (item.id === itemId) {
              const isDone = val !== undefined ? Boolean(val) : !item.completed;
              resolvedDone = isDone;
              return {
                ...item,
                completed: isDone,
                value: val !== undefined ? val : !item.completed,
              };
            }
            return item;
          });
          return { ...t, checklist: nextChecklist };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });
    haptics.checklistToggle(resolvedDone);
  },

  completeTask: (taskId: string, proof?: PhotoProof) => {
    haptics.taskComplete();
    // Burst particles
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#D8FF4F', '#10B981', '#ffffff'],
      });
    } catch {
      // Ignore
    }

    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const targetTask = state.tasks.find((t) => t.id === taskId);

    // Queue in offline queue if not effectively online
    if (!offlineQueue.isEffectiveOnline()) {
      offlineQueue.enqueue('COMPLETE_TASK', {
        taskId,
        taskTitle: targetTask?.title || 'Görev',
        proof,
        completedAt: nowStr,
        userName: state.currentUser.name,
      });
    }

    updateState((prev) => {
      let taskTitle = '';
      let requiresApproval = false;

      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          taskTitle = t.title;
          requiresApproval = t.requireApproval;
          return {
            ...t,
            status: requiresApproval ? ('waiting_approval' as const) : ('completed' as const),
            completedAt: nowStr,
            livePhotoProof: proof || t.livePhotoProof,
            checklist: t.checklist.map((c) => ({ ...c, completed: true })),
          };
        }
        return t;
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId: prev.currentUser.id,
        userName: prev.currentUser.name,
        action: requiresApproval ? 'Onaya gönderdi' : 'Görevi tamamladı',
        details: taskTitle,
        type: 'task',
      };

      // Also update user's metrics
      const updatedUsers = prev.users.map((u) => {
        if (u.id === prev.currentUser.id) {
          return {
            ...u,
            metrics: {
              ...u.metrics,
              tasksCompletedToday: u.metrics.tasksCompletedToday + 1,
            },
          };
        }
        return u;
      });

      return {
        tasks: updatedTasks,
        users: updatedUsers,
        currentUser:
          prev.currentUser.id === prev.currentUser.id
            ? {
                ...prev.currentUser,
                metrics: {
                  ...prev.currentUser.metrics,
                  tasksCompletedToday: prev.currentUser.metrics.tasksCompletedToday + 1,
                },
              }
            : prev.currentUser,
        activityLogs: [log, ...prev.activityLogs],
        selectedTaskId: null,
      };
    });

    if (targetTask) {
      if (targetTask.requireApproval) {
        store.dispatchNotification({
          type: 'task_waiting_approval',
          title: 'İnceleme Bekleyen Fotoğraflı Görev',
          message: `${state.currentUser.name}, "${targetTask.title}" görevini tamamladı ve fotoğraf onayı bekliyor.`,
          priority: 'important',
          relatedTaskId: taskId,
          actionLabel: 'İncele & Onayla',
        });
      } else {
        store.dispatchNotification({
          type: 'task_completed',
          title: 'Görev Tamamlandı ✓',
          message: `"${targetTask.title}" görevi başarıyla tamamlandı.`,
          priority: 'normal',
          relatedTaskId: taskId,
        });
      }
    }
  },

  verifyTaskLocation: (taskId: string, zoneCode: string) => {
    haptics.qrScanned();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const targetTask = state.tasks.find((t) => t.id === taskId);
    const targetZone = state.zones.find((z) => z.code === zoneCode || z.id === targetTask?.zoneId);

    updateState((prev) => {
      let taskTitle = '';
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          taskTitle = t.title;
          return {
            ...t,
            locationVerified: true,
            locationVerifiedAt: nowStr,
          };
        }
        return t;
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId: prev.currentUser.id,
        userName: prev.currentUser.name,
        action: 'QR Konum Doğrulandı ✓',
        details: `${taskTitle} (${targetZone?.name || zoneCode})`,
        type: 'task',
      };

      return {
        tasks: updatedTasks,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    store.dispatchNotification({
      type: 'system_sync',
      title: 'Konum Doğrulandı ✓',
      message: `"${targetTask?.title}" görevi için ${targetZone?.name || zoneCode} QR doğrulaması sağlandı.`,
      priority: 'normal',
      relatedTaskId: taskId,
    });
  },

  approveTask: (taskId: string) => {
    haptics.taskApprove();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const targetTask = state.tasks.find((t) => t.id === taskId);
    updateState((prev) => {
      let taskTitle = '';
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          taskTitle = t.title;
          return { ...t, status: 'completed' as const };
        }
        return t;
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId: prev.currentUser.id,
        userName: prev.currentUser.name,
        action: 'Görevi onayladı ✓',
        details: taskTitle,
        type: 'approval',
      };

      return {
        tasks: updatedTasks,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    store.dispatchNotification({
      type: 'task_approved',
      title: 'Görev Onaylandı ✓',
      message: `"${targetTask?.title || 'Görev'}" müdür tarafından incelendi ve onaylandı.`,
      priority: 'normal',
      relatedTaskId: taskId,
    });
  },

  redoTask: (taskId: string, reason: string) => {
    haptics.alert();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const targetTask = state.tasks.find((t) => t.id === taskId);
    updateState((prev) => {
      let taskTitle = '';
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          taskTitle = t.title;
          const comment = {
            id: `comm-${Date.now()}`,
            userId: prev.currentUser.id,
            userName: prev.currentUser.name,
            userRole: prev.currentUser.role,
            text: `[Tekrar İstendi]: ${reason}`,
            timestamp: nowStr,
          };
          return {
            ...t,
            status: 'rejected' as const,
            rejectionReason: reason,
            comments: [...t.comments, comment],
          };
        }
        return t;
      });

      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: nowStr,
        userId: prev.currentUser.id,
        userName: prev.currentUser.name,
        action: 'Görevi tekrar istendi (Redo)',
        details: `${taskTitle} — ${reason}`,
        type: 'approval',
      };

      return {
        tasks: updatedTasks,
        activityLogs: [log, ...prev.activityLogs],
      };
    });

    store.dispatchNotification({
      type: 'task_returned',
      title: 'Görev Revizyonu İstendi ⚠️',
      message: `"${targetTask?.title || 'Görev'}": ${reason}`,
      priority: 'important',
      relatedTaskId: taskId,
    });
  },

  addTaskComment: (taskId: string, text: string) => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    updateState((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [
              ...t.comments,
              {
                id: `comm-${Date.now()}`,
                userId: prev.currentUser.id,
                userName: prev.currentUser.name,
                userRole: prev.currentUser.role,
                text,
                timestamp: nowStr,
              },
            ],
          };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });
  },

  createTask: (newTask: Partial<Task>) => {
    haptics.success();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const fullTask: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title || 'Yeni Görev',
      description: newTask.description || '',
      assignedTo: newTask.assignedTo || [state.currentUser.id],
      assignedToRole: newTask.assignedToRole,
      zoneId: newTask.zoneId || 'z-veranda',
      priority: newTask.priority || 'normal',
      deadline: newTask.deadline || '18:00',
      estimatedMinutes: newTask.estimatedMinutes || 15,
      requirePhoto: newTask.requirePhoto ?? false,
      requireLivePhoto: newTask.requireLivePhoto ?? false,
      requireQr: newTask.requireQr ?? false,
      requireApproval: newTask.requireApproval ?? true,
      status: 'assigned',
      checklist: newTask.checklist || [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    updateState((prev) => ({
      tasks: [fullTask, ...prev.tasks],
      activeModal: null,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: nowStr,
          userId: prev.currentUser.id,
          userName: prev.currentUser.name,
          action: 'Yeni görev oluşturdu',
          details: fullTask.title,
          type: 'task',
        },
        ...prev.activityLogs,
      ],
    }));

    store.dispatchNotification({
      type: 'task_assigned',
      title: 'Yeni Görev Atandı',
      message: `"${fullTask.title}" - Teslim: ${fullTask.deadline}`,
      priority: fullTask.priority === 'urgent' ? 'urgent' : 'normal',
      relatedTaskId: fullTask.id,
    });
  },

  // Issues
  reportIssue: (data: Partial<Issue>) => {
    haptics.alert();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newIssue: Issue = {
      id: `iss-${Date.now()}`,
      title: data.title || 'Sorun Bildirimi',
      description: data.description || '',
      category: data.category || 'Ekipman & Cihaz',
      urgency: data.urgency || 'medium',
      status: 'reported',
      reporterId: state.currentUser.id,
      reporterName: state.currentUser.name,
      assignedToName: 'Mehmet Kaya (Müdür)',
      photoUrl: data.photoUrl,
      zoneId: data.zoneId,
      createdAt: new Date().toISOString(),
    };

    if (!offlineQueue.isEffectiveOnline()) {
      offlineQueue.enqueue('REPORT_ISSUE', {
        title: newIssue.title,
        reporterName: state.currentUser.name,
        issue: newIssue,
      });
    }

    updateState((prev) => ({
      issues: [newIssue, ...prev.issues],
      activeModal: null,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: nowStr,
          userId: prev.currentUser.id,
          userName: prev.currentUser.name,
          action: 'Sorun bildirdi',
          details: newIssue.title,
          type: 'issue',
        },
        ...prev.activityLogs,
      ],
    }));

    store.dispatchNotification({
      type: 'issue_reported',
      title: `🚨 Yeni Sorun Bildirimi: ${newIssue.title}`,
      message: `${newIssue.urgency.toUpperCase()} öncelikli: ${newIssue.description || newIssue.title}`,
      priority: newIssue.urgency === 'critical' ? 'urgent' : 'important',
      relatedIssueId: newIssue.id,
    });
  },

  resolveIssue: (issueId: string) => {
    haptics.success();
    const targetIssue = state.issues.find((i) => i.id === issueId);
    updateState((prev) => ({
      issues: prev.issues.map((i) =>
        i.id === issueId
          ? { ...i, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : i
      ),
    }));

    store.dispatchNotification({
      type: 'issue_resolved',
      title: '✅ Arıza / Sorun Çözüldü',
      message: `"${targetIssue?.title || 'Arıza kaydı'}" başarıyla giderildi ve kapatıldı.`,
      priority: 'normal',
    });
  },

  // Quick Action Dock Management
  addQuickAction: (action: Omit<QuickAction, 'id' | 'order'>) => {
    haptics.tap();
    updateState((prev) => {
      const newAction: QuickAction = {
        ...action,
        id: `qa-${Date.now()}`,
        order: prev.quickActions.length,
      };
      return {
        quickActions: [...prev.quickActions, newAction],
        activeModal: null,
      };
    });
  },

  updateQuickAction: (id: string, updates: Partial<QuickAction>) => {
    haptics.tap();
    updateState((prev) => ({
      quickActions: prev.quickActions.map((qa) => (qa.id === id ? { ...qa, ...updates } : qa)),
    }));
  },

  deleteQuickAction: (id: string) => {
    haptics.tap();
    updateState((prev) => ({
      quickActions: prev.quickActions.filter((qa) => qa.id !== id),
    }));
  },

  reorderQuickActions: (newActions: QuickAction[]) => {
    updateState(() => ({ quickActions: newActions }));
  },

  // Messages
  sendMessage: (channelId: string, text: string, photoUrl?: string) => {
    haptics.tap();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const msg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderRole: state.currentUser.role,
      text,
      timestamp: nowStr,
      photoUrl,
    };
    updateState((prev) => ({
      messages: [...prev.messages, msg],
    }));
  },

  // Announcements
  acknowledgeAnnouncement: (annId: string) => {
    haptics.success();
    updateState((prev) => ({
      announcements: prev.announcements.map((a) => {
        if (a.id === annId && !a.readUserIds.includes(prev.currentUser.id)) {
          return { ...a, readUserIds: [...a.readUserIds, prev.currentUser.id] };
        }
        return a;
      }),
    }));
  },

  createAnnouncement: (
    title: string,
    content: string,
    priority: 'normal' | 'important' | 'urgent' = 'important'
  ) => {
    haptics.alert();
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      priority,
      requireAck: true,
      authorName: state.currentUser.name,
      createdAt: nowStr,
      readUserIds: [state.currentUser.id],
    };

    updateState((prev) => ({
      announcements: [newAnn, ...prev.announcements],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: nowStr,
          userId: prev.currentUser.id,
          userName: prev.currentUser.name,
          action: 'Restoran duyurusu yayınladı',
          details: title,
          type: 'system',
        },
        ...prev.activityLogs,
      ],
    }));

    store.dispatchNotification({
      type: 'announcement',
      title: `📢 Restoran Duyurusu: ${title}`,
      message: content,
      priority,
    });
  },

  // Templates
  assignTemplate: (templateId: string, assigneeId: string) => {
    haptics.success();
    const tpl = state.templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const assignedUser = state.users.find((u) => u.id === assigneeId);
    const now = new Date();
    const deadlineStr = `${now.getHours() + 1}:${String(now.getMinutes()).padStart(2, '0')}`;

    const createdTask: Task = {
      id: `task-tpl-${Date.now()}`,
      title: tpl.title,
      description: tpl.description,
      assignedTo: [assigneeId],
      assignedToRole: tpl.targetPosition,
      zoneId: tpl.zoneId,
      priority: 'high',
      deadline: deadlineStr,
      estimatedMinutes: tpl.estimatedMinutes,
      requirePhoto: tpl.requirePhoto,
      requireLivePhoto: tpl.requireLivePhoto,
      requireQr: tpl.requireQr,
      requireApproval: true,
      status: 'assigned',
      checklist: tpl.checklist.map((item, idx) => ({
        id: `c-tpl-${Date.now()}-${idx}`,
        text: item.text,
        type: item.type,
        required: item.required,
        completed: false,
        targetValue: item.targetValue,
      })),
      comments: [],
      createdAt: new Date().toISOString(),
    };

    updateState((prev) => ({
      tasks: [createdTask, ...prev.tasks],
      activeModal: null,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          userId: prev.currentUser.id,
          userName: prev.currentUser.name,
          action: 'Şablondan görev atadı',
          details: `${tpl.title} → ${assignedUser?.name || 'Personel'}`,
          type: 'task',
        },
        ...prev.activityLogs,
      ],
    }));

    store.dispatchNotification({
      type: 'task_assigned',
      title: `Şablondan Görev Atandı: ${tpl.title}`,
      message: `${assignedUser?.name || 'Personele'} aktarıldı. Teslim: ${deadlineStr}`,
      priority: 'important',
      relatedTaskId: createdTask.id,
    });
  },

  toggleChefMode: () => {
    haptics.tap('medium');
    updateState((prev) => {
      const nextMode = !prev.chefMode;
      return { chefMode: nextMode };
    });
  },
};

export function useAppStore(): AppState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
