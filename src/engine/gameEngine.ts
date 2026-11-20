import {
  COMPANIONS,
  FACILITIES,
  RARITY_CONFIG,
  STANCES,
  TRAININGS,
  createStarterEquipment,
  getCompanionCost,
  getFacilityCost,
  getForgeLevel,
  getForgeOreCost,
  getKnightRankTitle,
  getTrainingCost,
  getZoneForStage,
  rollForgedItem,
} from './data';
import type {
  CompanionId,
  ComputedStats,
  EnemyEntity,
  EnemyKind,
  FacilityKey,
  GameEvent,
  GameState,
  SaveData,
  StanceId,
  TrainingKey,
} from './types';

export const ARENA_WIDTH = 360;
export const ARENA_HEIGHT = 250;
export const HERO_X = 128;
export const GROUND_Y = 192;

const ENEMY_NAMES: Record<EnemyKind, string> = {
  goblin: '초원 고블린',
  boar: '야생 멧돼지',
  bandit: '협곡 산적',
  scorpion: '사막 전갈',
  bogling: '늪지 괴수',
  golem: '서리 골렘',
  wyvern: '화염 와이번',
  boss: '구역 우두머리',
};

export class BangchiEngine {
  public state: GameState;
  private nextId = 1;
  private events: GameEvent[] = [];
  private demoMode: boolean;

  constructor(saved?: SaveData | null, options?: { demoMode?: boolean }) {
    this.demoMode = Boolean(options?.demoMode);
    this.state = this.createInitialState(saved);
    this.spawnWave();
  }

  private createInitialState(saved?: SaveData | null): GameState {
    const starterEq = createStarterEquipment();
    const state: GameState = {
      stage: Math.max(1, saved?.stage ?? 1),
      highestStage: Math.max(saved?.stage ?? 1, saved?.highestStage ?? 1),
      wave: Math.min(5, Math.max(1, saved?.wave ?? 1)),
      gold: Math.max(0, saved?.gold ?? 40),
      ore: Math.max(0, saved?.ore ?? 12),
      medals: Math.max(0, saved?.medals ?? 0),
      forgeExp: Math.max(0, saved?.forgeExp ?? 0),

      stance: saved?.stance ?? 'vanguard',
      equipment: saved?.equipment
        ? {
            weapon: { ...saved.equipment.weapon },
            shield: { ...saved.equipment.shield },
            armor: { ...saved.equipment.armor },
          }
        : starterEq,
      pendingForgeItem: null,

      training: {
        swordplay: saved?.training?.swordplay ?? 0,
        fortitude: saved?.training?.fortitude ?? 0,
        logistics: saved?.training?.logistics ?? 0,
      },
      companions: {
        ranger: saved?.companions?.ranger ?? (this.demoMode ? 2 : 0),
        pyro: saved?.companions?.pyro ?? (this.demoMode ? 1 : 0),
        banneret: saved?.companions?.banneret ?? (this.demoMode ? 1 : 0),
      },
      facilities: {
        royalForge: saved?.facilities?.royalForge ?? 0,
        warAcademy: saved?.facilities?.warAcademy ?? 0,
        supplyWagon: saved?.facilities?.supplyWagon ?? 0,
        guildHall: saved?.facilities?.guildHall ?? 0,
      },

      heroHp: 180,
      heroMaxHp: 180,
      heroShield: 0,
      heroAction: 'march',
      heroActionTimer: 0,
      heroAttackTimer: 0,
      animTime: 0,
      scrollX: 0,

      companionTimers: { ranger: 0.4, pyro: 1.0, banneret: 1.6 },

      morale: this.demoMode ? 65 : 20,
      rallyTimer: 0,
      screenShake: 0,
      bannerText: '',
      bannerTimer: 0,

      speedMult: saved?.speedMult ?? 1,
      autoRally: saved?.autoRally ?? false,
      soundEnabled: saved?.soundEnabled ?? true,

      enemies: [],
      projectiles: [],
      floatingTexts: [],
      particles: [],

      totalKills: saved?.totalKills ?? 0,
      totalForges: saved?.totalForges ?? 0,
      expeditionReturns: saved?.expeditionReturns ?? 0,
      totalPlaySeconds: saved?.totalPlaySeconds ?? 0,
    };

    this.state = state;
    const stats = this.computeStats();
    state.heroMaxHp = stats.maxHp;
    state.heroHp = stats.maxHp;
    return state;
  }

