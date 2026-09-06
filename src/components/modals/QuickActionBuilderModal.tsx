import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { QuickAction, ActionType, UserRole } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  AlertCircle,
  QrCode,
  PackageSearch,
  MessageSquare,
  Coffee,
  HelpCircle,
  Wrench,
  Camera,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { NeonCard } from '../common/NeonCard';

const PHOTO_PRESETS = [
  {
    name: 'Yer & Zemin Silme',
    color: 'blue' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80',
    template: 'Mutfak zemininde paspaslama ve kaymaz zemin dezenfeksiyonu yapıldı.',
  },
  {
    name: 'Dolap Isı Ölçümü',
    color: 'emerald' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'AlertCircle',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
    template: 'Soğuk hava deposu ve şoklayıcı ısı derecesi ölçüldü.',
  },
  {
    name: 'Çöp & Atık Boşaltma',
    color: 'amber' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'PackageSearch',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=80',
    template: 'Ana atık konteyneri ve organik çöp torbaları değiştirildi.',
  },
  {
    name: 'Bulaşık & Bardak',
    color: 'blue' as const,
    actionType: 'CREATE_STOCK_ALERT' as const,
    icon: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=500&q=80',
    template: 'Bar ve servis istasyonunda temiz su bardağı / fincan tükendi.',
  },
  {
    name: 'Fritöz Yağ Kontrolü',
    color: 'coral' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'AlertCircle',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80',
    template: 'Fritöz yağ polaritesi ve yanık tortu kontrolü yapıldı.',
  },
  {
    name: 'Bar & Espresso İstasyonu',
    color: 'lime' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=80',
    template: 'Espresso makinesi grup başlığı ve değirmen kalibrasyonu temizlendi.',
  },
  {
    name: 'Salon & Masa Hijyeni',
    color: 'purple' as const,
    actionType: 'CREATE_ISSUE' as const,
    icon: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
    template: 'Misafir masaları sanitasyon solüsyonu ile silindi.',
  },
  {
    name: 'Ekipman Arıza Bildirimi',
    color: 'coral' as const,
    actionType: 'SEND_ALERT' as const,
    icon: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80',
    template: 'Mutfak hattında acil teknik ekipman arızası tespit edildi.',
  },
];

