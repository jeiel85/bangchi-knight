export type StanceId = 'vanguard' | 'bulwark' | 'plunder';

export type EquipSlot = 'weapon' | 'shield' | 'armor';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';

export type TrainingKey = 'swordplay' | 'fortitude' | 'logistics';

export type CompanionId = 'ranger' | 'pyro' | 'banneret';

export type FacilityKey = 'royalForge' | 'warAcademy' | 'supplyWagon' | 'guildHall';

export type KnightSkillId = 'whirlwind' | 'judgment' | 'oath';

export type DungeonId = 'oreMine' | 'bossArena';

export type RelicId =
  | 'phoenixPlume'
  | 'frostSeal'
  | 'stormCompass'
  | 'citadelHeart'
  | 'goldenDice'
  | 'sovereignCrown';

export type AutoForgeFilter = 'upgrade' | 'rare' | 'epic';

export type EnemyKind = 'goblin' | 'boar' | 'bandit' | 'scorpion' | 'bogling' | 'golem' | 'wyvern' | 'boss';

export type ItemTraitId = 'doubleStrike' | 'vampiric' | 'oreFinder' | 'bossBreaker';

export interface ItemTraitDef {
  id: ItemTraitId;
  name: string;
  desc: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  roadTop: string;
  roadBase: string;
  sunColor: string;
  accent: string;
  enemyPool: EnemyKind[];
  bossName: string;
}

export interface StanceDef {
  id: StanceId;
  name: string;
  shortDesc: string;
  icon: string;
  color: string;
  atkMult: number;
  apsMult: number;
  dmgTakenMult: number;
  lootMult: number;
  shieldRegenRatio: number;
}

export interface KnightSkillDef {
  id: KnightSkillId;
  name: string;
  desc: string;
  cooldown: number;
  unlockStage: number;
  baseUpgradeCost: number;
  iconIndex: number;
}

export interface DungeonDef {
  id: DungeonId;
  name: string;
  subtitle: string;
  desc: string;
  durationSec: number;
  targetKills: number;
  iconIndex: number;
}

export interface RankDef {
  rank: number;
  title: string;
  reqStage: number;
  atkBonusPct: number;
  medalReward: number;
}

export interface RelicDef {
  id: RelicId;
  name: string;
  tag: string;
  desc: string;
  iconIndex: number;
  color: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  target: number;
  rewardMedals: number;
  rewardOre: number;
}

export interface ActiveDungeonState {
  id: DungeonId;
  tier: number;
  timeLeft: number;
  maxTime: number;
  kills: number;
  targetKills: number;
  earnedGold: number;
  earnedOre: number;
  earnedMedals: number;
}

export interface DungeonResultModal {
  id: DungeonId;
  tier: number;
  cleared: boolean;
  kills: number;
  targetKills: number;
  gold: number;
  ore: number;
  medals: number;
}

export interface EquipItem {
  id: string;
  slot: EquipSlot;
  name: string;
  rarity: ItemRarity;
  level: number;
  power: number;
  bonusLabel: string;
  bonusStat: 'crit' | 'gold' | 'speed' | 'hp';
  bonusValue: number;
  trait?: ItemTraitId;
}

export interface TrainingDef {
  key: TrainingKey;
  name: string;
  desc: string;
  baseCost: number;
  growth: number;
  icon: string;
}

export interface CompanionDef {
  id: CompanionId;
  name: string;
  role: string;
  desc: string;
  unlockCost: number;
  baseUpgradeCost: number;
  color: string;
  icon: string;
  interval: number;
}

export interface FacilityDef {
  key: FacilityKey;
  name: string;
  desc: string;
  baseCost: number;
  step: number;
  maxLevel: number;
  icon: string;
}

export type QuestGoalType =
  | 'kills'
  | 'forges'
  | 'stage'
  | 'companions'
  | 'stanceSwitch'
  | 'rally'
  | 'refine'
  | 'bossKills'
  | 'dungeonClears';

export interface QuestDef {
  index: number;
  title: string;
  goalType: QuestGoalType;
  target: number;
  rewardGold: number;
  rewardOre: number;
  rewardMedals?: number;
}

export interface OfflineReport {
  elapsedSeconds: number;
  kills: number;
  gold: number;
  ore: number;
}

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  isBoss: boolean;
  bossVisualRow?: number;
  x: number;
  knockbackX: number;
  hp: number;
  maxHp: number;
  atk: number;
  attackTimer: number;
  attackInterval: number;
  heavyWindup: number;
  heavyCooldown: number;
  stunTimer: number;
  hitFlash: number;
  animTime: number;
  goldReward: number;
  oreReward: number;
}

export interface Projectile {
  id: number;
  kind: 'arrow' | 'fireball';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  life: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  bold?: boolean;
}

export interface VfxInstance {
  id: number;
  cell: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  scale: number;
  life: number;
  maxLife: number;
}

