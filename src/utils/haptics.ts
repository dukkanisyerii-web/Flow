// Advanced Tactile Haptics Engine combining Navigator.vibrate API and Web Audio API
// Designed specifically for 3D tactile feel, button clicks, modal transitions, and task completions

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'selection';

class TactileHaptics {
  private ctx: AudioContext | null = null;
  private vibrationEnabled: boolean = true;
  private audioEnabled: boolean = true;

  constructor() {
    // Restore preference from localStorage if present
    if (typeof window !== 'undefined') {
      try {
        const storedVib = localStorage.getItem('cetem_vibration_enabled');
        if (storedVib !== null) {
          this.vibrationEnabled = storedVib === 'true';
        }
        const storedAud = localStorage.getItem('cetem_audio_haptics_enabled');
        if (storedAud !== null) {
          this.audioEnabled = storedAud === 'true';
        }
      } catch {
        // Ignore localStorage restrictions in sandbox
      }
    }
  }

  // Check if Navigator.vibrate API is supported on the user's current device/browser
  isVibrationSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    );
  }

  getVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    try {
      localStorage.setItem('cetem_vibration_enabled', String(enabled));
    } catch {
      // Ignore
    }
  }

  getAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
    try {
      localStorage.setItem('cetem_audio_haptics_enabled', String(enabled));
    } catch {
      // Ignore
    }
  }

  // Safe wrapper for Navigator.vibrate API
  vibrate(pattern: number | number[]): boolean {
    if (!this.vibrationEnabled) return false;
    try {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        return navigator.vibrate?.(pattern) ?? false;
      }
    } catch {
      // Gracefully catch security/interaction errors in restrictive iframes
    }
    return false;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.audioEnabled) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. General Tap / Button Clicks with tactile intensity variants
  tap(intensity: HapticIntensity = 'light') {
    switch (intensity) {
      case 'selection':
        this.vibrate(6);
        this.playTone(800, 400, 0.02, 'sine');
        break;
      case 'light':
        this.vibrate(10);
        this.playTone(600, 200, 0.04, 'sine');
        break;
      case 'medium':
        this.vibrate(20);
        this.playTone(450, 160, 0.05, 'triangle');
        break;
      case 'heavy':
        this.vibrate(35);
        this.playTone(320, 120, 0.06, 'sawtooth');
        break;
    }
  }

  buttonClick(intensity: HapticIntensity = 'medium') {
    this.tap(intensity);
  }

  // 2. 3D Tactile Card Press (Depression & Rebound Feel)
  tactileCardPress() {
    // Two-stage tactile impulse: primary press notch (14ms), micro release (20ms), rebound settle (16ms)
    this.vibrate([14, 20, 16]);
    this.playTone(380, 140, 0.06, 'triangle');
  }

  // 3. Neon Traveling Laser Beam (Energy sweep across the card)
  laserBeam() {
    // Rapid micro-burst sequence simulating a laser beam traveling from left to right
    this.vibrate([8, 14, 8, 14, 12]);
  }

  // 4. Modal Open Transition (Spatial expansion impulse)
  modalOpen() {
    // Expanding swell vibration pattern
    this.vibrate([15, 25, 22]);
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  // 5. Modal Close Transition (Deflation / dismissal impulse)
  modalClose() {
    // Quick closing drop pattern
    this.vibrate([12, 10]);
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  // 6. Successful Task Completion (Celebratory multi-stage cascading tactile rumble)
  taskComplete() {
    // Triumphant 5-beat celebration pattern matching confetti burst
    this.vibrate([25, 45, 35, 45, 65]);
    this.playVictoryChime();
  }

  // 7. General Success (e.g. form saved, item added, login successful)
  success() {
    this.vibrate([18, 30, 28]);
    this.playVictoryChime();
  }

  // 8. Task Approval by Manager (Authoritative double-pulse stamp)
  taskApprove() {
    this.vibrate([20, 35, 30]);
    this.playTone(520, 880, 0.18, 'sine');
  }

  // 9. Checklist Item Toggle (Satisfying affirmative bump vs light uncheck release)
  checklistToggle(completed: boolean) {
    if (completed) {
      this.vibrate([14, 24]);
      this.playTone(480, 720, 0.08, 'triangle');
    } else {
      this.vibrate(10);
      this.playTone(360, 220, 0.04, 'sine');
    }
  }

  // 10. Camera Mechanical Shutter Click
  cameraShutter() {
    this.vibrate([35, 20, 15]);
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  // 11. QR Code Scanned Successfully
  qrScanned() {
    this.vibrate([20, 30, 40]);
    this.playTone(600, 950, 0.12, 'sine');
  }

  // 12. Alert / Error / Warning / Redo
  alert() {
    this.vibrate([50, 40, 50, 40, 70]);
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  // 13. Voice Listening Mic State
  voiceListening(state: 'start' | 'stop') {
    if (state === 'start') {
      this.vibrate([15, 25]);
      this.playTone(400, 650, 0.1, 'sine');
    } else {
      this.vibrate(20);
      this.playTone(550, 350, 0.08, 'sine');
    }
  }

  // 14. Notification Push Chime
  notification(priority: 'normal' | 'important' | 'urgent' = 'normal') {
    if (priority === 'urgent') {
      this.vibrate([70, 40, 70, 40, 90]);
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [698.46, 880, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.07, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.26);
        });
      } catch {
        // Ignore
      }
    } else {
      this.vibrate(priority === 'important' ? [35, 40, 40] : [20, 35, 25]);
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.05, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.36);
        });
      } catch {
        // Ignore
      }
    }
  }

  // Audio helper
  private playTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  // Tri-tone victory chord
  private playVictoryChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.28);
      });
    } catch {
      // Ignore
    }
  }
}

export const haptics = new TactileHaptics();