export const QuickActionBuilderModal: React.FC = () => {
  const { activeModal, quickActions } = useAppStore();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Form states for new action
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [color, setColor] = useState<QuickAction['color']>('lime');
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'
  );
  const [actionType, setActionType] = useState<ActionType>('CREATE_ISSUE');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [visibleRoles, setVisibleRoles] = useState<UserRole[]>([
    'employee',
    'supervisor',
    'manager',
    'owner',
  ]);

  if (activeModal !== 'button_builder') return null;

  const colors: QuickAction['color'][] = ['lime', 'amber', 'coral', 'blue', 'purple', 'emerald'];

  const handleApplyPreset = (preset: typeof PHOTO_PRESETS[0]) => {
    haptics.tap();
    setName(preset.name);
    setColor(preset.color);
    setActionType(preset.actionType);
    setIcon(preset.icon);
    setImageUrl(preset.imageUrl);
    setMessageTemplate(preset.template);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    haptics.success();
    store.addQuickAction({
      name: name.trim(),
      icon,
      color,
      imageUrl: imageUrl.trim() || undefined,
      actionType,
      messageTemplate,
      requireConfirmation,
      requirePhoto,
      enabled: true,
      visibleRoles,
    });

    setName('');
    setMessageTemplate('');
    setActiveTab('list');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    haptics.tap();
    const newActions = [...quickActions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newActions.length) return;

    const temp = newActions[index];
    newActions[index] = newActions[targetIdx];
    newActions[targetIdx] = temp;

    // reassign orders
    const updated = newActions.map((a, i) => ({ ...a, order: i }));
    store.reorderQuickActions(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/20 text-[#D8FF4F] border border-[#D8FF4F]/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3D Hızlı Buton Editörü</h3>
              <p className="text-[10px] text-[#8E98A8]">
                Arka plan görselleri, 3D parlaklık ve neon çerçeveli butonlar
              </p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.04] rounded-xl mb-4 border border-white/10">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white/15 text-white shadow'
                : 'text-[#8E98A8] hover:text-white'
            }`}
          >
            Mevcut Butonlar ({quickActions.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#D8FF4F] text-black font-bold shadow'
                : 'text-[#8E98A8] hover:text-white'
            }`}
          >
            + Yeni Buton Ekle
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' ? (
          <div className="space-y-2 overflow-y-auto no-scrollbar pr-1 flex-1">
            {quickActions.map((action, idx) => (
              <div
                key={action.id}
                className="relative overflow-hidden p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 group hover:border-white/25 transition-all"
              >
                {action.imageUrl && (
                  <img
                    src={action.imageUrl}
                    alt={action.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none group-hover:scale-105 transition-all duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#06080D]/90 via-[#070A0F]/80 to-[#0A0E17]/85 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-[#D8FF4F] overflow-hidden flex-shrink-0">
                    {action.imageUrl ? (
                      <img src={action.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{action.name}</p>
                    <p className="text-[10px] text-[#8E98A8] font-mono">
                      {action.actionType} · {action.color} {action.imageUrl ? '· 📷 Görselli' : ''}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-1">
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === quickActions.length - 1}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => store.deleteQuickAction(action.id)}
                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5 overflow-y-auto no-scrollbar pr-1 flex-1">
            {/* Live Interactive 3D Preview Card with Neon Beam & Gloss */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-[#D8FF4F]/30 text-center">
              <span className="text-[10px] text-[#8E98A8] uppercase tracking-wider block mb-2 font-mono">
                3D Kart Canlı Önizleme
              </span>
              <div className="flex justify-center">
                <NeonCard
                  neonColor={color}
                  tactile={true}
                  shine={true}
                  interactive={true}
                  className="w-36 h-28 border border-white/15 p-3 flex flex-col items-center justify-center text-center group bg-[#0A0D14]"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06080D]/95 via-[#070A0F]/70 to-[#0A0E17]/60 pointer-events-none" />

                  <div className="relative z-10 w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center mb-1.5 shadow-md">
                    <Sparkles className="w-4 h-4 text-[#D8FF4F]" />
                  </div>
                  <span className="relative z-10 text-[11px] font-bold text-white line-clamp-2 px-1">
                    {name || 'Hızlı Aksiyon Başlığı'}
                  </span>
                </NeonCard>
              </div>
            </div>

            {/* Quick Presets Selection */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#D8FF4F]" />
                <span>Görsel Şablonları</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="relative overflow-hidden p-2 rounded-lg border border-white/10 hover:border-[#D8FF4F]/50 text-left transition-all group flex items-center gap-2 cursor-pointer"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                    <span className="text-[11px] font-medium text-white truncate">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Buton Başlığı
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ör: Yer Silme, Dolap Isı Kontrolü, Bardak Bitti..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Arka Plan Görseli URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              />
            </div>

            {/* Action Type */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Bağlı Aksiyon (Action Engine)
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D1016] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              >
                <option value="CREATE_ISSUE">Sorun Kaydı Oluştur (Issue)</option>
                <option value="CREATE_STOCK_ALERT">Stok Uyarısı Gönder (Stock Alert)</option>
                <option value="SEND_ALERT">Müdüre Acil Çağrı / Anons Gönder</option>
                <option value="SCAN_QR">Alan QR Taraması Başlat</option>
                <option value="OPEN_CAMERA">Kamera Aç & Kanıt Kaydet</option>
                <option value="START_BREAK">Mola Başlat (30 dk)</option>
                <option value="SEND_MESSAGE">Mesajlaşma Kanalını Aç</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Neon Çerçeve Rengi
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      color === c ? 'border-white scale-110 shadow-lg shadow-white/30' : 'border-transparent opacity-60'
                    } ${
                      c === 'lime'
                        ? 'bg-[#D8FF4F]'
                        : c === 'amber'
                        ? 'bg-amber-400'
                        : c === 'coral'
                        ? 'bg-rose-500'
                        : c === 'blue'
                        ? 'bg-sky-400'
                        : c === 'purple'
                        ? 'bg-purple-500'
                        : 'bg-emerald-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Predefined message template */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Otomatik Mesaj Şablonu
              </label>
              <input
                type="text"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Ör: Bar bölümünde su bardağı tükendi..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              />
            </div>

            {/* Checkbox options */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireConfirmation}
                  onChange={(e) => setRequireConfirmation(e.target.checked)}
                  className="rounded border-white/20 text-[#D8FF4F] focus:ring-0"
                />
                <span>Onay İstensin mi?</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePhoto}
                  onChange={(e) => setRequirePhoto(e.target.checked)}
                  className="rounded border-white/20 text-[#D8FF4F] focus:ring-0"
                />
                <span>Fotoğraf Zorunlu</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer mt-2 card-3d-tactile"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Hazır Butonu Ekle</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
