import type {
  AwakeningCardDef,
  BiomeDef,
  RelicDef,
  SkillDef,
  UpgradeDef,
} from './types';

export const BIOMES: BiomeDef[] = [
  {
    id: 'catacomb',
    name: '어둠의 지하묘지',
    subtitle: 'DARK CATACOMB',
    skyTop: '#080912',
    skyBottom: '#13162b',
    pillarColor: '#1b1f38',
    torchColor: '#f59e0b',
    floorTop: '#2a304d',
    floorBase: '#151829',
    moonTint: '#f5b942',
    enemyPool: ['slime', 'skeleton', 'bat'],
    bossName: '해골 군주 말로크',
  },
  {
    id: 'blood-hall',
    name: '피의 회랑',
    subtitle: 'CRIMSON CORRIDOR',
    skyTop: '#12070c',
    skyBottom: '#26101b',
    pillarColor: '#331524',
    torchColor: '#fb7185',
    floorTop: '#452031',
    floorBase: '#210e17',
    moonTint: '#fb7185',
    enemyPool: ['bat', 'skeleton', 'knight'],
    bossName: '진홍의 기사단장',
  },
  {
    id: 'frost-watch',
    name: '서리 망루',
    subtitle: 'FROSTBASTION',
    skyTop: '#071019',
    skyBottom: '#102436',
    pillarColor: '#1a364f',
    torchColor: '#38bdf8',
    floorTop: '#294c6b',
    floorBase: '#102233',
    moonTint: '#7dd3fc',
    enemyPool: ['skeleton', 'knight', 'gargoyle'],
    bossName: '빙결의 감시자',
  },
  {
    id: 'abyss-altar',
    name: '심연의 제단',
    subtitle: 'ALTAR OF THE ABYSS',
    skyTop: '#0d0718',
    skyBottom: '#201138',
    pillarColor: '#2d1a4d',
    torchColor: '#c084fc',
    floorTop: '#3e2766',
    floorBase: '#190e2e',
    moonTint: '#c084fc',
    enemyPool: ['knight', 'gargoyle', 'bat'],
    bossName: '심연의 대사제',
  },
  {
    id: 'eclipse-throne',
    name: '흑월의 왕좌',
    subtitle: 'ECLIPSE THRONE',
    skyTop: '#07070b',
    skyBottom: '#1b1421',
    pillarColor: '#2b202e',
    torchColor: '#fbbf24',
    floorTop: '#42312a',
    floorBase: '#171115',
    moonTint: '#fde047',
    enemyPool: ['knight', 'gargoyle', 'skeleton'],
    bossName: '흑월의 파괴신',
  },
];

export const KNIGHT_TIERS = [
  { name: '견습 흑기사', minStage: 1, capeColor: '#b91c1c', auraColor: '#f5b942' },
  { name: '월광 검사', minStage: 4, capeColor: '#2563eb', auraColor: '#38bdf8' },
  { name: '심연의 발키리', minStage: 8, capeColor: '#7c3aed', auraColor: '#c084fc' },
  { name: '흑월의 군주', minStage: 13, capeColor: '#f59e0b', auraColor: '#fde047' },
];

export const UPGRADES: UpgradeDef[] = [
  {
    key: 'atk',
    name: '공격력',
    shortDesc: '기본 공격력 +4.5',
    baseCost: 12,
    costGrowth: 1.155,
    icon: '⚔️',
  },
  {
    key: 'atkSpeed',
    name: '공격속도',
    shortDesc: '공격속도 +5%',
    baseCost: 18,
    costGrowth: 1.185,
    icon: '💨',
  },
  {
    key: 'crit',
    name: '치명타',
    shortDesc: '치명 확률 +2% / 피해 +8%',
    baseCost: 22,
    costGrowth: 1.18,
    icon: '💥',
  },
  {
    key: 'maxHp',
    name: '최대 체력',
    shortDesc: '최대 체력 +28',
    baseCost: 14,
    costGrowth: 1.15,
    icon: '🛡️',
  },
  {
    key: 'regen',
    name: '체력 재생',
    shortDesc: '초당 회복 +1.6 + 0.25%',
    baseCost: 16,
    costGrowth: 1.16,
    icon: '💚',
  },
  {
    key: 'goldGain',
    name: '골드 획득',
    shortDesc: '골드 획득량 +16%',
    baseCost: 24,
    costGrowth: 1.19,
    icon: '🪙',
  },
];

export const RELICS: RelicDef[] = [
  {
    key: 'soulBlade',
    name: '영혼의 검',
    desc: '영구 공격력 +25% / Lv',
    baseCost: 2,
    costStep: 2,
    maxLevel: 25,
    icon: '🗡️',
  },
  {
    key: 'goldenGrace',
    name: '황금 축복',
    desc: '영구 골드 획득 +30% / Lv',
    baseCost: 2,
    costStep: 2,
    maxLevel: 25,
    icon: '👑',
  },
  {
    key: 'counterMastery',
    name: '반격의 극의',
    desc: '일섬 반격 피해 +45% / Lv',
    baseCost: 3,
    costStep: 3,
    maxLevel: 20,
    icon: '⚡',
  },
  {
    key: 'swiftStart',
    name: '초기 축복',
    desc: '환생 시 시작 골드 +120 / Lv',
    baseCost: 2,
    costStep: 2,
    maxLevel: 15,
    icon: '✨',
  },
];

