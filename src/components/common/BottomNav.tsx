import React from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  Home,
  CheckSquare,
  MessageSquare,
  User as UserIcon,
  LayoutDashboard,
  Users,
  Plus,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const BottomNav: React.FC = () => {
  const { currentUser, activeTab, tasks, messages, announcements } = useAppStore();
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  // Count unread messages & pending tasks
  const pendingTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      (isManager ? true : t.assignedTo.includes(currentUser.id) || t.assignedToRole === currentUser.position)
  ).length;

  const waitingApprovalTasks = tasks.filter((t) => t.status === 'waiting_approval').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090D]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 sm:px-3 py-1.5 max-w-lg mx-auto transition-all pb-safe">
      <div className="flex items-center justify-around relative">
        {isManager ? (
          // Manager Navigation
          <>
            <button
              id="nav-manager-overview"
              onClick={() => {
                store.setActiveTab('overview');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'overview' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <div className="relative">
                <LayoutDashboard className="w-5 h-5" />
                {waitingApprovalTasks > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#07090D]" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Dükkan</span>
            </button>

            <button
              id="nav-manager-tasks"
              onClick={() => {
                store.setActiveTab('tasks');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'tasks' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <div className="relative">
                <CheckSquare className="w-5 h-5" />
                {pendingTasks > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[#D8FF4F] text-black text-[9px] font-bold font-mono">
                    {pendingTasks}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">İşler</span>
            </button>

            {/* Central Floating Quick Add Button */}
            <div className="relative -top-3">
              <button
                id="nav-central-action-btn"
                onClick={() => {
                  haptics.buttonClick('heavy');
                  store.openModal('create_task');
                }}
                className="w-12 h-12 rounded-full bg-[#D8FF4F] text-[#07090D] flex items-center justify-center shadow-lg shadow-[#D8FF4F]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Yeni İş Yaz (+)"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            <button
              id="nav-manager-team"
              onClick={() => {
                store.setActiveTab('team');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'team' || activeTab === 'schedule' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Elemanlar</span>
            </button>

            <button
              id="nav-manager-messages"
              onClick={() => {
                store.setActiveTab('messages');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'messages' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Mesajlar</span>
            </button>
          </>
        ) : (
          // Employee Navigation
          <>
            <button
              id="nav-employee-home"
              onClick={() => {
                store.setActiveTab('home');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'home' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">İş Başı</span>
            </button>

            <button
              id="nav-employee-tasks"
              onClick={() => {
                store.setActiveTab('tasks');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'tasks' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <div className="relative">
                <CheckSquare className="w-5 h-5" />
                {pendingTasks > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-[#D8FF4F] text-black text-[9px] font-bold font-mono">
                    {pendingTasks}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Yapılacaklar</span>
            </button>

            {/* Central Floating Action: Quick Report Issue / Camera */}
            <div className="relative -top-3">
              <button
                id="nav-central-issue-btn"
                onClick={() => {
                  haptics.buttonClick('heavy');
                  store.openModal('report_issue');
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D8FF4F] to-[#E4FF80] text-[#07090D] flex items-center justify-center shadow-lg shadow-[#D8FF4F]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Arıza / Aksilik Bildir (+)"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            <button
              id="nav-employee-messages"
              onClick={() => {
                store.setActiveTab('messages');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'messages' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Mesajlar</span>
            </button>

            <button
              id="nav-employee-profile"
              onClick={() => {
                store.setActiveTab('profile');
              }}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[46px] py-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                activeTab === 'profile' ? 'text-[#D8FF4F]' : 'text-[#8E98A8] hover:text-white'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Hesabım</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