  public drainEvents(): GameEvent[] {
    if (this.events.length === 0) return [];
    const copy = this.events;
    this.events = [];
    return copy;
  }

  private emit(type: GameEvent['type']): void {
    this.events.push({ type });
  }

  public getActiveStance() {
    return STANCES.find((st) => st.id === this.state.stance) ?? STANCES[0];
  }

  public computeStats(): ComputedStats {
    const s = this.state;
    const stance = this.getActiveStance();
    const forgeMult = 1 + s.facilities.royalForge * 0.2;
    const academyMult = 1 + s.facilities.warAcademy * 0.25;
    const supplyMult = 1 + s.facilities.supplyWagon * 0.3;

    const eqList = [s.equipment.weapon, s.equipment.shield, s.equipment.armor];
    let bonusCrit = 0;
    let bonusSpeed = 0;
    let bonusGold = 0;
    let bonusHp = 0;
    for (const item of eqList) {
      if (item.bonusStat === 'crit') bonusCrit += item.bonusValue;
      if (item.bonusStat === 'speed') bonusSpeed += item.bonusValue;
      if (item.bonusStat === 'gold') bonusGold += item.bonusValue;
      if (item.bonusStat === 'hp') bonusHp += item.bonusValue;
    }

    const rallyAtkMult = s.rallyTimer > 0 ? 1.55 : 1;
    const rallyApsMult = s.rallyTimer > 0 ? 1.4 : 1;

    const weaponAtk = s.equipment.weapon.power * forgeMult;
    const baseAtk = 10 + weaponAtk + s.training.swordplay * 5;
    const atk = baseAtk * academyMult * stance.atkMult * rallyAtkMult;

    const aps = 1.12 * (1 + bonusSpeed) * stance.apsMult * rallyApsMult;
    const critChance = Math.min(0.8, 0.1 + s.training.swordplay * 0.006 + bonusCrit);
    const critMult = 1.75;

    const shieldHp = s.equipment.shield.power * forgeMult;
    const maxHp = Math.round((135 + shieldHp + s.training.fortitude * 32) * (1 + bonusHp));
    const def = Math.round(s.equipment.armor.power * forgeMult);
    const regenPerSec = 2.6 + s.training.fortitude * 2.2 + maxHp * 0.006;

    const goldMult = (1 + s.training.logistics * 0.15 + bonusGold) * stance.lootMult * supplyMult;
    const oreMult = (1 + s.training.logistics * 0.12) * stance.lootMult * supplyMult;

    const heroDps = atk * (1 - critChance + critChance * critMult) * aps;
    const rangerDps =
      s.companions.ranger > 0
        ? (atk * (0.48 + s.companions.ranger * 0.16)) / COMPANIONS[0].interval
        : 0;
    const pyroDps =
      s.companions.pyro > 0
        ? (atk * (0.95 + s.companions.pyro * 0.28) * 1.6) / COMPANIONS[1].interval
        : 0;

    return {
      atk,
      aps,
      critChance,
      critMult,
      maxHp,
      def,
      regenPerSec,
      goldMult,
      oreMult,
      dps: heroDps + rangerDps + pyroDps,
      forgeLevel: getForgeLevel(s.forgeExp),
      rankTitle: getKnightRankTitle(s.highestStage),
    };
  }

