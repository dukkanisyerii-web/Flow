import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { TaskCard } from '../tasks/TaskCard';
import { TaskStatus, TaskPriority } from '../../types';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const TasksListView: React.FC = () => {
  const { tasks, zones, currentUser } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine' | 'in_progress' | 'waiting_approval' | 'completed' | 'urgent'>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Zone filter
    if (selectedZoneId !== 'all' && t.zoneId !== selectedZoneId) {
      return false;
    }

    // Filter chip
    if (selectedFilter === 'mine') {
      return (
        t.assignedTo.includes(currentUser.id) ||
        t.assignedToRole === currentUser.position
      );
    }
    if (selectedFilter === 'in_progress') return t.status === 'in_progress';
    if (selectedFilter === 'waiting_approval') return t.status === 'waiting_approval';
    if (selectedFilter === 'completed') return t.status === 'completed';
    if (selectedFilter === 'urgent') return t.priority === 'urgent';

    return true;
  });

  const filterPills = [
    { id: 'all', label: 'Hepsi' },
    { id: 'mine', label: 'Benim İşlerim' },
    { id: 'in_progress', label: 'Yapılıyor' },
    { id: 'waiting_approval', label: 'Onay Bekleyen' },
    { id: 'urgent', label: 'Acil Olanlar' },
    { id: 'completed', label: 'Bitenler' },
  ];

  return (
    <div className="space-y-4 pb-24 pt-2 animate-in fade-in duration-150">
      {/* Top Header Title & Actions */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Dükkan İşleri</h2>
          <p className="text-xs text-[#8E98A8]">
            {filteredTasks.length} iş kayıtlı
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <button
              onClick={() => store.openModal('template_assign')}
              className="p-2 rounded-xl glass-panel border border-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Hazır İş Şablonları"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="hidden xs:inline">Hazır İşler</span>
            </button>
          )}

          <button
            onClick={() => store.openModal('create_task')}
            className="py-2 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#D8FF4F]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Yeni İş Yaz</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İş adı ara (örn: masa, çöp, ızgara, temizlik)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
        />
      </div>

      {/* Filter Tabs Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => {
              haptics.tap();
              setSelectedFilter(pill.id as any);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === pill.id
                ? 'bg-[#D8FF4F] text-black shadow'
                : 'bg-white/5 text-[#8E98A8] hover:text-white border border-white/5'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Zone selection dropdown filter */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-[#8E98A8] font-medium flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#D8FF4F]" />
          Dükkan Bölümü:
        </span>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-[#0D1016] border border-white/15 text-xs text-white focus:outline-none focus:border-[#D8FF4F]"
        >
          <option value="all">Tüm Dükkan</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const zone = zones.find((z) => z.id === task.zoneId);
            return <TaskCard key={task.id} task={task} zone={zone} />;
          })
        ) : (
          <div className="p-8 rounded-2xl glass-panel border border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 flex items-center justify-center text-[#D8FF4F] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Şu An Bekleyen İş Yok</p>
              <p className="text-xs text-[#8E98A8] max-w-xs mx-auto mt-1">
                Dükkanda yapılacak bir iş olduğunda yukarıdaki <strong>+ Yeni İş Yaz</strong> butonuna basarak elemanlara anında görev verebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
