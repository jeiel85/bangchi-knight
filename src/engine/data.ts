import type {
  CompanionDef,
  EnemyKind,
  EquipItem,
  EquipSlot,
  FacilityDef,
  ItemRarity,
  ItemTraitDef,
  ItemTraitId,
  QuestDef,
  StanceDef,
  TrainingDef,
  ZoneDef,
} from './types';

export const ZONES: ZoneDef[] = [
  {
    id: 'dawnstep',
    name: '여명의 초원',
    subtitle: 'DAWNSTEP MEADOW',
    skyTop: '#1d4ed8',
    skyBottom: '#60a5fa',
    hillFar: '#1e3a5f',
    hillNear: '#15803d',
    roadTop: '#a16207',
    roadBase: '#713f12',
    sunColor: '#fde047',
    accent: '#38bdf8',
    enemyPool: ['goblin', 'boar'],
    bossName: '초원 족장 그루그',
  },
  {
    id: 'amber-canyon',
    name: '황혼의 협곡',
    subtitle: 'AMBER CANYON',
    skyTop: '#7c2d12',
    skyBottom: '#fb923c',
    hillFar: '#78350f',
    hillNear: '#9a3412',
    roadTop: '#b45309',
    roadBase: '#451a03',
    sunColor: '#fed7aa',
    accent: '#fb923c',
    enemyPool: ['bandit', 'scorpion', 'goblin'],
    bossName: '협곡 약탈왕 바르카',
  },
  {
    id: 'mirewood',
    name: '안개 늪지대',
    subtitle: 'MIREWOOD MARSH',
    skyTop: '#0f292e',
    skyBottom: '#115e59',
    hillFar: '#134e4a',
    hillNear: '#065f46',
    roadTop: '#3f6212',
    roadBase: '#1a2e05',
    sunColor: '#99f6e4',
    accent: '#2dd4bf',
    enemyPool: ['bogling', 'scorpion', 'bandit'],
    bossName: '늪의 거수 보그',
  },
  {
    id: 'frostpeak',
    name: '설원의 요새',
    subtitle: 'FROSTPEAK KEEP',
    skyTop: '#0f172a',
    skyBottom: '#334155',
    hillFar: '#475569',
    hillNear: '#64748b',
    roadTop: '#94a3b8',
    roadBase: '#334155',
    sunColor: '#e0f2fe',
    accent: '#93c5fd',
    enemyPool: ['golem', 'bandit', 'boar'],
    bossName: '백설 거인 요툰',
  },
  {
    id: 'cinder-citadel',
    name: '용암 성채',
    subtitle: 'CINDER CITADEL',
    skyTop: '#290b0b',
    skyBottom: '#7f1d1d',
    hillFar: '#450a0a',
    hillNear: '#571515',
    roadTop: '#44403c',
    roadBase: '#1c1917',
    sunColor: '#fb7185',
    accent: '#f87171',
    enemyPool: ['wyvern', 'golem', 'bandit'],
    bossName: '화염 군주 이그니스',
  },
];

export const ENEMY_CATALOG: Array<{ kind: Exclude<EnemyKind, 'boss'>; name: string; row: number }> = [
  { kind: 'goblin', name: '초원 고블린', row: 0 },
  { kind: 'boar', name: '야생 멧돼지', row: 1 },
  { kind: 'bandit', name: '협곡 산적', row: 2 },
  { kind: 'scorpion', name: '사막 전갈', row: 3 },
  { kind: 'bogling', name: '늪지 괴수', row: 4 },
  { kind: 'golem', name: '서리 골렘', row: 5 },
  { kind: 'wyvern', name: '화염 와이번', row: 6 },
];

export const STANCES: StanceDef[] = [
  {
    id: 'vanguard',
    name: '돌격',
    shortDesc: '공격 +35% · 공속 +20%',
    icon: '🔥',
    color: '#f97316',
    atkMult: 1.35,
    apsMult: 1.2,
    dmgTakenMult: 1.18,
    lootMult: 1.0,
    shieldRegenRatio: 0,
  },
  {
    id: 'bulwark',
    name: '철벽',
    shortDesc: '피해 -40% · 보스 방어',
    icon: '🛡️',
    color: '#38bdf8',
    atkMult: 0.92,
    apsMult: 0.95,
    dmgTakenMult: 0.6,
    lootMult: 1.0,
    shieldRegenRatio: 0.045,
  },
  {
    id: 'plunder',
    name: '약탈',
    shortDesc: '골드/광석 +55%',
    icon: '💰',
    color: '#facc15',
    atkMult: 1.05,
    apsMult: 1.08,
    dmgTakenMult: 1.0,
    lootMult: 1.55,
    shieldRegenRatio: 0,
  },
];