  public toSaveData(): SaveData {
    const s = this.state;
    return {
      version: 2,
      stage: s.stage,
      highestStage: s.highestStage,
      wave: s.wave,
      gold: Math.floor(s.gold),
      ore: Math.floor(s.ore),
      medals: Math.floor(s.medals),
      forgeExp: s.forgeExp,
      stance: s.stance,
      equipment: {
        weapon: { ...s.equipment.weapon },
        shield: { ...s.equipment.shield },
        armor: { ...s.equipment.armor },
      },
      training: { ...s.training },
      companions: { ...s.companions },
      facilities: { ...s.facilities },
      speedMult: s.speedMult,
      autoRally: s.autoRally,
      soundEnabled: s.soundEnabled,
      totalKills: s.totalKills,
      totalForges: s.totalForges,
      expeditionReturns: s.expeditionReturns,
      totalPlaySeconds: Math.floor(s.totalPlaySeconds),
      savedAt: Date.now(),
    };
  }

  public resetGame(): void {
    this.state = this.createInitialState(null);
    this.spawnWave();
  }

  public setStance(stance: StanceId): void {
    if (this.state.stance === stance) return;
    this.state.stance = stance;
    const def = this.getActiveStance();
    this.state.bannerText = `${def.icon} ${def.name} 진형 전환!`;
    this.state.bannerTimer = 1.4;
    this.spawnBurst(HERO_X, GROUND_Y - 22, def.color, 10);
    this.emit('stance');
  }

  public triggerRally(): boolean {
    const s = this.state;
    if (s.morale < 100 || s.rallyTimer > 0) return false;
    s.rallyTimer = 9.0;
    s.screenShake = 6;
    s.bannerText = '🎺 진격 나팔! 전군 돌격 개시!';
    s.bannerTimer = 2.0;

    // Immediate Warhorn Volley: knight + all unlocked companions strike!
    const stats = this.computeStats();
    s.heroHp = Math.min(stats.maxHp, s.heroHp + stats.maxHp * 0.25);
    s.heroShield = Math.max(s.heroShield, Math.round(stats.maxHp * 0.25));
    for (const enemy of s.enemies) {
      this.damageEnemy(enemy, stats.atk * 2.4, true, '#fde047');
    }
    this.spawnBurst(HERO_X, GROUND_Y - 24, '#facc15', 16);
    this.emit('rally');
    return true;
  }

  public getForgeCost(): number {
    return getForgeOreCost(getForgeLevel(this.state.forgeExp));
  }

  public forgeEquipment(): boolean {
    const s = this.state;
    if (s.pendingForgeItem) return false;
    const cost = this.getForgeCost();
    if (s.ore < cost) return false;

    s.ore -= cost;
    s.forgeExp += 1;
    s.totalForges += 1;
    const item = rollForgedItem(s.stage, getForgeLevel(s.forgeExp), `eq-${Date.now()}-${this.nextId++}`);
    s.pendingForgeItem = item;
    this.emit(item.rarity === 'epic' || item.rarity === 'mythic' ? 'forgeRare' : 'forge');
    return true;
  }

  public resolveForgedItem(equip: boolean): void {
    const s = this.state;
    const item = s.pendingForgeItem;
    if (!item) return;

    const rarityCfg = RARITY_CONFIG[item.rarity];
    if (equip) {
      const old = s.equipment[item.slot];
      s.equipment[item.slot] = item;
      const salvageGold = Math.round(12 * old.level * RARITY_CONFIG[old.rarity].mult);
      s.gold += salvageGold;
      s.bannerText = `🔨 ${item.name} 장착 완료! (+${salvageGold}G)`;
      s.bannerTimer = 1.6;
    } else {
      const salvageGold = Math.round(18 * item.level * rarityCfg.mult);
      const salvageOre = Math.max(1, Math.floor(this.getForgeCost() * 0.35));
      s.gold += salvageGold;
      s.ore += salvageOre;
      s.forgeExp += 1;
    }

    s.pendingForgeItem = null;
    const stats = this.computeStats();
    s.heroMaxHp = stats.maxHp;
    s.heroHp = Math.min(stats.maxHp, s.heroHp + 20);
    this.emit('upgrade');
  }

