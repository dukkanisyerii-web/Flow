import React, { useState } from 'react';
import { Task, ChecklistItem } from '../../types';
import { store, useAppStore } from '../../store/appStore';
import {
  X,
  Clock,
  MapPin,
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  MessageSquare,
  Sparkles,
  Check,
  Thermometer,
  Eye,
  AlertTriangle,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const { tasks, zones, currentUser, users } = useAppStore();
  const task = tasks.find((t) => t.id === taskId);
  const [commentText, setCommentText] = useState('');
  const [redoModalOpen, setRedoModalOpen] = useState(false);
  const [redoReason, setRedoReason] = useState('');

  if (!task) return null;

  const zone = zones.find((z) => z.id === task.zoneId);
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';
  const isAssignedToCurrent =
    task.assignedTo.includes(currentUser.id) ||
    task.assignedToRole === currentUser.position ||
    isManager;

  const allChecklistDone =
    task.checklist.length === 0 || task.checklist.every((item) => item.completed);

  const canComplete =
    allChecklistDone &&
    (!task.requireLivePhoto || !!task.livePhotoProof) &&
    task.status !== 'completed';

  const handleToggleChecklist = (item: ChecklistItem, nextVal?: string | number | boolean) => {
    store.toggleChecklistItem(task.id, item.id, nextVal);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    store.addTaskComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleApprove = () => {
    store.approveTask(task.id);
    onClose();
  };

  const handleRedoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redoReason.trim()) return;
    store.redoTask(task.id, redoReason.trim());
    setRedoModalOpen(false);
    onClose();
  };

  const handleCompleteAction = () => {
    if (task.requireLivePhoto && !task.livePhotoProof) {
      store.openModal('camera_live', { taskId: task.id });
      return;
    }
    store.completeTask(task.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl glass-panel-elevated border border-white/15 overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#07090D]/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#D8FF4F] px-2 py-0.5 rounded bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 font-semibold">
              {zone?.code || 'TASK'}
            </span>
            <span className="text-xs text-[#8E98A8]">
              {task.status === 'in_progress'
                ? '🟢 Devam Ediyor'
                : task.status === 'waiting_approval'
                ? '🟡 Onay Bekliyor'
                : task.status === 'completed'
                ? '✓ Tamamlandı'
                : task.status === 'rejected'
                ? '🔴 Tekrar İstendi'
                : 'Görev Detayı'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Hero Section */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D8FF4F]" />
                Son Saat: {task.deadline}
              </span>
              <span>·</span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D8FF4F]" />
                {zone?.name || 'Genel'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{task.title}</h2>
            {task.description && (
              <p className="text-xs text-[#8E98A8] mt-1 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Rejection notice banner if returned */}
          {task.status === 'rejected' && task.rejectionReason && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Görevin Tekrar Yapılması İstendi</p>
                <p className="mt-0.5">{task.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Smart Checklist Section */}
          {task.checklist.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
                  Smart Checklist ({task.checklist.filter((c) => c.completed).length}/
                  {task.checklist.length})
                </h3>
              </div>

              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.completed
                        ? 'bg-[#D8FF4F]/5 border-[#D8FF4F]/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {item.type === 'checkbox' ? (
                          <button
                            onClick={() => handleToggleChecklist(item)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              item.completed
                                ? 'bg-[#D8FF4F] border-[#D8FF4F] text-black font-bold'
                                : 'border-white/30 hover:border-white/50'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        ) : item.type === 'temperature' ? (
                          <Thermometer className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : item.type === 'photo' ? (
                          <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-[#8E98A8] shrink-0" />
                        )}

                        <span
                          className={`text-xs ${
                            item.completed ? 'line-through text-[#8E98A8]' : 'text-zinc-200'
                          }`}
                        >
                          {item.text}
                          {item.required && <span className="text-rose-400 ml-1">*</span>}
                        </span>
                      </div>

                      {/* Specialized input widgets */}
                      {item.type === 'temperature' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="text"
                            placeholder={item.targetValue || '4°C'}
                            defaultValue={typeof item.value === 'string' ? item.value : ''}
                            onBlur={(e) => {
                              handleToggleChecklist(item, e.target.value);
                            }}
                            className="w-16 px-2 py-1 rounded bg-black/40 border border-white/20 text-xs font-mono text-center text-[#D8FF4F] focus:outline-none focus:border-[#D8FF4F]"
                          />
                        </div>
                      )}

                      {item.type === 'yes_no' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleChecklist(item, true)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                              item.value === true
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-zinc-400'
                            }`}
                          >
                            Evet ✓
                          </button>
                          <button
                            onClick={() => handleToggleChecklist(item, false)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                              item.value === false
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-white/5 border-white/10 text-zinc-400'
                            }`}
                          >
                            Hayır
                          </button>
                        </div>
                      )}

                      {item.type === 'photo' && (
                        <button
                          onClick={() => store.openModal('camera_live', { taskId: task.id })}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] text-[#D8FF4F] flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Fotoğraf Çek</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof Section (Live Photo or Uploaded Proof) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8]">
              Görev Kanıtı (Proof)
            </h3>

            {task.livePhotoProof ? (
              <div
                onClick={() => store.openPhotoViewer(task.livePhotoProof!)}
                className="relative w-full h-44 rounded-xl overflow-hidden border border-white/15 cursor-pointer group"
              >
                <img
                  src={task.livePhotoProof.url}
                  alt="Proof"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Official CETEM Watermark Overlay */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md border border-white/15 text-[10px] font-mono text-[#D8FF4F]">
                  {task.livePhotoProof.overlayText}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-zinc-300 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  Büyüt
                </div>
              </div>
            ) : (
              <div
                onClick={() => store.openModal('camera_live', { taskId: task.id })}
                className="p-4 rounded-xl border border-dashed border-white/20 hover:border-[#D8FF4F]/50 bg-white/[0.02] hover:bg-white/[0.04] text-center cursor-pointer transition-all"
              >
                <Camera className="w-6 h-6 text-[#D8FF4F] mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-white">Canlı Fotoğraf Kanıtı Ekle</p>
                <p className="text-[10px] text-[#8E98A8] mt-0.5">
                  Tarih ve saat damgasıyla doğrudan kamera açılarak kaydedilir
                </p>
              </div>
            )}
          </div>

          {/* Task Chat Thread */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E98A8] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Görev Sohbeti & Notlar ({task.comments.length})
            </h3>

            {task.comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                {task.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      comm.userId === currentUser.id
                        ? 'bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 ml-4'
                        : 'bg-white/[0.04] border border-white/[0.08] mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#8E98A8] mb-1">
                      <span className="font-semibold text-white">{comm.userName}</span>
                      <span className="font-mono">{comm.timestamp}</span>
                    </div>
                    <p className="text-zinc-200 leading-snug">{comm.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8E98A8] italic">Henüz bir not veya mesaj eklenmedi.</p>
            )}

            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Görev hakkında soru sor veya not yaz..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[#D8FF4F] text-black hover:bg-[#c9f53e] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Sticky Action Bottom Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-[#07090D]/90 backdrop-blur-xl">
          {isManager && task.status === 'waiting_approval' ? (
            // Manager Approval Controls
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRedoModalOpen(true)}
                className="py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tekrar İste (Redo)</span>
              </button>

              <button
                onClick={handleApprove}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Onayla (Approve)</span>
              </button>
            </div>
          ) : task.status === 'completed' ? (
            <div className="py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Bu Görev Başarıyla Tamamlandı</span>
            </div>
          ) : (
            // Employee Complete / Start Controls
            <button
              onClick={handleCompleteAction}
              disabled={task.status === 'waiting_approval'}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                task.status === 'waiting_approval'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                  : 'bg-[#D8FF4F] hover:bg-[#c9f53e] text-[#07090D] shadow-lg shadow-[#D8FF4F]/20 cursor-pointer'
              }`}
            >
              <span>
                {task.status === 'waiting_approval'
                  ? 'Yönetici Onayı Bekleniyor'
                  : task.requireLivePhoto && !task.livePhotoProof
                  ? '📷 Canlı Fotoğraf Çek & Bitir'
                  : 'Görevi Tamamla (Complete)'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Redo Reason Dialog */}
        {redoModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/90 p-5 flex flex-col justify-center animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-2">Görevi Tekrar İste (Redo)</h3>
            <p className="text-xs text-[#8E98A8] mb-3">
              Çalışanın neyi düzeltmesi gerektiğini belirtin. Bu yorum çalışana bildirim olarak
              gidecektir.
            </p>
            <form onSubmit={handleRedoSubmit} className="space-y-3">
              <textarea
                value={redoReason}
                onChange={(e) => setRedoReason(e.target.value)}
                placeholder="Ör: Sol taraftaki korkuluk ve sandalye altları temizlenmemiş..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRedoModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-white/10 text-xs text-zinc-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
                >
                  Redo Bildirimi Gönder
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
