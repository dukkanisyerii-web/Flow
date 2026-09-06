import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { TaskPriority, EmployeePosition, ChecklistItem } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Camera,
  QrCode,
  CheckCircle2,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const CreateTaskModal: React.FC = () => {
  const { activeModal, users, zones } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(users[0]?.id || '');
  const [zoneId, setZoneId] = useState(zones[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [deadline, setDeadline] = useState('18:30');
  const [requireLivePhoto, setRequireLivePhoto] = useState(true);
  const [requireQr, setRequireQr] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Bölge masaları ve zemin kontrolü yapıldı',
    'Fotoğraf kanıtı yüklendi',
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  if (activeModal !== 'create_task') return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    haptics.tap();
    setChecklistItems([...checklistItems, newChecklistText.trim()]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (index: number) => {
    haptics.tap();
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedChecklist: ChecklistItem[] = checklistItems.map((text, idx) => ({
      id: `c-new-${Date.now()}-${idx}`,
      text,
      type: idx === checklistItems.length - 1 && requireLivePhoto ? 'photo' : 'checkbox',
      required: true,
      completed: false,
    }));

    store.createTask({
      title: title.trim(),
      description: description.trim(),
      assignedTo: [assigneeId],
      zoneId,
      priority,
      deadline,
      requirePhoto: requireLivePhoto,
      requireLivePhoto,
      requireQr,
      requireApproval: true,
      checklist: formattedChecklist,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/20 text-[#D8FF4F] border border-[#D8FF4F]/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yeni Görev Tanımla</h3>
              <p className="text-[10px] text-[#8E98A8]">Hızlı smart sheet ile operasyonel görev ata</p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto no-scrollbar pr-1 flex-1">
          {/* Smart Title input */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Ne Yapılması Gerekiyor? (What needs to be done?)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ör: Veranda masaları silinecek ve düzenlenecek"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
            />
          </div>

          {/* Assignee & Zone Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Kime Atanacak?
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D1016] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Alan / Bölge
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D1016] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Bitiş Saati (Due)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="18:30"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#D8FF4F]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
                Öncelik
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['normal', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-red-500 text-white'
                          : p === 'high'
                          ? 'bg-amber-400 text-black'
                          : 'bg-[#D8FF4F] text-black'
                        : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {p === 'urgent' ? 'Acil' : p === 'high' ? 'Yüksek' : 'Normal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Açıklama & Yönergeler
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Görev yönergeleri ve dikkat edilmesi gereken noktalar..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
            />
          </div>

          {/* Proof Options */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-[#8E98A8] uppercase tracking-wider block">
              Zorunlu Kanıt Gereksinimleri
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireLivePhoto}
                  onChange={(e) => setRequireLivePhoto(e.target.checked)}
                  className="rounded border-white/20 text-[#D8FF4F] focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Canlı Fotoğraf Kanıtı (Live Photo)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireQr}
                  onChange={(e) => setRequireQr(e.target.checked)}
                  className="rounded border-white/20 text-[#D8FF4F] focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-400" />
                  Alan QR Taraması
                </span>
              </label>
            </div>
          </div>

          {/* Checklist builder */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1">
              Kontrol Maddeleri (Checklist)
            </label>
            <div className="space-y-1.5 mb-2">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-zinc-300"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(idx)}
                    className="text-zinc-500 hover:text-rose-400 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="+ Yeni madde yazın ve ekleyin..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Görevi Ata (Assign Task)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
