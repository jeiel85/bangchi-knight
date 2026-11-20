import {
  AWAKENING_CARDS,
  RELICS,
  SKILLS,
  UPGRADES,
  getBiomeForStage,
  getKnightTier,
  getRelicCost,
  getUpgradeCost,
} from './data';
import type {
  AwakeningCardDef,
  BuyMode,
  ComputedStats,
  EnemyEntity,
  EnemyKind,
  GameEvent,
  GameState,
  RelicKey,
  SaveData,
  SkillId,
  UpgradeKey,
} from './types';

export const ARENA_WIDTH = 360;
export const ARENA_HEIGHT = 270;
export const HERO_X = 96;
export const GROUND_Y = 204;

const ENEMY_NAMES: Record<EnemyKind, string> = {
  slime: '심연 슬라임',
  skeleton: '망자 해골병',
  bat: '흡혈 박쥐',
  knight: '타락한 기사',
  gargoyle: '석상 가고일',
  boss: '던전 보스',
};

export class BangchiEngine {
  public state: GameState;
  private nextEntityId = 1;
  private eventQueue: GameEvent[] = [];
  private isDemoMode: boolean;

  constructor(saved?: SaveData | null, options?: { demoMode?: boolean }) {
    this.isDemoMode = Boolean(options?.demoMode);
    this.state = this.createInitialState(saved);
    this.spawnWave();
  }

  private createInitialState(saved?: SaveData | null): GameState {
    const upgrades = {
      atk: saved?.upgrades?.atk ?? 0,
      atkSpeed: saved?.upgrades?.atkSpeed ?? 0,
      crit: saved?.upgrades?.crit ?? 0,
      maxHp: saved?.upgrades?.maxHp ?? 0,
      regen: saved?.upgrades?.regen ?? 0,
      goldGain: saved?.upgrades?.goldGain ?? 0,
    };

    const relics = {
      soulBlade: saved?.relics?.soulBlade ?? 0,
      goldenGrace: saved?.relics?.goldenGrace ?? 0,
      counterMastery: saved?.relics?.counterMastery ?? 0,
      swiftStart: saved?.relics?.swiftStart ?? 0,
    };

    const stage = Math.max(1, saved?.stage ?? 1);
    const level = Math.max(1, saved?.level ?? 1);

    const state: GameState = {
      stage,
      highestStage: Math.max(stage, saved?.highestStage ?? stage),
      wave: Math.min(5, Math.max(1, saved?.wave ?? 1)),
      gold: Math.max(0, saved?.gold ?? 25),
      soul: Math.max(0, saved?.soul ?? 0),
      level,
      exp: Math.max(0, saved?.exp ?? 0),
      expToNext: this.calcExpRequired(level),

      heroX: HERO_X,
      heroHp: 120,
      heroMaxHp: 120,
      heroShield: 0,
      heroState: 'run',
      heroStateTimer: 0,
      heroAttackTimer: 0,
      heroAnimTime: 0,

      feverGauge: this.isDemoMode ? 45 : 0,
      feverActiveTimer: 0,
      counterCooldown: 0,
      counterFlashTimer: 0,
      screenShake: 0,
      scrollOffset: 0,
      bannerText: '',
      bannerTimer: 0,

      upgrades,
      relics,
      cards: { ...(saved?.cards ?? {}) },
      skillCooldowns: {
        moonSlash: 0,
        flashDash: 0,
        eclipseAegis: 0,
        abyssStorm: 0,
      },

      pendingAwakenings: saved?.pendingAwakenings ?? 0,
      activeCardChoices: null,

      autoSkill: saved?.autoSkill ?? true,
      speedMult: saved?.speedMult ?? 1,
      soundEnabled: saved?.soundEnabled ?? true,
      buyMode: 1,

      enemies: [],
      floatingTexts: [],
      slashEffects: [],
      particles: [],

      totalKills: saved?.totalKills ?? 0,
      totalCounters: saved?.totalCounters ?? 0,
      totalPlaySeconds: saved?.totalPlaySeconds ?? 0,
      rebirthCount: saved?.rebirthCount ?? 0,
      recentDamageWindow: [],
    };

    this.state = state;
    const stats = this.computeStats();
    state.heroMaxHp = stats.maxHp;
    state.heroHp = stats.maxHp;
    return state;
  }

