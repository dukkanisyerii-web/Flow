import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import {
  MessageSquare,
  Send,
  Megaphone,
  Pin,
  Clock,
  Sparkles,
  Users,
  CheckCheck,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const MessagesView: React.FC = () => {
  const { messages, announcements, currentUser } = useAppStore();
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [messageText, setMessageText] = useState('');
  const [isAnnouncementModal, setIsAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  const channels = [
    { id: 'general', name: 'Genel Operasyon' },
    { id: 'service', name: 'Servis & Bar' },
    { id: 'kitchen', name: 'Mutfak Ekibi' },
    { id: 'handover', name: 'Vardiya Devir (Handover)' },
  ];

  const filteredMessages = messages.filter((m) => m.channelId === selectedChannel);
  const activeAnnouncement = announcements[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    store.sendMessage(selectedChannel, messageText.trim());
    setMessageText('');
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    store.createAnnouncement(announcementTitle.trim(), announcementContent.trim());
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setIsAnnouncementModal(false);
  };

  return (
    <div className="space-y-4 pb-24 pt-2 animate-in fade-in duration-150">
      {/* Header with Broadcast Action */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Ekip İletişim & Anons</h2>
          <p className="text-xs text-[#8E98A8]">Operasyonel anlık mesajlaşma ve duyurular</p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsAnnouncementModal(true)}
            className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Megaphone className="w-4 h-4" />
            <span>Yeni Anons</span>
          </button>
        )}
      </div>

      {/* Pinned Broadcast Banner */}
      {activeAnnouncement && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#0D1016] to-rose-500/10 border border-amber-500/30 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
              SABİTLENMİŞ DUYURU: {activeAnnouncement.title}
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              {activeAnnouncement.createdAt}
            </span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">
            {activeAnnouncement.content}
          </p>
        </div>
      )}

      {/* Channel Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => {
              haptics.tap();
              setSelectedChannel(ch.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedChannel === ch.id
                ? 'bg-[#D8FF4F] text-black shadow'
                : 'bg-white/5 text-[#8E98A8] hover:text-white border border-white/5'
            }`}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="rounded-2xl glass-panel border border-white/10 p-3 h-[52vh] flex flex-col justify-between">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[#D8FF4F] text-[#07090D] font-medium rounded-tr-sm'
                      : 'bg-white/[0.06] text-zinc-200 border border-white/10 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Composer */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`${channels.find((c) => c.id === selectedChannel)?.name} kanalına yaz...`}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D8FF4F]"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Broadcast Modal */}
      {isAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel-elevated border border-white/20 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Yeni Restoran Duyurusu</h3>
            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Duyuru Başlığı (Ör: Akşam Yağmur Uyarısı)"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <textarea
                rows={3}
                required
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Duyuru içeriği ve personele talimatlar..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-zinc-300"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Tüm Ekibe Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
