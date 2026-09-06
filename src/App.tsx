import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, store } from './store/appStore';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { CommandPalette } from './components/common/CommandPalette';
import { EmployeeHomeView } from './components/views/EmployeeHomeView';
import { ManagerDashboardView } from './components/views/ManagerDashboardView';
import { TasksListView } from './components/views/TasksListView';
import { TeamView } from './components/views/TeamView';
import { MessagesView } from './components/views/MessagesView';
import { ProfileView } from './components/views/ProfileView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { CameraModal } from './components/modals/CameraModal';
import { QrScannerModal } from './components/modals/QrScannerModal';
import { QrZoneViewerModal } from './components/modals/QrZoneViewerModal';
import { ReportIssueModal } from './components/modals/ReportIssueModal';
import { LowStockModal } from './components/modals/LowStockModal';
import { QuickActionBuilderModal } from './components/modals/QuickActionBuilderModal';
import { TemplateAssignModal } from './components/modals/TemplateAssignModal';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { PhotoViewerModal } from './components/modals/PhotoViewerModal';
import { OfflineQueueModal } from './components/modals/OfflineQueueModal';
import { AddEmployeeModal } from './components/modals/AddEmployeeModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { PWAInstallModal } from './components/modals/PWAInstallModal';
import { ShiftScheduleModal } from './components/schedule/ShiftScheduleModal';
import { ShiftScheduleView } from './components/schedule/ShiftScheduleView';
import { NotificationToast } from './components/common/NotificationToast';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const { currentUser, activeTab, selectedTaskId, isAuthenticated } = useAppStore();

  // If user is not authenticated, show modern restaurant login portal
  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <NotificationToast />
      </>
    );
  }

  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  // Render appropriate view based on tab and role
  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <ManagerDashboardView />;
      case 'home':
        return <EmployeeHomeView />;
      case 'tasks':
        return <TasksListView />;
      case 'team':
        return <TeamView />;
      case 'schedule':
        return <ShiftScheduleView />;
      case 'messages':
        return <MessagesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return isManager ? <ManagerDashboardView /> : <EmployeeHomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F3F4F6] flex justify-center selection:bg-[#D8FF4F] selection:text-black">
      {/* Global Notification Toast */}
      <NotificationToast />

      {/* Mobile-constrained app frame with obsidian glow */}
      <div className="w-full max-w-lg min-h-screen bg-[#07090D] border-x border-white/[0.06] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Top Header */}
        <Header />

        {/* Global Offline / Sync Status Ribbon */}
        <OfflineStatusBanner />

        {/* Main View Body */}
        <main className="flex-1 px-3 sm:px-4 py-2 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Modals & Dialog Overlays */}
        {selectedTaskId && (
          <TaskDetailModal
            taskId={selectedTaskId}
            onClose={() => store.setSelectedTaskId(null)}
          />
        )}

        <CameraModal />
        <QrScannerModal />
        <QrZoneViewerModal />
        <ReportIssueModal />
        <LowStockModal />
        <QuickActionBuilderModal />
        <TemplateAssignModal />
        <CreateTaskModal />
        <PhotoViewerModal />
        <OfflineQueueModal />
        <AddEmployeeModal />
        <ShiftScheduleModal />
        <NotificationCenterModal />
        <PWAInstallModal />
        <CommandPalette />
      </div>
    </div>
  );
}
