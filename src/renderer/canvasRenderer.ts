import { ZONES, getZoneForStage } from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, GROUND_Y, HERO_X } from '../engine/gameEngine';
import type { EnemyEntity, EnemyKind, GameState } from '../engine/types';
import { getPixelAssets } from './assets';

const ENEMY_ROW: Record<Exclude<EnemyKind, 'boss'>, number> = {
  goblin: 0,
  boar: 1,
  bandit: 2,
  scorpion: 3,
  bogling: 4,
  golem: 5,
  wyvern: 6,
};

export function renderArena(ctx: CanvasRenderingContext2D, state: GameState, timeSec: number): void {
  const assets = getPixelAssets();
  const zone = getZoneForStage(state.stage);
  const zoneIndex = Math.max(0, ZONES.findIndex((z) => z.id === zone.id));

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (state.screenShake > 0.2) {
    ctx.translate(
      Math.round((Math.random() - 0.5) * state.screenShake * 1.4),
      Math.round((Math.random() - 0.5) * state.screenShake * 1.4)
    );
  }

  // 1. Rich Pixel-Art Zone Background with cobblestone road parallax scrolling
  const activeBgId = state.activeDungeon
    ? state.activeDungeon.id === 'oreMine'
      ? 'frostpeak'
      : 'cinder-citadel'
    : zone.id;
  const bgImg = assets.bg[activeBgId];
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, ARENA_WIDTH, GROUND_Y, 0, 0, ARENA_WIDTH, GROUND_Y);

    const roadH = ARENA_HEIGHT - GROUND_Y;
    const scroll = Math.floor(state.scrollX) % ARENA_WIDTH;
    ctx.drawImage(bgImg, scroll, GROUND_Y, ARENA_WIDTH - scroll, roadH, 0, GROUND_Y, ARENA_WIDTH - scroll, roadH);
    if (scroll > 0) {
      ctx.drawImage(bgImg, 0, GROUND_Y, scroll, roadH, ARENA_WIDTH - scroll, GROUND_Y, scroll, roadH);
    }
  } else {
    ctx.fillStyle = zone.skyTop;
    ctx.fillRect(0, 0, ARENA_WIDTH, GROUND_Y);
    ctx.fillStyle = zone.roadBase;
    ctx.fillRect(0, GROUND_Y, ARENA_WIDTH, ARENA_HEIGHT - GROUND_Y);
  }

  // Zone ambient particles
  if (zone.id === 'frostpeak') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
    for (let i = 0; i < 18; i++) {
      const sx = (i * 53 + timeSec * 22) % ARENA_WIDTH;
      const sy = (i * 37 + timeSec * 36) % GROUND_Y;
      ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
  } else if (zone.id === 'cinder-citadel') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.8)';
    for (let i = 0; i < 16; i++) {
      const ex = (i * 61 + Math.sin(timeSec * 2 + i) * 14) % ARENA_WIDTH;
      const ey = GROUND_Y - ((i * 29 + timeSec * 32) % GROUND_Y);
      ctx.fillRect(Math.round(ex), Math.round(ey), 2, 2);
    }
  }

  // Warhorn Rally golden overlay
  if (state.rallyTimer > 0) {
    ctx.fillStyle = `rgba(250, 204, 21, ${(0.1 + Math.sin(timeSec * 10) * 0.04).toFixed(2)})`;
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  // 2. Active Companions (48x48 sprite sheets)
  const bob = Math.round(Math.abs(Math.sin(state.animTime * 6)) * 1.5);

  if (state.companions.banneret > 0 && assets.banneret.complete && assets.banneret.naturalWidth > 0) {
    const cx = HERO_X - 96;
    drawShadow(ctx, cx, GROUND_Y + 4, 14);
    const castT = state.companionCastTimers.banneret;
    const frame = castT > 0.3 ? 2 : castT > 0 ? 3 : Math.floor(state.animTime * 3.5) % 2;
    ctx.drawImage(assets.banneret, frame * 48, 0, 48, 48, Math.round(cx - 24), Math.round(GROUND_Y - 40 - bob), 48, 48);
  }

  if (state.companions.pyro > 0 && assets.pyro.complete && assets.pyro.naturalWidth > 0) {
    const cx = HERO_X - 66;
    drawShadow(ctx, cx, GROUND_Y + 4, 14);
    const castT = state.companionCastTimers.pyro;
    const frame = castT > 0.25 ? 2 : castT > 0 ? 3 : Math.floor(state.animTime * 4) % 2;
    ctx.drawImage(assets.pyro, frame * 48, 0, 48, 48, Math.round(cx - 24), Math.round(GROUND_Y - 40 - bob), 48, 48);
  }

  if (state.companions.ranger > 0 && assets.ranger.complete && assets.ranger.naturalWidth > 0) {
    const cx = HERO_X - 38;
    drawShadow(ctx, cx, GROUND_Y + 4, 14);
    const castT = state.companionCastTimers.ranger;
    const frame = castT > 0.21 ? 2 : castT > 0 ? 3 : Math.floor(state.animTime * 4.5) % 2;
    ctx.drawImage(assets.ranger, frame * 48, 0, 48, 48, Math.round(cx - 24), Math.round(GROUND_Y - 40 - bob), 48, 48);
  }

  // 3. Hero Expedition Knight (64x64 sprite sheet)
  drawShadow(ctx, HERO_X, GROUND_Y + 5, 20);

  const stanceRing =
    state.stance === 'vanguard'
      ? 'rgba(249, 115, 22, 0.58)'
      : state.stance === 'bulwark'
      ? 'rgba(56, 189, 248, 0.68)'
      : 'rgba(250, 204, 21, 0.58)';
  ctx.strokeStyle = stanceRing;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(HERO_X, GROUND_Y + 5, 20, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (assets.knight.complete && assets.knight.naturalWidth > 0) {
    let kFrame = 0;
    if (state.rallyTimer > 8.15) {
      kFrame = 5;
    } else if (state.heroAction === 'swing') {
      kFrame = state.heroActionTimer > 0.14 ? 3 : 4;
    } else {
      const cycle = [0, 1, 2, 1];
      kFrame = cycle[Math.floor(state.animTime * 7) % cycle.length];
    }

    const lungeX = kFrame === 4 ? 7 : 0;
    const drawX = Math.round(HERO_X - 30 + lungeX);
    const drawY = Math.round(GROUND_Y - 53);

    const spriteSrc =
      state.heroAction === 'hurt' && assets.whiteFlash.knight ? assets.whiteFlash.knight : assets.knight;
    ctx.drawImage(spriteSrc, kFrame * 64, 0, 64, 64, drawX, drawY, 64, 64);
  }

  if (state.heroShield > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(HERO_X, GROUND_Y - 22, 27, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bulwark Perfect Guard Hex Barrier Burst!
  if (state.guardBurstTimer > 0 && assets.projectiles.complete && assets.projectiles.naturalWidth > 0) {
    const t = 1 - state.guardBurstTimer / 0.55;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * 0.9);
    const sz = Math.round(44 + t * 22);
    ctx.drawImage(
      assets.projectiles,
      3 * 32,
      0,
      32,
      32,
      Math.round(HERO_X - sz / 2 + 12),
      Math.round(GROUND_Y - 24 - sz / 2),
      sz,
      sz
    );
    ctx.restore();
  }

  // 4. Enemies & Zone Bosses
  let activeBoss: EnemyEntity | null = null;
  for (const enemy of state.enemies) {
    if (enemy.isBoss) activeBoss = enemy;
    drawEnemy(ctx, enemy, zoneIndex, assets);
  }

  // 4.5 Physical Bouncing Gold Coin & Ore Crystal Loot Drops
  if (assets.projectiles.complete && assets.projectiles.naturalWidth > 0) {
    for (const d of state.lootDrops) {
      const cell = d.kind === 'coin' ? 4 : 5;
      ctx.drawImage(
        assets.projectiles,
        cell * 32,
        0,
        32,
        32,
        Math.round(d.x - 10),
        Math.round(d.y - 10),
        20,
        20
      );
    }
  }

  // 5. Companion Projectiles (Pixel Art Arrow & 2-Frame Fireball)
  const projReady = assets.projectiles.complete && assets.projectiles.naturalWidth > 0;
  for (const p of state.projectiles) {
    if (projReady) {
      const cell = p.kind === 'arrow' ? 0 : Math.floor(timeSec * 14) % 2 === 0 ? 1 : 2;
      const sz = p.kind === 'arrow' ? 24 : 26;
      ctx.drawImage(
        assets.projectiles,
        cell * 32,
        0,
        32,
        32,
        Math.round(p.x - sz / 2),
        Math.round(p.y - sz / 2),
        sz,
        sz
      );
    } else if (p.kind === 'arrow') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(Math.round(p.x) - 8, Math.round(p.y) - 1, 14, 2);
    } else {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Pixel VFX Sprite Sheet Overlays
  if (assets.vfx.complete && assets.vfx.naturalWidth > 0) {
    for (const fx of state.vfxList) {
      const progress = 1 - fx.life / fx.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress * 0.85);
      const size = Math.round(64 * fx.scale * (0.85 + progress * 0.25));
      ctx.drawImage(
        assets.vfx,
        fx.cell * 64,
        0,
        64,
        64,
        Math.round(fx.x - size / 2),
        Math.round(fx.y - size / 2),
        size,
        size
      );
      ctx.restore();
    }
  }

  // 7. Particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 8. Floating Damage & Loot Numbers
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

  // 9. Combo Counter (Top-Left of Arena)
  if (state.comboCount >= 3) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '700 13px Galmuri9, monospace';
    ctx.fillStyle = '#090d16';
    ctx.fillText(`${state.comboCount} HIT!`, 11, 23);
    ctx.fillStyle = state.comboCount >= 15 ? '#f97316' : '#fde047';
    ctx.fillText(`${state.comboCount} HIT!`, 10, 22);
    ctx.restore();
  }

  // 10. Boss Dedicated Top Nameplate & HP Bar + Dungeon Countdown Bar
  if (state.activeDungeon) {
    const d = state.activeDungeon;
    const barW = 224;
    const bx = Math.round((ARENA_WIDTH - barW) / 2);
    const by = 10;
    const ratio = Math.max(0, d.timeLeft / d.maxTime);
    ctx.fillStyle = 'rgba(11, 18, 32, 0.9)';
    ctx.fillRect(bx - 6, by - 4, barW + 12, 28);
    ctx.strokeStyle = d.id === 'oreMine' ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 6, by - 4, barW + 12, 28);
    ctx.font = '700 10px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    const dName = d.id === 'oreMine' ? '⛏️ 광산 토벌' : '👑 보스 러시';
    ctx.fillText(
      `${dName} Lv.${d.tier} · ${d.kills}/${d.targetKills} · ${d.timeLeft.toFixed(1)}s`,
      ARENA_WIDTH / 2,
      by + 8
    );
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by + 13, barW, 7);
    ctx.fillStyle = ratio < 0.25 ? '#ef4444' : d.id === 'oreMine' ? '#38bdf8' : '#f59e0b';
    ctx.fillRect(bx, by + 13, Math.round(barW * ratio), 7);
  } else if (activeBoss) {
    const barW = 200;
    const bx = Math.round((ARENA_WIDTH - barW) / 2);
    const by = 10;
    const ratio = Math.max(0, activeBoss.hp / activeBoss.maxHp);

    ctx.fillStyle = 'rgba(11, 18, 32, 0.86)';
    ctx.fillRect(bx - 6, by - 4, barW + 12, 28);
    ctx.strokeStyle = activeBoss.heavyWindup > 0 ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 6, by - 4, barW + 12, 28);

    ctx.font = '700 10px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = activeBoss.heavyWindup > 0 ? '#fca5a5' : '#fef08a';
    const title =
      activeBoss.heavyWindup > 0
        ? `⚠ 강타 예고! 지금 🛡️철벽 전환!`
        : `👑 ${activeBoss.name}`;
    ctx.fillText(title, ARENA_WIDTH / 2, by + 8);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, by + 13, barW, 7);
    ctx.fillStyle = activeBoss.heavyWindup > 0 ? '#ef4444' : '#f97316';
    ctx.fillRect(bx, by + 13, Math.round(barW * ratio), 7);
  }

  // 11. Top Announcement Banner (offset below boss/dungeon bar if active)
  if (state.bannerTimer > 0 && state.bannerText) {
    const by = activeBoss || state.activeDungeon ? 42 : 12;
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.bannerTimer * 1.6);
    ctx.fillStyle = 'rgba(11, 18, 32, 0.88)';
    ctx.fillRect(24, by, ARENA_WIDTH - 48, 24);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, by, ARENA_WIDTH - 48, 24);
    ctx.fillStyle = '#fef08a';
    ctx.font = '700 10px Galmuri9, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, ARENA_WIDTH / 2, by + 16);
    ctx.restore();
  }

  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(x, y, r, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: EnemyEntity,
  zoneIndex: number,
  assets: ReturnType<typeof getPixelAssets>
): void {
  const frame = Math.floor(e.animTime * (e.isBoss ? 2.6 : 4.2)) % 2;
  const ex = Math.round(e.x + e.knockbackX);

  if (e.isBoss) {
    drawShadow(ctx, ex, GROUND_Y + 6, 30);
    if (assets.bosses.complete && assets.bosses.naturalWidth > 0) {
      const bossRow = (e.bossVisualRow ?? zoneIndex) % 5;
      const src = e.hitFlash > 0.25 && assets.whiteFlash.bosses ? assets.whiteFlash.bosses : assets.bosses;
      ctx.drawImage(src, frame * 80, bossRow * 80, 80, 80, ex - 40, Math.round(GROUND_Y - 70), 80, 80);
    }

    if (e.stunTimer > 0) {
      ctx.font = '700 10px Galmuri9, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('STUN!', ex, GROUND_Y - 74);
    } else if (e.heavyWindup > 0) {
      const cw = 54;
      const cy = GROUND_Y - 78;
      ctx.fillStyle = 'rgba(11, 18, 32, 0.85)';
      ctx.fillRect(ex - cw / 2, cy, cw, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ex - cw / 2, cy, Math.round(cw * e.heavyWindup), 5);
    }
    return;
  }

  const hoverY = e.kind === 'wyvern' ? Math.round(Math.sin(e.animTime * 6) * 4 - 8) : 0;
  drawShadow(ctx, ex, GROUND_Y + 4, 16);

  if (assets.enemies.complete && assets.enemies.naturalWidth > 0) {
    const row = ENEMY_ROW[e.kind as Exclude<EnemyKind, 'boss'>] ?? 0;
    const src = e.hitFlash > 0.25 && assets.whiteFlash.enemies ? assets.whiteFlash.enemies : assets.enemies;
    ctx.drawImage(src, frame * 48, row * 48, 48, 48, ex - 24, Math.round(GROUND_Y - 40 + hoverY), 48, 48);
  }

  const hpW = 34;
  const hpY = GROUND_Y - 46 + hoverY;
  const ratio = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = 'rgba(11, 18, 32, 0.88)';
  ctx.fillRect(ex - hpW / 2 - 1, hpY - 1, hpW + 2, 6);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(ex - hpW / 2, hpY, Math.round(hpW * ratio), 4);
}
