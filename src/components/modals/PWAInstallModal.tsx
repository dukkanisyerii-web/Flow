import React, { useState } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { usePWAInstall } from '../../utils/usePWAInstall';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  ShieldCheck,
  Zap,
  WifiOff,
  Bell,
  X,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const PWAInstallModal: React.FC = () => {
  const { activeModal } = useAppStore();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (activeModal !== 'pwa_install') return null;

  const handleClose = () => {
    haptics.tap();
    store.closeModal();
  };

  const handleInstallClick = async () => {
    haptics.tap();
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      setInstalledSuccess(true);
      haptics.success();
    }
  };

  return (
    <div
      id="pwa-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-md bg-[#0E121B] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#090C12]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D8FF4F]/10 border border-[#D8FF4F]/20 flex items-center justify-center text-[#D8FF4F]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Mobil Uygulama (APK / PWA)
              </h3>
              <p className="text-xs text-[#8F9CAE]">
                Restoran personeli ve şefler için doğrudan kurulum
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* App preview badge */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B2230] to-[#0A0D13] border border-white/20 p-1 flex items-center justify-center shadow-lg">
              <img
                src="/icon.svg"
                alt="CETEM Flow"
                className="w-10 h-10 object-contain rounded-xl"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">CETEM Flow Ops</h4>
              <p className="text-xs text-[#8F9CAE]">Sürüm 2.4.0 • Restoran İşletim Sistemi</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Android & iOS Uyumlu
                </span>
              </div>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Zap className="w-4 h-4 text-[#D8FF4F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">Tam Ekran (APK Hissi)</strong>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Tarayıcı çubuğu olmadan tam ekran deneyim.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Bell className="w-4 h-4 text-[#D8FF4F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">Anlık Sesli Uyarılar</strong>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Görev ve acil durum bildirimleri kilit ekranına gelir.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">Çevrimdışı Çalışma</strong>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Mutfakta Wi-Fi kopsa bile görevler kaydedilir.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D8FF4F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-[11px]">Sıfır Alan Kaplar</strong>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Telefon belleğini doldurmaz, hızlıca güncellenir.
                </span>
              </div>
            </div>
          </div>

          {/* Installation Method / Instructions */}
          {installedSuccess || isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">
                Uygulama Zaten Cihazınıza Yüklü!
              </h4>
              <p className="text-xs text-zinc-300">
                Ana ekranınızdan CETEM Flow simgesine dokunarak tam ekran kullanabilirsiniz.
              </p>
            </div>
          ) : isIOS ? (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span>iPhone / iPad Kurulum Adımları:</span>
              </div>
              <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    1
                  </span>
                  <span>
                    Safari&apos;nin altındaki <strong className="text-white">Paylaş</strong> (
                    <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" />) simgesine dokunun.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    2
                  </span>
                  <span>
                    Listeyi aşağı kaydırıp <strong className="text-white">&quot;Ana Ekrana Ekle&quot;</strong> (
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#D8FF4F]" />) seçeneğine
                    basın.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    3
                  </span>
                  <span>
                    Sağ üstteki <strong className="text-white">&quot;Ekle&quot;</strong> butonuna
                    dokunun. Uygulama ana ekranınıza gelecektir.
                  </span>
                </li>
              </ol>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D8FF4F] hover:bg-[#cbf738] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(216,255,79,0.3)] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? 'Yükleniyor...' : 'Telefona Kur (WebAPK / PWA)'}</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-center">
              <Smartphone className="w-6 h-6 text-[#D8FF4F] mx-auto mb-1" />
              <h4 className="text-xs font-bold text-white">Android / Chrome Kurulumu:</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chrome menüsünden (sağ üstteki 3 nokta <strong className="text-white">⋮</strong>)
                &apos;<strong className="text-white">Uygulamayı Yükle</strong>&apos; veya &apos;
                <strong className="text-white">Ana Ekrana Ekle</strong>&apos; butonuna dokunun.
                Uygulama otomatik olarak yerel bir APK gibi kurulacaktır.
              </p>
            </div>
          )}

          {/* GitHub'a Aktarma & Standalone APK (.apk) Çıkarma Rehberi */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#D8FF4F]" />
                GitHub &amp; Standalone APK (.apk)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-400 font-mono">
                Rehber
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              <strong>1. GitHub&apos;a Aktarma:</strong> AI Studio arayüzünün sağ üst köşesindeki ayarlar menüsünden <code className="text-[#D8FF4F] bg-black/40 px-1 py-0.5 rounded">Export to GitHub</code> seçeneğini kullanarak projeyi tek tıkla kendi deponuza aktarabilirsiniz.
            </p>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              <strong>2. Doğrudan APK Çıkarma:</strong> <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-[#D8FF4F] underline font-semibold">PWABuilder.com</a> adresine uygulamanın canlı URL&apos;sini girerek 1 dakikada imzalı Google Play / Android <code className="text-emerald-400">.apk</code> dosyasını indirebilirsiniz.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
