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
  getQuestDef,
  getRefineCost,
  getTrainingCost,
  getZoneForStage,
  getZoneIndexForStage,
  rollForgedItem,
} from './data';
import type {
  CompanionId,
  ComputedStats,
  EnemyEntity,
  EnemyKind,
  EquipSlot,
  FacilityKey,
  GameEvent,
  GameState,
  QuestDef,
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
      this.computeOfflineLoot(saved.savedAt);
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
      autoForgeTimer: 0,
      screenShake: 0,
      bannerText: '',
      bannerTimer: 0,

      speedMult: saved?.speedMult ?? 1,
      autoRally: saved?.autoRally ?? false,
      autoForge: saved?.autoForge ?? false,
      soundEnabled: saved?.soundEnabled ?? true,
      bgmEnabled: saved?.bgmEnabled ?? false,
      buyStep: 1,

      enemies: [],
      projectiles: [],
      vfxList: [],
      floatingTexts: [],
      particles: [],

      totalKills: saved?.totalKills ?? 0,
      totalBossKills: saved?.totalBossKills ?? 0,
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

  private computeOfflineLoot(savedAt: number): void {
    const elapsed = Math.floor((Date.now() - savedAt) / 1000);
    if (elapsed < 60) return; // Require at least 1 minute away
    const capped = Math.min(elapsed, 12 * 3600);
    const stats = this.computeStats();
    const s = this.state;
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

    const weaponAtk = this.getEffectiveEquipPower('weapon');
    const baseAtk = 10 + weaponAtk + s.training.swordplay * 5;
    const atk = baseAtk * academyMult * (1 + codexAtkBonus) * stance.atkMult * rallyAtkMult;

    const aps = 1.12 * (1 + bonusSpeed) * stance.apsMult * rallyApsMult;
    const critChance = Math.min(0.85, 0.1 + s.training.swordplay * 0.006 + bonusCrit);
    const critMult = 1.75;

    const shieldHp = this.getEffectiveEquipPower('shield');
    const maxHp = Math.round((135 + shieldHp + s.training.fortitude * 32) * (1 + bonusHp));
    const def = this.getEffectiveEquipPower('armor');
    const regenPerSec = 2.6 + s.training.fortitude * 2.2 + maxHp * 0.006;

    const goldMult = (1 + s.training.logistics * 0.15 + bonusGold) * stance.lootMult * supplyMult;
    const oreMult = (1 + s.training.logistics * 0.12 + traitOreBonus) * stance.lootMult * supplyMult;

    const heroDps = atk * (1 - critChance + critChance * critMult) * aps * (1 + doubleStrikeChance * 0.75);
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
      doubleStrikeChance,
      lifesteal,
      bossDmgMult,
      codexAtkBonus,
      dps: heroDps + rangerDps + pyroDps,
      forgeLevel: getForgeLevel(s.forgeExp),
      rankTitle: getKnightRankTitle(s.highestStage),
    };
  }

  public getCurrentQuestStatus(): { def: QuestDef; progress: number; complete: boolean } {
    const s = this.state;
    const def = getQuestDef(s.questIndex);
    const isLoopQuest = s.questIndex >= 10;
    let raw = 0;

    switch (def.goalType) {
      case 'kills':
        raw = s.totalKills;
        break;
      case 'forges':
        raw = s.totalForges;
        break;
      case 'stage':
        raw = s.highestStage;
        break;
      case 'companions':
        raw =
          (s.companions.ranger > 0 ? 1 : 0) +
          (s.companions.pyro > 0 ? 1 : 0) +
          (s.companions.banneret > 0 ? 1 : 0);
        break;
      case 'stanceSwitch':
        raw = s.totalStanceSwitches;
        break;
      case 'rally':
        raw = s.totalRallies;
        break;
      case 'refine':
        raw = s.totalRefines;
        break;
      case 'bossKills':
        raw = s.totalBossKills;
        break;
    }

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
    if (s.questIndex >= 10) {
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
      case 'refine': return s.totalRefines;
      case 'bossKills': return s.totalBossKills;
      default: return 0;
    }
  }

  public toSaveData(): SaveData {
    const s = this.state;
    return {
      version: 3,
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
      questIndex: s.questIndex,
      questBaseline: s.questBaseline,
      discoveredEnemies: [...s.discoveredEnemies],
      discoveredBosses: [...s.discoveredBosses],
      speedMult: s.speedMult,
      autoRally: s.autoRally,
      autoForge: s.autoForge,
      soundEnabled: s.soundEnabled,
      bgmEnabled: s.bgmEnabled,
      totalKills: s.totalKills,
      totalBossKills: s.totalBossKills,
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

    // Check Perfect Guard if switching to Bulwark right while a Boss is telegraphing a heavy strike!
    const chargingBoss = this.state.enemies.find((e) => e.isBoss && e.heavyWindup >= 0.35);
    if (stance === 'bulwark' && chargingBoss) {
      chargingBoss.heavyWindup = 0;
      chargingBoss.heavyCooldown = 5.5;
      chargingBoss.stunTimer = 1.6;
      const stats = this.computeStats();
      this.state.heroShield = Math.max(this.state.heroShield, Math.round(stats.maxHp * 0.35));
      this.addMorale(24);
      this.state.totalPerfectGuards += 1;
      this.state.screenShake = 6;
      this.damageEnemy(chargingBoss, stats.atk * 2.2, true, '#38bdf8');
      this.spawnVfx(3, HERO_X, GROUND_Y - 24, 1.0, 0.5);
      this.spawnText(HERO_X, GROUND_Y - 62, '🛡️ 철벽 완벽 방어!', '#38bdf8', 12, true);
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
    s.screenShake = 6;
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
      const isUpgrade = item.power > current.power || RARITY_CONFIG[item.rarity].rank >= 3;
      if (!isUpgrade) {
        // Auto-salvage weak rolls cleanly!
        const salvageGold = Math.round(18 * item.level * RARITY_CONFIG[item.rarity].mult);
        const salvageOre = Math.max(1, Math.floor(cost * 0.35));
        s.gold += salvageGold;
        s.ore += salvageOre;
        s.forgeExp += 1;
        this.spawnText(HERO_X - 20, GROUND_Y - 58, `자동분해 +${salvageGold}G`, '#93c5fd', 9);
        this.emit('forge');
        return true;
      }
      // Pause auto-forge when an upgrade or Epic/Mythic drops!
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
    s.animTime += dt;
    s.screenShake = Math.max(0, s.screenShake - rawDt * 22);
    if (s.bannerTimer > 0) s.bannerTimer = Math.max(0, s.bannerTimer - rawDt);
    if (s.comboTimer > 0) {
      s.comboTimer -= rawDt;
      if (s.comboTimer <= 0) s.comboCount = 0;
    }
    if (s.heroActionTimer > 0) {
      s.heroActionTimer -= dt;
      if (s.heroActionTimer <= 0) s.heroAction = 'march';
    }

    // Auto-Forge tick when enabled and no pending modal
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
          // Boss Heavy Strike Telegraph!
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

    s.companionCastTimers.ranger = Math.max(0, s.companionCastTimers.ranger - dt);
    s.companionCastTimers.pyro = Math.max(0, s.companionCastTimers.pyro - dt);
    s.companionCastTimers.banneret = Math.max(0, s.companionCastTimers.banneret - dt);

    if (s.companions.ranger > 0 && s.enemies.length > 0) {
      s.companionTimers.ranger -= dt * speedBoost;
      if (s.companionTimers.ranger <= 0) {
        s.companionTimers.ranger = COMPANIONS[0].interval;
        s.companionCastTimers.ranger = 0.42;
        const dmg = stats.atk * (0.48 + s.companions.ranger * 0.16);
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
        const dmg = stats.atk * (0.95 + s.companions.pyro * 0.28);
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

    const isCrit = Math.random() < stats.critChance;
    let dmg = stats.atk * (0.93 + Math.random() * 0.14);
    if (isCrit) dmg *= stats.critMult;
    if (target.isBoss) dmg *= stats.bossDmgMult;

    this.damageEnemy(target, dmg, isCrit, isCrit ? '#facc15' : '#ffffff');
    this.spawnVfx(isCrit ? 1 : 0, target.x - 8, GROUND_Y - (target.isBoss ? 30 : 20), isCrit ? 0.85 : 0.72, 0.24);

    if (stats.lifesteal > 0) {
      s.heroHp = Math.min(stats.maxHp, s.heroHp + dmg * stats.lifesteal);
    }

    // Epic/Mythic Trait: Double Strike!
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

    if (s.heroHp <= 0) {
      s.heroHp = stats.maxHp;
      s.heroShield = 0;
      s.wave = 1;
      s.farmMode = true; // Safely switch to repeat farming so player doesn't get stuck dying!
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

      const goldGain = Math.max(1, Math.round(e.goldReward * stats.goldMult));
      const oreGain = Math.max(1, Math.round(e.oreReward * stats.oreMult));
      s.gold += goldGain;
      s.ore += oreGain;

      this.spawnText(e.x - 8, GROUND_Y - 14, `+${goldGain}G`, '#facc15', 9);
      this.spawnText(e.x + 12, GROUND_Y - 26, `+${oreGain}광석`, '#93c5fd', 9);
      this.spawnBurst(e.x, GROUND_Y - 18, '#facc15', e.isBoss ? 20 : 8);

      if (e.isBoss) {
        s.totalBossKills += 1;
        s.bannerText = `🚩 STAGE ${s.stage} 점령 완료!`;
        s.bannerTimer = 2.0;
        this.emit('bossKill');
      }
    }
  }

  private advanceWave(): void {
    const s = this.state;
    if (s.farmMode) {
      // Loop waves 1..4 safely while farming
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

  private tickParticlesAndTexts(dt: number): void {
    const s = this.state;
    for (let i = s.vfxList.length - 1; i >= 0; i--) {
      s.vfxList[i].life -= dt;
      if (s.vfxList[i].life <= 0) s.vfxList.splice(i, 1);
    }
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