export const ITEM_TRAITS: Record<ItemTraitId, ItemTraitDef> = {
  doubleStrike: { id: 'doubleStrike', name: '연쇄 일격', desc: '공격 시 20% 확률로 2연타 발동' },
  vampiric: { id: 'vampiric', name: '흡혈 강철', desc: '가한 피해의 5%만큼 체력 회복' },
  oreFinder: { id: 'oreFinder', name: '광산 축복', desc: '광석 획득량 +28%' },
  bossBreaker: { id: 'bossBreaker', name: '거신 분쇄', desc: '보스 대상 최종 피해 +35%' },
};

export const TRAININGS: TrainingDef[] = [
  {
    key: 'swordplay',
    name: '기사단 검술',
    desc: '기본 공격력 +5 / 치명 확률 +0.6%',
    baseCost: 15,
    growth: 1.18,
    icon: '⚔️',
  },
  {
    key: 'fortitude',
    name: '강철 체력 단련',
    desc: '최대 체력 +32 / 초당 회복 +2.2',
    baseCost: 15,
    growth: 1.17,
    icon: '❤️',
  },
  {
    key: 'logistics',
    name: '전리품 보급술',
    desc: '골드 & 광석 획득 +15%',
    baseCost: 22,
    growth: 1.2,
    icon: '🎒',
  },
];

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'ranger',
    name: '숲의 궁수 리아',
    role: '원거리 관통 연사',
    desc: '후방에서 빠르게 화살을 날려 적을 견제합니다.',
    unlockCost: 45,
    baseUpgradeCost: 30,
    color: '#22c55e',
    icon: '🏹',
    interval: 1.15,
  },
  {
    id: 'pyro',
    name: '불꽃 마법사 카인',
    role: '광역 화염구 폭발',
    desc: '강력한 화염구를 던져 모든 적에게 광역 피해를 줍니다.',
    unlockCost: 160,
    baseUpgradeCost: 75,
    color: '#f97316',
    icon: '🔮',
    interval: 2.35,
  },
  {
    id: 'banneret',
    name: '군악 성기사 엘렌',
    role: '전군 치유 & 사기 증폭',
    desc: '주기적으로 체력을 회복하고 진격 나팔 사기를 채웁니다.',
    unlockCost: 380,
    baseUpgradeCost: 130,
    color: '#facc15',
    icon: '🎺',
    interval: 3.1,
  },
];

export const FACILITIES: FacilityDef[] = [
  {
    key: 'royalForge',
    name: '왕립 대장간',
    desc: '모든 장비 성능 영구 +20% / Lv',
    baseCost: 2,
    step: 2,
    maxLevel: 20,
    icon: '🔨',
  },
  {
    key: 'warAcademy',
    name: '기사단 훈련장',
    desc: '기사 & 원정대 공격력 영구 +25% / Lv',
    baseCost: 2,
    step: 2,
    maxLevel: 20,
    icon: '🏛️',
  },
  {
    key: 'supplyWagon',
    name: '왕실 보급 마차',
    desc: '광석 & 골드 획득 영구 +30% / Lv',
    baseCost: 2,
    step: 2,
    maxLevel: 20,
    icon: '🪙',
  },
  {
    key: 'guildHall',
    name: '용병 길드 회관',
    desc: '귀환 시 시작 골드 +120 & 광석 +12 / Lv',
    baseCost: 3,
    step: 3,
    maxLevel: 15,
    icon: '🚩',
  },
];

export const RARITY_CONFIG: Record<
  ItemRarity,
  { label: string; color: string; mult: number; rank: number }
> = {
  common: { label: '일반', color: '#cbd5e1', mult: 1.0, rank: 0 },
  uncommon: { label: '고급', color: '#4ade80', mult: 1.28, rank: 1 },
  rare: { label: '희귀', color: '#38bdf8', mult: 1.65, rank: 2 },
  epic: { label: '영웅', color: '#c084fc', mult: 2.15, rank: 3 },
  mythic: { label: '신화', color: '#facc15', mult: 2.95, rank: 4 },
};

const ITEM_NAMES: Record<EquipSlot, Record<ItemRarity, string[]>> = {
  weapon: {
    common: ['수련용 철검', '보병 브로드소드'],
    uncommon: ['강철 원정검', '단조 롱소드'],
    rare: ['청기사 기사검', '바람가르기 대검'],
    epic: ['태양불꽃 클레이모어', '폭풍강철 명검'],
    mythic: ['왕국 수호자의 성검', '불멸의 여명검'],
  },
  shield: {
    common: ['참나무 둥근방패', '철테 카이트실드'],
    uncommon: ['왕국 보병 방패', '강화 타워실드'],
    rare: ['사자문장 방패', '청강 기사 방패'],
    epic: ['요새 수호의 아이기스', '불굴의 성벽 방패'],
    mythic: ['황금 태양의 방벽', '불멸의 왕실 성방패'],
  },
  armor: {
    common: ['가죽 흉갑', '사슬 갑옷'],
    uncommon: ['철판 경갑', '원정대 판금갑'],
    rare: ['청기사 풀플레이트', '강철 백작 갑주'],
    epic: ['용린 화염 갑주', '폭풍요새 중갑'],
    mythic: ['여명 왕관의 성갑', '황금 사자의 전신갑'],
  },
};