export const SKILLS: SkillDef[] = [
  {
    id: 'moonSlash',
    name: '월광참',
    desc: '전방 적에게 280% 광역 검기',
    cooldown: 5.5,
    unlockStage: 1,
    color: '#f5b942',
    icon: '🌙',
  },
  {
    id: 'flashDash',
    name: '일섬 돌진',
    desc: '선두 적에게 360% 반격 + 1.4초 기절',
    cooldown: 7.5,
    unlockStage: 1,
    color: '#38bdf8',
    icon: '⚡',
  },
  {
    id: 'eclipseAegis',
    name: '흑월 방패',
    desc: '최대 체력 35% 보호막 & 20% 회복',
    cooldown: 10.0,
    unlockStage: 2,
    color: '#34d399',
    icon: '🛡️',
  },
  {
    id: 'abyssStorm',
    name: '심연 폭풍',
    desc: '모든 적에게 520% 벼락 연타',
    cooldown: 13.0,
    unlockStage: 3,
    color: '#c084fc',
    icon: '🌩️',
  },
];

export const AWAKENING_CARDS: AwakeningCardDef[] = [
  {
    id: 'vampiric_edge',
    name: '흡혈의 칼날',
    rarity: 'rare',
    desc: '가한 피해의 5%만큼 체력을 회복합니다.',
    maxStack: 5,
    icon: '🩸',
    tag: '생존',
  },
  {
    id: 'chain_lightning',
    name: '연쇄 번개',
    rarity: 'epic',
    desc: '공격 시 28% 확률로 주변 적에게 110% 연쇄 피해.',
    maxStack: 4,
    icon: '⚡',
    tag: '광역',
  },
  {
    id: 'counter_sage',
    name: '일섬의 달인',
    rarity: 'epic',
    desc: '일섬 반격 피해 +60%, 자동 반격 발동률 증가.',
    maxStack: 5,
    icon: '⚔️',
    tag: '반격',
  },
  {
    id: 'executioner',
    name: '처형자의 의지',
    rarity: 'rare',
    desc: '체력 40% 이하의 적에게 추가 피해 +45%.',
    maxStack: 4,
    icon: '💀',
    tag: '폭딜',
  },
  {
    id: 'berserk_blood',
    name: '광전사의 피',
    rarity: 'common',
    desc: '기본 공격력 +22% 증폭.',
    maxStack: 8,
    icon: '🔥',
    tag: '화력',
  },
  {
    id: 'gale_blade',
    name: '신속 발도',
    rarity: 'common',
    desc: '공격속도 +18% 상승.',
    maxStack: 6,
    icon: '💨',
    tag: '속도',
  },
  {
    id: 'golden_hunter',
    name: '황금 사냥꾼',
    rarity: 'common',
    desc: '처치 골드 획득량 +35% 증가.',
    maxStack: 6,
    icon: '🪙',
    tag: '경제',
  },
  {
    id: 'boss_slayer',
    name: '보스 학살자',
    rarity: 'rare',
    desc: '보스 몬스터 대상 최종 피해 +40%.',
    maxStack: 5,
    icon: '👑',
    tag: '보스',
  },
  {
    id: 'eclipse_overdrive',
    name: '흑월 가속',
    rarity: 'legendary',
    desc: '흑월 폭주 충전 속도 +45% & 치명타 피해 +35%.',
    maxStack: 3,
    icon: '🌑',
    tag: '폭주',
  },
  {
    id: 'iron_bastion',
    name: '철벽 수호',
    rarity: 'common',
    desc: '최대 체력 +30% 및 초당 체력 재생 강화.',
    maxStack: 6,
    icon: '🛡️',
    tag: '방어',
  },
  {
    id: 'keen_edge',
    name: '치명적 관통',
    rarity: 'rare',
    desc: '치명타 확률 +8%, 치명타 피해 +25%.',
    maxStack: 5,
    icon: '🎯',
    tag: '치명',
  },
  {
    id: 'moon_resonance',
    name: '월광 공명',
    rarity: 'legendary',
    desc: '공격력 +28%, 공격속도 +12%, 보스 피해 +25%.',
    maxStack: 3,
    icon: '✨',
    tag: '전설',
  },
];

export function getBiomeForStage(stage: number): BiomeDef {
  const index = Math.floor((stage - 1) / 3) % BIOMES.length;
  return BIOMES[index];
}

export function getUpgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export function getRelicCost(def: RelicDef, currentLevel: number): number {
  return def.baseCost + currentLevel * def.costStep;
}

export function getKnightTier(stage: number): { name: string; index: number; capeColor: string; auraColor: string } {
  let result = 0;
  for (let i = 0; i < KNIGHT_TIERS.length; i++) {
    if (stage >= KNIGHT_TIERS[i].minStage) {
      result = i;
    }
  }
  return { ...KNIGHT_TIERS[result], index: result };
}
