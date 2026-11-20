export type UpgradeKey = 'atk' | 'atkSpeed' | 'crit' | 'maxHp' | 'regen' | 'goldGain';

export type RelicKey = 'soulBlade' | 'goldenGrace' | 'counterMastery' | 'swiftStart';

export type SkillId = 'moonSlash' | 'flashDash' | 'eclipseAegis' | 'abyssStorm';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type EnemyKind = 'slime' | 'skeleton' | 'bat' | 'knight' | 'gargoyle' | 'boss';

export type BuyMode = 1 | 10 | 'MAX';

export interface BiomeDef {
  id: string;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  pillarColor: string;
  torchColor: string;
  floorTop: string;
  floorBase: string;
  moonTint: string;
  enemyPool: EnemyKind[];
  bossName: string;
}

export interface UpgradeDef {
  key: UpgradeKey;
  name: string;
  shortDesc: string;
  baseCost: number;
  costGrowth: number;
  icon: string;
}

export interface RelicDef {
  key: RelicKey;
  name: string;
  desc: string;
  baseCost: number;
  costStep: number;
  maxLevel: number;
  icon: string;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
  cooldown: number;
  unlockStage: number;
  color: string;
  icon: string;
}

export interface AwakeningCardDef {
  id: string;
  name: string;
  rarity: CardRarity;
  desc: string;
  maxStack: number;
  icon: string;
  tag: string;
}

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  isBoss: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  attackCooldown: number;
  attackInterval: number;
  /** 0..1 telegraph windup right before attacking; window for perfect counter */
  windup: number;
  windupDuration: number;
  stunTimer: number;
  hitFlash: number;
  scale: number;
  animTime: number;
  goldReward: number;
  expReward: number;
  soulReward: number;
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

export interface SlashEffect {
  id: number;
  x: number;
  y: number;
  kind: 'normal' | 'crit' | 'counter' | 'moon' | 'storm' | 'heal';
  life: number;
  maxLife: number;
  radius: number;
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
  regenPerSec: number;
  goldMult: number;
  lifesteal: number;
  counterMult: number;
  bossDmgMult: number;
  chainLightningChance: number;
  executeBonus: number;
  dps: number;
  tierName: string;
  tierIndex: number;
}

export type GameEventType =
  | 'slash'
  | 'crit'
  | 'counter'
  | 'skill'
  | 'bossWarning'
  | 'bossKill'
  | 'levelUp'
  | 'feverStart'
  | 'upgrade'
  | 'heroDie'
  | 'rebirth';

export interface GameEvent {
  type: GameEventType;
  label?: string;
}

export interface SaveData {
  version: number;
  stage: number;
  highestStage: number;
  wave: number; // 1..5 (5 = boss)
  gold: number;
  soul: number;
  level: number;
  exp: number;
  upgrades: Record<UpgradeKey, number>;
  relics: Record<RelicKey, number>;
  cards: Record<string, number>;
  pendingAwakenings: number;
  autoSkill: boolean;
  speedMult: 1 | 2;
  soundEnabled: boolean;
  totalKills: number;
  totalCounters: number;
  totalPlaySeconds: number;
  rebirthCount: number;
  savedAt: number;
}

export interface GameState {
  stage: number;
  highestStage: number;
  wave: number; // 1..5
  gold: number;
  soul: number;
  level: number;
  exp: number;
  expToNext: number;

  heroX: number;
  heroHp: number;
  heroMaxHp: number;
  heroShield: number;
  heroState: 'run' | 'attack' | 'counter' | 'hurt';
  heroStateTimer: number;
  heroAttackTimer: number;
  heroAnimTime: number;

  feverGauge: number; // 0..100
  feverActiveTimer: number;
  counterCooldown: number;
  counterFlashTimer: number;
  screenShake: number;
  scrollOffset: number;
  bannerText: string;
  bannerTimer: number;

  upgrades: Record<UpgradeKey, number>;
  relics: Record<RelicKey, number>;
  cards: Record<string, number>;
  skillCooldowns: Record<SkillId, number>;

  pendingAwakenings: number;
  activeCardChoices: AwakeningCardDef[] | null;

  autoSkill: boolean;
  speedMult: 1 | 2;
  soundEnabled: boolean;
  buyMode: BuyMode;

  enemies: EnemyEntity[];
  floatingTexts: FloatingText[];
  slashEffects: SlashEffect[];
  particles: Particle[];

  totalKills: number;
  totalCounters: number;
  totalPlaySeconds: number;
  rebirthCount: number;
  recentDamageWindow: number[];
}
