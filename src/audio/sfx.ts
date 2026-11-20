import type { GameEventType } from '../engine/types';

class SfxManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public play(type: GameEventType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'slash':
        this.tone(ctx, 'triangle', 420, 150, 0.06, 0.06, now);
        break;
      case 'crit':
        this.tone(ctx, 'sawtooth', 620, 220, 0.09, 0.08, now);
        this.tone(ctx, 'square', 880, 1180, 0.07, 0.05, now + 0.02);
        break;
      case 'counter':
        this.tone(ctx, 'square', 520, 1320, 0.12, 0.09, now);
        this.tone(ctx, 'triangle', 1040, 1560, 0.14, 0.08, now + 0.05);
        break;
      case 'skill':
        this.tone(ctx, 'sawtooth', 260, 740, 0.16, 0.08, now);
        this.tone(ctx, 'triangle', 520, 980, 0.14, 0.06, now + 0.06);
        break;
      case 'upgrade':
        this.tone(ctx, 'square', 587, 880, 0.07, 0.06, now);
        break;
      case 'levelUp':
      case 'bossKill':
        this.tone(ctx, 'square', 523, 523, 0.08, 0.07, now);
        this.tone(ctx, 'square', 659, 659, 0.08, 0.07, now + 0.08);
        this.tone(ctx, 'square', 784, 1046, 0.16, 0.08, now + 0.16);
        break;
      case 'bossWarning':
        this.tone(ctx, 'sawtooth', 160, 110, 0.18, 0.09, now);
        this.tone(ctx, 'sawtooth', 140, 95, 0.22, 0.09, now + 0.2);
        break;
      case 'feverStart':
        this.tone(ctx, 'sawtooth', 220, 880, 0.26, 0.1, now);
        this.tone(ctx, 'square', 440, 1320, 0.24, 0.08, now + 0.08);
        break;
      case 'heroDie':
        this.tone(ctx, 'sawtooth', 260, 85, 0.3, 0.09, now);
        break;
      case 'rebirth':
        this.tone(ctx, 'triangle', 330, 660, 0.16, 0.08, now);
        this.tone(ctx, 'triangle', 495, 990, 0.2, 0.08, now + 0.12);
        this.tone(ctx, 'square', 660, 1320, 0.25, 0.08, now + 0.24);
        break;
    }
  }

  private tone(
    ctx: AudioContext,
    wave: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    startTime: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
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
