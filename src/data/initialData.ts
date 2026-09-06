import {
  User,
  Zone,
  Task,
  TaskTemplate,
  QuickAction,
  Issue,
  Announcement,
  ChannelMessage,
  Shift,
  ActivityLog,
  AppNotification,
} from '../types';

// Tertemiz tek usta/yönetici hesabı (Dükkan Sahibi)
export const initialUsers: User[] = [
  {
    id: 'u-usta',
    name: 'Mehmet Usta',
    email: 'usta@cetemflow.com',
    password: '123',
    phone: '+90 555 100 2030',
    code: 'USTA-01',
    role: 'owner',
    position: 'Müdür',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shiftStatus: 'clocked_in',
    shiftStartTime: '08:00',
    metrics: {
      tasksCompletedToday: 0,
      tasksTotalToday: 0,
      thisWeekCompleted: 0,
      thisWeekTotal: 0,
      onTimeRate: 100,
      returnedCount: 0,
    },
  },
];

// Dükkanın ana çalışma bölümleri
export const initialZones: Zone[] = [
  {
    id: 'z-kitchen',
    name: 'Mutfak & Ocakbaşı',
    code: 'MTF-01',
    iconName: 'UtensilsCrossed',
    status: 'ready',
    totalTasks: 0,
    completedTasks: 0,
    color: '#F59E0B',
    qrCode: 'DUKKAN-BOLGE-MUTFAK',
    description: 'Sıcak hat, ocak, hazırlık tezgahı ve bulaşıkhane',
  },
  {
    id: 'z-salon',
    name: 'Salon & Masalar',
    code: 'SLN-02',
    iconName: 'Store',
    status: 'ready',
    totalTasks: 0,
    completedTasks: 0,
    color: '#3B82F6',
    qrCode: 'DUKKAN-BOLGE-SALON',
    description: 'Müşteri oturma alanı, masalar ve sandalyeler',
  },
  {
    id: 'z-bar',
    name: 'Kasa & İçecek Tezgahı',
    code: 'KSA-03',
    iconName: 'Coffee',
    status: 'ready',
    totalTasks: 0,
    completedTasks: 0,
    color: '#10B981',
    qrCode: 'DUKKAN-BOLGE-KASA',
    description: 'Kasa, çay ocağı, içecek vitrini ve servis tezgahı',
  },
  {
    id: 'z-wc',
    name: 'Müşteri Lavaboları',
    code: 'LVB-04',
    iconName: 'Sparkles',
    status: 'ready',
    totalTasks: 0,
    completedTasks: 0,
    color: '#8B5CF6',
    qrCode: 'DUKKAN-BOLGE-LAVABO',
    description: 'Lavabolar, sabunluk ve havlu kontrol noktası',
  },
  {
    id: 'z-storage',
    name: 'Depo & Kiler',
    code: 'DEP-05',
    iconName: 'Package',
    status: 'ready',
    totalTasks: 0,
    completedTasks: 0,
    color: '#D8FF4F',
    qrCode: 'DUKKAN-BOLGE-DEPO',
    description: 'Kuru erzak, içecek kasaları ve temizlik malzemeleri',
  },
];

// Tüm örnek görevler sıfırlandı, tertemiz liste
export const initialTasks: Task[] = [];

// Esnafın dükkanda tek tıkla kullanacağı gerçek hızlı düğmeler
export const initialQuickActions: QuickAction[] = [
  {
    id: 'qa-mopping',
    name: 'Yerleri Paspasla',
    icon: 'Sparkles',
    color: 'blue',
    actionType: 'CREATE_ISSUE',
    messageTemplate: 'Zemin temizlendi, paspas atıldı.',
    requireConfirmation: false,
    requirePhoto: true,
    order: 0,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-trash',
    name: 'Çöpleri Çıkar',
    icon: 'PackageSearch',
    color: 'amber',
    actionType: 'CREATE_ISSUE',
    messageTemplate: 'Dükkanın ve mutfağın çöpleri boşaltıldı.',
    requireConfirmation: false,
    requirePhoto: false,
    order: 1,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-fridge',
    name: 'Dolap Derece Kontrol',
    icon: 'ShieldCheck',
    color: 'emerald',
    actionType: 'CREATE_ISSUE',
    messageTemplate: 'Buzdolaplarının soğutma dereceleri kontrol edildi.',
    requireConfirmation: false,
    requirePhoto: false,
    order: 2,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-issue',
    name: 'Arıza / Sorun Bildir',
    icon: 'AlertCircle',
    color: 'coral',
    actionType: 'CREATE_ISSUE',
    requireConfirmation: false,
    requirePhoto: true,
    order: 3,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-lowstock',
    name: 'Eksik Malzeme Bildir',
    icon: 'Layers',
    color: 'lime',
    actionType: 'CREATE_STOCK_ALERT',
    requireConfirmation: false,
    requirePhoto: false,
    order: 4,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-scan',
    name: 'Bölge QR Okut',
    icon: 'QrCode',
    color: 'purple',
    actionType: 'SCAN_QR',
    requireConfirmation: false,
    requirePhoto: false,
    order: 5,
    enabled: true,
    visibleRoles: ['employee', 'supervisor', 'manager', 'owner'],
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-break',
    name: 'Mola Başlat / Bitir',
    icon: 'Coffee',
    color: 'emerald',
    actionType: 'START_BREAK',
    requireConfirmation: true,
    requirePhoto: false,
    order: 6,
    enabled: true,
    visibleRoles: ['employee', 'supervisor'],
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'qa-help',
    name: 'Acil Destek Çağır',
    icon: 'HelpCircle',
    color: 'coral',
    actionType: 'SEND_ALERT',
    messageTemplate: 'Dükkanda yoğunluk var, acil takviye gerek!',
    requireConfirmation: true,
    requirePhoto: false,
    order: 7,
    enabled: true,
    visibleRoles: ['employee', 'supervisor'],
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  },
];