  public drainEvents(): GameEvent[] {
    if (this.eventQueue.length === 0) return [];
    const copy = this.eventQueue;
    this.eventQueue = [];
    return copy;
  }

  private emit(type: GameEvent['type'], label?: string): void {
    this.eventQueue.push({ type, label });
  }

  public calcExpRequired(level: number): number {
    return Math.floor(32 * Math.pow(1.24, level - 1));
  }

  public computeStats(): ComputedStats {
    const s = this.state;
    const c = (id: string) => s.cards[id] ?? 0;

    const baseAtk = 14 + s.upgrades.atk * 4.5 + (s.level - 1) * 1.6;
    const cardAtkMult = 1 + c('berserk_blood') * 0.22 + c('moon_resonance') * 0.28;
    const relicAtkMult = 1 + s.relics.soulBlade * 0.25;
    const feverAtkMult = s.feverActiveTimer > 0 ? 1.8 : 1;
    const atk = baseAtk * cardAtkMult * relicAtkMult * feverAtkMult;

    const baseAps = 1.18 * (1 + s.upgrades.atkSpeed * 0.05 + c('gale_blade') * 0.18 + c('moon_resonance') * 0.12);
    const aps = baseAps * (s.feverActiveTimer > 0 ? 1.65 : 1);

    const critChance = Math.min(0.88, 0.1 + s.upgrades.crit * 0.02 + c('keen_edge') * 0.08);
    const critMult = 1.65 + s.upgrades.crit * 0.08 + c('keen_edge') * 0.25 + c('eclipse_overdrive') * 0.35;

    const maxHp = Math.floor((120 + s.upgrades.maxHp * 28 + (s.level - 1) * 10) * (1 + c('iron_bastion') * 0.3));
    const regenPerSec =
      2.2 +
      s.upgrades.regen * 1.6 +
      maxHp * (0.0025 * s.upgrades.regen + 0.004 * c('iron_bastion'));

    const goldMult =
      (1 + s.upgrades.goldGain * 0.16) *
      (1 + c('golden_hunter') * 0.35) *
      (1 + s.relics.goldenGrace * 0.3);

    const lifesteal = c('vampiric_edge') * 0.05;
    const counterMult = 2.6 + c('counter_sage') * 0.6 + s.relics.counterMastery * 0.45;
    const bossDmgMult = 1 + c('boss_slayer') * 0.4 + c('moon_resonance') * 0.25;
    const chainLightningChance = Math.min(0.85, c('chain_lightning') * 0.28);
    const executeBonus = c('executioner') * 0.45;

    const avgHit = atk * (1 - critChance + critChance * critMult);
    const dps = avgHit * aps;
    const tier = getKnightTier(s.stage);

    return {
      atk,
      aps,
      critChance,
      critMult,
      maxHp,
      regenPerSec,
      goldMult,
      lifesteal,
      counterMult,
      bossDmgMult,
      chainLightningChance,
      executeBonus,
      dps,
      tierName: tier.name,
      tierIndex: tier.index,
    };
  }

  public toSaveData(): SaveData {
    const s = this.state;
    return {
      version: 1,
      stage: s.stage,
      highestStage: s.highestStage,
      wave: s.wave,
      gold: Math.floor(s.gold),
      soul: Math.floor(s.soul),
      level: s.level,
      exp: Math.floor(s.exp),
      upgrades: { ...s.upgrades },
      relics: { ...s.relics },
      cards: { ...s.cards },
      pendingAwakenings: s.pendingAwakenings,
      autoSkill: s.autoSkill,
      speedMult: s.speedMult,
      soundEnabled: s.soundEnabled,
      totalKills: s.totalKills,
      totalCounters: s.totalCounters,
      totalPlaySeconds: Math.floor(s.totalPlaySeconds),
      rebirthCount: s.rebirthCount,
      savedAt: Date.now(),
    };
  }

  public resetForNewGame(): void {
    this.state = this.createInitialState(null);
    this.spawnWave();
  }

