import React, { useState, useRef } from 'react';
import { haptics } from '../../utils/haptics';

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  neonColor?: 'lime' | 'amber' | 'blue' | 'purple' | 'emerald' | 'coral';
  active?: boolean;
  tactile?: boolean;
  shine?: boolean;
  interactive?: boolean;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  neonColor = 'lime',
  active = false,
  tactile = true,
  shine = true,
  interactive = true,
  className = '',
  onClick,
  ...props
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [isSettled, setIsSettled] = useState(active);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getNeonColors = () => {
    switch (neonColor) {
      case 'amber':
        return {
          beam: 'via-amber-300',
          glow: 'rgba(251, 191, 36, 0.85)',
          glowSoft: 'rgba(251, 191, 36, 0.22)',
          borderStrong: 'rgba(251, 191, 36, 0.65)',
          settledBorder: 'rgba(251, 191, 36, 0.4)',
        };
      case 'blue':
        return {
          beam: 'via-sky-300',
          glow: 'rgba(56, 189, 248, 0.85)',
          glowSoft: 'rgba(56, 189, 248, 0.22)',
          borderStrong: 'rgba(56, 189, 248, 0.65)',
          settledBorder: 'rgba(56, 189, 248, 0.4)',
        };
      case 'coral':
        return {
          beam: 'via-rose-300',
          glow: 'rgba(251, 113, 133, 0.85)',
          glowSoft: 'rgba(251, 113, 133, 0.22)',
          borderStrong: 'rgba(251, 113, 133, 0.65)',
          settledBorder: 'rgba(251, 113, 133, 0.4)',
        };
      case 'emerald':
        return {
          beam: 'via-emerald-300',
          glow: 'rgba(52, 211, 153, 0.85)',
          glowSoft: 'rgba(52, 211, 153, 0.22)',
          borderStrong: 'rgba(52, 211, 153, 0.65)',
          settledBorder: 'rgba(52, 211, 153, 0.4)',
        };
      case 'purple':
        return {
          beam: 'via-purple-300',
          glow: 'rgba(192, 132, 252, 0.85)',
          glowSoft: 'rgba(192, 132, 252, 0.22)',
          borderStrong: 'rgba(192, 132, 252, 0.65)',
          settledBorder: 'rgba(192, 132, 252, 0.4)',
        };
      default: // lime
        return {
          beam: 'via-[#D8FF4F]',
          glow: 'rgba(216, 255, 79, 0.9)',
          glowSoft: 'rgba(216, 255, 79, 0.25)',
          borderStrong: 'rgba(216, 255, 79, 0.7)',
          settledBorder: 'rgba(216, 255, 79, 0.45)',
        };
    }
  };

  const colors = getNeonColors();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tactile || interactive) {
      haptics.tactileCardPress();
    } else {
      haptics.tap('light');
    }

    // Trigger neon sweep animation
    setIsSweeping(false);
    // double RAF to restart keyframe animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSweeping(true);
        setIsSettled(true);
      });
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsSweeping(false);
    }, 720);

    if (onClick) onClick(e);
  };

  return (
    <div
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      className={`relative rounded-2xl overflow-hidden transition-all select-none ${
        tactile ? 'card-3d-tactile' : ''
      } ${shine ? 'glossy-shine' : ''} ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        borderColor: isSettled || active ? colors.settledBorder : undefined,
      }}
      {...props}
    >
      {/* 3D Specular Top Rim Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10" />

      {/* Traveling Neon Laser Beam (İnce Neon Işık Soldan Sağa Süzülür) */}
      {isSweeping && (
        <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden pointer-events-none z-30">
          <div
            className={`absolute top-0 h-full w-28 sm:w-40 bg-gradient-to-r from-transparent via-white ${colors.beam} to-transparent animate-neon-beam`}
            style={{
              boxShadow: `0 0 10px ${colors.glow}, 0 0 20px ${colors.glow}`,
            }}
          />
        </div>
      )}

      {/* Settled Neon Frame (Soldan Sağa Gider ve İnce Çerçevede Parlayarak Durur) */}
      {(isSettled || active) && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none border-[1.5px] transition-all duration-300 z-20 animate-neon-lock"
          style={{
            borderColor: colors.borderStrong,
            boxShadow: `inset 0 0 10px ${colors.glowSoft}, 0 0 14px ${colors.glowSoft}`,
          }}
        />
      )}

      {/* Card Body */}
      <div className="relative z-[3] h-full flex flex-col">{children}</div>
    </div>
  );
};