  public buyTraining(key: TrainingKey): boolean {
    const def = TRAININGS.find((t) => t.key === key)!;
    const cost = getTrainingCost(def, this.state.training[key]);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.training[key] += 1;
    const stats = this.computeStats();
    this.state.heroMaxHp = stats.maxHp;
    if (key === 'fortitude') {
      this.state.heroHp = Math.min(stats.maxHp, this.state.heroHp + 32);
    }
    this.emit('upgrade');
    return true;
  }

  public buyCompanion(id: CompanionId): boolean {
    const def = COMPANIONS.find((c) => c.id === id)!;
    const lv = this.state.companions[id];
    const cost = getCompanionCost(def, lv);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.companions[id] = lv + 1;
    if (lv === 0) {
      this.state.bannerText = `${def.icon} ${def.name} 원정대 합류!`;
      this.state.bannerTimer = 1.8;
    }
    this.emit('upgrade');
    return true;
  }

  public buyFacility(key: FacilityKey): boolean {
    const def = FACILITIES.find((f) => f.key === key)!;
    const lv = this.state.facilities[key];
    if (lv >= def.maxLevel) return false;
    const cost = getFacilityCost(def, lv);
    if (this.state.medals < cost) return false;
    this.state.medals -= cost;
    this.state.facilities[key] = lv + 1;
    this.emit('upgrade');
    return true;
  }

  public canReturnToKingdom(): boolean {
    return this.state.stage >= 4;
  }

  public getReturnMedalReward(): number {
    if (!this.canReturnToKingdom()) return 0;
    return Math.floor(Math.pow(this.state.stage - 2, 1.45) * 2.5);
  }

  public performKingdomReturn(): number {
    if (!this.canReturnToKingdom()) return 0;
    const reward = this.getReturnMedalReward();
    const s = this.state;
    s.medals += reward;
    s.expeditionReturns += 1;
    s.stage = 1;
    s.wave = 1;
    s.gold = 40 + s.facilities.guildHall * 120;
    s.ore = 12 + s.facilities.guildHall * 12;
    s.training = { swordplay: 0, fortitude: 0, logistics: 0 };
    s.companions = { ranger: 0, pyro: 0, banneret: 0 };
    s.equipment = createStarterEquipment();
    s.pendingForgeItem = null;
    s.morale = 25;
    s.rallyTimer = 0;
    s.heroShield = 0;
    const stats = this.computeStats();
    s.heroMaxHp = stats.maxHp;
    s.heroHp = stats.maxHp;
    s.bannerText = `🏰 왕국 귀환! 훈장 +${reward} 획득`;
    s.bannerTimer = 2.4;
    this.emit('returnKingdom');
    this.spawnWave();
    return reward;
  }

