import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../../store/appStore';
import { QrCode, X, Printer, Download, MapPin, Check, Copy, Sparkles, ExternalLink } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import QRCode from 'qrcode';

export const QrZoneViewerModal: React.FC = () => {
  const { activeModal, zones } = useAppStore();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrUrls, setAllQrUrls] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  // Generate QR data URLs for zones
  useEffect(() => {
    if (activeModal !== 'qr_zone_viewer') return;

    async function generateCodes() {
      const urls: Record<string, string> = {};
      for (const z of zones) {
        try {
          const dataUrl = await QRCode.toDataURL(z.code, {
            width: 320,
            margin: 2,
            color: {
              dark: '#07090D',
              light: '#FFFFFF',
            },
          });
          urls[z.id] = dataUrl;
        } catch (err) {
          console.error('QR generation error for zone', z.code, err);
        }
      }
      setAllQrUrls(urls);
      if (selectedZone) {
        setQrDataUrl(urls[selectedZone.id] || '');
      }
    }

    generateCodes();
  }, [activeModal, zones, selectedZone]);

  useEffect(() => {
    if (selectedZone && allQrUrls[selectedZone.id]) {
      setQrDataUrl(allQrUrls[selectedZone.id]);
    }
  }, [selectedZoneId, allQrUrls, selectedZone]);

  if (activeModal !== 'qr_zone_viewer') return null;

  const handleCopy = (code: string) => {
    haptics.tap();
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrint = () => {
    haptics.buttonClick('heavy');
    window.print();
  };

  const handleDownloadSingle = () => {
    if (!qrDataUrl || !selectedZone) return;
    haptics.tap();
    const link = document.createElement('a');
    link.download = `cetem-qr-${selectedZone.code.toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel-elevated border border-white/20 p-5 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D8FF4F]/20 text-[#D8FF4F] border border-[#D8FF4F]/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Yazdırılabilir Alan QR Rozetleri</h3>
              <p className="text-[10px] text-[#8E98A8]">
                Restoran duvarlarına asılmak üzere resmi kontrol noktaları
              </p>
            </div>
          </div>
          <button
            onClick={() => store.closeModal()}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                haptics.tap();
                setSelectedZoneId(z.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedZone?.id === z.id
                  ? 'bg-[#D8FF4F] text-black border-[#D8FF4F] font-bold shadow-md shadow-[#D8FF4F]/20'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>

        {/* Official Printable Badge Card */}
        {selectedZone && (
          <div className="p-4 rounded-2xl bg-white text-zinc-900 border-2 border-[#D8FF4F] flex flex-col items-center shadow-2xl text-center my-1 relative print:border-black">
            <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-200 text-left">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">
                  CETEM FLOW · KONTROL NOKTASI
                </span>
                <h4 className="text-base font-black text-black leading-tight">
                  {selectedZone.name}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-black text-[#D8FF4F] font-mono text-xs font-bold">
                {selectedZone.code}
              </span>
            </div>

            {/* Generated QR Code */}
            <div className="p-3 my-2 bg-white rounded-xl shadow-sm flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${selectedZone.name}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-400 text-xs">
                  QR Oluşturuluyor...
                </div>
              )}
            </div>

            <p className="text-[11px] font-medium text-zinc-600 max-w-xs">
              Personel görev başlangıcında veya hijyen kontrolünde bu karekodu CETEM Flow kamerasıyla
              okutmalıdır.
            </p>

            <div className="w-full pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Güvenlik Doğrulamalı</span>
              <span>v2.4 Operasyon Standardı</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handleDownloadSingle}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D8FF4F]" />
            <span>PNG İndir</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-[#D8FF4F] hover:bg-[#c9f53e] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#D8FF4F]/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır (Print A4)</span>
          </button>
        </div>

        {/* Quick Copy Code Button */}
        <button
          onClick={() => selectedZone && handleCopy(selectedZone.code)}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-zinc-300 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
        >
          {copiedCode === selectedZone?.code ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Kod Kopyalandı: {selectedZone?.code}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#D8FF4F]" />
              <span>Kodu Kopyala ({selectedZone?.code})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
