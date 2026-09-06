import React, { useEffect, useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  Coffee,
  Clock,
  Megaphone,
  UserCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const NotificationToast: React.FC = () => {
  const { activeToast } = useAppStore();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!activeToast) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const DURATION = 4500;
    const intervalTime = 50;
    const step = (intervalTime / DURATION) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          store.dismissToast();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeToast]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'task_waiting_approval':
        return <Camera className="w-4 h-4 text-amber-300" />;
      case 'task_approved':
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-300" />;
      case 'task_returned':
        return <RotateCcw className="w-4 h-4 text-rose-300" />;
      case 'issue_reported':
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'shift_break':
        return <Coffee className="w-4 h-4 text-amber-200" />;
      case 'shift_clock_in':
        return <Clock className="w-4 h-4 text-sky-300" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-[#D8FF4F]" />;
      case 'employee_registered':
        return <UserCheck className="w-4 h-4 text-purple-300" />;
      case 'system_sync':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-[#D8FF4F]" />;
    }
  };

  const getBorderAndBg = () => {
    switch (activeToast.priority) {
      case 'urgent':
        return 'border-rose-500/50 bg-[#12080A]/95 shadow-[0_12px_32px_rgba(244,63,94,0.25)]';
      case 'important':
        return 'border-amber-500/40 bg-[#141006]/95 shadow-[0_12px_32px_rgba(245,158,11,0.2)]';
      default:
        return 'border-[#D8FF4F]/30 bg-[#0A0E14]/95 shadow-[0_12px_32px_rgba(0,0,0,0.6)]';
    }
  };

  const handleClick = () => {
    haptics.tap();
    if (activeToast.relatedTaskId) {
      store.setSelectedTaskId(activeToast.relatedTaskId);
      store.setActiveTab('tasks');
    } else if (activeToast.relatedIssueId) {
      store.setActiveTab('overview');
    } else {
      store.openModal('notifications');
    }
    store.dismissToast();
  };

  return (
    <div
      id="global-notification-toast"
      className={`fixed top-3.5 sm:top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md rounded-2xl border backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 overflow-hidden ${getBorderAndBg()}`}
      role="alert"
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Glowing circular icon */}
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">
              {activeToast.title}
            </h4>
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
              {activeToast.timeFormatted}
            </span>
          </div>
          <p className="text-[11px] text-[#A2ACB9] line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-center">
          {(activeToast.relatedTaskId || activeToast.relatedIssueId) && (
            <button
              onClick={handleClick}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#D8FF4F] transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              haptics.tap();
              store.dismissToast();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Countdown progress bar */}
      <div className="w-full h-1 bg-white/5 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ${
            activeToast.priority === 'urgent'
              ? 'bg-rose-500'
              : activeToast.priority === 'important'
              ? 'bg-amber-400'
              : 'bg-[#D8FF4F]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