  public step(rawDt: number): void {
    const dt = Math.min(0.05, rawDt) * this.state.speedMult;
    const s = this.state;

    s.totalPlaySeconds += rawDt;
    s.animTime += dt;
    s.screenShake = Math.max(0, s.screenShake - rawDt * 22);
    if (s.bannerTimer > 0) s.bannerTimer = Math.max(0, s.bannerTimer - rawDt);
    if (s.heroActionTimer > 0) {
      s.heroActionTimer -= dt;
      if (s.heroActionTimer <= 0) s.heroAction = 'march';
    }

    const stats = this.computeStats();
    const stance = this.getActiveStance();
    s.heroMaxHp = stats.maxHp;
    s.heroHp = Math.min(stats.maxHp, s.heroHp + stats.regenPerSec * dt);

    if (stance.shieldRegenRatio > 0) {
      const cap = Math.round(stats.maxHp * 0.38);
      s.heroShield = Math.min(cap, s.heroShield + stats.maxHp * stance.shieldRegenRatio * dt);
    } else if (s.rallyTimer <= 0 && s.heroShield > 0) {
      s.heroShield = Math.max(0, s.heroShield - stats.maxHp * 0.03 * dt);
    }

    if (s.rallyTimer > 0) {
      s.rallyTimer = Math.max(0, s.rallyTimer - dt);
      s.morale = (s.rallyTimer / 9.0) * 100;
    }

    if (s.enemies.length === 0) {
      this.advanceWave();
    }

    const front = this.getFrontEnemy();
    const engageDist = front?.isBoss ? 68 : 54;
    const inCombat = front !== null && front.x - HERO_X <= engageDist;

    if (!inCombat) {
      const speed = (s.stance === 'plunder' ? 112 : 90) * (s.rallyTimer > 0 ? 1.25 : 1);
      s.scrollX += speed * dt;
      for (const e of s.enemies) {
        e.x -= speed * dt;
        e.animTime += dt;
      }
    } else {
      // Enemy AI
      for (let i = 0; i < s.enemies.length; i++) {
        const e = s.enemies[i];
        e.animTime += dt;
        e.hitFlash = Math.max(0, e.hitFlash - rawDt * 6);
        const stopX = HERO_X + (e.isBoss ? 66 : 48 + i * 28);
        if (e.x > stopX) {
          e.x = Math.max(stopX, e.x - 62 * dt);
        }
        if (i < 2 && e.x - HERO_X <= (e.isBoss ? 76 : 82)) {
          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = e.attackInterval;
            this.resolveEnemyAttack(e, stats, stance.dmgTakenMult);
          }
        }
      }

      // Knight basic attack
      s.heroAttackTimer -= dt;
      if (s.heroAttackTimer <= 0 && front) {
        s.heroAttackTimer = 1 / stats.aps;
        this.performKnightSwing(front, stats);
      }

      // Companions active support!
      this.tickCompanions(dt, stats);

      if ((s.autoRally || this.demoMode) && s.morale >= 100 && s.rallyTimer <= 0) {
        this.triggerRally();
      }
    }

