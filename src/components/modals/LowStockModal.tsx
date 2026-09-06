import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { PackageSearch, X, Send, AlertTriangle, Coffee, Package, Sparkles } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const LowStockModal: React.FC = () => {
  const { activeModal, currentUser } = useAppStore();
  const [selectedItem, setSelectedItem] = useState('Coffee');
  const [remainingLevel, setRemainingLevel] = useState<'low' | 'critical' | 'out'>('critical');
  const [customItem, setCustomItem] = useState('');

  if (activeModal !== 'low_stock') return null;

  const stockItems = [
    { id: 'Coffee', label: 'Espresso Kahve Çekirdeği', icon: '☕' },
    { id: 'Milk', label: 'Barista Sütü / Yulaf Sütü', icon: '🥛' },
    { id: 'Napkin', label: 'Peçete & Dispenser Havlu', icon: '🧻' },
    { id: 'Straw', label: 'Pipet & Takeaway Bardaklar', icon: '🥤' },
    { id: 'Glass', label: 'Masa Bardağı / Fincan', icon: '🍸' },
    { id: 'Cleaning', label: 'Yüzey Dezenfektanı / Deterjan', icon: '🧴' },
    { id: 'Other', label: 'Diğer Malzeme...', icon: '📦' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.success();

    const itemName = selectedItem === 'Other' ? customItem || 'Özel Malzeme' : stockItems.find(i => i.id === selectedItem)?.label || selectedItem;
    const levelText = remainingLevel === 'out' ? 'TÜKENDİ (Out of Stock)' : remainingLevel === 'critical' ? 'Kritik Düzeyde' : 'Azaldı (Low)';

    store.reportIssue({
      title: `[Stok Uyarısı]: ${itemName} ${levelText}`,
      description: `${currentUser.name} tarafından ${levelText} olarak bildirildi. Acil tedarik / depodan aktarım gerekiyor.`,
      category: 'Stock',
      urgency: remainingLevel === 'out' ? 'critical' : remainingLevel === 'critical' ? 'high' : 'medium',
    });

    store.sendMessage('general', `📦 [Stok Uyarısı]: ${itemName} seviyesi: ${levelText}!`);
    store.closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <PackageSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Hızlı Stok Bildirimi</h3>
              <p className="text-[10px] text-[#8E98A8]">Tükenen malzemeyi 2 saniyede bildirin</p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Item Grid */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1.5">
              Malzeme Seçimi
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {stockItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item.id)}
                  className={`p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                    selectedItem === item.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-white font-semibold'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedItem === 'Other' && (
            <div>
              <input
                type="text"
                required
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                placeholder="Malzeme adını girin..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Remaining level */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E98A8] uppercase tracking-wider block mb-1.5">
              Kalan Miktar Durumu
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRemainingLevel('low')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                  remainingLevel === 'low'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                Azaldı (Low)
              </button>
              <button
                type="button"
                onClick={() => setRemainingLevel('critical')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                  remainingLevel === 'critical'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                Kritik ⚠️
              </button>
              <button
                type="button"
                onClick={() => setRemainingLevel('out')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                  remainingLevel === 'out'
                    ? 'bg-red-600/30 border-red-500 text-red-200'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                Bitti (Out)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Müdüre Bildirim Gönder</span>
          </button>
        </form>
      </div>
    </div>
  );
};
