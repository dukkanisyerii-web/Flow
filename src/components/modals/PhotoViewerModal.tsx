import React from 'react';
import { useAppStore, store } from '../../store/appStore';
import { X, Clock, MapPin, Maximize2, Check, Download } from 'lucide-react';

export const PhotoViewerModal: React.FC = () => {
  const { activeModal, selectedPhotoProof } = useAppStore();

  if (activeModal !== 'photo_viewer' || !selectedPhotoProof) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden glass-panel-elevated border border-white/20 shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between p-3.5 bg-[#07090D]/90 border-b border-white/10 text-white z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#D8FF4F] font-bold px-2 py-0.5 rounded bg-[#D8FF4F]/10 border border-[#D8FF4F]/30">
              DOĞRULANMIŞ CANLI KANIT (LIVE PROOF)
            </span>
            <span className="text-xs text-zinc-300 font-mono">{selectedPhotoProof.timestamp}</span>
          </div>

          <button
            onClick={() => store.closePhotoViewer()}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Display */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={selectedPhotoProof.url}
            alt="Proof high-res"
            className="max-h-[70vh] w-auto object-contain"
          />

          {/* Persistent Stamp Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#D8FF4F]/40 text-xs font-mono text-[#D8FF4F] shadow-xl">
            {selectedPhotoProof.overlayText}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#07090D]/90 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D8FF4F]" />
            <span>Konum: {selectedPhotoProof.locationName}</span>
          </div>

          <button
            onClick={() => store.closePhotoViewer()}
            className="px-3 py-1 rounded-lg bg-[#D8FF4F] text-black font-semibold hover:bg-[#c9f53e] transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
