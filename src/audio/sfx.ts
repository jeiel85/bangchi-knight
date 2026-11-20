import type { GameEventType } from '../engine/types';

class SfxManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
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
  }

  public play(type: GameEventType): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case 'hit':
        this.tone(ctx, 'triangle', 360, 140, 0.055, 0.05, now);
        break;
      case 'crit':
        this.tone(ctx, 'sawtooth', 540, 190, 0.08, 0.07, now);
        this.tone(ctx, 'square', 820, 1120, 0.06, 0.045, now + 0.02);
        break;
      case 'arrow':
        this.tone(ctx, 'triangle', 740, 420, 0.045, 0.035, now);
        break;
      case 'fireball':
        this.tone(ctx, 'sawtooth', 220, 95, 0.14, 0.065, now);
        break;
      case 'heal':
        this.tone(ctx, 'sine', 520, 780, 0.1, 0.045, now);
        break;
      case 'forge':
        // Metallic anvil clink!
        this.tone(ctx, 'square', 980, 1420, 0.06, 0.08, now);
        this.tone(ctx, 'triangle', 1560, 1120, 0.12, 0.06, now + 0.03);
        break;
      case 'forgeRare':
        this.tone(ctx, 'square', 980, 1480, 0.07, 0.09, now);
        this.tone(ctx, 'square', 784, 1046, 0.1, 0.07, now + 0.08);
        this.tone(ctx, 'triangle', 1046, 1568, 0.18, 0.08, now + 0.16);
        break;
      case 'rally':
        // Brass warhorn fanfare
        this.tone(ctx, 'sawtooth', 293, 293, 0.12, 0.075, now);
        this.tone(ctx, 'sawtooth', 440, 440, 0.14, 0.08, now + 0.11);
        this.tone(ctx, 'sawtooth', 587, 600, 0.28, 0.085, now + 0.24);
        break;
      case 'stance':
        this.tone(ctx, 'square', 440, 660, 0.07, 0.055, now);
        break;
      case 'upgrade':
        this.tone(ctx, 'square', 523, 784, 0.07, 0.055, now);
        break;
      case 'bossWarning':
        this.tone(ctx, 'sawtooth', 180, 120, 0.18, 0.08, now);
        this.tone(ctx, 'sawtooth', 150, 105, 0.22, 0.08, now + 0.2);
        break;
      case 'bossKill':
      case 'returnKingdom':
        this.tone(ctx, 'square', 523, 523, 0.08, 0.065, now);
        this.tone(ctx, 'square', 659, 659, 0.08, 0.065, now + 0.08);
        this.tone(ctx, 'square', 784, 1046, 0.2, 0.08, now + 0.16);
        break;
      case 'retreat':
        this.tone(ctx, 'sawtooth', 260, 95, 0.26, 0.07, now);
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