  public getRebirthSoulReward(): number {
    if (this.state.stage < 3) return 0;
    return Math.floor(Math.pow(this.state.stage - 1, 1.45) * 2.2);
  }

  public canRebirth(): boolean {
    return this.state.stage >= 3;
  }

  public performRebirth(): number {
    if (!this.canRebirth()) return 0;
    const gainedSoul = this.getRebirthSoulReward();
    const s = this.state;
    s.soul += gainedSoul;
    s.rebirthCount += 1;
    s.stage = 1;
    s.wave = 1;
    s.level = 1;
    s.exp = 0;
    s.expToNext = this.calcExpRequired(1);
    s.gold = 25 + s.relics.swiftStart * 120;
    s.upgrades = {
      atk: 0,
      atkSpeed: 0,
      crit: 0,
      maxHp: 0,
      regen: 0,
      goldGain: 0,
    };
    s.cards = {};
    s.pendingAwakenings = 0;
    s.activeCardChoices = null;
    s.feverGauge = 0;
    s.feverActiveTimer = 0;
    s.heroShield = 0;

    const stats = this.computeStats();
    s.heroMaxHp = stats.maxHp;
    s.heroHp = stats.maxHp;
    s.bannerText = `환생 완료! 영혼 +${gainedSoul}`;
    s.bannerTimer = 2.6;
    this.emit('rebirth');
    this.spawnWave();
    return gainedSoul;
  }

  public step(rawDt: number): void {
    const dt = Math.min(0.05, rawDt) * this.state.speedMult;
    const s = this.state;

    // Pause combat while choosing awakening cards (except in demo mode)
    if (s.activeCardChoices && !this.isDemoMode) {
      this.updateVisualsOnly(rawDt);
      return;
    }

    s.totalPlaySeconds += rawDt;
    s.heroAnimTime += dt;
    s.screenShake = Math.max(0, s.screenShake - rawDt * 24);
    s.counterCooldown = Math.max(0, s.counterCooldown - dt);
    s.counterFlashTimer = Math.max(0, s.counterFlashTimer - rawDt);
    if (s.bannerTimer > 0) {
      s.bannerTimer = Math.max(0, s.bannerTimer - rawDt);
    }

    const stats = this.computeStats();
    s.heroMaxHp = stats.maxHp;
    s.heroHp = Math.min(s.heroMaxHp, s.heroHp + stats.regenPerSec * dt);

    if (s.feverActiveTimer > 0) {
      s.feverActiveTimer = Math.max(0, s.feverActiveTimer - dt);
      s.feverGauge = (s.feverActiveTimer / 8.0) * 100;
    }

    // Skill cooldowns
    for (const sk of SKILLS) {
      if (s.skillCooldowns[sk.id] > 0) {
        s.skillCooldowns[sk.id] = Math.max(0, s.skillCooldowns[sk.id] - dt);
      }
    }

    if (s.heroStateTimer > 0) {
      s.heroStateTimer -= dt;
      if (s.heroStateTimer <= 0) {
        s.heroState = 'run';
      }
    }

    // Spawn wave if empty
    if (s.enemies.length === 0) {
      this.advanceWave();
    }

    const frontEnemy = this.getFrontEnemy();
    const engageDist = frontEnemy?.isBoss ? 72 : 56;
    const inCombat = frontEnemy !== null && frontEnemy.x - s.heroX <= engageDist;

    if (!inCombat) {
      // Hero running forward; world scrolls
      const runSpeed = 94;
      s.scrollOffset += runSpeed * dt;
      for (const e of s.enemies) {
        e.x -= runSpeed * dt;
        e.animTime += dt;
      }
    } else {
      // Combat tick
      for (let i = 0; i < s.enemies.length; i++) {
        const e = s.enemies[i];
        e.animTime += dt;
        e.hitFlash = Math.max(0, e.hitFlash - rawDt * 6);
        const desiredX = s.heroX + (e.isBoss ? 70 : 52 + i * 28);
        if (e.x > desiredX) {
          e.x = Math.max(desiredX, e.x - 68 * dt);
        }

        if (e.stunTimer > 0) {
          e.stunTimer = Math.max(0, e.stunTimer - dt);
          e.windup = 0;
          continue;
        }

        // Only front-most 2 enemies attack
        if (i < 2 && e.x - s.heroX <= (e.isBoss ? 80 : 88)) {
          if (e.windup > 0) {
            e.windup += dt / e.windupDuration;
            if (e.windup >= 1) {
              e.windup = 0;
              e.attackCooldown = e.attackInterval;
              this.resolveEnemyHit(e, stats);
            }
          } else {
            e.attackCooldown -= dt;
            if (e.attackCooldown <= 0) {
              e.windup = 0.01;
            }
          }
        }
      }

      // Hero auto-attack
      s.heroAttackTimer -= dt;
      if (s.heroAttackTimer <= 0 && frontEnemy) {
        s.heroAttackTimer = 1 / stats.aps;
        this.performHeroBasicAttack(frontEnemy, stats);
      }

      // Auto-skills & auto-fever in demo mode
      if (s.autoSkill || this.isDemoMode) {
        this.tryAutoSkills();
      }
      if (this.isDemoMode && s.feverGauge >= 100 && s.feverActiveTimer <= 0) {
        this.triggerFever();
      }
    }

    this.cleanupDeadEnemies(stats);
    this.updateVisualsOnly(dt);
  }