// Tek tıkla verilebilecek hazır dükkan iş şablonları
export const initialTemplates: TaskTemplate[] = [
  {
    id: 'tpl-acilis',
    title: 'SABAH DÜKKAN AÇILIŞI',
    category: 'Açılış Rutini',
    targetPosition: 'Garson',
    description: 'Dükkanın sabah servisine eksiksiz ve temiz hazırlanması.',
    estimatedMinutes: 20,
    requirePhoto: true,
    requireLivePhoto: true,
    requireQr: true,
    zoneId: 'z-salon',
    checklist: [
      { text: 'Tüm masalar ve sandalyeler silindi', type: 'checkbox', required: true },
      { text: 'Tuzluk, peçetelik ve kürdanlar dolduruldu', type: 'checkbox', required: true },
      { text: 'Zemin süpürüldü ve paspaslandı', type: 'checkbox', required: true },
      { text: 'Açılış hazır halinin fotoğrafı çekildi', type: 'photo', required: true },
    ],
  },
  {
    id: 'tpl-kapanis',
    title: 'AKŞAM DÜKKAN KAPANIŞI',
    category: 'Kapanış Rutini',
    targetPosition: 'Mutfak',
    description: 'Dükkanı kapatırken güvenlik ve temizlik kontrolleri.',
    estimatedMinutes: 30,
    requirePhoto: true,
    requireLivePhoto: true,
    requireQr: true,
    zoneId: 'z-kitchen',
    checklist: [
      { text: 'Ocaklar, fritöz ve ana gaz vanası kapatıldı', type: 'yes_no', required: true },
      { text: 'Tüm çöpler dışarı konteynere çıkarıldı', type: 'checkbox', required: true },
      { text: 'Buzdolapları kapatılıp dereceleri kontrol edildi', type: 'temperature', required: true, targetValue: '4°C' },
      { text: 'Tezgahlar dezenfekte edilip temizlendi', type: 'checkbox', required: true },
      { text: 'Kapanış genel görünüm fotoğrafı çekildi', type: 'photo', required: true },
    ],
  },
  {
    id: 'tpl-lavabo',
    title: 'LAVABO & TEMİZLİK KONTROLÜ',
    category: 'Hijyen',
    targetPosition: 'Temizlik',
    description: 'Müşteri lavabolarının temizliği ve hijyen malzemesi kontrolü.',
    estimatedMinutes: 10,
    requirePhoto: true,
    requireLivePhoto: false,
    requireQr: false,
    zoneId: 'z-wc',
    checklist: [
      { text: 'Sıvı sabunluklar dolduruldu', type: 'checkbox', required: true },
      { text: 'Havlu kağıt ve tuvalet kağıdı tamamlandı', type: 'checkbox', required: true },
      { text: 'Ayna ve musluklar silinip kurulandı', type: 'checkbox', required: true },
      { text: 'Zemin paspaslandı', type: 'checkbox', required: true },
    ],
  },
];

// Örnek arızalar temizlendi
export const initialIssues: Issue[] = [];

// Örnek duyurular temizlendi
export const initialAnnouncements: Announcement[] = [];

// Örnek mesajlar temizlendi
export const initialMessages: ChannelMessage[] = [];

// Örnek vardiyalar temizlendi
export const initialShifts: Shift[] = [];

// Örnek işlem geçmişi temizlendi
export const initialActivityLogs: ActivityLog[] = [];

// Örnek bildirimler temizlendi
export const initialNotifications: AppNotification[] = [];