export const SLOT_META: Record<EquipSlot, { label: string; statLabel: string; icon: string }> = {
  weapon: { label: '무기', statLabel: '공격력', icon: '🗡️' },
  shield: { label: '방패', statLabel: '최대 체력', icon: '🛡️' },
  armor: { label: '갑옷', statLabel: '방어력', icon: '🦺' },
};

const STORY_QUESTS: Omit<QuestDef, 'index'>[] = [
  { title: '야전 대장간에서 장비 1회 단조하기', goalType: 'forges', target: 1, rewardGold: 60, rewardOre: 8 },
  { title: '초원 몬스터 6마리 처치하기', goalType: 'kills', target: 6, rewardGold: 80, rewardOre: 10 },
  { title: '원정대 탭에서 동료 1명 영입하기', goalType: 'companions', target: 1, rewardGold: 110, rewardOre: 12 },
  { title: '전술 진형 1회 전환해보기', goalType: 'stanceSwitch', target: 1, rewardGold: 120, rewardOre: 14 },
  { title: '대장간에서 장비 제련 +1 강화하기', goalType: 'refine', target: 1, rewardGold: 150, rewardOre: 16 },
  { title: 'STAGE 2 돌파하기', goalType: 'stage', target: 2, rewardGold: 220, rewardOre: 20, rewardMedals: 1 },
  { title: '사기를 모아 진격 나팔 1회 발동하기', goalType: 'rally', target: 1, rewardGold: 240, rewardOre: 22 },
  { title: '대장간 누적 단조 5회 달성', goalType: 'forges', target: 5, rewardGold: 320, rewardOre: 28 },
  { title: '원정대 동료 2명 이상 편성하기', goalType: 'companions', target: 2, rewardGold: 420, rewardOre: 32, rewardMedals: 1 },
  { title: 'STAGE 4 도달하기 (왕국 귀환 해금)', goalType: 'stage', target: 4, rewardGold: 600, rewardOre: 45, rewardMedals: 2 },
];

export function getQuestDef(index: number): QuestDef {
  if (index < STORY_QUESTS.length) {
    return { index, ...STORY_QUESTS[index] };
  }
  const loop = index - STORY_QUESTS.length;
  const cycle = loop % 4;
  const tier = Math.floor(loop / 4) + 1;
  const goldScale = Math.round(360 * Math.pow(1.42, tier));
  const oreScale = Math.round(24 + tier * 10);

  if (cycle === 0) {
    return {
      index,
      title: `몬스터 ${14 + tier * 4}마리 토벌`,
      goalType: 'kills',
      target: 14 + tier * 4,
      rewardGold: goldScale,
      rewardOre: oreScale,
    };
  }
  if (cycle === 1) {
    return {
      index,
      title: `대장간 장비 ${4 + tier}회 단조`,
      goalType: 'forges',
      target: 4 + tier,
      rewardGold: Math.round(goldScale * 1.1),
      rewardOre: oreScale + 6,
    };
  }
  if (cycle === 2) {
    return {
      index,
      title: `장비 제련 ${2 + Math.floor(tier / 2)}회 강화`,
      goalType: 'refine',
      target: 2 + Math.floor(tier / 2),
      rewardGold: Math.round(goldScale * 1.2),
      rewardOre: oreScale + 8,
    };
  }
  return {
    index,
    title: `구역 보스 ${1 + Math.floor(tier / 2)}회 격파`,
    goalType: 'bossKills',
    target: 1 + Math.floor(tier / 2),
    rewardGold: Math.round(goldScale * 1.45),
    rewardOre: oreScale + 14,
    rewardMedals: 1,
  };
}

export function createStarterEquipment(): Record<EquipSlot, EquipItem> {
  return {
    weapon: {
      id: 'init-w',
      slot: 'weapon',
      name: '수련용 철검',
      rarity: 'common',
      level: 1,
      power: 10,
      bonusLabel: '치명 +2%',
      bonusStat: 'crit',
      bonusValue: 0.02,
    },
    shield: {
      id: 'init-s',
      slot: 'shield',
      name: '참나무 둥근방패',
      rarity: 'common',
      level: 1,
      power: 55,
      bonusLabel: '체력 +5%',
      bonusStat: 'hp',
      bonusValue: 0.05,
    },
    armor: {
      id: 'init-a',
      slot: 'armor',
      name: '가죽 흉갑',
      rarity: 'common',
      level: 1,
      power: 4,
      bonusLabel: '골드 +5%',
      bonusStat: 'gold',
      bonusValue: 0.05,
    },
  };
}

