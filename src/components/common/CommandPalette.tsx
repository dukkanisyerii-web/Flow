import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Search,
  X,
  CheckSquare,
  Users,
  MapPin,
  AlertCircle,
  BookOpen,
  Plus,
  Sliders,
  Sparkles,
  ArrowRight,
  Coffee,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    tasks,
    users,
    zones,
    issues,
    templates,
  } = useAppStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        store.setCommandPalette(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        store.setCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search filtered items
  const matchedTasks = tasks.filter(
    (t) =>
      !cleanQuery ||
      t.title.toLowerCase().includes(cleanQuery) ||
      t.description.toLowerCase().includes(cleanQuery)
  );

  const matchedUsers = users.filter(
    (u) =>
      !cleanQuery ||
      u.name.toLowerCase().includes(cleanQuery) ||
      u.code.toLowerCase().includes(cleanQuery) ||
      u.position.toLowerCase().includes(cleanQuery)
  );

  const matchedZones = zones.filter(
    (z) =>
      !cleanQuery ||
      z.name.toLowerCase().includes(cleanQuery) ||
      z.code.toLowerCase().includes(cleanQuery)
  );

  const matchedIssues = issues.filter(
    (i) =>
      !cleanQuery ||
      i.title.toLowerCase().includes(cleanQuery) ||
      i.category.toLowerCase().includes(cleanQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl glass-panel-elevated border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-[#07090D]/80">
          <Search className="w-5 h-5 text-[#D8FF4F]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Arayın: Deniz, Veranda, WC, Görev ata, Kahve makinesi..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            ESC
          </span>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {/* Quick Actions Shortcuts */}
          <div>
            <p className="text-[10px] font-bold text-[#8E98A8] uppercase tracking-wider px-2 mb-1.5">
              Hızlı Komutlar
            </p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  store.setCommandPalette(false);
                  store.openModal('create_task');
                }}
                className="w-full p-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-xs text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#D8FF4F]/15 text-[#D8FF4F]">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-white group-hover:text-[#D8FF4F]">
                    + Yeni Görev Oluştur
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
              </button>

              <button
                onClick={() => {
                  store.setCommandPalette(false);
                  store.openModal('template_assign');
                }}
                className="w-full p-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-xs text-left group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-white group-hover:text-[#D8FF4F]">
                    Hazır Görev Şablonu Ata (Açılış/Kapanış)
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8E98A8] uppercase tracking-wider px-2 mb-1.5">
                Görevler ({matchedTasks.length})
              </p>
              <div className="space-y-1">
                {matchedTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      store.setCommandPalette(false);
                      store.setSelectedTaskId(t.id);
                    }}
                    className="w-full p-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-xs text-left group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-3.5 h-3.5 text-[#D8FF4F] shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-white truncate group-hover:text-[#D8FF4F]">
                          {t.title}
                        </p>
                        <p className="text-[10px] text-[#8E98A8] font-mono">
                          Due {t.deadline} · {t.status}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                      Görüntüle
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Personnel */}
          {matchedUsers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8E98A8] uppercase tracking-wider px-2 mb-1.5">
                Personel ({matchedUsers.length})
              </p>
              <div className="space-y-1">
                {matchedUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      store.switchUser(u.id);
                      store.setCommandPalette(false);
                    }}
                    className="w-full p-2 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-xs text-left group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white group-hover:text-[#D8FF4F]">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-[#8E98A8]">
                          {u.position} · <span className="font-mono text-[#D8FF4F]">{u.code}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">Profiline Geç</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Zones */}
          {matchedZones.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8E98A8] uppercase tracking-wider px-2 mb-1.5">
                Restoran Alanları ({matchedZones.length})
              </p>
              <div className="space-y-1">
                {matchedZones.map((z) => (
                  <div
                    key={z.id}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#D8FF4F]" />
                      <span className="font-semibold text-white">{z.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400">{z.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
