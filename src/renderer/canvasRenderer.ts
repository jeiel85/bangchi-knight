import { getBiomeForStage, getKnightTier } from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, GROUND_Y } from '../engine/gameEngine';
import type { EnemyEntity, GameState } from '../engine/types';
import {
  ENEMY_SPRITES,
  KNIGHT_ATTACK,
  KNIGHT_RUN_A,
  KNIGHT_RUN_B,
  drawPixelSprite,
} from './sprites';

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 47 + 19) % ARENA_WIDTH,
  y: 12 + ((i * 31) % 92),
  phase: i * 0.7,
}));

export function renderArena(ctx: CanvasRenderingContext2D, state: GameState, timeSec: number): void {
  const biome = getBiomeForStage(state.stage);
  const tier = getKnightTier(state.stage);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Screen shake
  if (state.screenShake > 0.2) {
    const sx = (Math.random() - 0.5) * state.screenShake * 1.4;
    const sy = (Math.random() - 0.5) * state.screenShake * 1.4;
    ctx.translate(Math.round(sx), Math.round(sy));
  }

  // 1. Sky backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, biome.skyTop);
  skyGrad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  // Fever tint
  if (state.feverActiveTimer > 0) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(0, 0, ARENA_WIDTH, GROUND_Y);
  }

  // 2. Twinkling pixel stars
  for (const star of STARS) {
    const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(timeSec * 2.2 + star.phase));
    ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(2)})`;
    ctx.fillRect(star.x, star.y, 2, 2);
  }

  // 3. Eclipse Moon (흑월)
  const moonX = ARENA_WIDTH - 64;
  const moonY = 52;
  const feverPulse = state.feverActiveTimer > 0 ? 5 + Math.sin(timeSec * 12) * 3 : 0;
  const outerGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 44 + feverPulse);
  outerGlow.addColorStop(0, state.feverActiveTimer > 0 ? 'rgba(251, 191, 36, 0.65)' : `${biome.moonTint}55`);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 44 + feverPulse, 0, Math.PI * 2);
  ctx.fill();

  // Golden ring
  ctx.fillStyle = state.feverActiveTimer > 0 ? '#fde047' : biome.moonTint;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
  ctx.fill();

  // Dark moon core (eclipse)
  ctx.fillStyle = '#07080f';
  ctx.beginPath();
  ctx.arc(moonX - 1.5, moonY + 1, 17, 0, Math.PI * 2);
  ctx.fill();

  // 4. Parallax dungeon pillars + flickering torches
  const pillarSpacing = 128;
  const scrollFar = (state.scrollOffset * 0.45) % pillarSpacing;
  for (let x = -scrollFar; x < ARENA_WIDTH + pillarSpacing; x += pillarSpacing) {
    const px = Math.round(x);
    ctx.fillStyle = biome.pillarColor;
    ctx.fillRect(px, 68, 22, GROUND_Y - 68);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(px + 2, 68, 3, GROUND_Y - 68);
    // Pillar cap
    ctx.fillRect(px - 3, 66, 28, 6);

    // Torch glow
    const tx = px + 11;
    const ty = 122;
    const flicker = Math.sin(timeSec * 13 + px) * 2;
    const torchGlow = ctx.createRadialGradient(tx, ty, 2, tx, ty, 22 + flicker);
    torchGlow.addColorStop(0, `${biome.torchColor}99`);
    torchGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = torchGlow;
    ctx.beginPath();
    ctx.arc(tx, ty, 22 + flicker, 0, Math.PI * 2);
    ctx.fill();

    // Torch flame pixel
    ctx.fillStyle = biome.torchColor;
    ctx.fillRect(tx - 2, ty - 2, 4, 4);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(tx - 1, ty - 1, 2, 2);
  }

  // 5. Stone floor
  ctx.fillStyle = biome.floorTop;
  ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, 6);
  ctx.fillStyle = biome.floorBase;
  ctx.fillRect(0, GROUND_Y + 6, ARENA_WIDTH, ARENA_HEIGHT - GROUND_Y - 6);

  // Scrolling stone tile lines
  const tileW = 32;
  const scrollFloor = state.scrollOffset % tileW;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (let x = -scrollFloor; x < ARENA_WIDTH + tileW; x += tileW) {
    ctx.fillRect(Math.round(x), GROUND_Y + 6, 2, 18);
    ctx.fillRect(Math.round(x + 16), GROUND_Y + 24, 2, 22);
  }
  ctx.fillRect(0, GROUND_Y + 23, ARENA_WIDTH, 2);
  ctx.fillRect(0, GROUND_Y + 45, ARENA_WIDTH, 2);

  // 6. Hero shadow & aura
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(state.heroX, GROUND_Y + 2, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.feverActiveTimer > 0 || state.heroState === 'counter') {
    const auraR = state.feverActiveTimer > 0 ? 32 : 26;
    const aura = ctx.createRadialGradient(state.heroX, GROUND_Y - 22, 4, state.heroX, GROUND_Y - 22, auraR);
    aura.addColorStop(0, `${tier.auraColor}77`);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(state.heroX, GROUND_Y - 22, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Hero Knight Sprite
  const heroSprite =
    state.heroState === 'attack' || state.heroState === 'counter'
      ? KNIGHT_ATTACK
      : Math.floor(state.heroAnimTime * 8) % 2 === 0
      ? KNIGHT_RUN_A
      : KNIGHT_RUN_B;

  const heroOffsetX = state.heroState === 'attack' ? 7 : state.heroState === 'counter' ? 14 : 0;
  const knightPalette: Record<string, string> = {
    H: '#e2e8f0',
    h: '#94a3b8',
    S: '#fde2c4',
    E: state.feverActiveTimer > 0 ? '#fde047' : '#38bdf8',
    A: '#1e293b',
    a: '#475569',
    C: tier.capeColor,
    G: '#f5b942',
    B: '#f8fafc',
    b: '#94a3b8',
    W: '#ffffff',
  };

  drawPixelSprite(
    ctx,
    heroSprite,
    knightPalette,
    state.heroX + heroOffsetX,
    GROUND_Y + 2,
    2.5,
    state.heroState === 'hurt'
  );

  // Shield ring visual
  if (state.heroShield > 0) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.heroX, GROUND_Y - 20, 23, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 8. Enemies
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy);
  }

  // 9. Slash & skill effects
  for (const fx of state.slashEffects) {
    const t = 1 - fx.life / fx.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    if (fx.kind === 'storm') {
      // Lightning bolt from sky
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx.x - 6, 0);
      ctx.lineTo(fx.x + 8, fx.y * 0.45);
      ctx.lineTo(fx.x - 7, fx.y * 0.72);
      ctx.lineTo(fx.x + 2, fx.y);
      ctx.stroke();
    } else if (fx.kind === 'heal') {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.6 + t * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const color =
        fx.kind === 'counter'
          ? '#fde047'
          : fx.kind === 'crit' || fx.kind === 'moon'
          ? '#f5b942'
          : '#e2e8f0';
      ctx.strokeStyle = color;
      ctx.lineWidth = fx.kind === 'counter' || fx.kind === 'moon' ? 4.5 : 2.5;
      ctx.beginPath();
      ctx.arc(fx.x - 10, fx.y, fx.radius * (0.7 + t * 0.45), -0.95, 0.95);
      ctx.stroke();

      if (fx.kind === 'counter') {
        // Horizontal flash line (일섬!)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(state.heroX - 18, fx.y);
        ctx.lineTo(fx.x + 36, fx.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 10. Particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 11. Counter screen flash
  if (state.counterFlashTimer > 0) {
    ctx.fillStyle = `rgba(253, 224, 71, ${(state.counterFlashTimer * 0.85).toFixed(2)})`;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  // 12. Floating damage texts
  ctx.textAlign = 'center';
  for (const ft of state.floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.6);
    ctx.globalAlpha = alpha;
    ctx.font = `${ft.bold ? '700' : '400'} ${ft.size}px Galmuri9, monospace`;
    ctx.fillStyle = '#07080f';
    ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
  }
  ctx.globalAlpha = 1;

  // 13. Top center dramatic banner (Boss warning / Stage clear / Fever)
  if (state.bannerTimer > 0 && state.bannerText) {
    const alpha = Math.min(1, state.bannerTimer * 1.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(8, 9, 16, 0.82)';
    ctx.fillRect(36, 18, ARENA_WIDTH - 72, 26);
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 18, ARENA_WIDTH - 72, 26);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 11px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, ARENA_WIDTH / 2, 35);
    ctx.restore();
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity): void {
  const bob = enemy.kind === 'bat' ? -18 + Math.sin(enemy.animTime * 8) * 5 : Math.abs(Math.sin(enemy.animTime * 5)) * -3;
  const pixelSize = enemy.isBoss ? 3.2 : 2.2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(enemy.x, GROUND_Y + 2, enemy.isBoss ? 25 : 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const paletteMap: Record<EnemyEntity['kind'], Record<string, string>> = {
    slime: { P: '#7e22ce', p: '#a855f7', E: '#fde047' },
    skeleton: { W: '#e2e8f0', K: '#0f172a', G: '#94a3b8', B: '#cbd5e1' },
    bat: { P: '#4c1d95', p: '#7c3aed', R: '#fb7185', W: '#f8fafc' },
    knight: { G: '#64748b', A: '#1e293b', R: '#ef4444', C: '#7f1d1d', B: '#cbd5e1', W: '#ffffff' },
    gargoyle: { K: '#475569', R: '#38bdf8', G: '#94a3b8' },
    boss: { G: '#f5b942', K: '#1e1b2e', R: '#fb7185', C: '#991b1b', B: '#e2e8f0', W: '#ffffff' },
  };

  drawPixelSprite(
    ctx,
    ENEMY_SPRITES[enemy.kind],
    paletteMap[enemy.kind],
    enemy.x,
    GROUND_Y + 2 + bob,
    pixelSize,
    enemy.hitFlash > 0.25
  );

  // Stun indicator
  if (enemy.stunTimer > 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 10px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STUN!', enemy.x, GROUND_Y - (enemy.isBoss ? 60 : 42));
  }

  // Telegraph windup warning (Parry window!)
  if (enemy.windup > 0) {
    const barW = enemy.isBoss ? 44 : 28;
    const barY = GROUND_Y - (enemy.isBoss ? 66 : 44);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(enemy.x - barW / 2, barY, barW, 4);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(enemy.x - barW / 2, barY, barW * enemy.windup, 4);

    if (enemy.windup > 0.2) {
      ctx.fillStyle = '#fde047';
      ctx.font = '700 11px Galmuri9, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', enemy.x, barY - 4);
    }
  }

  // HP Bar
  const hpW = enemy.isBoss ? 54 : 30;
  const hpY = GROUND_Y - (enemy.isBoss ? 54 : 35);
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = 'rgba(8, 9, 16, 0.8)';
  ctx.fillRect(enemy.x - hpW / 2, hpY, hpW, 5);
  ctx.fillStyle = enemy.isBoss ? '#fb7185' : '#ef4444';
  ctx.fillRect(enemy.x - hpW / 2 + 1, hpY + 1, (hpW - 2) * ratio, 3);
}
