import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { TaskTemplate, EmployeePosition } from '../../types';
import { X, Sparkles, Check, Clock, UserCheck, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const TemplateAssignModal: React.FC = () => {
  const { activeModal, templates, users } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (activeModal !== 'template_assign') return null;

  const categories = ['ALL', 'Opening', 'Closing', 'Cleaning', 'Kitchen', 'Bar', 'Restroom'];

  const filteredTemplates =
    selectedCategory === 'ALL'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleQuickAssign = (template: TaskTemplate) => {
    // Find matching staff by position
    const matchingUser =
      users.find((u) => u.position === template.targetPosition) ||
      users.find((u) => u.role === 'employee') ||
      users[0];

    store.assignTemplate(template.id, matchingUser.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/20 text-[#D8FF4F] border border-[#D8FF4F]/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Görev Şablon Kütüphanesi</h3>
              <p className="text-[10px] text-[#8E98A8]">
                Tek dokunuşla bugünün personeline hazır kontrol rutinleri atayın
              </p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#D8FF4F] text-black shadow'
                  : 'bg-white/5 text-[#8E98A8] hover:text-white border border-white/5'
              }`}
            >
              {cat === 'ALL' ? 'Tüm Şablonlar' : cat}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="space-y-3 overflow-y-auto no-scrollbar pr-1 flex-1">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl glass-panel border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#D8FF4F]/10 text-[#D8FF4F] border border-[#D8FF4F]/20 font-semibold">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] text-[#8E98A8] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tpl.estimatedMinutes} dk
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  <p className="text-xs text-[#8E98A8] mt-0.5">{tpl.description}</p>
                </div>
              </div>

              {/* Checklist preview bullets */}
              <div className="my-2 p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Kontrol Maddeleri ({tpl.checklist.length}):
                </p>
                {tpl.checklist.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                    <Check className="w-3 h-3 text-[#D8FF4F]" />
                    <span className="truncate">{c.text}</span>
                  </div>
                ))}
                {tpl.checklist.length > 4 && (
                  <p className="text-[10px] text-[#8E98A8] italic">
                    +{tpl.checklist.length - 4} diğer kontrol maddesi
                  </p>
                )}
              </div>

              {/* 1-Touch Assign Button */}
              <button
                onClick={() => handleQuickAssign(tpl)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#D8FF4F]/15 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Bugünün {tpl.targetPosition} Personeline Ata</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