export function getZoneForStage(stage: number): ZoneDef {
  return ZONES[Math.floor((stage - 1) / 3) % ZONES.length];
}

export function getZoneIndexForStage(stage: number): number {
  return Math.floor((stage - 1) / 3) % ZONES.length;
}

export function getForgeLevel(forgeExp: number): number {
  return Math.floor(Math.sqrt(forgeExp / 3)) + 1;
}

export function getForgeOreCost(forgeLevel: number): number {
  return Math.max(4, 4 + Math.floor((forgeLevel - 1) * 1.6));
}

export function getRefineCost(refineLevel: number): number {
  return Math.floor(35 * Math.pow(1.36, refineLevel));
}

export function getTrainingCost(def: TrainingDef, level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.growth, level));
}

export function getCompanionCost(def: CompanionDef, level: number): number {
  if (level === 0) return def.unlockCost;
  return Math.floor(def.baseUpgradeCost * Math.pow(1.24, level - 1));
}

export function getFacilityCost(def: FacilityDef, level: number): number {
  return def.baseCost + level * def.step;
}

export function rollForgedItem(stage: number, forgeLevel: number, uid: string): EquipItem {
  const slots: EquipSlot[] = ['weapon', 'shield', 'armor'];
  const slot = slots[Math.floor(Math.random() * slots.length)];

  const weights: Array<{ r: ItemRarity; w: number }> = [
    { r: 'common', w: Math.max(12, 56 - forgeLevel * 4.2) },
    { r: 'uncommon', w: 28 + Math.min(12, forgeLevel * 0.8) },
    { r: 'rare', w: 12 + forgeLevel * 2.1 },
    { r: 'epic', w: 3.5 + forgeLevel * 1.15 },
    { r: 'mythic', w: 0.8 + forgeLevel * 0.45 },
  ];

  const totalW = weights.reduce((acc, x) => acc + x.w, 0);
  let pick = Math.random() * totalW;
  let rarity: ItemRarity = 'common';
  for (const entry of weights) {
    pick -= entry.w;
    if (pick <= 0) {
      rarity = entry.r;
      break;
    }
  }

  const cfg = RARITY_CONFIG[rarity];
  const itemLevel = Math.max(1, stage + Math.floor(forgeLevel * 0.6));
  const variance = 0.92 + Math.random() * 0.18;

  let power = 10;
  if (slot === 'weapon') {
    power = Math.round((11 + itemLevel * 5.8) * cfg.mult * variance);
  } else if (slot === 'shield') {
    power = Math.round((55 + itemLevel * 28) * cfg.mult * variance);
  } else {
    power = Math.round((4 + itemLevel * 2.4) * cfg.mult * variance);
  }

  const bonusChoices: Array<{ stat: EquipItem['bonusStat']; label: string; val: number }> = [
    { stat: 'crit', label: `치명 +${Math.round(3 * cfg.mult)}%`, val: 0.03 * cfg.mult },
    { stat: 'speed', label: `공속 +${Math.round(4 * cfg.mult)}%`, val: 0.04 * cfg.mult },
    { stat: 'gold', label: `골드 +${Math.round(8 * cfg.mult)}%`, val: 0.08 * cfg.mult },
    { stat: 'hp', label: `체력 +${Math.round(7 * cfg.mult)}%`, val: 0.07 * cfg.mult },
  ];
  const bonus = bonusChoices[Math.floor(Math.random() * bonusChoices.length)];
  const names = ITEM_NAMES[slot][rarity];
  const name = names[Math.floor(Math.random() * names.length)];

  let trait: ItemTraitId | undefined;
  if (rarity === 'epic' || rarity === 'mythic') {
    const traitPool: ItemTraitId[] = ['doubleStrike', 'vampiric', 'oreFinder', 'bossBreaker'];
    trait = traitPool[Math.floor(Math.random() * traitPool.length)];
  }

  return {
    id: uid,
    slot,
    name,
    rarity,
    level: itemLevel,
    power,
    bonusLabel: bonus.label,
    bonusStat: bonus.stat,
    bonusValue: bonus.val,
    trait,
  };
}

export function getKnightRankTitle(highestStage: number): string {
  if (highestStage >= 13) return '왕국 대장군';
  if (highestStage >= 9) return '원정 기사단장';
  if (highestStage >= 5) return '청강 정예기사';
  if (highestStage >= 3) return '국경 수호기사';
  return '견습 원정기사';
}