    this.tickProjectiles(dt);
    this.cleanupDeadEnemies(stats);
    this.tickParticlesAndTexts(dt);
  }

  private tickCompanions(dt: number, stats: ComputedStats): void {
    const s = this.state;
    const speedBoost = s.rallyTimer > 0 ? 1.45 : 1;

    // 1. Ranger shoots arrows
    if (s.companions.ranger > 0 && s.enemies.length > 0) {
      s.companionTimers.ranger -= dt * speedBoost;
      if (s.companionTimers.ranger <= 0) {
        s.companionTimers.ranger = COMPANIONS[0].interval;
        const dmg = stats.atk * (0.48 + s.companions.ranger * 0.16);
        s.projectiles.push({
          id: this.nextId++,
          kind: 'arrow',
          x: HERO_X - 38,
          y: GROUND_Y - 22,
          vx: 260,
          vy: 0,
          damage: dmg,
          color: '#86efac',
          life: 1.2,
        });
        this.emit('arrow');
      }
    }

    // 2. Pyromancer launches AoE fireballs
    if (s.companions.pyro > 0 && s.enemies.length > 0) {
      s.companionTimers.pyro -= dt * speedBoost;
      if (s.companionTimers.pyro <= 0) {
        s.companionTimers.pyro = COMPANIONS[1].interval;
        const dmg = stats.atk * (0.95 + s.companions.pyro * 0.28);
        s.projectiles.push({
          id: this.nextId++,
          kind: 'fireball',
          x: HERO_X - 70,
          y: GROUND_Y - 28,
          vx: 185,
          vy: -16,
          damage: dmg,
          color: '#fb923c',
          life: 1.6,
        });
        this.emit('fireball');
      }
    }

    // 3. Banneret heals knight & fills Warhorn morale
    if (s.companions.banneret > 0) {
      s.companionTimers.banneret -= dt * speedBoost;
      if (s.companionTimers.banneret <= 0) {
        s.companionTimers.banneret = COMPANIONS[2].interval;
        const healAmt = Math.round(stats.maxHp * (0.07 + s.companions.banneret * 0.015));
        s.heroHp = Math.min(stats.maxHp, s.heroHp + healAmt);
        this.addMorale(8 + s.companions.banneret * 1.5);
        this.spawnText(HERO_X, GROUND_Y - 52, `+${healAmt}`, '#4ade80', 10, true);
        this.spawnBurst(HERO_X - 96, GROUND_Y - 28, '#fde047', 6);
        this.emit('heal');
      }
    }
  }

  private tickProjectiles(dt: number): void {
    const s = this.state;
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'fireball') p.vy += 32 * dt;
      p.life -= dt;

      const hitEnemy = s.enemies.find((e) => e.hp > 0 && Math.abs(e.x - p.x) < (e.isBoss ? 26 : 16));
      if (hitEnemy) {
        if (p.kind === 'fireball') {
          for (const e of s.enemies) {
            if (Math.abs(e.x - hitEnemy.x) <= 68) {
              this.damageEnemy(e, p.damage, false, '#fb923c');
            }
          }
          this.spawnBurst(hitEnemy.x, GROUND_Y - 22, '#f97316', 12);
          s.screenShake = Math.max(s.screenShake, 3);
        } else {
          this.damageEnemy(hitEnemy, p.damage, false, '#86efac');
          this.spawnBurst(hitEnemy.x, GROUND_Y - 20, '#86efac', 4);
        }
        s.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0 || p.x > ARENA_WIDTH + 20) {
        s.projectiles.splice(i, 1);
      }
    }
  }

  private performKnightSwing(target: EnemyEntity, stats: ComputedStats): void {
    const s = this.state;
    s.heroAction = 'swing';
    s.heroActionTimer = Math.min(0.24, 0.7 / stats.aps);

    const isCrit = Math.random() < stats.critChance;
    let dmg = stats.atk * (0.93 + Math.random() * 0.14);
    if (isCrit) dmg *= stats.critMult;

    this.damageEnemy(target, dmg, isCrit, isCrit ? '#facc15' : '#ffffff');
    this.addMorale(5.5);
    this.emit(isCrit ? 'crit' : 'hit');
  }

  private damageEnemy(enemy: EnemyEntity, rawDmg: number, isCrit: boolean, color: string): void {
    const dmg = Math.max(1, Math.round(rawDmg));
    enemy.hp -= dmg;
    enemy.hitFlash = 1;
    this.spawnText(
      enemy.x + (Math.random() - 0.5) * 14,
      GROUND_Y - (enemy.isBoss ? 54 : 34),
      isCrit ? `${dmg}!` : `${dmg}`,
      color,
      isCrit ? 13 : 10,
      isCrit
    );
    this.spawnBurst(enemy.x, GROUND_Y - 18, color, isCrit ? 7 : 3);
  }

  private resolveEnemyAttack(attacker: EnemyEntity, stats: ComputedStats, stanceDmgMult: number): void {
    const s = this.state;
    const raw = Math.max(1, attacker.atk * stanceDmgMult - stats.def * 0.55);
    let dmg = Math.round(raw);
    if (s.heroShield > 0) {
      const blocked = Math.min(s.heroShield, dmg);
      s.heroShield -= blocked;
      dmg -= blocked;
    }

    if (dmg > 0) {
      s.heroHp = Math.max(0, s.heroHp - dmg);
      s.heroAction = 'hurt';
      s.heroActionTimer = 0.15;
      s.screenShake = Math.max(s.screenShake, 2.5);
      this.spawnText(HERO_X, GROUND_Y - 46, `-${dmg}`, '#f87171', 10);
    }

    if (s.heroHp <= 0) {
      s.heroHp = stats.maxHp;
      s.heroShield = 0;
      s.wave = 1;
      if (s.stage > 1) s.stage -= 1;
      s.enemies = [];
      s.bannerText = '전열 재정비 — 이전 캠프로 후퇴';
      s.bannerTimer = 2.0;
      this.emit('retreat');
      this.spawnWave();
    }
  }

  private cleanupDeadEnemies(stats: ComputedStats): void {
    const s = this.state;
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      if (e.hp > 0) continue;
      s.enemies.splice(i, 1);
      s.totalKills += 1;

      const goldGain = Math.max(1, Math.round(e.goldReward * stats.goldMult));
      const oreGain = Math.max(1, Math.round(e.oreReward * stats.oreMult));
      s.gold += goldGain;
      s.ore += oreGain;

      this.spawnText(e.x - 8, GROUND_Y - 14, `+${goldGain}G`, '#facc15', 9);
      this.spawnText(e.x + 12, GROUND_Y - 26, `+${oreGain}광석`, '#93c5fd', 9);
      this.spawnBurst(e.x, GROUND_Y - 18, '#facc15', e.isBoss ? 20 : 8);

      if (e.isBoss) {
        s.bannerText = `🚩 STAGE ${s.stage} 점령 완료!`;
        s.bannerTimer = 2.0;
        this.emit('bossKill');
      }
    }
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
    const zone = getZoneForStage(s.stage);
    const isBoss = s.wave === 5;
    const factor = Math.pow(1.34, s.stage - 1) * (1 + (s.wave - 1) * 0.14);

    if (isBoss) {
      const maxHp = Math.round(180 * factor);
      s.enemies = [
        {
          id: this.nextId++,
          kind: 'boss',
          name: zone.bossName,
          isBoss: true,
          x: ARENA_WIDTH + 34,
          hp: maxHp,
          maxHp,
          atk: Math.round(14 * Math.pow(1.24, s.stage - 1)),
          attackTimer: 1.4,
          attackInterval: 2.1,
          hitFlash: 0,
          animTime: 0,
          goldReward: Math.round(55 * Math.pow(1.3, s.stage - 1)),
          oreReward: Math.max(4, Math.round(4 + s.stage * 1.6)),
        },
      ];
      s.bannerText = `⚠ BOSS · ${zone.bossName}`;
      s.bannerTimer = 1.9;
      this.emit('bossWarning');
      return;
    }

    const count = Math.min(4, 2 + Math.floor((s.stage + s.wave) / 4));
    s.enemies = [];
    for (let i = 0; i < count; i++) {
      const kind = zone.enemyPool[(s.wave + i) % zone.enemyPool.length];
      const maxHp = Math.round(44 * factor * (kind === 'golem' || kind === 'wyvern' ? 1.25 : 1));
      s.enemies.push({
        id: this.nextId++,
        kind,
        name: ENEMY_NAMES[kind],
        isBoss: false,
        x: ARENA_WIDTH + 24 + i * 36,
        hp: maxHp,
        maxHp,
        atk: Math.round(6.5 * Math.pow(1.21, s.stage - 1)),
        attackTimer: 1.0 + i * 0.35,
        attackInterval: 1.95,
        hitFlash: 0,
        animTime: i * 0.5,
        goldReward: Math.round(9 * Math.pow(1.26, s.stage - 1)),
        oreReward: Math.max(1, Math.round(1 + s.stage * 0.35)),
      });
    }
  }

  private addMorale(amount: number): void {
    if (this.state.rallyTimer > 0) return;
    this.state.morale = Math.min(100, this.state.morale + amount);
  }

  private getFrontEnemy(): EnemyEntity | null {
    if (this.state.enemies.length === 0) return null;
    let front = this.state.enemies[0];
    for (const e of this.state.enemies) {
      if (e.x < front.x) front = e;
    }
    return front;
  }

  private spawnText(x: number, y: number, text: string, color: string, size: number, bold = false): void {
    this.state.floatingTexts.push({
      id: this.nextId++,
      x,
      y,
      vy: -34,
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
      const a = Math.random() * Math.PI * 2;
      const sp = 25 + Math.random() * 80;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        size: 2 + Math.floor(Math.random() * 2),
        color,
        life: 0.32 + Math.random() * 0.22,
        maxLife: 0.54,
      });
    }
  }

  private tickParticlesAndTexts(dt: number): void {
    const s = this.state;
    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      const ft = s.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.94;
      ft.life -= dt;
      if (ft.life <= 0) s.floatingTexts.splice(i, 1);
    }
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 115 * dt;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
  }
}
