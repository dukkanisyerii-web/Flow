import React from 'react';
import { QuickAction, UserRole } from '../../types';
import { useAppStore, store } from '../../store/appStore';
import {
  AlertCircle,
  QrCode,
  PackageSearch,
  MessageSquare,
  HelpCircle,
  Coffee,
  Sparkles,
  Wrench,
  Plus,
  Sliders,
  Bell,
  Camera,
  Check,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { NeonCard } from '../common/NeonCard';

export const QuickActionDock: React.FC = () => {
  const { quickActions, currentUser } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  // Filter actions visible to current user's role
  const visibleActions = quickActions
    .filter((a) => a.enabled && a.visibleRoles.includes(currentUser.role))
    .sort((a, b) => a.order - b.order);

  const getFallbackImage = (action: QuickAction) => {
    if (action.imageUrl) return action.imageUrl;
    const n = action.name.toLowerCase();
    if (n.includes('yer') || n.includes('sil') || n.includes('mop') || n.includes('temiz')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('dolap') || n.includes('ısı') || n.includes('soğuk') || n.includes('derece')) {
      return 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('çöp') || n.includes('atık')) {
      return 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('arıza') || n.includes('cihaz') || n.includes('tamir') || n.includes('sorun')) {
      return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('buz') || n.includes('bar') || n.includes('stok')) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('mola') || n.includes('kahve') || n.includes('dinlen')) {
      return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('qr') || n.includes('tara') || n.includes('bölge')) {
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('takviye') || n.includes('yardım') || n.includes('acil')) {
      return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80';
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertCircle':
        return <AlertCircle className="w-4 h-4" />;
      case 'QrCode':
        return <QrCode className="w-4 h-4" />;
      case 'PackageSearch':
        return <PackageSearch className="w-4 h-4" />;
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4" />;
      case 'Camera':
        return <Camera className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColorClasses = (color: QuickAction['color']) => {
    switch (color) {
      case 'lime':
        return 'text-[#D8FF4F] bg-[#D8FF4F]/10 border-[#D8FF4F]/25 hover:bg-[#D8FF4F]/20 group-hover:border-[#D8FF4F]/50';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20 group-hover:border-amber-500/50';
      case 'coral':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20 group-hover:border-rose-500/50';
      case 'blue':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/25 hover:bg-sky-500/20 group-hover:border-sky-500/50';
      case 'purple':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20 group-hover:border-purple-500/50';
      case 'emerald':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 group-hover:border-emerald-500/50';
      default:
        return 'text-zinc-300 bg-white/5 border-white/10 hover:bg-white/10';
    }
  };

  const handleActionClick = (action: QuickAction) => {
    haptics.tap();

    switch (action.actionType) {
      case 'CREATE_ISSUE':
        store.openModal('report_issue', { prefillMessage: action.messageTemplate });
        break;
      case 'CREATE_STOCK_ALERT':
        store.openModal('low_stock');
        break;
      case 'SCAN_QR':
        store.openModal('scan_qr');
        break;
      case 'SEND_MESSAGE':
        store.setActiveTab('messages');
        break;
      case 'START_BREAK':
        store.toggleBreak(currentUser.id);
        break;
      case 'SEND_ALERT':
        // Fast broadcast alert with global notification
        store.sendMessage('general', `⚠️ [Acil Destek Talebi]: ${action.messageTemplate || 'Destek isteniyor!'}`);
        store.dispatchNotification({
          type: 'issue_reported',
          title: '🚨 Acil Yardım Çağrısı',
          message: `${currentUser.name}: ${action.messageTemplate || 'Acil destek talebi iletildi!'}`,
          priority: 'urgent',
        });
        break;
      case 'OPEN_CAMERA':
        store.openModal('camera_live');
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-[#8E98A8] uppercase tracking-wider">
          Hızlı Aksiyonlar (Quick Actions)
        </h3>

        {isManager && (
          <button
            onClick={() => store.openModal('button_builder')}
            className="flex items-center gap-1 text-[11px] font-medium text-[#D8FF4F] hover:underline cursor-pointer min-h-[36px]"
          >
            <Sliders className="w-3 h-3" />
            <span>Özelleştir</span>
          </button>
        )}
      </div>

      {/* Grid of quick action buttons - 2 cols on small mobile, 4 cols on larger */}
      <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-2.5">
        {visibleActions.map((action) => {
          const bgImg = getFallbackImage(action);
          return (
            <NeonCard
              key={action.id}
              id={`qa-btn-${action.id}`}
              neonColor={action.color}
              tactile={true}
              shine={true}
              interactive={true}
              onClick={() => handleActionClick(action)}
              className="group relative h-24 sm:h-28 border border-white/[0.12] bg-[#0A0E17]"
            >
              {/* Background Photographic Image with 3D Depth Zoom on Hover */}
              <img
                src={bgImg}
                alt={action.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300 pointer-events-none"
              />

              {/* Dark Gradient Overlay for optimal legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A]/95 via-[#070A0F]/70 to-[#0A0E17]/40 group-hover:via-[#070A0F]/55 transition-colors pointer-events-none" />

              {/* Content layout inside card */}
              <div className="relative z-10 h-full p-2.5 flex flex-col justify-between items-start text-left">
                {/* Top Badge with Icon */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border shadow-md transition-transform group-hover:scale-110 ${getColorClasses(
                      action.color
                    )}`}
                  >
                    {getIcon(action.icon)}
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#D8FF4F] transition-colors" />
                </div>

                {/* Bottom Label with clean contrast */}
                <div className="w-full">
                  <span className="block text-[11px] sm:text-xs font-bold text-white group-hover:text-[#D8FF4F] transition-colors leading-tight line-clamp-2 drop-shadow-sm">
                    {action.name}
                  </span>
                </div>
              </div>
            </NeonCard>
          );
        })}

        {/* Manager Add More Quick Button Shortcut */}
        {isManager && (
          <NeonCard
            neonColor="lime"
            tactile={true}
            shine={true}
            interactive={true}
            onClick={() => store.openModal('button_builder')}
            className="group relative h-24 sm:h-28 border border-dashed border-white/20 hover:border-[#D8FF4F]/50 bg-white/[0.02] hover:bg-white/[0.05]"
          >
            <div className="h-full p-2.5 flex flex-col items-center justify-center text-center gap-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-dashed border-white/20 group-hover:border-[#D8FF4F]/50 text-[#8E98A8] group-hover:text-[#D8FF4F] transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-[#8E98A8] group-hover:text-[#D8FF4F] transition-colors">
                + Buton Ekle
              </span>
            </div>
          </NeonCard>
        )}
      </div>
    </div>
  );
};