export interface LootDrop {
  id: number;
  kind: 'coin' | 'ore';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface ComputedStats {
  atk: number;
  aps: number;
  critChance: number;
  critMult: number;
  maxHp: number;
  def: number;
  regenPerSec: number;
  goldMult: number;
  oreMult: number;
  doubleStrikeChance: number;
  lifesteal: number;
  bossDmgMult: number;
  codexAtkBonus: number;
  rankAtkBonus: number;
  dps: number;
  cp: number;
  forgeLevel: number;
  rankTitle: string;
}

export type GameEventType =
  | 'hit'
  | 'crit'
  | 'arrow'
  | 'fireball'
  | 'heal'
  | 'forge'
  | 'forgeRare'
  | 'rally'
  | 'skill'
  | 'stance'
  | 'perfectGuard'
  | 'questClaim'
  | 'bossWarning'
  | 'bossKill'
  | 'upgrade'
  | 'retreat'
  | 'returnKingdom';

export interface GameEvent {
  type: GameEventType;
}

export interface SaveData {
  version: number;
  stage: number;
  highestStage: number;
  wave: number;
  farmMode: boolean;
  gold: number;
  ore: number;
  medals: number;
  forgeExp: number;
  stance: StanceId;
  equipment: Record<EquipSlot, EquipItem>;
  refineLevels: Record<EquipSlot, number>;
  training: Record<TrainingKey, number>;
  companions: Record<CompanionId, number>;
  facilities: Record<FacilityKey, number>;
  skillLevels: Record<KnightSkillId, number>;
  dungeonTickets: Record<DungeonId, number>;
  dungeonTiers: Record<DungeonId, number>;
  ticketRechargeTimer: number;
  claimedRank: number;
  unlockedRelics: RelicId[];
  equippedRelics: RelicId[];
  claimedAchievements: string[];
  questIndex: number;
  questBaseline: number;
  discoveredEnemies: string[];
  discoveredBosses: number[];
  speedMult: 1 | 2 | 3;
  autoRally: boolean;
  autoSkill: boolean;
  autoForge: boolean;
  autoForgeFilter: AutoForgeFilter;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  totalKills: number;
  totalBossKills: number;
  totalDungeonClears: number;
  totalForges: number;
  totalRefines: number;
  totalStanceSwitches: number;
  totalRallies: number;
  totalPerfectGuards: number;
  expeditionReturns: number;
  totalPlaySeconds: number;
  savedAt: number;
}

export interface GameState {
  stage: number;
  highestStage: number;
  wave: number;
  farmMode: boolean;
  gold: number;
  ore: number;
  medals: number;
  forgeExp: number;

  stance: StanceId;
  equipment: Record<EquipSlot, EquipItem>;
  refineLevels: Record<EquipSlot, number>;
  pendingForgeItem: EquipItem | null;

  training: Record<TrainingKey, number>;
  companions: Record<CompanionId, number>;
  facilities: Record<FacilityKey, number>;

  skillLevels: Record<KnightSkillId, number>;
  skillCooldowns: Record<KnightSkillId, number>;
  oathBuffTimer: number;

  dungeonTickets: Record<DungeonId, number>;
  dungeonTiers: Record<DungeonId, number>;
  ticketRechargeTimer: number;
  activeDungeon: ActiveDungeonState | null;
  dungeonResult: DungeonResultModal | null;

  claimedRank: number;
  unlockedRelics: RelicId[];
  equippedRelics: RelicId[];
  claimedAchievements: string[];
  questIndex: number;
  questBaseline: number;
  discoveredEnemies: string[];
  discoveredBosses: number[];
  offlineReport: OfflineReport | null;

  heroHp: number;
  heroMaxHp: number;
  heroShield: number;
  heroAction: 'march' | 'swing' | 'hurt';
  heroActionTimer: number;
  heroAttackTimer: number;
  animTime: number;
  scrollX: number;
  comboCount: number;
  comboTimer: number;

  companionTimers: Record<CompanionId, number>;
  companionCastTimers: Record<CompanionId, number>;

  morale: number;
  rallyTimer: number;
  guardBurstTimer: number;
  hitStopTimer: number;
  cutInTimer: number;
  cutInText: string;
  cutInColor: string;
  hitCounter: number;
  dustTimer: number;
  autoForgeTimer: number;
  screenShake: number;
  bannerText: string;
  bannerTimer: number;

  speedMult: 1 | 2 | 3;
  autoRally: boolean;
  autoSkill: boolean;
  autoForge: boolean;
  autoForgeFilter: AutoForgeFilter;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  buyStep: 1 | 10;

  enemies: EnemyEntity[];
  projectiles: Projectile[];
  vfxList: VfxInstance[];
  lootDrops: LootDrop[];
  floatingTexts: FloatingText[];
  particles: Particle[];

  totalKills: number;
  totalBossKills: number;
  totalDungeonClears: number;
  totalForges: number;
  totalRefines: number;
  totalStanceSwitches: number;
  totalRallies: number;
  totalPerfectGuards: number;
  expeditionReturns: number;
  totalPlaySeconds: number;
}
