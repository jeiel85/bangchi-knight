import { getZoneForStage } from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, GROUND_Y, HERO_X } from '../engine/gameEngine';
import type { EnemyEntity, GameState } from '../engine/types';
import {
  BANNERET_SPRITE,
  ENEMY_SPRITES,
  KNIGHT_MARCH_A,
  KNIGHT_MARCH_B,
  KNIGHT_SWING,
  PYRO_SPRITE,
  RANGER_SPRITE,
  drawPixelSprite,
} from './sprites';

export function renderArena(ctx: CanvasRenderingContext2D, state: GameState, timeSec: number): void {
  const zone = getZoneForStage(state.stage);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (state.screenShake > 0.2) {
    ctx.translate(
      Math.round((Math.random() - 0.5) * state.screenShake * 1.4),
      Math.round((Math.random() - 0.5) * state.screenShake * 1.4)
    );
  }

  // 1. Vibrant Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, zone.skyTop);
  skyGrad.addColorStop(1, zone.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ARENA_WIDTH, GROUND_Y);

  // 2. Sun / Horizon orb
  const sunX = ARENA_WIDTH - 68;
  const sunY = 46;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 44);
  sunGlow.addColorStop(0, `${zone.sunColor}aa`);
  sunGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = zone.sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
  ctx.fill();

  // 3. Drifting pixel clouds
  const cloudDrift = (timeSec * 10 + state.scrollX * 0.12) % (ARENA_WIDTH + 90);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let i = 0; i < 3; i++) {
    const cx = ARENA_WIDTH + 40 - ((cloudDrift + i * 145) % (ARENA_WIDTH + 90));
    const cy = 28 + i * 20;
    ctx.fillRect(Math.round(cx), cy, 42, 8);
    ctx.fillRect(Math.round(cx) + 8, cy - 5, 24, 6);
  }

  // 4. Far mountain silhouettes (parallax)
  ctx.fillStyle = zone.hillFar;
  const farShift = (state.scrollX * 0.2) % 120;
  for (let x = -farShift - 120; x < ARENA_WIDTH + 120; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + 60, GROUND_Y - 68);
    ctx.lineTo(x + 120, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Near rolling hills & frontier pine trees / watchtower posts
  ctx.fillStyle = zone.hillNear;
  ctx.fillRect(0, GROUND_Y - 26, ARENA_WIDTH, 26);
  const treeSpacing = 88;
  const nearShift = (state.scrollX * 0.55) % treeSpacing;
  for (let x = -nearShift; x < ARENA_WIDTH + treeSpacing; x += treeSpacing) {
    const tx = Math.round(x);
    // Pixel pine tree
    ctx.fillStyle = '#3f2c1b';
    ctx.fillRect(tx + 8, GROUND_Y - 14, 4, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(tx + 2, GROUND_Y - 26, 16, 12);
    ctx.fillStyle = zone.hillNear;
    ctx.fillRect(tx, GROUND_Y - 24, 20, 8);
    ctx.fillRect(tx + 3, GROUND_Y - 32, 14, 8);
    ctx.fillRect(tx + 6, GROUND_Y - 38, 8, 6);
  }

  // 6. Frontier Cobblestone Road
  ctx.fillStyle = zone.roadTop;
  ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, 8);
  ctx.fillStyle = zone.roadBase;
  ctx.fillRect(0, GROUND_Y + 8, ARENA_WIDTH, ARENA_HEIGHT - GROUND_Y - 8);

  const stoneShift = state.scrollX % 28;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = -stoneShift; x < ARENA_WIDTH + 28; x += 28) {
    ctx.fillRect(Math.round(x), GROUND_Y + 12, 16, 4);
    ctx.fillRect(Math.round(x + 14), GROUND_Y + 28, 16, 4);
  }

  // Rally warhorn golden sky aura
  if (state.rallyTimer > 0) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  // 7. Companions marching behind the knight!
  const bob = Math.abs(Math.sin(state.animTime * 8)) * 2;
  if (state.companions.banneret > 0) {
    drawShadow(ctx, HERO_X - 96, GROUND_Y + 2, 11);
    drawPixelSprite(
      ctx,
      BANNERET_SPRITE,
      { Y: '#facc15', G: '#fde047', S: '#fde2c4', B: '#1d4ed8' },
      HERO_X - 96,
      GROUND_Y + 2 - bob,
      2.3
    );
  }
  if (state.companions.pyro > 0) {
    drawShadow(ctx, HERO_X - 68, GROUND_Y + 2, 11);
    drawPixelSprite(
      ctx,
      PYRO_SPRITE,
      { R: '#dc2626', O: '#fb923c', S: '#fde2c4', K: '#0f172a', F: '#fde047', G: '#92400e' },
      HERO_X - 68,
      GROUND_Y + 2 - bob,
      2.3
    );
  }
  if (state.companions.ranger > 0) {
    drawShadow(ctx, HERO_X - 40, GROUND_Y + 2, 11);
    drawPixelSprite(
      ctx,
      RANGER_SPRITE,
      { G: '#16a34a', B: '#78350f', S: '#fde2c4', K: '#0f172a' },
      HERO_X - 40,
      GROUND_Y + 2 - bob,
      2.3
    );
  }

  // 8. Hero Knight + Stance Aura
  drawShadow(ctx, HERO_X, GROUND_Y + 3, 17);

  const stanceAuraColor =
    state.stance === 'vanguard'
      ? 'rgba(249, 115, 22, 0.32)'
      : state.stance === 'bulwark'
      ? 'rgba(56, 189, 248, 0.35)'
      : 'rgba(250, 204, 21, 0.3)';
  const aura = ctx.createRadialGradient(HERO_X, GROUND_Y - 18, 4, HERO_X, GROUND_Y - 18, 28);
  aura.addColorStop(0, stanceAuraColor);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(HERO_X, GROUND_Y - 18, 28, 0, Math.PI * 2);
  ctx.fill();

  const knightSprite =
    state.heroAction === 'swing'
      ? KNIGHT_SWING
      : Math.floor(state.animTime * 8) % 2 === 0
      ? KNIGHT_MARCH_A
      : KNIGHT_MARCH_B;

  const knightOffsetX = state.heroAction === 'swing' ? 8 : 0;
  drawPixelSprite(
    ctx,
    knightSprite,
    {
      P: state.stance === 'vanguard' ? '#f97316' : state.stance === 'bulwark' ? '#38bdf8' : '#facc15',
      M: '#e2e8f0',
      m: '#94a3b8',
      B: '#1d4ed8',
      G: '#f59e0b',
      S: '#f8fafc',
      W: '#ffffff',
      K: '#0f172a',
    },
    HERO_X + knightOffsetX,
    GROUND_Y + 3,
    2.6,
    state.heroAction === 'hurt'
  );

  // Sword slash arc on swing
  if (state.heroAction === 'swing') {
    ctx.strokeStyle = state.rallyTimer > 0 ? '#fde047' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(HERO_X + 20, GROUND_Y - 18, 22, -0.85, 0.85);
    ctx.stroke();
  }

  // Bulwark shield ring
  if (state.heroShield > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(HERO_X, GROUND_Y - 18, 23, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 9. Enemies
  for (const e of state.enemies) {
    drawEnemy(ctx, e);
  }

  // 10. Companion Projectiles (arrows & fireballs)
  for (const p of state.projectiles) {
    if (p.kind === 'arrow') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(Math.round(p.x) - 6, Math.round(p.y) - 1, 12, 2);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(Math.round(p.x) - 8, Math.round(p.y) - 2, 3, 4);
    } else if (p.kind === 'fireball') {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 11. Particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 12. Floating Damage / Loot Texts
  ctx.textAlign = 'center';
  for (const ft of state.floatingTexts) {
    ctx.globalAlpha = Math.min(1, (ft.life / ft.maxLife) * 1.5);
    ctx.font = `${ft.bold ? '700' : '400'} ${ft.size}px Galmuri9, monospace`;
    ctx.fillStyle = '#090d16';
    ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
  }
  ctx.globalAlpha = 1;

  // 13. Top Banner
  if (state.bannerTimer > 0 && state.bannerText) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.bannerTimer * 1.6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.fillRect(30, 14, ARENA_WIDTH - 60, 26);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 14, ARENA_WIDTH - 60, 26);
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 11px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, ARENA_WIDTH / 2, 31);
    ctx.restore();
  }

  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, r, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity): void {
  const hop = e.kind === 'wyvern' ? -18 + Math.sin(e.animTime * 8) * 5 : Math.abs(Math.sin(e.animTime * 5)) * -3;
  const px = e.isBoss ? 3.3 : 2.3;
  drawShadow(ctx, e.x, GROUND_Y + 3, e.isBoss ? 24 : 13);

  const palettes: Record<EnemyEntity['kind'], Record<string, string>> = {
    goblin: { G: '#4ade80', R: '#ef4444', B: '#78350f', b: '#451a03', S: '#e2e8f0' },
    boar: { B: '#92400e', W: '#fef3c7', R: '#ef4444', K: '#1c1917' },
    bandit: { R: '#b91c1c', K: '#1e293b', B: '#475569', S: '#e2e8f0' },
    scorpion: { P: '#ea580c', R: '#fef08a' },
    bogling: { T: '#14b8a6', Y: '#fde047', K: '#0f172a' },
    golem: { C: '#cbd5e1', B: '#38bdf8' },
    wyvern: { R: '#dc2626', O: '#fb923c', Y: '#fde047' },
    boss: { Y: '#facc15', K: '#1e293b', R: '#ef4444', S: '#f8fafc' },
  };

  drawPixelSprite(
    ctx,
    ENEMY_SPRITES[e.kind],
    palettes[e.kind],
    e.x,
    GROUND_Y + 3 + hop,
    px,
    e.hitFlash > 0.25
  );

  // HP Bar
  const hpW = e.isBoss ? 52 : 30;
  const hpY = GROUND_Y - (e.isBoss ? 48 : 30);
  const ratio = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(e.x - hpW / 2, hpY, hpW, 5);
  ctx.fillStyle = e.isBoss ? '#f97316' : '#ef4444';
  ctx.fillRect(e.x - hpW / 2 + 1, hpY + 1, (hpW - 2) * ratio, 3);
}
