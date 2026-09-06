import React, { useState, useRef } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { IssueCategory, IssueUrgency } from '../../types';
import { AlertCircle, X, Camera, Send, Wrench, Package, Sparkles, Shield, HelpCircle, Trash2, Upload } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const ReportIssueModal: React.FC = () => {
  const { activeModal, modalPayload, zones } = useAppStore();
  const prefillMessage = (modalPayload?.prefillMessage as string) || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(prefillMessage);
  const [category, setCategory] = useState<IssueCategory>('Equipment');
  const [urgency, setUrgency] = useState<IssueUrgency>('medium');
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id || '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (activeModal !== 'report_issue') return null;

  const categories: { label: string; value: IssueCategory; icon: string }[] = [
    { label: 'Ekipman / Cihaz', value: 'Equipment', icon: 'Wrench' },
    { label: 'Kritik Stok', value: 'Stock', icon: 'Package' },
    { label: 'Temizlik & Hijyen', value: 'Cleaning', icon: 'Sparkles' },
    { label: 'Müşteri Alanı', value: 'Customer Area', icon: 'Shield' },
    { label: 'İş Güvenliği', value: 'Safety', icon: 'AlertCircle' },
    { label: 'Genel Bakım', value: 'Maintenance', icon: 'Wrench' },
    { label: 'Diğer', value: 'Other', icon: 'HelpCircle' },
  ];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptics.cameraShutter();
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    haptics.tap();
    setPhotoDataUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    haptics.buttonClick('heavy');
    store.reportIssue({
      title: title.trim(),
      description: description.trim(),
      category,
      urgency,
      zoneId,
      photoUrl: photoDataUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sorun / Arıza Bildir</h3>
              <p className="text-[10px] text-[#8E98A8]">
                Yöneticiye anlık push bildirimi ve görev kaydı iletilir
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto no-scrollbar pr-1 flex-1">
          {/* Category Chips */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1.5">
              Sorun Kategorisi
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setCategory(cat.value);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    category === cat.value
                      ? 'bg-[#D8FF4F]/15 border-[#D8FF4F]/40 text-white font-semibold'
                      : 'bg-white/[0.03] border-white/[0.08] text-[#8E98A8] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Başlık
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ör: 2 nolu espresso buhar hortumu sızdırıyor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
            />
          </div>

          {/* Location / Zone */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Restoran Bölgesi
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1016] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Aciliyet Seviyesi
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as IssueUrgency[]).map((urg) => (
                <button
                  key={urg}
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setUrgency(urg);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-center border transition-all cursor-pointer ${
                    urgency === urg
                      ? urg === 'critical'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                        : urg === 'high'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#D8FF4F]/20 border-[#D8FF4F] text-[#D8FF4F]'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400'
                  }`}
                >
                  {urg === 'critical'
                    ? 'Kritik'
                    : urg === 'high'
                    ? 'Yüksek'
                    : urg === 'medium'
                    ? 'Orta'
                    : 'Düşük'}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Açıklama & Detaylar
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sorunu veya arızayı kısaca açıklayın..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
            />
          </div>

          {/* Real Photo Attachment with Camera / File selector & Preview */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1.5">
              Fotoğraf Kanıtı
            </label>

            {photoDataUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/20 group">
                <img
                  src={photoDataUrl}
                  alt="Issue Proof"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-full bg-rose-500 text-white shadow-lg cursor-pointer"
                    title="Fotoğrafı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-rose-300 border border-white/10 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kaldır</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-[#D8FF4F]/50 bg-white/[0.02] hover:bg-white/[0.05] text-center flex items-center justify-center gap-2 text-xs text-zinc-300 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#D8FF4F]" />
                <span>Fotoğraf Çek veya Galeriden Ekle</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Sorunu Bildir & Yöneticiyi Uyar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
