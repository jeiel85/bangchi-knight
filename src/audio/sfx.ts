import type { GameEventType } from '../engine/types';

// Heroic 16-bit adventure march (Lead + Bass)
const NORMAL_LEAD = [
  293.66, 0, 369.99, 440.0, 587.33, 0, 440.0, 369.99,
  329.63, 0, 392.0, 493.88, 659.25, 587.33, 493.88, 440.0,
  293.66, 369.99, 440.0, 587.33, 659.25, 0, 587.33, 493.88,
  440.0, 493.88, 587.33, 440.0, 369.99, 329.63, 293.66, 0,
];
const NORMAL_BASS = [
  146.83, 146.83, 220.0, 146.83, 164.81, 164.81, 246.94, 164.81,
  146.83, 146.83, 196.0, 220.0, 146.83, 164.81, 220.0, 146.83,
];

// Intense minor-key boss & dungeon battle theme
const BOSS_LEAD = [
  293.66, 293.66, 349.23, 440.0, 466.16, 440.0, 349.23, 329.63,
  293.66, 349.23, 440.0, 587.33, 523.25, 466.16, 440.0, 392.0,
  349.23, 349.23, 440.0, 523.25, 587.33, 523.25, 466.16, 440.0,
  440.0, 392.0, 349.23, 329.63, 293.66, 329.63, 293.66, 0,
];
const BOSS_BASS = [
  146.83, 146.83, 174.61, 146.83, 116.54, 116.54, 130.81, 146.83,
  174.61, 174.61, 196.0, 174.61, 164.81, 130.81, 146.83, 110.0,
];

class SfxManager {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmMood: 'normal' | 'boss' = 'normal';
  public enabled = true;
  public bgmEnabled = false;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureCtx();
    if (this.bgmEnabled && this.bgmTimer === null) {
      this.startBgmLoop();
    }
  }

  public setBgm(on: boolean): void {
    this.bgmEnabled = on;
    if (on) {
      this.ensureCtx();
      this.startBgmLoop();
    } else {
      this.stopBgmLoop();
    }
  }

  public setBgmMood(mood: 'normal' | 'boss'): void {
    if (this.bgmMood === mood) return;
    this.bgmMood = mood;
    if (this.bgmEnabled && this.bgmTimer !== null) {
      this.stopBgmLoop();
      this.startBgmLoop();
    }
  }

  private startBgmLoop(): void {
    if (typeof window === 'undefined' || this.bgmTimer !== null) return;
    const stepMs = this.bgmMood === 'boss' ? 165 : 210;
    this.bgmTimer = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const isBoss = this.bgmMood === 'boss';
      const lead = isBoss ? BOSS_LEAD : NORMAL_LEAD;
      const bass = isBoss ? BOSS_BASS : NORMAL_BASS;

      const leadFreq = lead[this.bgmStep % lead.length];
      if (leadFreq > 0) {
        this.tone(this.ctx, isBoss ? 'square' : 'triangle', leadFreq, leadFreq, 0.14, isBoss ? 0.015 : 0.022, now);
      }

      if (this.bgmStep % 2 === 0) {
        const bassFreq = bass[Math.floor(this.bgmStep / 2) % bass.length];
        this.tone(this.ctx, 'triangle', bassFreq, bassFreq, 0.24, 0.024, now);
      }

      // Soft rhythmic percussion click on off-beats
      if (this.bgmStep % 2 === 1) {
        this.tone(this.ctx, 'sine', isBoss ? 140 : 110, 48, 0.045, 0.014, now);
      }

      this.bgmStep += 1;
    }, stepMs);
  }

  private stopBgmLoop(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private vibrate(ms: number): void {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(ms);
      }
    } catch {
      // ignore unsupported
    }
  }

  public play(type: GameEventType): void {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case 'hit':
        this.tone(ctx, 'triangle', 360, 140, 0.055, 0.045, now);
        break;
      case 'crit':
        this.tone(ctx, 'sawtooth', 540, 190, 0.08, 0.065, now);
        this.tone(ctx, 'square', 820, 1120, 0.06, 0.04, now + 0.02);
        break;
      case 'arrow':
        this.tone(ctx, 'triangle', 740, 420, 0.045, 0.03, now);
        break;
      case 'fireball':
        this.tone(ctx, 'sawtooth', 220, 95, 0.14, 0.06, now);
        break;
      case 'heal':
        this.tone(ctx, 'sine', 520, 780, 0.1, 0.04, now);
        break;
      case 'forge':
        this.tone(ctx, 'square', 980, 1420, 0.06, 0.075, now);
        this.tone(ctx, 'triangle', 1560, 1120, 0.12, 0.055, now + 0.03);
        break;
      case 'forgeRare':
        this.vibrate(20);
        this.tone(ctx, 'square', 980, 1480, 0.07, 0.085, now);
        this.tone(ctx, 'square', 784, 1046, 0.1, 0.07, now + 0.08);
        this.tone(ctx, 'triangle', 1046, 1568, 0.18, 0.075, now + 0.16);
        break;
      case 'perfectGuard':
        this.vibrate(25);
        this.tone(ctx, 'square', 660, 1320, 0.1, 0.09, now);
        this.tone(ctx, 'triangle', 1320, 1760, 0.16, 0.08, now + 0.06);
        break;
      case 'questClaim':
        this.tone(ctx, 'square', 659, 659, 0.06, 0.06, now);
        this.tone(ctx, 'square', 880, 1175, 0.14, 0.07, now + 0.06);
        break;
      case 'rally':
        this.vibrate(18);
        this.tone(ctx, 'sawtooth', 293, 293, 0.12, 0.07, now);
        this.tone(ctx, 'sawtooth', 440, 440, 0.14, 0.075, now + 0.11);
        this.tone(ctx, 'sawtooth', 587, 600, 0.28, 0.08, now + 0.24);
        break;
      case 'skill':
        this.tone(ctx, 'sawtooth', 320, 820, 0.14, 0.075, now);
        this.tone(ctx, 'square', 640, 1180, 0.1, 0.05, now + 0.05);
        break;
      case 'stance':
        this.tone(ctx, 'square', 440, 660, 0.07, 0.05, now);
        break;
      case 'upgrade':
        this.tone(ctx, 'square', 523, 784, 0.07, 0.05, now);
        break;
      case 'bossWarning':
        this.tone(ctx, 'sawtooth', 180, 120, 0.18, 0.075, now);
        this.tone(ctx, 'sawtooth', 150, 105, 0.22, 0.075, now + 0.2);
        break;
      case 'bossKill':
      case 'returnKingdom':
        this.vibrate(25);
        this.tone(ctx, 'square', 523, 523, 0.08, 0.065, now);
        this.tone(ctx, 'square', 659, 659, 0.08, 0.065, now + 0.08);
        this.tone(ctx, 'square', 784, 1046, 0.2, 0.08, now + 0.16);
        break;
      case 'retreat':
        this.tone(ctx, 'sawtooth', 260, 95, 0.26, 0.065, now);
        break;
    }
  }

  private tone(
    ctx: AudioContext,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    startTime: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }
}

export const sfx = new SfxManager();
