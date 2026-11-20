import {
  ACHIEVEMENTS,
  COMPANIONS,
  DUNGEONS,
  FACILITIES,
  KNIGHT_SKILLS,
  MAX_DUNGEON_TICKETS,
  RARITY_CONFIG,
  RELICS,
  STANCES,
  TICKET_RECHARGE_SEC,
  TRAININGS,
  ZONES,
  createStarterEquipment,
  getCompanionCost,
  getFacilityCost,
  getForgeLevel,
  getForgeOreCost,
  getKnightRankTitle,
  getMaxRelicSlots,
  getNextClaimableRank,
  getQuestDef,
  getRankDef,
  getRefineCost,
  getRelicAppraisalCost,
  getSkillUpgradeCost,
  getTrainingCost,
  getZoneForStage,
  getZoneIndexForStage,
  rollForgedItem,
} from './data';
import type {
  AutoForgeFilter,
  CompanionId,
  ComputedStats,
  DungeonId,
  EnemyEntity,
  EnemyKind,
  EquipSlot,
  FacilityKey,
  GameEvent,
  GameState,
  KnightSkillId,
  QuestDef,
  RelicId,
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
    if (!this.demoMode && saved?.savedAt) {
      this.computeOfflineProgress(saved.savedAt);
    }
    this.spawnWave();
  }

  private createInitialState(saved?: SaveData | null): GameState {
    const starterEq = createStarterEquipment();
    const state: GameState = {
      stage: Math.max(1, saved?.stage ?? 1),
      highestStage: Math.max(saved?.stage ?? 1, saved?.highestStage ?? 1),
      wave: Math.min(5, Math.max(1, saved?.wave ?? 1)),
      farmMode: Boolean(saved?.farmMode),
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
      refineLevels: {
        weapon: saved?.refineLevels?.weapon ?? 0,
        shield: saved?.refineLevels?.shield ?? 0,
        armor: saved?.refineLevels?.armor ?? 0,
      },
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

      skillLevels: {
        whirlwind: saved?.skillLevels?.whirlwind ?? 1,
        judgment: saved?.skillLevels?.judgment ?? 1,
        oath: saved?.skillLevels?.oath ?? 1,
      },
      skillCooldowns: { whirlwind: 0, judgment: 0, oath: 0 },
      oathBuffTimer: 0,

      dungeonTickets: {
        oreMine: saved?.dungeonTickets?.oreMine ?? 2,
        bossArena: saved?.dungeonTickets?.bossArena ?? 2,
      },
      dungeonTiers: {
        oreMine: saved?.dungeonTiers?.oreMine ?? 1,
        bossArena: saved?.dungeonTiers?.bossArena ?? 1,
      },
      ticketRechargeTimer: saved?.ticketRechargeTimer ?? 0,
      activeDungeon: null,
      dungeonResult: null,

      claimedRank: saved?.claimedRank ?? 0,
      unlockedRelics: Array.isArray(saved?.unlockedRelics) ? [...saved.unlockedRelics] : [],
      equippedRelics: Array.isArray(saved?.equippedRelics) ? [...saved.equippedRelics] : [],
      claimedAchievements: Array.isArray(saved?.claimedAchievements) ? [...saved.claimedAchievements] : [],
      questIndex: saved?.questIndex ?? 0,
      questBaseline: saved?.questBaseline ?? 0,
      discoveredEnemies: Array.isArray(saved?.discoveredEnemies) ? [...saved.discoveredEnemies] : [],
      discoveredBosses: Array.isArray(saved?.discoveredBosses) ? [...saved.discoveredBosses] : [],
      offlineReport: null,

      heroHp: 180,
      heroMaxHp: 180,
      heroShield: 0,
      heroAction: 'march',
      heroActionTimer: 0,
      heroAttackTimer: 0,
      animTime: 0,
      scrollX: 0,
      comboCount: 0,
      comboTimer: 0,

      companionTimers: { ranger: 0.4, pyro: 1.0, banneret: 1.6 },
      companionCastTimers: { ranger: 0, pyro: 0, banneret: 0 },

      morale: this.demoMode ? 65 : 20,
      rallyTimer: 0,
      guardBurstTimer: 0,
      hitStopTimer: 0,
      cutInTimer: 0,
      cutInText: '',
      cutInColor: '#facc15',
      hitCounter: 0,
      dustTimer: 0,
      autoForgeTimer: 0,
      screenShake: 0,
      bannerText: '',
      bannerTimer: 0,

      speedMult: saved?.speedMult ?? 1,
      autoRally: saved?.autoRally ?? false,
      autoSkill: saved?.autoSkill ?? true,
      autoForge: saved?.autoForge ?? false,
      autoForgeFilter: saved?.autoForgeFilter ?? 'upgrade',
      soundEnabled: saved?.soundEnabled ?? true,
      bgmEnabled: saved?.bgmEnabled ?? false,
      buyStep: 1,

      enemies: [],
      projectiles: [],
      vfxList: [],
      lootDrops: [],
      floatingTexts: [],
      particles: [],

      totalKills: saved?.totalKills ?? 0,
      totalBossKills: saved?.totalBossKills ?? 0,
      totalDungeonClears: saved?.totalDungeonClears ?? 0,
      totalForges: saved?.totalForges ?? 0,
      totalRefines: saved?.totalRefines ?? 0,
      totalStanceSwitches: saved?.totalStanceSwitches ?? 0,
      totalRallies: saved?.totalRallies ?? 0,
      totalPerfectGuards: saved?.totalPerfectGuards ?? 0,
      expeditionReturns: saved?.expeditionReturns ?? 0,
      totalPlaySeconds: saved?.totalPlaySeconds ?? 0,
    };

    this.state = state;
    const stats = this.computeStats();
    state.heroMaxHp = stats.maxHp;
    state.heroHp = stats.maxHp;
    return state;
  }

  private computeOfflineProgress(savedAt: number): void {
    const elapsed = Math.floor((Date.now() - savedAt) / 1000);
    if (elapsed < 60) return;
    const capped = Math.min(elapsed, 12 * 3600);
    const s = this.state;

    // Recharge dungeon tickets while away!
    const gainedTickets = Math.floor((s.ticketRechargeTimer + capped) / TICKET_RECHARGE_SEC);
    if (gainedTickets > 0) {
      s.dungeonTickets.oreMine = Math.min(MAX_DUNGEON_TICKETS, s.dungeonTickets.oreMine + gainedTickets);
      s.dungeonTickets.bossArena = Math.min(MAX_DUNGEON_TICKETS, s.dungeonTickets.bossArena + gainedTickets);
    }
    s.ticketRechargeTimer = (s.ticketRechargeTimer + capped) % TICKET_RECHARGE_SEC;

    const stats = this.computeStats();
    const avgEnemyHp = Math.max(30, 44 * Math.pow(1.34, s.stage - 1));
    const killsPerSec = Math.min(1.6, Math.max(0.18, (stats.dps / avgEnemyHp) * 0.65));
    const kills = Math.max(1, Math.floor(capped * killsPerSec));
    const goldPerKill = Math.round(9 * Math.pow(1.26, s.stage - 1) * stats.goldMult);
    const orePerKill = Math.max(1, Math.round((1 + s.stage * 0.35) * stats.oreMult));
    s.offlineReport = {
      elapsedSeconds: capped,
      kills,
      gold: Math.max(10, Math.floor(kills * goldPerKill * 0.65)),
      ore: Math.max(2, Math.floor(kills * orePerKill * 0.45)),
    };
  }

  public claimOfflineLoot(): void {
    const rep = this.state.offlineReport;
    if (!rep) return;
    this.state.gold += rep.gold;
    this.state.ore += rep.ore;
    this.state.totalKills += rep.kills;
    this.state.offlineReport = null;
    this.state.bannerText = `📦 오프라인 전리품 수령! +${rep.gold}G`;
    this.state.bannerTimer = 2.0;
    this.emit('questClaim');
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

  public hasRelic(id: RelicId): boolean {
    return this.state.equippedRelics.includes(id);
  }

  public appraiseRelic(): RelicId | null {
    const s = this.state;
    const locked = RELICS.filter((r) => !s.unlockedRelics.includes(r.id));
    if (locked.length === 0) return null;
    const cost = getRelicAppraisalCost(s.unlockedRelics.length);
    if (s.medals < cost) return null;
    s.medals -= cost;
    const picked = locked[Math.floor(Math.random() * locked.length)];
    s.unlockedRelics.push(picked.id);
    if (s.equippedRelics.length < getMaxRelicSlots(s.claimedRank)) {
      s.equippedRelics.push(picked.id);
    }
    this.triggerCutIn(`🔮 유물 감정 · ${picked.name}!`, picked.color);
    this.emit('forgeRare');
    return picked.id;
  }

  public toggleEquipRelic(id: RelicId): boolean {
    const s = this.state;
    if (!s.unlockedRelics.includes(id)) return false;
    const idx = s.equippedRelics.indexOf(id);
    if (idx >= 0) {
      s.equippedRelics.splice(idx, 1);
      this.emit('upgrade');
      return true;
    }
    const maxSlots = getMaxRelicSlots(s.claimedRank);
    if (s.equippedRelics.length >= maxSlots) {
      s.equippedRelics.shift();
    }
    s.equippedRelics.push(id);
    const stats = this.computeStats();
    s.heroMaxHp = stats.maxHp;
    this.emit('upgrade');
    return true;
  }

  public getAchievementProgress(id: string): number {
    const s = this.state;
    switch (id) {
      case 'first_boss': return s.totalBossKills;
      case 'forge_20': return s.totalForges;
      case 'refine_8': return s.totalRefines;
      case 'full_squad':
        return (
          (s.companions.ranger > 0 ? 1 : 0) +
          (s.companions.pyro > 0 ? 1 : 0) +
          (s.companions.banneret > 0 ? 1 : 0)
        );
      case 'guard_2': return s.totalPerfectGuards;
      case 'dungeon_3': return s.totalDungeonClears;
      case 'epic_gear': {
        const eq = [s.equipment.weapon, s.equipment.shield, s.equipment.armor];
        return eq.some((it) => RARITY_CONFIG[it.rarity].rank >= 3) ? 1 : 0;
      }
      case 'codex_6': return s.discoveredEnemies.length + s.discoveredBosses.length;
      case 'kills_250': return s.totalKills;
      case 'stage_7': return s.highestStage;
      default: return 0;
    }
  }

  public getClaimableAchievementCount(): number {
    let cnt = 0;
    for (const a of ACHIEVEMENTS) {
      if (!this.state.claimedAchievements.includes(a.id) && this.getAchievementProgress(a.id) >= a.target) {
        cnt += 1;
      }
    }
    return cnt;
  }

  public claimAchievement(id: string): boolean {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def || this.state.claimedAchievements.includes(id)) return false;
    if (this.getAchievementProgress(id) < def.target) return false;
    this.state.claimedAchievements.push(id);
    this.state.medals += def.rewardMedals;
    this.state.ore += def.rewardOre;
    this.state.bannerText = `🏆 업적 달성 · ${def.title} (🏅+${def.rewardMedals}, ⛏️+${def.rewardOre})`;
    this.state.bannerTimer = 2.2;
    this.emit('questClaim');
    return true;
  }

  private triggerCutIn(text: string, color: string): void {
    this.state.cutInText = text;
    this.state.cutInColor = color;
    this.state.cutInTimer = 0.72;
  }

  public getActiveStance() {
    return STANCES.find((st) => st.id === this.state.stance) ?? STANCES[0];
  }

  public getEffectiveEquipPower(slot: EquipSlot): number {
    const base = this.state.equipment[slot].power;
    const refineMult = 1 + this.state.refineLevels[slot] * 0.12;
    const forgeMult = 1 + this.state.facilities.royalForge * 0.2;
    return Math.round(base * refineMult * forgeMult);
  }

  public computeStats(): ComputedStats {
    const s = this.state;
    const stance = this.getActiveStance();
    const academyMult = 1 + s.facilities.warAcademy * 0.25;
    const supplyMult = 1 + s.facilities.supplyWagon * 0.3;
    const codexCount = s.discoveredEnemies.length + s.discoveredBosses.length;
    const codexAtkBonus = codexCount * 0.025;
    const rankAtkBonus = getRankDef(s.claimedRank).atkBonusPct / 100;

    const eqList = [s.equipment.weapon, s.equipment.shield, s.equipment.armor];
    let bonusCrit = 0;
    let bonusSpeed = 0;
    let bonusGold = 0;
    let bonusHp = 0;
    let doubleStrikeChance = 0;
    let lifesteal = 0;
    let traitOreBonus = 0;
    let bossDmgMult = 1;

    for (const item of eqList) {
      if (item.bonusStat === 'crit') bonusCrit += item.bonusValue;
      if (item.bonusStat === 'speed') bonusSpeed += item.bonusValue;
      if (item.bonusStat === 'gold') bonusGold += item.bonusValue;
      if (item.bonusStat === 'hp') bonusHp += item.bonusValue;
      if (item.trait === 'doubleStrike') doubleStrikeChance += 0.2;
      if (item.trait === 'vampiric') lifesteal += 0.05;
      if (item.trait === 'oreFinder') traitOreBonus += 0.28;
      if (item.trait === 'bossBreaker') bossDmgMult += 0.35;
    }

    const rallyAtkMult = s.rallyTimer > 0 ? 1.55 : 1;
    const rallyApsMult = s.rallyTimer > 0 ? 1.4 : 1;
    const oathCritBonus = s.oathBuffTimer > 0 ? 0.4 : 0;
    const oathApsMult = s.oathBuffTimer > 0 ? 1.28 : 1;
    const compassApsMult = this.hasRelic('stormCompass') ? 1.18 : 1;
    const citadelHpMult = this.hasRelic('citadelHeart') ? 1.35 : 1;
    const diceLootMult = this.hasRelic('goldenDice') ? 1.45 : 1;
    const crownSquadMult = this.hasRelic('sovereignCrown') ? 1.6 : 1;

    const weaponAtk = this.getEffectiveEquipPower('weapon');
    const baseAtk = 10 + weaponAtk + s.training.swordplay * 5;
    const atk = baseAtk * academyMult * (1 + codexAtkBonus) * (1 + rankAtkBonus) * stance.atkMult * rallyAtkMult;

    const aps = 1.12 * (1 + bonusSpeed) * stance.apsMult * rallyApsMult * oathApsMult * compassApsMult;
    const critChance = Math.min(0.95, 0.1 + s.training.swordplay * 0.006 + bonusCrit + oathCritBonus);
    const critMult = 1.75;

    const shieldHp = this.getEffectiveEquipPower('shield');
    const maxHp = Math.round((135 + shieldHp + s.training.fortitude * 32) * (1 + bonusHp) * citadelHpMult);
    const def = this.getEffectiveEquipPower('armor');
    const regenPerSec = 2.6 + s.training.fortitude * 2.2 + maxHp * 0.006;

    const goldMult = (1 + s.training.logistics * 0.15 + bonusGold) * stance.lootMult * supplyMult * diceLootMult;
    const oreMult = (1 + s.training.logistics * 0.12 + traitOreBonus) * stance.lootMult * supplyMult * diceLootMult;

    const heroDps = atk * (1 - critChance + critChance * critMult) * aps * (1 + doubleStrikeChance * 0.75);
    const rangerDps =
      s.companions.ranger > 0
        ? (atk * (0.48 + s.companions.ranger * 0.16) * crownSquadMult) / COMPANIONS[0].interval
        : 0;
    const pyroDps =
      s.companions.pyro > 0
        ? (atk * (0.95 + s.companions.pyro * 0.28) * 1.6 * crownSquadMult) / COMPANIONS[1].interval
        : 0;
    const skillBonusDps =
      (atk * (2.4 + s.skillLevels.whirlwind * 0.22)) / 6 +
      (s.highestStage >= 2 ? (atk * (3.9 + s.skillLevels.judgment * 0.35)) / 10 : 0);

    const dps = heroDps + rangerDps + pyroDps;
    const cp = Math.round((dps + skillBonusDps * 0.5) * 4.2 + maxHp * 0.45 + def * 3.5);

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
      doubleStrikeChance,
      lifesteal,
      bossDmgMult,
      codexAtkBonus,
      rankAtkBonus,
      dps,
      cp,
      forgeLevel: getForgeLevel(s.forgeExp),
      rankTitle: getKnightRankTitle(s.claimedRank),
    };
  }

  public castSkill(skillId: KnightSkillId): boolean {
    const s = this.state;
    const def = KNIGHT_SKILLS.find((k) => k.id === skillId);
    if (!def) return false;
    if (s.highestStage < def.unlockStage && !this.demoMode) return false;
    if (s.skillCooldowns[skillId] > 0) return false;
    if (skillId !== 'oath' && s.enemies.length === 0) return false;

    const stats = this.computeStats();
    const lv = s.skillLevels[skillId];
    const cdMult = this.hasRelic('stormCompass') ? 0.78 : 1;
    s.skillCooldowns[skillId] = def.cooldown * cdMult;
    s.heroAction = 'swing';
    s.heroActionTimer = 0.28;

    if (skillId === 'whirlwind') {
      const mult = 2.4 + (lv - 1) * 0.25;
      s.screenShake = 5;
      s.hitStopTimer = 0.032;
      this.spawnVfx(0, HERO_X + 44, GROUND_Y - 22, 1.35, 0.35);
      for (const e of s.enemies) {
        if (e.x - HERO_X < 210) {
          this.damageEnemy(e, stats.atk * mult * (e.isBoss ? stats.bossDmgMult : 1), true, '#fde047');
        }
      }
      this.spawnText(HERO_X + 18, GROUND_Y - 62, '회전 참격!', '#fde047', 11, true);
      this.addMorale(8);
    } else if (skillId === 'judgment') {
      const front = this.getFrontEnemy();
      if (front) {
        const mult = 3.9 + (lv - 1) * 0.38;
        front.stunTimer = Math.max(front.stunTimer, 1.3);
        front.heavyWindup = 0;
        this.spawnVfx(3, front.x, GROUND_Y - 30, 1.25, 0.52);
        this.damageEnemy(front, stats.atk * mult * (front.isBoss ? stats.bossDmgMult : 1), true, '#38bdf8');
        this.spawnText(front.x, GROUND_Y - 68, '⚡ 왕국의 심판!', '#38bdf8', 11, true);
        this.triggerCutIn('⚡ 왕국의 심판!', '#38bdf8');
        s.hitStopTimer = 0.045;
        s.screenShake = 7;
      }
      this.addMorale(10);
    } else if (skillId === 'oath') {
      const healAmt = Math.round(stats.maxHp * (0.22 + (lv - 1) * 0.02));
      s.heroHp = Math.min(stats.maxHp, s.heroHp + healAmt);
      s.oathBuffTimer = 5.5 + (lv - 1) * 0.3;
      this.spawnVfx(3, HERO_X, GROUND_Y - 24, 1.0, 0.48);
      this.spawnText(HERO_X, GROUND_Y - 60, `기사단의 맹세 +${healAmt}`, '#4ade80', 11, true);
      this.addMorale(10);
    }

    this.emit('skill');
    return true;
  }

  public upgradeSkill(skillId: KnightSkillId): boolean {
    const def = KNIGHT_SKILLS.find((k) => k.id === skillId)!;
    const lv = this.state.skillLevels[skillId];
    if (lv >= 25) return false;
    const cost = getSkillUpgradeCost(def, lv);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.skillLevels[skillId] = lv + 1;
    this.emit('upgrade');
    return true;
  }

  public claimRankPromotion(): boolean {
    const next = getNextClaimableRank(this.state.claimedRank, this.state.highestStage);
    if (!next) return false;
    this.state.claimedRank = next.rank;
    this.state.medals += next.medalReward;
    this.state.bannerText = `👑 [${next.title}] 승급! 공격력 +${next.atkBonusPct}% · 훈장 +${next.medalReward}`;
    this.state.bannerTimer = 2.6;
    this.spawnVfx(3, HERO_X, GROUND_Y - 26, 1.35, 0.7);
    this.emit('returnKingdom');
    return true;
  }

  public jumpToStage(targetStage: number): boolean {
    if (this.state.activeDungeon) return false;
    const clamped = Math.max(1, Math.min(this.state.highestStage, targetStage));
    this.state.stage = clamped;
    this.state.wave = 1;
    this.state.farmMode = clamped < this.state.highestStage;
    this.state.enemies = [];
    this.state.projectiles = [];
    const zone = getZoneForStage(clamped);
    this.state.bannerText = `🗺️ STAGE ${clamped} · ${zone.name} 이동!`;
    this.state.bannerTimer = 1.8;
    this.spawnWave();
    return true;
  }

  public enterDungeon(id: DungeonId): boolean {
    const s = this.state;
    if (s.activeDungeon || s.dungeonTickets[id] <= 0) return false;
    const def = DUNGEONS.find((d) => d.id === id)!;
    s.dungeonTickets[id] -= 1;

    const tier = s.dungeonTiers[id];
    const stats = this.computeStats();
    s.heroHp = stats.maxHp;
    s.heroShield = 0;
    s.enemies = [];
    s.projectiles = [];
    s.dungeonResult = null;
    s.activeDungeon = {
      id,
      tier,
      timeLeft: def.durationSec,
      maxTime: def.durationSec,
      kills: 0,
      targetKills: def.targetKills,
      earnedGold: 0,
      earnedOre: 0,
      earnedMedals: 0,
    };

    s.bannerText = `⚔️ ${def.name} Lv.${tier} 입장!`;
    s.bannerTimer = 1.9;
    this.spawnDungeonWave();
    this.emit('bossWarning');
    return true;
  }

  public abandonDungeon(): void {
    if (!this.state.activeDungeon) return;
    this.finishDungeon(false);
  }

  public dismissDungeonResult(): void {
    this.state.dungeonResult = null;
  }

  private finishDungeon(cleared: boolean): void {
    const s = this.state;
    const d = s.activeDungeon;
    if (!d) return;

    let bonusGold = 0;
    let bonusOre = 0;
    let bonusMedals = 0;
    if (cleared) {
      s.dungeonTiers[d.id] += 1;
      s.totalDungeonClears += 1;
      if (d.id === 'oreMine') {
        bonusOre = Math.round(18 + d.tier * 12);
        bonusGold = Math.round(80 * Math.pow(1.3, d.tier - 1));
      } else {
        bonusGold = Math.round(240 * Math.pow(1.35, d.tier - 1));
        bonusOre = Math.round(10 + d.tier * 5);
        bonusMedals = Math.max(1, Math.floor(1 + d.tier * 0.7));
      }
      this.emit('bossKill');
    } else {
      this.emit('retreat');
    }

    const totalGold = d.earnedGold + bonusGold;
    const totalOre = d.earnedOre + bonusOre;
    const totalMedals = d.earnedMedals + bonusMedals;

    s.gold += totalGold;
    s.ore += totalOre;
    s.medals += totalMedals;

    s.dungeonResult = {
      id: d.id,
      tier: d.tier,
      cleared,
      kills: d.kills,
      targetKills: d.targetKills,
      gold: totalGold,
      ore: totalOre,
      medals: totalMedals,
    };

    s.activeDungeon = null;
    s.enemies = [];
    s.projectiles = [];
    const stats = this.computeStats();
    s.heroHp = stats.maxHp;
    this.spawnWave();
  }

  private spawnDungeonWave(): void {
    const s = this.state;
    const d = s.activeDungeon;
    if (!d) return;
    const tierFactor = Math.pow(1.42, d.tier - 1);

    if (d.id === 'oreMine') {
      const remaining = Math.max(1, d.targetKills - d.kills);
      const batch = Math.min(3, remaining);
      s.enemies = [];
      for (let i = 0; i < batch; i++) {
        const kind: EnemyKind = i === 0 ? 'golem' : 'goblin';
        const maxHp = Math.round(62 * tierFactor);
        s.enemies.push({
          id: this.nextId++,
          kind,
          name: kind === 'golem' ? '광석 골렘' : '보물 고블린',
          isBoss: false,
          x: ARENA_WIDTH + 20 + i * 36,
          knockbackX: 0,
          hp: maxHp,
          maxHp,
          atk: Math.round(5 * Math.pow(1.2, d.tier - 1)),
          attackTimer: 1.4,
          attackInterval: 2.2,
          heavyWindup: 0,
          heavyCooldown: 99,
          stunTimer: 0,
          hitFlash: 0,
          animTime: i * 0.4,
          goldReward: Math.round(14 * tierFactor),
          oreReward: Math.max(3, Math.round(3 + d.tier * 2.2)),
        });
      }
      return;
    }

    // Boss Rush Arena: consecutive Zone Bosses!
    const bossRow = (d.tier + d.kills - 1) % ZONES.length;
    const zone = ZONES[bossRow];
    const maxHp = Math.round(190 * tierFactor * (1 + d.kills * 0.25));
    s.enemies = [
      {
        id: this.nextId++,
        kind: 'boss',
        name: `${zone.bossName} (Lv.${d.tier})`,
        isBoss: true,
        bossVisualRow: bossRow,
        x: ARENA_WIDTH + 32,
        knockbackX: 0,
        hp: maxHp,
        maxHp,
        atk: Math.round(13 * Math.pow(1.24, d.tier - 1)),
        attackTimer: 1.3,
        attackInterval: 2.0,
        heavyWindup: 0,
        heavyCooldown: 3.6,
        stunTimer: 0,
        hitFlash: 0,
        animTime: 0,
        goldReward: Math.round(75 * tierFactor),
        oreReward: Math.max(3, Math.round(3 + d.tier * 1.4)),
      },
    ];
  }

  public getCurrentQuestStatus(): { def: QuestDef; progress: number; complete: boolean } {
    const s = this.state;
    const def = getQuestDef(s.questIndex);
    const isLoopQuest = s.questIndex >= 11;
    const raw = this.getQuestMetricRaw(def.goalType);
    const progress = isLoopQuest ? Math.max(0, raw - s.questBaseline) : raw;
    return { def, progress: Math.min(def.target, progress), complete: progress >= def.target };
  }

  public claimQuestReward(): boolean {
    const status = this.getCurrentQuestStatus();
    if (!status.complete) return false;
    const s = this.state;
    s.gold += status.def.rewardGold;
    s.ore += status.def.rewardOre;
    if (status.def.rewardMedals) s.medals += status.def.rewardMedals;

    s.questIndex += 1;
    const nextDef = getQuestDef(s.questIndex);
    if (s.questIndex >= 11) {
      s.questBaseline = this.getQuestMetricRaw(nextDef.goalType);
    } else {
      s.questBaseline = 0;
    }

    s.bannerText = `📜 퀘스트 완료! +${status.def.rewardGold}G · +${status.def.rewardOre}광석`;
    s.bannerTimer = 1.9;
    this.emit('questClaim');
    return true;
  }

  private getQuestMetricRaw(goalType: QuestDef['goalType']): number {
    const s = this.state;
    switch (goalType) {
      case 'kills': return s.totalKills;
      case 'forges': return s.totalForges;
      case 'stage': return s.highestStage;
      case 'companions':
        return (
          (s.companions.ranger > 0 ? 1 : 0) +
          (s.companions.pyro > 0 ? 1 : 0) +
          (s.companions.banneret > 0 ? 1 : 0)
        );
      case 'stanceSwitch': return s.totalStanceSwitches;
      case 'rally': return s.totalRallies;
      case 'refine': return s.totalRefines;
      case 'bossKills': return s.totalBossKills;
      case 'dungeonClears': return s.totalDungeonClears;
    }
  }

  public cycleAutoForgeFilter(): AutoForgeFilter {
    const order: AutoForgeFilter[] = ['upgrade', 'rare', 'epic'];
    const idx = order.indexOf(this.state.autoForgeFilter);
    this.state.autoForgeFilter = order[(idx + 1) % order.length];
    return this.state.autoForgeFilter;
  }

  public toSaveData(): SaveData {
    const s = this.state;
    return {
      version: 5,
      stage: s.stage,
      highestStage: s.highestStage,
      wave: s.wave,
      farmMode: s.farmMode,
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
      refineLevels: { ...s.refineLevels },
      training: { ...s.training },
      companions: { ...s.companions },
      facilities: { ...s.facilities },
      skillLevels: { ...s.skillLevels },
      dungeonTickets: { ...s.dungeonTickets },
      dungeonTiers: { ...s.dungeonTiers },
      ticketRechargeTimer: Math.floor(s.ticketRechargeTimer),
      claimedRank: s.claimedRank,
      unlockedRelics: [...s.unlockedRelics],
      equippedRelics: [...s.equippedRelics],
      claimedAchievements: [...s.claimedAchievements],
      questIndex: s.questIndex,
      questBaseline: s.questBaseline,
      discoveredEnemies: [...s.discoveredEnemies],
      discoveredBosses: [...s.discoveredBosses],
      speedMult: s.speedMult,
      autoRally: s.autoRally,
      autoSkill: s.autoSkill,
      autoForge: s.autoForge,
      autoForgeFilter: s.autoForgeFilter,
      soundEnabled: s.soundEnabled,
      bgmEnabled: s.bgmEnabled,
      totalKills: s.totalKills,
      totalBossKills: s.totalBossKills,
      totalDungeonClears: s.totalDungeonClears,
      totalForges: s.totalForges,
      totalRefines: s.totalRefines,
      totalStanceSwitches: s.totalStanceSwitches,
      totalRallies: s.totalRallies,
      totalPerfectGuards: s.totalPerfectGuards,
      expeditionReturns: s.expeditionReturns,
      totalPlaySeconds: Math.floor(s.totalPlaySeconds),
      savedAt: Date.now(),
    };
  }

  public loadFromSaveData(saved: SaveData): void {
    this.state = this.createInitialState(saved);
    this.spawnWave();
  }

  public resetGame(): void {
    this.state = this.createInitialState(null);
    this.spawnWave();
  }

  public challengeBossNow(): void {
    if (this.state.activeDungeon) return;
    this.state.farmMode = false;
    this.state.wave = 5;
    this.state.enemies = [];
    this.spawnWave();
  }

  public setStance(stance: StanceId): void {
    if (this.state.stance === stance) return;
    this.state.stance = stance;
    this.state.totalStanceSwitches += 1;
    const def = this.getActiveStance();

    const chargingBoss = this.state.enemies.find((e) => e.isBoss && e.heavyWindup >= 0.35);
    if (stance === 'bulwark' && chargingBoss) {
      chargingBoss.heavyWindup = 0;
      chargingBoss.heavyCooldown = 5.5;
      chargingBoss.stunTimer = 1.6;
      const stats = this.computeStats();
      this.state.heroShield = Math.max(this.state.heroShield, Math.round(stats.maxHp * 0.35));
      this.addMorale(24);
      this.state.totalPerfectGuards += 1;
      this.state.guardBurstTimer = 0.55;
      this.state.hitStopTimer = 0.055;
      this.state.screenShake = 6;
      this.triggerCutIn('🛡️ 철벽 완벽 방어!', '#38bdf8');
      this.damageEnemy(chargingBoss, stats.atk * 2.2, true, '#38bdf8');
      this.spawnVfx(3, HERO_X, GROUND_Y - 24, 1.0, 0.5);
      this.spawnText(HERO_X, GROUND_Y - 62, '철벽 완벽 방어!', '#38bdf8', 12, true);
      this.state.bannerText = '🛡️ 철벽 퍼펙트 가드! 보스 기절 & 사기 +24%';
      this.state.bannerTimer = 1.9;
      this.emit('perfectGuard');
      return;
    }

    this.state.bannerText = `${def.icon} ${def.name} 진형 전환!`;
    this.state.bannerTimer = 1.3;
    this.spawnBurst(HERO_X, GROUND_Y - 22, def.color, 10);
    this.emit('stance');
  }

  public triggerRally(): boolean {
    const s = this.state;
    if (s.morale < 100 || s.rallyTimer > 0) return false;
    s.rallyTimer = 9.0;
    s.totalRallies += 1;
    s.hitStopTimer = 0.05;
    s.screenShake = 6;
    this.triggerCutIn('🎺 진격 나팔! 전군 돌격!', '#facc15');
    s.bannerText = '🎺 진격 나팔! 전군 돌격 개시!';
    s.bannerTimer = 2.0;

    const stats = this.computeStats();
    s.heroHp = Math.min(stats.maxHp, s.heroHp + stats.maxHp * 0.25);
    s.heroShield = Math.max(s.heroShield, Math.round(stats.maxHp * 0.25));
    this.spawnVfx(3, HERO_X, GROUND_Y - 26, 1.35, 0.72);
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

  public forgeEquipment(isAuto = false): boolean {
    const s = this.state;
    if (s.pendingForgeItem) return false;
    const cost = this.getForgeCost();
    if (s.ore < cost) return false;

    s.ore -= cost;
    s.forgeExp += 1;
    s.totalForges += 1;
    const item = rollForgedItem(s.stage, getForgeLevel(s.forgeExp), `eq-${Date.now()}-${this.nextId++}`);

    if (isAuto) {
      const current = s.equipment[item.slot];
      const rank = RARITY_CONFIG[item.rarity].rank;
      const shouldStop =
        s.autoForgeFilter === 'epic'
          ? rank >= 3
          : s.autoForgeFilter === 'rare'
          ? rank >= 2 && (item.power > current.power || rank >= 3)
          : item.power > current.power || rank >= 3;

      if (!shouldStop) {
        const salvageGold = Math.round(18 * item.level * RARITY_CONFIG[item.rarity].mult);
        const salvageOre = Math.max(1, Math.floor(cost * 0.35));
        s.gold += salvageGold;
        s.ore += salvageOre;
        s.forgeExp += 1;
        this.spawnText(HERO_X - 20, GROUND_Y - 58, `자동분해 +${salvageGold}G`, '#93c5fd', 9);
        this.emit('forge');
        return true;
      }
      s.pendingForgeItem = item;
      this.emit('forgeRare');
      return true;
    }

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

  public refineSlot(slot: EquipSlot): boolean {
    const lv = this.state.refineLevels[slot];
    if (lv >= 30) return false;
    const cost = getRefineCost(lv);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.refineLevels[slot] += 1;
    this.state.totalRefines += 1;
    const stats = this.computeStats();
    this.state.heroMaxHp = stats.maxHp;
    this.emit('upgrade');
    return true;
  }

  public getTrainingBatchCost(key: TrainingKey, count: 1 | 10 = this.state.buyStep): number {
    const def = TRAININGS.find((t) => t.key === key)!;
    let total = 0;
    const cur = this.state.training[key];
    for (let i = 0; i < count; i++) {
      total += getTrainingCost(def, cur + i);
    }
    return total;
  }

  public buyTraining(key: TrainingKey): boolean {
    const count = this.state.buyStep;
    const cost = this.getTrainingBatchCost(key, count);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.training[key] += count;
    const stats = this.computeStats();
    this.state.heroMaxHp = stats.maxHp;
    if (key === 'fortitude') {
      this.state.heroHp = Math.min(stats.maxHp, this.state.heroHp + 32 * count);
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
    return this.state.stage >= 4 && !this.state.activeDungeon;
  }

  public getReturnMedalReward(): number {
    if (this.state.stage < 4) return 0;
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
    s.farmMode = false;
    s.gold = 40 + s.facilities.guildHall * 120;
    s.ore = 12 + s.facilities.guildHall * 12;
    s.training = { swordplay: 0, fortitude: 0, logistics: 0 };
    s.companions = { ranger: 0, pyro: 0, banneret: 0 };
    s.equipment = createStarterEquipment();
    s.refineLevels = { weapon: 0, shield: 0, armor: 0 };
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
    s.screenShake = Math.max(0, s.screenShake - rawDt * 22);
    s.guardBurstTimer = Math.max(0, s.guardBurstTimer - rawDt);
    if (s.cutInTimer > 0) s.cutInTimer = Math.max(0, s.cutInTimer - rawDt);
    if (s.bannerTimer > 0) s.bannerTimer = Math.max(0, s.bannerTimer - rawDt);

    // Hit-stop micro-freeze for crisp action impact!
    if (s.hitStopTimer > 0) {
      s.hitStopTimer = Math.max(0, s.hitStopTimer - rawDt);
      this.tickParticlesAndTexts(rawDt * 0.35);
      return;
    }

    s.animTime += dt;
    if (s.oathBuffTimer > 0) s.oathBuffTimer = Math.max(0, s.oathBuffTimer - dt);
    if (s.comboTimer > 0) {
      s.comboTimer -= rawDt;
      if (s.comboTimer <= 0) s.comboCount = 0;
    }
    if (s.heroActionTimer > 0) {
      s.heroActionTimer -= dt;
      if (s.heroActionTimer <= 0) s.heroAction = 'march';
    }

    // Skill cooldowns
    for (const sk of KNIGHT_SKILLS) {
      if (s.skillCooldowns[sk.id] > 0) {
        s.skillCooldowns[sk.id] = Math.max(0, s.skillCooldowns[sk.id] - dt);
      }
    }

    // Ticket auto-recharge (real time)
    if (!this.demoMode) {
      const needsTicket =
        s.dungeonTickets.oreMine < MAX_DUNGEON_TICKETS ||
        s.dungeonTickets.bossArena < MAX_DUNGEON_TICKETS;
      if (needsTicket) {
        s.ticketRechargeTimer += rawDt;
        if (s.ticketRechargeTimer >= TICKET_RECHARGE_SEC) {
          s.ticketRechargeTimer -= TICKET_RECHARGE_SEC;
          s.dungeonTickets.oreMine = Math.min(MAX_DUNGEON_TICKETS, s.dungeonTickets.oreMine + 1);
          s.dungeonTickets.bossArena = Math.min(MAX_DUNGEON_TICKETS, s.dungeonTickets.bossArena + 1);
        }
      }
    }

    // Active Dungeon countdown
    if (s.activeDungeon) {
      s.activeDungeon.timeLeft -= rawDt;
      if (s.activeDungeon.timeLeft <= 0) {
        this.finishDungeon(false);
        return;
      }
    }

    // Auto-Forge
    if (!this.demoMode && s.autoForge && !s.pendingForgeItem) {
      s.autoForgeTimer += rawDt;
      if (s.autoForgeTimer >= 0.75) {
        s.autoForgeTimer = 0;
        if (s.ore >= this.getForgeCost()) {
          this.forgeEquipment(true);
        }
      }
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
      if (s.activeDungeon) {
        if (s.activeDungeon.kills >= s.activeDungeon.targetKills) {
          this.finishDungeon(true);
          return;
        }
        this.spawnDungeonWave();
      } else {
        this.advanceWave();
      }
    }

    const front = this.getFrontEnemy();
    const engageDist = front?.isBoss ? 68 : 54;
    const inCombat = front !== null && front.x - HERO_X <= engageDist;

    if (!inCombat) {
      const speed = (s.stance === 'plunder' ? 112 : 90) * (s.rallyTimer > 0 ? 1.25 : 1);
      s.scrollX += speed * dt;
      s.dustTimer -= dt;
      if (s.dustTimer <= 0) {
        s.dustTimer = 0.16;
        s.particles.push({
          x: HERO_X - 10 + (Math.random() - 0.5) * 6,
          y: GROUND_Y + 2,
          vx: -24 - Math.random() * 14,
          vy: -14 - Math.random() * 14,
          size: 3,
          color: '#cbd5e1',
          life: 0.35,
          maxLife: 0.35,
        });
      }
      for (const e of s.enemies) {
        e.x -= speed * dt;
        e.animTime += dt;
        e.knockbackX = Math.max(0, e.knockbackX - rawDt * 28);
      }
    } else {
      for (let i = 0; i < s.enemies.length; i++) {
        const e = s.enemies[i];
        e.animTime += dt;
        e.hitFlash = Math.max(0, e.hitFlash - rawDt * 6);
        e.knockbackX = Math.max(0, e.knockbackX - rawDt * 30);

        const stopX = HERO_X + (e.isBoss ? 66 : 48 + i * 28);
        if (e.x > stopX) {
          e.x = Math.max(stopX, e.x - 62 * dt);
        }

        if (e.stunTimer > 0) {
          e.stunTimer = Math.max(0, e.stunTimer - dt);
          continue;
        }

        if (i < 2 && e.x - HERO_X <= (e.isBoss ? 76 : 82)) {
          if (e.isBoss) {
            if (e.heavyWindup > 0) {
              e.heavyWindup += dt / 1.35;
              if (e.heavyWindup >= 1) {
                e.heavyWindup = 0;
                e.heavyCooldown = 5.2;
                const dmgMult = s.stance === 'bulwark' ? 0.45 : 1.75;
                this.resolveEnemyAttack(e, stats, stance.dmgTakenMult * dmgMult, true);
              }
              continue;
            }
            e.heavyCooldown -= dt;
            if (e.heavyCooldown <= 0) {
              e.heavyWindup = 0.01;
              continue;
            }
          }

          e.attackTimer -= dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = e.attackInterval;
            this.resolveEnemyAttack(e, stats, stance.dmgTakenMult, false);
          }
        }
      }

      s.heroAttackTimer -= dt;
      if (s.heroAttackTimer <= 0 && front) {
        s.heroAttackTimer = 1 / stats.aps;
        this.performKnightSwing(front, stats);
      }

      // Auto-cast active knight skills
      if (s.autoSkill || this.demoMode) {
        if (s.skillCooldowns.oath <= 0 && s.highestStage >= 3 && s.heroHp < stats.maxHp * 0.85) {
          this.castSkill('oath');
        } else if (s.skillCooldowns.judgment <= 0 && s.highestStage >= 2) {
          this.castSkill('judgment');
        } else if (s.skillCooldowns.whirlwind <= 0) {
          this.castSkill('whirlwind');
        }
      }

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
    const crownMult = this.hasRelic('sovereignCrown') ? 1.6 : 1;

    s.companionCastTimers.ranger = Math.max(0, s.companionCastTimers.ranger - dt);
    s.companionCastTimers.pyro = Math.max(0, s.companionCastTimers.pyro - dt);
    s.companionCastTimers.banneret = Math.max(0, s.companionCastTimers.banneret - dt);

    if (s.companions.ranger > 0 && s.enemies.length > 0) {
      s.companionTimers.ranger -= dt * speedBoost;
      if (s.companionTimers.ranger <= 0) {
        s.companionTimers.ranger = COMPANIONS[0].interval;
        s.companionCastTimers.ranger = 0.42;
        const dmg = stats.atk * (0.48 + s.companions.ranger * 0.16) * crownMult;
        s.projectiles.push({
          id: this.nextId++,
          kind: 'arrow',
          x: HERO_X - 36,
          y: GROUND_Y - 20,
          vx: 260,
          vy: 0,
          damage: dmg,
          color: '#86efac',
          life: 1.2,
        });
        this.emit('arrow');
      }
    }

    if (s.companions.pyro > 0 && s.enemies.length > 0) {
      s.companionTimers.pyro -= dt * speedBoost;
      if (s.companionTimers.pyro <= 0) {
        s.companionTimers.pyro = COMPANIONS[1].interval;
        s.companionCastTimers.pyro = 0.5;
        const dmg = stats.atk * (0.95 + s.companions.pyro * 0.28) * crownMult;
        s.projectiles.push({
          id: this.nextId++,
          kind: 'fireball',
          x: HERO_X - 66,
          y: GROUND_Y - 26,
          vx: 185,
          vy: -16,
          damage: dmg,
          color: '#fb923c',
          life: 1.6,
        });
        this.emit('fireball');
      }
    }

    if (s.companions.banneret > 0) {
      s.companionTimers.banneret -= dt * speedBoost;
      if (s.companionTimers.banneret <= 0) {
        s.companionTimers.banneret = COMPANIONS[2].interval;
        s.companionCastTimers.banneret = 0.6;
        const healAmt = Math.round(stats.maxHp * (0.07 + s.companions.banneret * 0.015) * crownMult);
        s.heroHp = Math.min(stats.maxHp, s.heroHp + healAmt);
        this.addMorale((8 + s.companions.banneret * 1.5) * (crownMult > 1 ? 1.25 : 1));
        this.spawnText(HERO_X, GROUND_Y - 52, `+${healAmt}`, '#4ade80', 10, true);
        this.spawnBurst(HERO_X - 96, GROUND_Y - 28, '#fde047', 6);
        this.emit('heal');
      }
    }
  }

  private tickProjectiles(dt: number): void {
    const s = this.state;
    const stats = this.computeStats();
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
              const dmg = p.damage * (e.isBoss ? stats.bossDmgMult : 1);
              this.damageEnemy(e, dmg, false, '#fb923c');
            }
          }
          this.spawnVfx(2, hitEnemy.x, GROUND_Y - 24, 1.0, 0.32);
          this.spawnBurst(hitEnemy.x, GROUND_Y - 22, '#f97316', 12);
          s.screenShake = Math.max(s.screenShake, 3);
        } else {
          const dmg = p.damage * (hitEnemy.isBoss ? stats.bossDmgMult : 1);
          this.damageEnemy(hitEnemy, dmg, false, '#86efac');
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
    s.hitCounter += 1;

    const isCrit = Math.random() < stats.critChance;
    let dmg = stats.atk * (0.93 + Math.random() * 0.14);
    if (isCrit) dmg *= stats.critMult;
    if (target.isBoss) dmg *= stats.bossDmgMult;
    if (this.hasRelic('frostSeal') && target.stunTimer > 0) dmg *= 1.4;

    this.damageEnemy(target, dmg, isCrit, isCrit ? '#facc15' : '#ffffff');
    this.spawnVfx(isCrit ? 1 : 0, target.x - 8, GROUND_Y - (target.isBoss ? 30 : 20), isCrit ? 0.85 : 0.72, 0.24);
    if (isCrit) s.hitStopTimer = Math.max(s.hitStopTimer, 0.022);

    // Relic: Phoenix Plume AoE Crit Fire Explosion
    if (isCrit && this.hasRelic('phoenixPlume') && Math.random() < 0.35) {
      this.spawnVfx(2, target.x, GROUND_Y - 22, 1.1, 0.32);
      for (const e of s.enemies) {
        if (e.hp > 0) this.damageEnemy(e, stats.atk * 0.7, false, '#fb923c');
      }
      this.spawnText(target.x, GROUND_Y - 56, '🔥 불사조 폭발!', '#fb923c', 10, true);
    }

    // Relic: Frost King Seal 5th-hit Freeze
    if (this.hasRelic('frostSeal') && s.hitCounter % 5 === 0 && target.hp > 0) {
      target.stunTimer = Math.max(target.stunTimer, 1.2);
      this.spawnBurst(target.x, GROUND_Y - 22, '#7dd3fc', 10);
      this.spawnText(target.x, GROUND_Y - 54, '❄️ 빙결!', '#7dd3fc', 10, true);
    }

    if (stats.lifesteal > 0) {
      s.heroHp = Math.min(stats.maxHp, s.heroHp + dmg * stats.lifesteal);
    }

    if (stats.doubleStrikeChance > 0 && Math.random() < stats.doubleStrikeChance && target.hp > 0) {
      this.damageEnemy(target, dmg * 0.75, false, '#38bdf8');
      this.spawnText(target.x, GROUND_Y - 50, '연쇄 일격!', '#38bdf8', 9, true);
    }

    this.addMorale(5.5);
    this.emit(isCrit ? 'crit' : 'hit');
  }

  private damageEnemy(enemy: EnemyEntity, rawDmg: number, isCrit: boolean, color: string): void {
    const dmg = Math.max(1, Math.round(rawDmg));
    enemy.hp -= dmg;
    enemy.hitFlash = 1;
    enemy.knockbackX = enemy.isBoss ? 3 : 6;
    this.state.comboCount += 1;
    this.state.comboTimer = 2.4;

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

  private resolveEnemyAttack(
    attacker: EnemyEntity,
    stats: ComputedStats,
    stanceDmgMult: number,
    isHeavy: boolean
  ): void {
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
      s.heroActionTimer = 0.16;
      s.screenShake = Math.max(s.screenShake, isHeavy ? 6.5 : 2.5);
      this.spawnText(HERO_X, GROUND_Y - 46, isHeavy ? `강타 -${dmg}!` : `-${dmg}`, '#f87171', isHeavy ? 12 : 10, isHeavy);
    }

    // Relic: Citadel Heart Reflect in Bulwark stance
    if (s.stance === 'bulwark' && this.hasRelic('citadelHeart') && attacker.hp > 0) {
      this.damageEnemy(attacker, stats.atk * 1.2, false, '#34d399');
      this.spawnText(attacker.x, GROUND_Y - 48, '반사!', '#34d399', 9, true);
    }

    if (s.heroHp <= 0) {
      if (s.activeDungeon) {
        this.finishDungeon(false);
        return;
      }
      s.heroHp = stats.maxHp;
      s.heroShield = 0;
      s.wave = 1;
      s.farmMode = true;
      s.enemies = [];
      s.bannerText = '전열 재정비 — 반복 파밍 전환 (강화 후 보스 도전!)';
      s.bannerTimer = 2.4;
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

      const isJackpot = this.hasRelic('goldenDice') && Math.random() < 0.08;
      const goldGain = Math.max(1, Math.round(e.goldReward * stats.goldMult * (isJackpot ? 5 : 1)));
      const oreGain = Math.max(1, Math.round(e.oreReward * stats.oreMult));

      if (s.activeDungeon) {
        s.activeDungeon.kills += 1;
        s.activeDungeon.earnedGold += goldGain;
        s.activeDungeon.earnedOre += oreGain;
      } else {
        s.gold += goldGain;
        s.ore += oreGain;
      }

      if (isJackpot) {
        this.spawnText(e.x, GROUND_Y - 46, `🎲 잭팟 +${goldGain}G!`, '#fde047', 12, true);
      } else {
        this.spawnText(e.x - 8, GROUND_Y - 14, `+${goldGain}G`, '#facc15', 9);
      }
      this.spawnText(e.x + 12, GROUND_Y - 26, `+${oreGain}광석`, '#93c5fd', 9);
      this.spawnBurst(e.x, GROUND_Y - 18, '#facc15', e.isBoss ? 24 : 8);
      this.spawnLootDrops(e.x, e.isBoss ? 6 : isJackpot ? 5 : 2);

      if (e.isBoss && !s.activeDungeon) {
        s.totalBossKills += 1;
        s.hitStopTimer = 0.07;
        s.bannerText = `🚩 STAGE ${s.stage} 점령 완료!`;
        s.bannerTimer = 2.0;
        this.emit('bossKill');
      }
    }
  }

  private advanceWave(): void {
    const s = this.state;
    if (s.farmMode) {
      s.wave = s.wave >= 4 ? 1 : s.wave + 1;
      this.spawnWave();
      return;
    }

    if (s.wave < 5) {
      s.wave += 1;
    } else {
      s.stage += 1;
      s.highestStage = Math.max(s.highestStage, s.stage);
      s.wave = 1;
    }
    this.spawnWave();
  }

  private recordDiscovery(kind: EnemyKind, zoneIndex: number): void {
    if (this.demoMode) return;
    if (kind === 'boss') {
      if (!this.state.discoveredBosses.includes(zoneIndex)) {
        this.state.discoveredBosses.push(zoneIndex);
      }
    } else if (!this.state.discoveredEnemies.includes(kind)) {
      this.state.discoveredEnemies.push(kind);
    }
  }

  private spawnWave(): void {
    const s = this.state;
    const zone = getZoneForStage(s.stage);
    const zoneIndex = getZoneIndexForStage(s.stage);
    const isBoss = s.wave === 5;
    const factor = Math.pow(1.34, s.stage - 1) * (1 + (s.wave - 1) * 0.14);

    if (isBoss) {
      this.recordDiscovery('boss', zoneIndex);
      const maxHp = Math.round(180 * factor);
      s.enemies = [
        {
          id: this.nextId++,
          kind: 'boss',
          name: zone.bossName,
          isBoss: true,
          bossVisualRow: zoneIndex,
          x: ARENA_WIDTH + 34,
          knockbackX: 0,
          hp: maxHp,
          maxHp,
          atk: Math.round(14 * Math.pow(1.24, s.stage - 1)),
          attackTimer: 1.4,
          attackInterval: 2.1,
          heavyWindup: 0,
          heavyCooldown: 3.4,
          stunTimer: 0,
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
      this.recordDiscovery(kind, zoneIndex);
      const maxHp = Math.round(44 * factor * (kind === 'golem' || kind === 'wyvern' ? 1.25 : 1));
      s.enemies.push({
        id: this.nextId++,
        kind,
        name: ENEMY_NAMES[kind],
        isBoss: false,
        x: ARENA_WIDTH + 24 + i * 36,
        knockbackX: 0,
        hp: maxHp,
        maxHp,
        atk: Math.round(6.5 * Math.pow(1.21, s.stage - 1)),
        attackTimer: 1.0 + i * 0.35,
        attackInterval: 1.95,
        heavyWindup: 0,
        heavyCooldown: 99,
        stunTimer: 0,
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
      vx: (Math.random() - 0.5) * 24,
      vy: bold ? -48 : -36,
      text,
      color,
      size,
      life: 0.8,
      maxLife: 0.8,
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

  private spawnVfx(cell: 0 | 1 | 2 | 3, x: number, y: number, scale: number, life: number): void {
    this.state.vfxList.push({
      id: this.nextId++,
      cell,
      x,
      y,
      scale,
      life,
      maxLife: life,
    });
  }

  private spawnLootDrops(x: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const kind: 'coin' | 'ore' = i % 2 === 0 ? 'coin' : 'ore';
      this.state.lootDrops.push({
        id: this.nextId++,
        kind,
        x: x + (Math.random() - 0.5) * 16,
        y: GROUND_Y - 16,
        vx: (Math.random() - 0.5) * 58,
        vy: -78 - Math.random() * 44,
        life: 0.95 + Math.random() * 0.25,
        maxLife: 1.2,
      });
    }
  }

  private tickParticlesAndTexts(dt: number): void {
    const s = this.state;
    for (let i = s.lootDrops.length - 1; i >= 0; i--) {
      const d = s.lootDrops[i];
      d.life -= dt;
      if (d.life < 0.28) {
        d.x += (HERO_X - d.x) * Math.min(1, dt * 12);
        d.y += (GROUND_Y - 24 - d.y) * Math.min(1, dt * 12);
      } else {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 260 * dt;
        if (d.y > GROUND_Y + 2) {
          d.y = GROUND_Y + 2;
          d.vy = -Math.abs(d.vy) * 0.42;
          d.vx *= 0.65;
        }
      }
      if (d.life <= 0) s.lootDrops.splice(i, 1);
    }
    for (let i = s.vfxList.length - 1; i >= 0; i--) {
      s.vfxList[i].life -= dt;
      if (s.vfxList[i].life <= 0) s.vfxList.splice(i, 1);
    }
    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      const ft = s.floatingTexts[i];
      ft.x += ft.vx * dt;
      ft.vx *= 0.92;
      ft.y += ft.vy * dt;
      ft.vy += 46 * dt;
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
