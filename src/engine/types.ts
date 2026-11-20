export type StanceId = 'vanguard' | 'bulwark' | 'plunder';

export type EquipSlot = 'weapon' | 'shield' | 'armor';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic';

export type TrainingKey = 'swordplay' | 'fortitude' | 'logistics';

export type CompanionId = 'ranger' | 'pyro' | 'banneret';

export type FacilityKey = 'royalForge' | 'warAcademy' | 'supplyWagon' | 'guildHall';

export type EnemyKind = 'goblin' | 'boar' | 'bandit' | 'scorpion' | 'bogling' | 'golem' | 'wyvern' | 'boss';

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

export interface EquipItem {
  id: string;
  slot: EquipSlot;
  name: string;
  rarity: ItemRarity;
  level: number;
  power: number; // weapon->atk, shield->maxHp, armor->def/regen
  bonusLabel: string;
  bonusStat: 'crit' | 'gold' | 'speed' | 'hp';
  bonusValue: number;
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

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  isBoss: boolean;
  x: number;
  hp: number;
  maxHp: number;
  atk: number;
  attackTimer: number;
  attackInterval: number;
  hitFlash: number;
  animTime: number;
  goldReward: number;
  oreReward: number;
}

export interface Projectile {
  id: number;
  kind: 'arrow' | 'fireball' | 'healWave';
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
  cell: 0 | 1 | 2 | 3; // 0=slash, 1=crit, 2=explosion, 3=rallyBeam
  x: number;
  y: number;
  scale: number;
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
  dps: number;
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
  | 'stance'
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
  gold: number;
  ore: number;
  medals: number;
  forgeExp: number;
  stance: StanceId;
  equipment: Record<EquipSlot, EquipItem>;
  training: Record<TrainingKey, number>;
  companions: Record<CompanionId, number>;
  facilities: Record<FacilityKey, number>;
  speedMult: 1 | 2;
  autoRally: boolean;
  soundEnabled: boolean;
  totalKills: number;
  totalForges: number;
  expeditionReturns: number;
  totalPlaySeconds: number;
  savedAt: number;
}

export interface GameState {
  stage: number;
  highestStage: number;
  wave: number; // 1..5
  gold: number;
  ore: number;
  medals: number;
  forgeExp: number;

  stance: StanceId;
  equipment: Record<EquipSlot, EquipItem>;
  pendingForgeItem: EquipItem | null;

  training: Record<TrainingKey, number>;
  companions: Record<CompanionId, number>;
  facilities: Record<FacilityKey, number>;

  heroHp: number;
  heroMaxHp: number;
  heroShield: number;
  heroAction: 'march' | 'swing' | 'hurt';
  heroActionTimer: number;
  heroAttackTimer: number;
  animTime: number;
  scrollX: number;

  companionTimers: Record<CompanionId, number>;
  companionCastTimers: Record<CompanionId, number>;

  morale: number; // 0..100
  rallyTimer: number; // >0 while Warhorn Rally is active
  screenShake: number;
  bannerText: string;
  bannerTimer: number;

  speedMult: 1 | 2;
  autoRally: boolean;
  soundEnabled: boolean;

  enemies: EnemyEntity[];
  projectiles: Projectile[];
  vfxList: VfxInstance[];
  floatingTexts: FloatingText[];
  particles: Particle[];

  totalKills: number;
  totalForges: number;
  expeditionReturns: number;
  totalPlaySeconds: number;
}