  private updateVisualsOnly(dt: number): void {
    const s = this.state;
    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      const ft = s.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      ft.life -= dt;
      if (ft.life <= 0) s.floatingTexts.splice(i, 1);
    }

    for (let i = s.slashEffects.length - 1; i >= 0; i--) {
      const fx = s.slashEffects[i];
      fx.life -= dt;
      if (fx.life <= 0) s.slashEffects.splice(i, 1);
    }

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
  }

  private getFrontEnemy(): EnemyEntity | null {
    if (this.state.enemies.length === 0) return null;
    let front = this.state.enemies[0];
    for (const e of this.state.enemies) {
      if (e.x < front.x) front = e;
    }
    return front;
  }

  private performHeroBasicAttack(target: EnemyEntity, stats: ComputedStats): void {
    const s = this.state;
    s.heroState = 'attack';
    s.heroStateTimer = Math.min(0.24, 0.7 / stats.aps);

    const isCrit = Math.random() < stats.critChance;
    let dmg = stats.atk * (0.94 + Math.random() * 0.12);
    if (isCrit) dmg *= stats.critMult;
    if (target.isBoss) dmg *= stats.bossDmgMult;
    if (target.hp / target.maxHp <= 0.4 && stats.executeBonus > 0) {
      dmg *= 1 + stats.executeBonus;
    }

    this.dealDamageToEnemy(target, dmg, isCrit ? 'crit' : 'normal', stats);
    this.addFever(4.5);

    if (stats.chainLightningChance > 0 && Math.random() < stats.chainLightningChance) {
      for (const other of s.enemies) {
        if (other.id !== target.id && other.hp > 0) {
          this.dealDamageToEnemy(other, stats.atk * 1.1, 'storm', stats);
          break;
        }
      }
    }

    this.emit(isCrit ? 'crit' : 'slash');
  }

  private resolveEnemyHit(attacker: EnemyEntity, stats: ComputedStats): void {
    const s = this.state;
    const autoCounterChance = Math.min(0.45, 0.14 + (s.cards['counter_sage'] ?? 0) * 0.06);
    if (Math.random() < autoCounterChance) {
      this.executeCounterSlash(attacker, stats, true);
      return;
    }

    let dmg = attacker.atk;
    if (s.heroShield > 0) {
      const absorbed = Math.min(s.heroShield, dmg);
      s.heroShield -= absorbed;
      dmg -= absorbed;
    }

    if (dmg > 0) {
      s.heroHp = Math.max(0, s.heroHp - dmg);
      s.heroState = 'hurt';
      s.heroStateTimer = 0.16;
      s.screenShake = Math.max(s.screenShake, 3);
      this.spawnText(s.heroX, GROUND_Y - 46, `-${Math.round(dmg)}`, '#fb7185', 11);
    }

    if (s.heroHp <= 0) {
      this.handleHeroDefeat();
    }
  }

  public triggerManualCounter(): boolean {
    const s = this.state;
    if (s.counterCooldown > 0 || s.enemies.length === 0) return false;

    const stats = this.computeStats();
    const windingEnemy = s.enemies.find((e) => e.windup > 0.12);
    const target = windingEnemy ?? this.getFrontEnemy();
    if (!target) return false;

    const isPerfect = Boolean(windingEnemy);
    s.counterCooldown = isPerfect ? 1.4 : 2.8;
    this.executeCounterSlash(target, stats, isPerfect);
    return true;
  }

  private executeCounterSlash(target: EnemyEntity, stats: ComputedStats, isPerfect: boolean): void {
    const s = this.state;
    s.heroState = 'counter';
    s.heroStateTimer = 0.34;
    s.counterFlashTimer = isPerfect ? 0.28 : 0.14;
    s.screenShake = isPerfect ? 7 : 4;
    s.totalCounters += 1;

    target.windup = 0;
    target.attackCooldown = target.attackInterval;
    target.stunTimer = Math.max(target.stunTimer, isPerfect ? 1.15 : 0.45);

    const mult = stats.counterMult * (isPerfect ? 1.25 : 0.85);
    const dmg = stats.atk * mult * (target.isBoss ? stats.bossDmgMult : 1);
    this.dealDamageToEnemy(target, dmg, 'counter', stats);

    this.spawnText(
      s.heroX + 18,
      GROUND_Y - 64,
      isPerfect ? '⚡ 일섬 반격!' : '반격 베기!',
      '#fde047',
      isPerfect ? 13 : 11,
      true
    );

    if (isPerfect) {
      const bonusGold = Math.max(3, Math.floor(s.stage * 4 * stats.goldMult));
      s.gold += bonusGold;
      this.addFever(14);
      this.spawnBurst(target.x, GROUND_Y - 24, '#fde047', 12);
    } else {
      this.addFever(7);
      this.spawnBurst(target.x, GROUND_Y - 24, '#38bdf8', 7);
    }

    this.emit('counter');
  }

  public castSkill(skillId: SkillId): boolean {
    const s = this.state;
    const def = SKILLS.find((sk) => sk.id === skillId);
    if (!def) return false;
    if (s.stage < def.unlockStage && !this.isDemoMode) return false;
    if (s.skillCooldowns[skillId] > 0) return false;
    if (skillId !== 'eclipseAegis' && s.enemies.length === 0) return false;

    const stats = this.computeStats();
    s.skillCooldowns[skillId] = def.cooldown;
    s.heroState = 'attack';
    s.heroStateTimer = 0.3;

    if (skillId === 'moonSlash') {
      s.screenShake = 5;
      for (const e of s.enemies) {
        if (e.x - s.heroX < 185) {
          this.dealDamageToEnemy(e, stats.atk * 2.8, 'moon', stats);
        }
      }
      s.slashEffects.push({
        id: this.nextEntityId++,
        x: s.heroX + 54,
        y: GROUND_Y - 24,
        kind: 'moon',
        life: 0.34,
        maxLife: 0.34,
        radius: 48,
      });
      this.addFever(12);
    } else if (skillId === 'flashDash') {
      const front = this.getFrontEnemy();
      if (front) {
        front.stunTimer = Math.max(front.stunTimer, 1.4);
        front.windup = 0;
        this.dealDamageToEnemy(front, stats.atk * 3.6, 'counter', stats);
        this.spawnBurst(front.x, GROUND_Y - 24, '#38bdf8', 10);
      }
      s.screenShake = 6;
      this.addFever(14);
    } else if (skillId === 'eclipseAegis') {
      const shieldAmt = Math.floor(stats.maxHp * 0.35);
      const healAmt = Math.floor(stats.maxHp * 0.2);
      s.heroShield = Math.max(s.heroShield, shieldAmt);
      s.heroHp = Math.min(stats.maxHp, s.heroHp + healAmt);
      s.slashEffects.push({
        id: this.nextEntityId++,
        x: s.heroX,
        y: GROUND_Y - 24,
        kind: 'heal',
        life: 0.42,
        maxLife: 0.42,
        radius: 34,
      });
      this.spawnText(s.heroX, GROUND_Y - 56, `+${healAmt} 보호막`, '#34d399', 11, true);
    } else if (skillId === 'abyssStorm') {
      s.screenShake = 8;
      for (const e of s.enemies) {
        this.dealDamageToEnemy(e, stats.atk * 5.2, 'storm', stats);
        s.slashEffects.push({
          id: this.nextEntityId++,
          x: e.x,
          y: GROUND_Y - 28,
          kind: 'storm',
          life: 0.4,
          maxLife: 0.4,
          radius: 38,
        });
      }
      this.addFever(18);
    }

    this.emit('skill', def.name);
    return true;
  }

  private tryAutoSkills(): void {
    const s = this.state;
    const front = this.getFrontEnemy();
    if (!front || front.x - s.heroX > 140) return;

    if (s.heroHp < s.heroMaxHp * 0.68 && s.skillCooldowns.eclipseAegis <= 0 && s.stage >= 2) {
      this.castSkill('eclipseAegis');
      return;
    }
    if (s.skillCooldowns.abyssStorm <= 0 && s.stage >= 3) {
      this.castSkill('abyssStorm');
      return;
    }
    if (s.skillCooldowns.flashDash <= 0) {
      this.castSkill('flashDash');
      return;
    }
    if (s.skillCooldowns.moonSlash <= 0) {
      this.castSkill('moonSlash');
    }
  }

  public triggerFever(): boolean {
    const s = this.state;
    if (s.feverGauge < 100 || s.feverActiveTimer > 0) return false;
    s.feverActiveTimer = 8.0;
    s.screenShake = 9;
    s.bannerText = '🌑 흑월 폭주 발동!';
    s.bannerTimer = 1.8;
    this.spawnBurst(s.heroX, GROUND_Y - 24, '#f5b942', 18);
    this.emit('feverStart');
    return true;
  }

  private addFever(amount: number): void {
    const s = this.state;
    if (s.feverActiveTimer > 0) return;
    const boost = 1 + (s.cards['eclipse_overdrive'] ?? 0) * 0.45;
    s.feverGauge = Math.min(100, s.feverGauge + amount * boost);
  }

  private dealDamageToEnemy(
    enemy: EnemyEntity,
    rawDmg: number,
    kind: 'normal' | 'crit' | 'counter' | 'moon' | 'storm',
    stats: ComputedStats
  ): void {
    const dmg = Math.max(1, Math.round(rawDmg));
    enemy.hp -= dmg;
    enemy.hitFlash = 1;

    if (stats.lifesteal > 0) {
      this.state.heroHp = Math.min(stats.maxHp, this.state.heroHp + dmg * stats.lifesteal);
    }

    const colorMap = {
      normal: '#f8fafc',
      crit: '#fbbf24',
      counter: '#38bdf8',
      moon: '#f5b942',
      storm: '#c084fc',
    };

    const sizeMap = {
      normal: 11,
      crit: 14,
      counter: 15,
      moon: 13,
      storm: 14,
    };

    this.spawnText(
      enemy.x + (Math.random() - 0.5) * 18,
      GROUND_Y - (enemy.isBoss ? 56 : 36),
      kind === 'crit' ? `${dmg}!` : `${dmg}`,
      colorMap[kind],
      sizeMap[kind],
      kind !== 'normal'
    );

    this.state.slashEffects.push({
      id: this.nextEntityId++,
      x: enemy.x,
      y: GROUND_Y - (enemy.isBoss ? 28 : 18),
      kind,
      life: 0.22,
      maxLife: 0.22,
      radius: enemy.isBoss ? 34 : 24,
    });

    this.spawnBurst(enemy.x, GROUND_Y - 20, colorMap[kind], kind === 'normal' ? 4 : 8);
  }

  private cleanupDeadEnemies(stats: ComputedStats): void {
    const s = this.state;
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      if (e.hp > 0) continue;

      s.enemies.splice(i, 1);
      s.totalKills += 1;

      const goldGain = Math.max(1, Math.round(e.goldReward * stats.goldMult));
      s.gold += goldGain;
      this.spawnText(e.x, GROUND_Y - 12, `+${goldGain}G`, '#fde047', 10);
      this.spawnBurst(e.x, GROUND_Y - 16, '#fbbf24', e.isBoss ? 22 : 10);

      if (e.soulReward > 0) {
        s.soul += e.soulReward;
        this.spawnText(e.x, GROUND_Y - 46, `+${e.soulReward} SOUL`, '#c084fc', 12, true);
      }

      this.gainExp(e.expReward);

      if (e.isBoss) {
        s.bannerText = `STAGE ${s.stage} 돌파!`;
        s.bannerTimer = 2.0;
        this.emit('bossKill');
        if (!this.isDemoMode) {
          s.pendingAwakenings += 1;
          this.openAwakeningIfReady();
        }
      }
    }
  }

  private gainExp(amount: number): void {
    const s = this.state;
    s.exp += amount;
    while (s.exp >= s.expToNext) {
      s.exp -= s.expToNext;
      s.level += 1;
      s.expToNext = this.calcExpRequired(s.level);
      const stats = this.computeStats();
      s.heroMaxHp = stats.maxHp;
      s.heroHp = stats.maxHp;
      this.spawnText(s.heroX, GROUND_Y - 60, `LEVEL UP! LV.${s.level}`, '#34d399', 12, true);
      this.emit('levelUp');

      if (!this.isDemoMode && s.level % 3 === 0) {
        s.pendingAwakenings += 1;
        this.openAwakeningIfReady();
      }
    }
  }

  private handleHeroDefeat(): void {
    const s = this.state;
    const stats = this.computeStats();
    s.heroHp = stats.maxHp;
    s.heroShield = 0;
    s.wave = 1;
    if (s.stage > 1) {
      s.stage -= 1;
    }
    s.enemies = [];
    s.bannerText = '전열 재정비 — 이전 웨이브로 복귀';
    s.bannerTimer = 2.0;
    this.emit('heroDie');
    this.spawnWave();
  }

  private advanceWave(): void {
    const s = this.state;
    if (s.wave < 5) {
      s.wave += 1;
    } else {
      s.stage += 1;
      s.highestStage = Math.max(s.highestStage, s.stage);
      s.wave = 1;
    }
    this.spawnWave();
  }

  private spawnWave(): void {
    const s = this.state;
    const biome = getBiomeForStage(s.stage);
    const isBossWave = s.wave === 5;
    const scaleFactor = Math.pow(1.36, s.stage - 1) * (1 + (s.wave - 1) * 0.14);

    if (isBossWave) {
      const maxHp = Math.round(165 * scaleFactor);
      s.enemies = [
        {
          id: this.nextEntityId++,
          kind: 'boss',
          name: biome.bossName,
          isBoss: true,
          x: ARENA_WIDTH + 34,
          y: GROUND_Y,
          hp: maxHp,
          maxHp,
          atk: Math.round(14 * Math.pow(1.25, s.stage - 1)),
          attackCooldown: 1.5,
          attackInterval: 2.25,
          windup: 0,
          windupDuration: 0.78,
          stunTimer: 0,
          hitFlash: 0,
          scale: 1.65,
          animTime: 0,
          goldReward: Math.round(45 * Math.pow(1.32, s.stage - 1)),
          expReward: Math.round(36 * Math.pow(1.22, s.stage - 1)),
          soulReward: Math.max(1, Math.floor(s.stage * 0.65) + 1),
        },
      ];
      s.bannerText = `⚠ BOSS · ${biome.bossName}`;
      s.bannerTimer = 1.9;
      this.emit('bossWarning', biome.bossName);
      return;
    }

    const count = Math.min(4, 2 + Math.floor((s.stage + s.wave) / 4));
    s.enemies = [];
    for (let i = 0; i < count; i++) {
      const kind = biome.enemyPool[(s.wave + i) % biome.enemyPool.length];
      const hpMult = kind === 'knight' || kind === 'gargoyle' ? 1.25 : kind === 'bat' ? 0.82 : 1;
      const maxHp = Math.round(42 * scaleFactor * hpMult);
      s.enemies.push({
        id: this.nextEntityId++,
        kind,
        name: ENEMY_NAMES[kind],
        isBoss: false,
        x: ARENA_WIDTH + 24 + i * 38,
        y: GROUND_Y,
        hp: maxHp,
        maxHp,
        atk: Math.round(6.5 * Math.pow(1.22, s.stage - 1)),
        attackCooldown: 0.9 + i * 0.4,
        attackInterval: 1.9,
        windup: 0,
        windupDuration: 0.65,
        stunTimer: 0,
        hitFlash: 0,
        scale: 1,
        animTime: i * 0.6,
        goldReward: Math.round(8 * Math.pow(1.28, s.stage - 1)),
        expReward: Math.round(10 * Math.pow(1.2, s.stage - 1)),
        soulReward: 0,
      });
    }
  }

  public getUpgradeBatchInfo(key: UpgradeKey, mode: BuyMode = this.state.buyMode): {
    count: number;
    totalCost: number;
    canAfford: boolean;
  } {
    const def = UPGRADES.find((u) => u.key === key)!;
    let level = this.state.upgrades[key];
    let totalCost = 0;
    let count = 0;

    if (mode === 'MAX') {
      while (count < 100) {
        const nextCost = getUpgradeCost(def, level);
        if (totalCost + nextCost > this.state.gold) break;
        totalCost += nextCost;
        level += 1;
        count += 1;
      }
      if (count === 0) {
        return { count: 1, totalCost: getUpgradeCost(def, level), canAfford: false };
      }
      return { count, totalCost, canAfford: true };
    }

    for (let i = 0; i < mode; i++) {
      totalCost += getUpgradeCost(def, level + i);
    }
    return {
      count: mode,
      totalCost,
      canAfford: this.state.gold >= totalCost,
    };
  }

  public buyUpgrade(key: UpgradeKey): boolean {
    const batch = this.getUpgradeBatchInfo(key, this.state.buyMode);
    if (!batch.canAfford) return false;
    this.state.gold -= batch.totalCost;
    this.state.upgrades[key] += batch.count;

    const stats = this.computeStats();
    const prevMax = this.state.heroMaxHp;
    this.state.heroMaxHp = stats.maxHp;
    if (stats.maxHp > prevMax) {
      this.state.heroHp += stats.maxHp - prevMax;
    }

    this.emit('upgrade');
    return true;
  }

  public buyRelic(key: RelicKey): boolean {
    const def = RELICS.find((r) => r.key === key)!;
    const lv = this.state.relics[key];
    if (lv >= def.maxLevel) return false;
    const cost = getRelicCost(def, lv);
    if (this.state.soul < cost) return false;

    this.state.soul -= cost;
    this.state.relics[key] += 1;
    this.emit('upgrade');
    return true;
  }

  public openAwakeningIfReady(): boolean {
    const s = this.state;
    if (s.activeCardChoices || s.pendingAwakenings <= 0) return false;

    const available = AWAKENING_CARDS.filter((card) => (s.cards[card.id] ?? 0) < card.maxStack);
    if (available.length === 0) {
      s.pendingAwakenings = 0;
      return false;
    }

    const pool = [...available];
    const picked: AwakeningCardDef[] = [];
    while (picked.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    s.activeCardChoices = picked;
    return true;
  }

  public chooseAwakeningCard(cardId: string): boolean {
    const s = this.state;
    if (!s.activeCardChoices) return false;
    const chosen = s.activeCardChoices.find((c) => c.id === cardId);
    if (!chosen) return false;

    s.cards[cardId] = (s.cards[cardId] ?? 0) + 1;
    s.pendingAwakenings = Math.max(0, s.pendingAwakenings - 1);
    s.activeCardChoices = null;
    s.bannerText = `각성 획득 · ${chosen.name}`;
    s.bannerTimer = 1.8;
    this.emit('levelUp');

    if (s.pendingAwakenings > 0) {
      this.openAwakeningIfReady();
    }
    return true;
  }

  private spawnText(
    x: number,
    y: number,
    text: string,
    color: string,
    size: number,
    bold = false
  ): void {
    this.state.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y,
      vy: -36,
      text,
      color,
      size,
      life: 0.78,
      maxLife: 0.78,
      bold,
    });
  }

  private spawnBurst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 28 + Math.random() * 88;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: 2 + Math.floor(Math.random() * 2),
        color,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }
}
