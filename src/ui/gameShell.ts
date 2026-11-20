import { sfx } from '../audio/sfx';
import {
  COMPANIONS,
  ENEMY_CATALOG,
  FACILITIES,
  ITEM_TRAITS,
  RARITY_CONFIG,
  SLOT_META,
  STANCES,
  TRAININGS,
  ZONES,
  getCompanionCost,
  getFacilityCost,
  getRefineCost,
  getZoneForStage,
} from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, BangchiEngine } from '../engine/gameEngine';
import {
  clearSaveData,
  decodeSaveCode,
  encodeSaveCode,
  loadSaveData,
  writeSaveData,
} from '../engine/storage';
import type {
  CompanionId,
  EquipSlot,
  FacilityKey,
  ItemRarity,
  StanceId,
  TrainingKey,
} from '../engine/types';
import { renderArena } from '../renderer/canvasRenderer';

type TabKey = 'forge' | 'squad' | 'kingdom' | 'journal';

type IconKey = 'weapon' | 'shield' | 'armor' | 'gold' | 'ore' | 'medal' | 'forge' | 'rally';
const ICON_INDEX: Record<IconKey, number> = {
  weapon: 0,
  shield: 1,
  armor: 2,
  gold: 3,
  ore: 4,
  medal: 5,
  forge: 6,
  rally: 7,
};

type TacticsIconKey =
  | 'vanguard'
  | 'bulwark'
  | 'plunder'
  | 'royalForge'
  | 'warAcademy'
  | 'supplyWagon'
  | 'guildHall';

const TACTICS_INDEX: Record<TacticsIconKey, number> = {
  vanguard: 0,
  bulwark: 1,
  plunder: 2,
  royalForge: 3,
  warAcademy: 4,
  supplyWagon: 5,
  guildHall: 6,
};

const SLOT_ROW: Record<EquipSlot, number> = {
  weapon: 0,
  shield: 1,
  armor: 2,
};

function pxIcon(key: IconKey, size = 18): string {
  const idx = ICON_INDEX[key];
  const bgW = size * 8;
  const posX = -idx * size;
  return `<span class="px-icon" style="width:${size}px;height:${size}px;background-image:url('./assets/ui/icons.png');background-size:${bgW}px ${size}px;background-position:${posX}px 0;" aria-hidden="true"></span>`;
}

function tacticsIcon(key: TacticsIconKey, size = 20): string {
  const idx = TACTICS_INDEX[key];
  const bgW = size * 7;
  const posX = -idx * size;
  return `<span class="px-icon" style="width:${size}px;height:${size}px;background-image:url('./assets/ui/tactics-sheet.png');background-size:${bgW}px ${size}px;background-position:${posX}px 0;" aria-hidden="true"></span>`;
}

function equipTierIcon(slot: EquipSlot, rarity: ItemRarity, size = 34): string {
  const col = RARITY_CONFIG[rarity].rank;
  const row = SLOT_ROW[slot];
  const bgW = size * 5;
  const bgH = size * 3;
  return `<span class="px-icon" style="width:${size}px;height:${size}px;background-image:url('./assets/ui/equipment-sheet.png');background-size:${bgW}px ${bgH}px;background-position:${-col * size}px ${-row * size}px;" aria-hidden="true"></span>`;
}

function companionThumb(id: CompanionId): string {
  return `<span class="companion-sprite-thumb" style="background-image:url('./assets/sprites/${id}.png');" aria-hidden="true"></span>`;
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString('ko-KR');
}

function fmtTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${rem}초`;
  return `${rem}초`;
}

export function mountGameShell(root: HTMLElement, onBackToLanding: () => void): () => void {
  const engine = new BangchiEngine(loadSaveData());
  sfx.enabled = engine.state.soundEnabled;
  sfx.setBgm(engine.state.bgmEnabled);

  let activeTab: TabKey = 'forge';
  let lastUiSync = 0;
  let lastSave = performance.now();
  let lastForgeSig = '';
  let confirmCallback: (() => void) | null = null;

  root.innerHTML = `
    <div class="game-viewport">
      <div class="phone-shell">
        <header class="shell-topbar">
          <button class="shell-back-btn" id="back-landing-btn" title="랜딩 페이지로">← 홈</button>
          <div class="stage-cluster">
            <span class="stage-code" id="hud-stage">STAGE 1-1</span>
            <span class="stage-biome" id="hud-zone">여명의 초원</span>
          </div>
          <div class="currency-cluster">
            <span class="currency gold">${pxIcon('gold', 15)}<span id="hud-gold">0</span></span>
            <span class="currency ore">${pxIcon('ore', 15)}<span id="hud-ore">0</span></span>
          </div>
        </header>

        <div class="wave-bar-row">
          <div class="wave-pips" id="hud-wave-pips"></div>
          <div class="dps-pill" id="hud-dps">DPS 0</div>
        </div>

        <div class="hero-hud">
          <div class="hero-badge">
            <img class="hero-portrait-img" src="./assets/ui/knight-portrait.png" alt="원정 기사 초상화" width="36" height="36" />
            <div>
              <div class="hero-rank" id="hud-rank">견습 원정기사</div>
              <div class="hero-sub">${pxIcon('medal', 12)}<span id="hud-medals">훈장 0</span></div>
            </div>
          </div>
          <div class="hero-bars">
            <div class="bar-track hp-track">
              <div class="bar-fill hp-fill" id="hud-hp-fill"></div>
              <div class="bar-fill shield-fill" id="hud-shield-fill"></div>
              <span class="bar-text" id="hud-hp-text">HP 180 / 180</span>
            </div>
            <div class="bar-track morale-track">
              <div class="bar-fill morale-fill" id="hud-morale-fill"></div>
            </div>
          </div>
        </div>

        <div class="arena-container">
          <canvas id="game-canvas" width="${ARENA_WIDTH}" height="${ARENA_HEIGHT}"></canvas>
          <button class="arena-boss-btn hidden" id="btn-boss-challenge">
            ⚔️ 보스 도전
          </button>
          <button class="arena-rally-btn" id="btn-rally">
            <span class="inline-flex">${pxIcon('rally', 15)} 진격 나팔</span>
            <small id="rally-sub">20%</small>
          </button>
        </div>

        <button class="quest-strip" id="quest-strip" title="퀘스트 완료 시 클릭해 보상 수령">
          <span class="quest-tag" id="quest-tag">Q#1</span>
          <span class="quest-title" id="quest-title">로딩 중...</span>
          <span class="quest-prog" id="quest-prog">0/1</span>
        </button>

        <div class="tactics-strip">
          <div class="stance-bar" id="stance-bar">
            ${STANCES.map(
              (st) => `
              <button class="stance-btn" data-stance="${st.id}" title="${st.shortDesc}">
                <span class="stance-top inline-flex">${tacticsIcon(st.id, 17)} ${st.name}</span>
                <span class="stance-desc">${st.shortDesc}</span>
              </button>
            `
            ).join('')}
          </div>
          <div class="quick-bar five">
            <button class="quick-btn" id="q-auto">자동나팔</button>
            <button class="quick-btn" id="q-speed">1x</button>
            <button class="quick-btn" id="q-sound">SFX</button>
            <button class="quick-btn" id="q-bgm">BGM</button>
            <button class="quick-btn" id="q-save">저장</button>
          </div>
        </div>

        <section class="panel-body" id="panel-body"></section>

        <nav class="bottom-nav">
          <button class="nav-tab active" data-tab="forge">${pxIcon('forge', 20)}<span>대장간</span></button>
          <button class="nav-tab" data-tab="squad">${pxIcon('weapon', 20)}<span>원정대</span></button>
          <button class="nav-tab" data-tab="kingdom">${pxIcon('medal', 20)}<span>왕국</span></button>
          <button class="nav-tab" data-tab="journal">${pxIcon('shield', 20)}<span>원정일지</span></button>
        </nav>

        <div class="modal-backdrop hidden" id="forge-modal">
          <div class="modal-card" id="forge-modal-content"></div>
        </div>

        <div class="modal-backdrop hidden" id="offline-modal">
          <div class="modal-card" id="offline-modal-content"></div>
        </div>

        <div class="modal-backdrop hidden" id="confirm-modal">
          <div class="modal-card">
            <div class="modal-kicker">CONFIRMATION</div>
            <h3 id="confirm-title">확인</h3>
            <p class="confirm-desc" id="confirm-desc"></p>
            <div class="modal-actions two">
              <button class="btn btn-ghost btn-sm" id="confirm-cancel">취소</button>
              <button class="btn btn-amber btn-sm" id="confirm-ok">확인</button>
            </div>
          </div>
        </div>

        <div class="toast-pill hidden" id="toast-pill"></div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const panelBody = root.querySelector<HTMLElement>('#panel-body')!;
  const forgeModal = root.querySelector<HTMLElement>('#forge-modal')!;
  const forgeModalContent = root.querySelector<HTMLElement>('#forge-modal-content')!;
  const offlineModal = root.querySelector<HTMLElement>('#offline-modal')!;
  const offlineModalContent = root.querySelector<HTMLElement>('#offline-modal-content')!;
  const confirmModal = root.querySelector<HTMLElement>('#confirm-modal')!;
  const toastEl = root.querySelector<HTMLElement>('#toast-pill')!;

  let toastTimer: number | null = null;
  function showToast(msg: string): void {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add('hidden'), 1700);
  }

  function openConfirm(title: string, desc: string, onOk: () => void): void {
    root.querySelector('#confirm-title')!.textContent = title;
    root.querySelector('#confirm-desc')!.textContent = desc;
    confirmCallback = onOk;
    confirmModal.classList.remove('hidden');
  }

  root.querySelector('#confirm-cancel')?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
  });

  root.querySelector('#confirm-ok')?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    const cb = confirmCallback;
    confirmCallback = null;
    cb?.();
  });

  root.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

  root.querySelector('#back-landing-btn')?.addEventListener('click', () => {
    sfx.setBgm(false);
    writeSaveData(engine.toSaveData());
    onBackToLanding();
  });

  root.querySelector('#btn-rally')?.addEventListener('click', () => {
    sfx.unlock();
    engine.triggerRally();
  });

  root.querySelector('#btn-boss-challenge')?.addEventListener('click', () => {
    sfx.unlock();
    engine.challengeBossNow();
    showToast('⚔️ 구역 보스에 도전합니다!');
  });

  root.querySelector('#quest-strip')?.addEventListener('click', () => {
    sfx.unlock();
    if (engine.claimQuestReward()) {
      updateQuestBar();
      renderTab();
      showToast('📜 퀘스트 보상을 수령했습니다!');
    }
  });

  root.querySelector('#stance-bar')?.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-stance]');
    if (!btn) return;
    sfx.unlock();
    engine.setStance(btn.dataset.stance as StanceId);
    updateStanceButtons();
  });

  const qAuto = root.querySelector<HTMLButtonElement>('#q-auto')!;
  const qSpeed = root.querySelector<HTMLButtonElement>('#q-speed')!;
  const qSound = root.querySelector<HTMLButtonElement>('#q-sound')!;
  const qBgm = root.querySelector<HTMLButtonElement>('#q-bgm')!;
  const qSave = root.querySelector<HTMLButtonElement>('#q-save')!;

  qAuto.addEventListener('click', () => {
    engine.state.autoRally = !engine.state.autoRally;
    updateQuickButtons();
  });
  qSpeed.addEventListener('click', () => {
    engine.state.speedMult = engine.state.speedMult === 1 ? 2 : engine.state.speedMult === 2 ? 3 : 1;
    updateQuickButtons();
  });
  qSound.addEventListener('click', () => {
    engine.state.soundEnabled = !engine.state.soundEnabled;
    sfx.enabled = engine.state.soundEnabled;
    updateQuickButtons();
  });
  qBgm.addEventListener('click', () => {
    sfx.unlock();
    engine.state.bgmEnabled = !engine.state.bgmEnabled;
    sfx.setBgm(engine.state.bgmEnabled);
    updateQuickButtons();
  });
  qSave.addEventListener('click', () => {
    writeSaveData(engine.toSaveData());
    showToast('💾 진행 상황이 저장되었습니다!');
  });

  root.querySelectorAll<HTMLButtonElement>('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.tab as TabKey;
      if (!next) return;
      activeTab = next;
      root.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b === btn));
      renderTab();
    });
  });

  panelBody.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    sfx.unlock();

    const action = btn.dataset.action;
    if (action === 'forge-now') {
      if (engine.forgeEquipment(false)) {
        renderForgeModal();
        renderTab();
      }
    } else if (action === 'toggle-autoforge') {
      engine.state.autoForge = !engine.state.autoForge;
      renderTab();
      showToast(engine.state.autoForge ? '⚡ 자동 단조 ON (상위 장비 시 정지)' : '자동 단조 OFF');
    } else if (action === 'refine-slot') {
      const slot = btn.dataset.slot as EquipSlot;
      if (engine.refineSlot(slot)) {
        renderTab();
      }
    } else if (action === 'buy-step') {
      engine.state.buyStep = engine.state.buyStep === 1 ? 10 : 1;
      renderTab();
    } else if (action === 'buy-training') {
      if (engine.buyTraining(btn.dataset.key as TrainingKey)) {
        renderTab();
      }
    } else if (action === 'buy-companion') {
      if (engine.buyCompanion(btn.dataset.key as CompanionId)) {
        renderTab();
      }
    } else if (action === 'buy-facility') {
      if (engine.buyFacility(btn.dataset.key as FacilityKey)) {
        renderTab();
      }
    } else if (action === 'kingdom-return') {
      if (engine.canReturnToKingdom()) {
        const reward = engine.getReturnMedalReward();
        openConfirm(
          '🏰 왕국 귀환',
          `훈장 +${reward}개를 정산하고 STAGE 1부터 재출정할까요? (훈장, 왕국 시설, 대장간 숙련도, 도감은 영구 유지됩니다)`,
          () => {
            engine.performKingdomReturn();
            writeSaveData(engine.toSaveData());
            renderTab();
            showToast(`🏅 훈장 +${reward} 획득! 재출정 시작!`);
          }
        );
      }
    } else if (action === 'export-save') {
      const code = encodeSaveCode(engine.toSaveData());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        void navigator.clipboard.writeText(code).then(
          () => showToast('📋 세이브 코드가 클립보드에 복사되었습니다!'),
          () => window.prompt('아래 세이브 코드를 복사하세요:', code)
        );
      } else {
        window.prompt('아래 세이브 코드를 복사하세요:', code);
      }
    } else if (action === 'import-save') {
      const code = window.prompt('복원할 세이브 코드를 붙여넣으세요:');
      if (!code) return;
      const parsed = decodeSaveCode(code);
      if (!parsed) {
        showToast('⚠ 올바른 세이브 코드가 아닙니다.');
        return;
      }
      engine.loadFromSaveData(parsed);
      writeSaveData(engine.toSaveData());
      updateStanceButtons();
      updateQuickButtons();
      renderTab();
      showToast('✅ 세이브 복원 완료!');
    } else if (action === 'reset-save') {
      openConfirm(
        '세이브 초기화',
        '모든 원정 기록, 장비, 왕국 영구 시설, 도감을 처음 상태로 되돌릴까요?',
        () => {
          clearSaveData();
          engine.resetGame();
          updateStanceButtons();
          renderTab();
          showToast('초기화가 완료되었습니다.');
        }
      );
    }
  });

  forgeModal.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-forge-choice]');
    if (!btn) return;
    sfx.unlock();
    const equip = btn.dataset.forgeChoice === 'equip';
    engine.resolveForgedItem(equip);
    renderForgeModal();
    renderTab();
  });

  offlineModal.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-offline-claim]');
    if (!btn) return;
    sfx.unlock();
    engine.claimOfflineLoot();
    offlineModal.classList.add('hidden');
    renderTab();
  });

  function renderOfflineModalIfNeeded(): void {
    const rep = engine.state.offlineReport;
    if (!rep) return;
    offlineModal.classList.remove('hidden');
    offlineModalContent.innerHTML = `
      <div class="modal-kicker">OFFLINE EXPEDITION LOOT</div>
      <div class="modal-art-wrap">
        <img class="modal-chest-art" src="./assets/ui/loot-chest.png" alt="전리품 보물상자" width="64" height="64" />
      </div>
      <h3>방치 원정 전리품 도착!</h3>
      <p class="confirm-desc">자리를 비운 <strong>${fmtTime(rep.elapsedSeconds)}</strong> 동안 원정대가 몬스터 <strong>${fmtNum(rep.kills)}마리</strong>를 토벌했습니다.</p>
      <div class="offline-loot-row">
        <div class="loot-chip">${pxIcon('gold', 20)} <strong>+${fmtNum(rep.gold)}</strong></div>
        <div class="loot-chip">${pxIcon('ore', 20)} <strong>+${fmtNum(rep.ore)}</strong></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-amber btn-sm" data-offline-claim="1">전리품 수령하기</button>
      </div>
    `;
  }

  function updateStanceButtons(): void {
    const bossCharging = engine.state.enemies.some((e) => e.isBoss && e.heavyWindup > 0.15);
    root.querySelectorAll<HTMLButtonElement>('[data-stance]').forEach((btn) => {
      const id = btn.dataset.stance;
      btn.classList.toggle('active', id === engine.state.stance);
      btn.classList.toggle('guard-cue', id === 'bulwark' && bossCharging && engine.state.stance !== 'bulwark');
    });
  }

  function updateQuickButtons(): void {
    qAuto.classList.toggle('on', engine.state.autoRally);
    qAuto.textContent = engine.state.autoRally ? '자동나팔' : '수동나팔';
    qSpeed.classList.toggle('on', engine.state.speedMult > 1);
    qSpeed.textContent = `${engine.state.speedMult}x`;
    qSound.classList.toggle('on', engine.state.soundEnabled);
    qSound.textContent = engine.state.soundEnabled ? 'SFX ON' : 'SFX OFF';
    qBgm.classList.toggle('on', engine.state.bgmEnabled);
    qBgm.textContent = engine.state.bgmEnabled ? 'BGM ON' : 'BGM OFF';
  }

  function updateQuestBar(): void {
    const q = engine.getCurrentQuestStatus();
    const strip = root.querySelector<HTMLButtonElement>('#quest-strip')!;
    strip.classList.toggle('complete', q.complete);
    root.querySelector('#quest-tag')!.textContent = `Q#${q.def.index + 1}`;
    root.querySelector('#quest-title')!.textContent = q.def.title;
    root.querySelector('#quest-prog')!.textContent = q.complete
      ? `수령 +${fmtNum(q.def.rewardGold)}G`
      : `${q.progress}/${q.def.target}`;
  }

  function renderForgeModal(): void {
    const item = engine.state.pendingForgeItem;
    const sig = item ? item.id : '';
    if (sig === lastForgeSig) return;
    lastForgeSig = sig;

    if (!item) {
      forgeModal.classList.add('hidden');
      return;
    }

    const cur = engine.state.equipment[item.slot];
    const slotInfo = SLOT_META[item.slot];
    const newRarity = RARITY_CONFIG[item.rarity];
    const curRarity = RARITY_CONFIG[cur.rarity];
    const diff = item.power - cur.power;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    const newTrait = item.trait ? ITEM_TRAITS[item.trait] : null;
    const curTrait = cur.trait ? ITEM_TRAITS[cur.trait] : null;

    forgeModal.classList.remove('hidden');
    forgeModalContent.innerHTML = `
      <div class="modal-kicker">LIVE ANVIL FORGING</div>
      <h3 class="inline-flex center">${equipTierIcon(item.slot, item.rarity, 26)} 새로운 ${slotInfo.label} 단조 완료!</h3>
      <div class="compare-grid">
        <div class="item-box">
          <div class="item-tag">현재 장착</div>
          <div class="compare-icon-row">${equipTierIcon(cur.slot, cur.rarity, 34)}</div>
          <div class="item-name" style="color:${curRarity.color}">[${curRarity.label}] ${cur.name}</div>
          <div class="item-stat">${slotInfo.statLabel} <strong>${cur.power}</strong></div>
          <div class="item-bonus">${cur.bonusLabel}</div>
          ${curTrait ? `<div class="trait-chip">✨ ${curTrait.name}</div>` : ''}
        </div>
        <div class="item-box highlight" style="border-color:${newRarity.color}">
          <div class="item-tag" style="color:${newRarity.color}">신규 단조 (Lv.${item.level})</div>
          <div class="compare-icon-row">${equipTierIcon(item.slot, item.rarity, 34)}</div>
          <div class="item-name" style="color:${newRarity.color}">[${newRarity.label}] ${item.name}</div>
          <div class="item-stat">
            ${slotInfo.statLabel} <strong>${item.power}</strong>
            <span class="diff-pill ${diff >= 0 ? 'up' : 'down'}">${diffStr}</span>
          </div>
          <div class="item-bonus">${item.bonusLabel}</div>
          ${newTrait ? `<div class="trait-chip" title="${newTrait.desc}">✨ ${newTrait.name}</div>` : ''}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-amber btn-sm" data-forge-choice="equip">${pxIcon('weapon', 16)} 장착하기 (구장비 판매)</button>
        <button class="btn btn-ghost btn-sm" data-forge-choice="salvage">${pxIcon('ore', 16)} 분해 (골드·광석·숙련도)</button>
      </div>
    `;
  }

  function renderTab(): void {
    const s = engine.state;
    const stats = engine.computeStats();

    if (activeTab === 'forge') {
      const oreCost = engine.getForgeCost();
      const canForge = s.ore >= oreCost && !s.pendingForgeItem;
      const slots: EquipSlot[] = ['weapon', 'shield', 'armor'];

      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>야전 대장간 · 숙련 Lv.${stats.forgeLevel}</h4>
            <p>장비 단조 + 골드 제련(+강화)으로 전력을 끌어올리세요</p>
          </div>
          <button class="toggle-chip ${s.autoForge ? 'on' : ''}" data-action="toggle-autoforge">
            ⚡ 자동단조 ${s.autoForge ? 'ON' : 'OFF'}
          </button>
        </div>

        <button class="anvil-cta ${canForge ? 'ready' : ''}" data-action="forge-now" ${canForge ? '' : 'disabled'}>
          <span class="anvil-scene ${canForge ? 'hammering' : ''}" style="background-image:url('./assets/ui/forge-anvil.png');" aria-hidden="true"></span>
          <div class="anvil-copy">
            <strong>장비 즉시 단조하기</strong>
            <small class="inline-flex">소모 광석 ${pxIcon('ore', 13)} ${oreCost} · 보유 ${fmtNum(s.ore)}</small>
          </div>
        </button>

        <div class="equip-grid">
          ${slots
            .map((slot) => {
              const item = s.equipment[slot];
              const refLv = s.refineLevels[slot];
              const refCost = getRefineCost(refLv);
              const canRefine = refLv < 30 && s.gold >= refCost;
              const effPower = engine.getEffectiveEquipPower(slot);
              const meta = SLOT_META[slot];
              const rar = RARITY_CONFIG[item.rarity];
              const trait = item.trait ? ITEM_TRAITS[item.trait] : null;
              return `
                <div class="equip-card" style="border-left: 3px solid ${rar.color}">
                  <div class="equip-row-flex">
                    <span class="equip-slot-art" style="border-color:${rar.color}">${equipTierIcon(slot, item.rarity, 34)}</span>
                    <div class="equip-info">
                      <div class="equip-top">
                        <span>${meta.label} ${refLv > 0 ? `<em class="refine-tag">+${refLv}</em>` : ''}</span>
                        <span class="rar-chip" style="color:${rar.color}">${rar.label} · Lv.${item.level}</span>
                      </div>
                      <div class="equip-name">${item.name}</div>
                      <div class="equip-stats">
                        <span>${meta.statLabel} <strong>+${effPower}</strong></span>
                        <span class="equip-bonus">${item.bonusLabel}</span>
                      </div>
                      ${trait ? `<div class="trait-chip inline">✨ ${trait.name}: ${trait.desc}</div>` : ''}
                    </div>
                    <button
                      class="refine-btn ${canRefine ? 'can-buy' : ''}"
                      data-action="refine-slot"
                      data-slot="${slot}"
                      ${canRefine ? '' : 'disabled'}
                    >
                      <span>${refLv >= 30 ? 'MAX' : '제련 +1'}</span>
                      <small class="inline-flex">${refLv >= 30 ? '' : `${pxIcon('gold', 11)}${fmtNum(refCost)}`}</small>
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    } else if (activeTab === 'squad') {
      const trainingIcons: Record<TrainingKey, IconKey> = {
        swordplay: 'weapon',
        fortitude: 'shield',
        logistics: 'gold',
      };
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>원정대 동료 &amp; 기사 훈련</h4>
            <p>동료를 영입하면 전장에 직접 합류해 함께 싸웁니다</p>
          </div>
          <button class="toggle-chip on" data-action="buy-step">훈련 x${s.buyStep}</button>
        </div>

        <div class="sub-label">원정대 용병 (전장 직접 참전)</div>
        <div class="row-list">
          ${COMPANIONS.map((c) => {
            const lv = s.companions[c.id];
            const cost = getCompanionCost(c, lv);
            const canBuy = s.gold >= cost;
            return `
              <div class="item-row">
                <div class="row-left">
                  <span class="row-icon sprite-icon" style="border-color:${c.color}">${companionThumb(c.id)}</span>
                  <div>
                    <div class="row-title">${c.name} <span class="lv-tag">${lv === 0 ? '미영입' : `Lv.${lv}`}</span></div>
                    <div class="row-desc">${c.role} · ${c.desc}</div>
                  </div>
                </div>
                <button class="buy-btn ${canBuy ? 'can-buy' : ''}" data-action="buy-companion" data-key="${c.id}" ${canBuy ? '' : 'disabled'}>
                  <span>${lv === 0 ? '영입' : '강화'}</span>
                  <small class="inline-flex">${pxIcon('gold', 12)} ${fmtNum(cost)}</small>
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="sub-label">기사단 기초 훈련 (x${s.buyStep})</div>
        <div class="row-list">
          ${TRAININGS.map((t) => {
            const lv = s.training[t.key];
            const cost = engine.getTrainingBatchCost(t.key, s.buyStep);
            const canBuy = s.gold >= cost;
            return `
              <div class="item-row">
                <div class="row-left">
                  <span class="row-icon">${pxIcon(trainingIcons[t.key], 22)}</span>
                  <div>
                    <div class="row-title">${t.name} <span class="lv-tag">Lv.${lv}</span></div>
                    <div class="row-desc">${t.desc}</div>
                  </div>
                </div>
                <button class="buy-btn ${canBuy ? 'can-buy' : ''}" data-action="buy-training" data-key="${t.key}" ${canBuy ? '' : 'disabled'}>
                  <span>+${s.buyStep}</span>
                  <small class="inline-flex">${pxIcon('gold', 12)} ${fmtNum(cost)}</small>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (activeTab === 'kingdom') {
      const canReturn = engine.canReturnToKingdom();
      const reward = engine.getReturnMedalReward();
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>왕국 본부 &amp; 영구 시설</h4>
            <p>원정 귀환으로 획득한 훈장으로 영구 보너스를 해금합니다</p>
          </div>
          <span class="medal-badge inline-flex">${pxIcon('medal', 14)} ${fmtNum(s.medals)}</span>
        </div>

        <div class="return-card">
          <div>
            <div class="return-title inline-flex">${pxIcon('medal', 15)} 원정 귀환 (훈장 정산)</div>
            <div class="return-desc">
              ${
                canReturn
                  ? `지금 귀환하면 <strong>훈장 +${reward}</strong> 획득 (누적 ${s.expeditionReturns}회)`
                  : `STAGE 4 돌파 시 귀환 가능 (현재 STAGE ${s.stage})`
              }
            </div>
          </div>
          <button class="btn btn-sm ${canReturn ? 'btn-amber' : 'btn-muted'}" data-action="kingdom-return" ${canReturn ? '' : 'disabled'}>
            귀환하기
          </button>
        </div>

        <div class="row-list">
          ${FACILITIES.map((f) => {
            const lv = s.facilities[f.key];
            const isMax = lv >= f.maxLevel;
            const cost = getFacilityCost(f, lv);
            const canBuy = !isMax && s.medals >= cost;
            return `
              <div class="item-row">
                <div class="row-left">
                  <span class="row-icon">${tacticsIcon(f.key, 26)}</span>
                  <div>
                    <div class="row-title">${f.name} <span class="lv-tag">Lv.${lv}/${f.maxLevel}</span></div>
                    <div class="row-desc">${f.desc}</div>
                  </div>
                </div>
                <button class="buy-btn medal-buy ${canBuy ? 'can-buy' : ''}" data-action="buy-facility" data-key="${f.key}" ${canBuy ? '' : 'disabled'}>
                  <span>${isMax ? 'MAX' : '증축'}</span>
                  <small class="inline-flex">${isMax ? '' : `${pxIcon('medal', 12)} ${cost}`}</small>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      const totalCodex = ENEMY_CATALOG.length + ZONES.length;
      const foundCodex = s.discoveredEnemies.length + s.discoveredBosses.length;
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>원정 일지 &amp; 몬스터 도감</h4>
            <p>도감 발견 1종당 공격력 +2.5% (현재 +${(stats.codexAtkBonus * 100).toFixed(1)}%)</p>
          </div>
          <span class="ore-badge">${foundCodex}/${totalCodex}</span>
        </div>

        <div class="codex-grid">
          ${ENEMY_CATALOG.map((en) => {
            const seen = s.discoveredEnemies.includes(en.kind);
            return `
              <div class="codex-cell ${seen ? 'seen' : ''}" title="${seen ? en.name : '미발견'}">
                <span class="codex-sprite enemy" style="background-image:url('./assets/sprites/enemies.png');background-position: 0 ${-en.row * 34}px;"></span>
                <small>${seen ? en.name : '???'}</small>
              </div>
            `;
          }).join('')}
          ${ZONES.map((z, idx) => {
            const seen = s.discoveredBosses.includes(idx);
            return `
              <div class="codex-cell boss ${seen ? 'seen' : ''}" title="${seen ? z.bossName : '미발견 보스'}">
                <span class="codex-sprite boss" style="background-image:url('./assets/sprites/bosses.png');background-position: 0 ${-idx * 40}px;"></span>
                <small>${seen ? z.bossName : '??? 보스'}</small>
              </div>
            `;
          }).join('')}
        </div>

        <div class="stat-grid">
          <div class="stat-cell"><span>기사 공격력</span><strong>${fmtNum(stats.atk)}</strong></div>
          <div class="stat-cell"><span>공격속도</span><strong>${stats.aps.toFixed(2)}/s</strong></div>
          <div class="stat-cell"><span>치명타 확률</span><strong>${(stats.critChance * 100).toFixed(1)}%</strong></div>
          <div class="stat-cell"><span>방어력</span><strong>${fmtNum(stats.def)}</strong></div>
          <div class="stat-cell"><span>최대 체력</span><strong>${fmtNum(stats.maxHp)}</strong></div>
          <div class="stat-cell"><span>철벽 방어 성공</span><strong>${s.totalPerfectGuards}회</strong></div>
          <div class="stat-cell"><span>누적 처치</span><strong>${fmtNum(s.totalKills)}</strong></div>
          <div class="stat-cell"><span>누적 단조</span><strong>${fmtNum(s.totalForges)}회</strong></div>
          <div class="stat-cell"><span>최고 스테이지</span><strong>STG ${s.highestStage}</strong></div>
          <div class="stat-cell"><span>원정 시간</span><strong>${fmtTime(s.totalPlaySeconds)}</strong></div>
        </div>

        <div class="save-actions">
          <button class="btn btn-ghost btn-sm" data-action="export-save">📋 코드 백업</button>
          <button class="btn btn-ghost btn-sm" data-action="import-save">📥 코드 복원</button>
          <button class="btn btn-danger btn-sm" data-action="reset-save">초기화</button>
        </div>
      `;
    }
  }

  function updateHud(): void {
    const s = engine.state;
    const stats = engine.computeStats();
    const zone = getZoneForStage(s.stage);

    root.querySelector('#hud-stage')!.textContent = `STAGE ${s.stage}-${s.wave}${s.farmMode ? ' · 파밍' : ''}`;
    root.querySelector('#hud-zone')!.textContent = zone.name;
    root.querySelector('#hud-gold')!.textContent = fmtNum(s.gold);
    root.querySelector('#hud-ore')!.textContent = fmtNum(s.ore);
    root.querySelector('#hud-dps')!.textContent = `DPS ${fmtNum(stats.dps)}`;
    root.querySelector('#hud-rank')!.textContent = stats.rankTitle;
    root.querySelector('#hud-medals')!.textContent = `훈장 ${fmtNum(s.medals)} · 대장간 Lv.${stats.forgeLevel}`;

    const hpPct = Math.max(0, Math.min(100, (s.heroHp / s.heroMaxHp) * 100));
    const shPct = Math.max(0, Math.min(100, (s.heroShield / s.heroMaxHp) * 100));
    (root.querySelector('#hud-hp-fill') as HTMLElement).style.width = `${hpPct}%`;
    (root.querySelector('#hud-shield-fill') as HTMLElement).style.width = `${shPct}%`;
    (root.querySelector('#hud-morale-fill') as HTMLElement).style.width = `${Math.min(100, s.morale)}%`;
    root.querySelector('#hud-hp-text')!.textContent = `HP ${fmtNum(s.heroHp)} / ${fmtNum(s.heroMaxHp)}${
      s.heroShield > 0 ? ` (+${fmtNum(s.heroShield)})` : ''
    }`;

    let pips = '';
    for (let w = 1; w <= 5; w++) {
      const cls = w < s.wave ? 'done' : w === s.wave ? 'current' : '';
      pips += `<span class="wave-pip ${cls} ${w === 5 ? 'boss' : ''}">${w === 5 ? '👑' : ''}</span>`;
    }
    root.querySelector('#hud-wave-pips')!.innerHTML = pips;

    root.querySelector('#btn-boss-challenge')!.classList.toggle('hidden', !s.farmMode);

    const rallyBtn = root.querySelector<HTMLButtonElement>('#btn-rally')!;
    const rallySub = root.querySelector('#rally-sub')!;
    const ready = s.morale >= 100 && s.rallyTimer <= 0;
    rallyBtn.classList.toggle('ready', ready);
    rallyBtn.classList.toggle('active', s.rallyTimer > 0);
    rallyBtn.disabled = !ready;
    rallySub.textContent = s.rallyTimer > 0 ? `돌격 ${s.rallyTimer.toFixed(1)}s` : `${Math.floor(s.morale)}%`;

    updateQuestBar();
    updateStanceButtons();
  }

  function refreshButtonsLightweight(): void {
    const s = engine.state;
    if (activeTab === 'forge') {
      const btn = panelBody.querySelector<HTMLButtonElement>('[data-action="forge-now"]');
      if (btn) {
        const can = s.ore >= engine.getForgeCost() && !s.pendingForgeItem;
        btn.disabled = !can;
        btn.classList.toggle('ready', can);
      }
      panelBody.querySelectorAll<HTMLButtonElement>('[data-action="refine-slot"]').forEach((rb) => {
        const slot = rb.dataset.slot as EquipSlot;
        const lv = s.refineLevels[slot];
        const can = lv < 30 && s.gold >= getRefineCost(lv);
        rb.disabled = !can;
        rb.classList.toggle('can-buy', can);
      });
    } else if (activeTab === 'squad') {
      panelBody.querySelectorAll<HTMLButtonElement>('[data-action="buy-companion"]').forEach((btn) => {
        const id = btn.dataset.key as CompanionId;
        const def = COMPANIONS.find((c) => c.id === id)!;
        const can = s.gold >= getCompanionCost(def, s.companions[id]);
        btn.disabled = !can;
        btn.classList.toggle('can-buy', can);
      });
      panelBody.querySelectorAll<HTMLButtonElement>('[data-action="buy-training"]').forEach((btn) => {
        const key = btn.dataset.key as TrainingKey;
        const can = s.gold >= engine.getTrainingBatchCost(key, s.buyStep);
        btn.disabled = !can;
        btn.classList.toggle('can-buy', can);
      });
    }
  }

  updateStanceButtons();
  updateQuickButtons();
  renderTab();
  updateHud();
  renderOfflineModalIfNeeded();

  let rafId = 0;
  let lastFrame = performance.now();

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    engine.step(dt);
    for (const ev of engine.drainEvents()) {
      sfx.play(ev.type);
    }

    renderArena(ctx, engine.state, now / 1000);

    if (now - lastUiSync >= 120) {
      lastUiSync = now;
      updateHud();
      renderForgeModal();
      refreshButtonsLightweight();
    }

    if (now - lastSave >= 8000) {
      lastSave = now;
      writeSaveData(engine.toSaveData());
    }

    rafId = requestAnimationFrame(loop);
  };

  const onUnload = () => writeSaveData(engine.toSaveData());
  window.addEventListener('beforeunload', onUnload);

  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    sfx.setBgm(false);
    window.removeEventListener('beforeunload', onUnload);
    writeSaveData(engine.toSaveData());
  };
}
