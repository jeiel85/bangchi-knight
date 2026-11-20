import { sfx } from '../audio/sfx';
import {
  COMPANIONS,
  FACILITIES,
  RARITY_CONFIG,
  SLOT_META,
  STANCES,
  TRAININGS,
  getCompanionCost,
  getFacilityCost,
  getTrainingCost,
  getZoneForStage,
} from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, BangchiEngine } from '../engine/gameEngine';
import { clearSaveData, loadSaveData, writeSaveData } from '../engine/storage';
import type { CompanionId, EquipSlot, FacilityKey, StanceId, TrainingKey } from '../engine/types';
import { renderArena } from '../renderer/canvasRenderer';

type TabKey = 'forge' | 'squad' | 'kingdom' | 'journal';

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

  let activeTab: TabKey = 'forge';
  let lastUiSync = 0;
  let lastSave = performance.now();
  let lastForgeSig = '';

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
            <span class="currency gold" id="hud-gold">🪙 0</span>
            <span class="currency ore" id="hud-ore">⛏️ 0</span>
          </div>
        </header>

        <div class="wave-bar-row">
          <div class="wave-pips" id="hud-wave-pips"></div>
          <div class="dps-pill" id="hud-dps">DPS 0</div>
        </div>

        <div class="hero-hud">
          <div class="hero-badge">
            <span class="hero-crest">🛡️</span>
            <div>
              <div class="hero-rank" id="hud-rank">견습 원정기사</div>
              <div class="hero-sub" id="hud-medals">🏅 훈장 0</div>
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
          <button class="arena-rally-btn" id="btn-rally">
            <span>🎺 진격 나팔</span>
            <small id="rally-sub">20%</small>
          </button>
        </div>

        <div class="tactics-strip">
          <div class="stance-bar" id="stance-bar">
            ${STANCES.map(
              (st) => `
              <button class="stance-btn" data-stance="${st.id}" title="${st.shortDesc}">
                <span class="stance-top">${st.icon} ${st.name}</span>
                <span class="stance-desc">${st.shortDesc}</span>
              </button>
            `
            ).join('')}
          </div>
          <div class="quick-bar">
            <button class="quick-btn" id="q-auto">자동나팔</button>
            <button class="quick-btn" id="q-speed">1배속</button>
            <button class="quick-btn" id="q-sound">소리 ON</button>
            <button class="quick-btn" id="q-save">저장</button>
          </div>
        </div>

        <section class="panel-body" id="panel-body"></section>

        <nav class="bottom-nav">
          <button class="nav-tab active" data-tab="forge">🔨<span>대장간</span></button>
          <button class="nav-tab" data-tab="squad">👥<span>원정대</span></button>
          <button class="nav-tab" data-tab="kingdom">🏰<span>왕국</span></button>
          <button class="nav-tab" data-tab="journal">📜<span>원정일지</span></button>
        </nav>

        <div class="modal-backdrop hidden" id="forge-modal">
          <div class="modal-card" id="forge-modal-content"></div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const panelBody = root.querySelector<HTMLElement>('#panel-body')!;
  const forgeModal = root.querySelector<HTMLElement>('#forge-modal')!;
  const forgeModalContent = root.querySelector<HTMLElement>('#forge-modal-content')!;

  root.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

  root.querySelector('#back-landing-btn')?.addEventListener('click', () => {
    writeSaveData(engine.toSaveData());
    onBackToLanding();
  });

  root.querySelector('#btn-rally')?.addEventListener('click', () => {
    sfx.unlock();
    engine.triggerRally();
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
  const qSave = root.querySelector<HTMLButtonElement>('#q-save')!;

  qAuto.addEventListener('click', () => {
    engine.state.autoRally = !engine.state.autoRally;
    updateQuickButtons();
  });
  qSpeed.addEventListener('click', () => {
    engine.state.speedMult = engine.state.speedMult === 1 ? 2 : 1;
    updateQuickButtons();
  });
  qSound.addEventListener('click', () => {
    engine.state.soundEnabled = !engine.state.soundEnabled;
    sfx.enabled = engine.state.soundEnabled;
    updateQuickButtons();
  });
  qSave.addEventListener('click', () => {
    writeSaveData(engine.toSaveData());
    qSave.textContent = '완료!';
    setTimeout(() => {
      qSave.textContent = '저장';
    }, 850);
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
      if (engine.forgeEquipment()) {
        renderForgeModal();
        renderTab();
      }
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
        if (
          window.confirm(
            `왕국으로 귀환하여 훈장 +${reward}개를 획득하고 STAGE 1부터 재출정할까요?\n(훈장과 왕국 영구 시설, 대장간 숙련도는 유지됩니다)`
          )
        ) {
          engine.performKingdomReturn();
          writeSaveData(engine.toSaveData());
          renderTab();
        }
      }
    } else if (action === 'reset-save') {
      if (window.confirm('모든 원정 기록과 왕국 시설을 초기화할까요?')) {
        clearSaveData();
        engine.resetGame();
        renderTab();
      }
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

  function updateStanceButtons(): void {
    root.querySelectorAll<HTMLButtonElement>('[data-stance]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.stance === engine.state.stance);
    });
  }

  function updateQuickButtons(): void {
    qAuto.classList.toggle('on', engine.state.autoRally);
    qAuto.textContent = engine.state.autoRally ? '자동나팔 ON' : '자동나팔';
    qSpeed.classList.toggle('on', engine.state.speedMult === 2);
    qSpeed.textContent = `${engine.state.speedMult}배속`;
    qSound.classList.toggle('on', engine.state.soundEnabled);
    qSound.textContent = engine.state.soundEnabled ? '소리 ON' : '음소거';
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

    forgeModal.classList.remove('hidden');
    forgeModalContent.innerHTML = `
      <div class="modal-kicker">LIVE ANVIL FORGING</div>
      <h3>${slotInfo.icon} 새로운 ${slotInfo.label} 단조 완료!</h3>
      <div class="compare-grid">
        <div class="item-box">
          <div class="item-tag">현재 장착</div>
          <div class="item-name" style="color:${curRarity.color}">[${curRarity.label}] ${cur.name}</div>
          <div class="item-stat">${slotInfo.statLabel} <strong>${cur.power}</strong></div>
          <div class="item-bonus">${cur.bonusLabel}</div>
        </div>
        <div class="item-box highlight" style="border-color:${newRarity.color}">
          <div class="item-tag" style="color:${newRarity.color}">신규 단조 (Lv.${item.level})</div>
          <div class="item-name" style="color:${newRarity.color}">[${newRarity.label}] ${item.name}</div>
          <div class="item-stat">
            ${slotInfo.statLabel} <strong>${item.power}</strong>
            <span class="diff-pill ${diff >= 0 ? 'up' : 'down'}">${diffStr}</span>
          </div>
          <div class="item-bonus">${item.bonusLabel}</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-amber btn-sm" data-forge-choice="equip">⚔️ 장착하기 (구장비 판매)</button>
        <button class="btn btn-ghost btn-sm" data-forge-choice="salvage">♻️ 분해 (골드·광석·숙련도)</button>
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
            <p>광석으로 장비를 단조할수록 희귀·신화 확률이 올라갑니다</p>
          </div>
          <span class="ore-badge">⛏️ ${fmtNum(s.ore)}</span>
        </div>

        <button class="anvil-cta ${canForge ? 'ready' : ''}" data-action="forge-now" ${canForge ? '' : 'disabled'}>
          <span class="anvil-emoji">🔨</span>
          <div class="anvil-copy">
            <strong>장비 즉시 단조하기</strong>
            <small>소모 광석 ⛏️ ${oreCost} · 무작위 무기/방패/갑옷 제작</small>
          </div>
        </button>

        <div class="equip-grid">
          ${slots
            .map((slot) => {
              const item = s.equipment[slot];
              const meta = SLOT_META[slot];
              const rar = RARITY_CONFIG[item.rarity];
              return `
                <div class="equip-card" style="border-left: 3px solid ${rar.color}">
                  <div class="equip-top">
                    <span>${meta.icon} ${meta.label}</span>
                    <span class="rar-chip" style="color:${rar.color}">${rar.label} · Lv.${item.level}</span>
                  </div>
                  <div class="equip-name">${item.name}</div>
                  <div class="equip-stats">
                    <span>${meta.statLabel} <strong>+${item.power}</strong></span>
                    <span class="equip-bonus">${item.bonusLabel}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    } else if (activeTab === 'squad') {
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>원정대 동료 &amp; 기사 훈련</h4>
            <p>동료를 영입하면 전장에 직접 합류해 함께 싸웁니다</p>
          </div>
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
                  <span class="row-icon" style="border-color:${c.color}">${c.icon}</span>
                  <div>
                    <div class="row-title">${c.name} <span class="lv-tag">${lv === 0 ? '미영입' : `Lv.${lv}`}</span></div>
                    <div class="row-desc">${c.role} · ${c.desc}</div>
                  </div>
                </div>
                <button class="buy-btn ${canBuy ? 'can-buy' : ''}" data-action="buy-companion" data-key="${c.id}" ${canBuy ? '' : 'disabled'}>
                  <span>${lv === 0 ? '영입' : '강화'}</span>
                  <small>🪙 ${fmtNum(cost)}</small>
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="sub-label">기사단 기초 훈련</div>
        <div class="row-list">
          ${TRAININGS.map((t) => {
            const lv = s.training[t.key];
            const cost = getTrainingCost(t, lv);
            const canBuy = s.gold >= cost;
            return `
              <div class="item-row">
                <div class="row-left">
                  <span class="row-icon">${t.icon}</span>
                  <div>
                    <div class="row-title">${t.name} <span class="lv-tag">Lv.${lv}</span></div>
                    <div class="row-desc">${t.desc}</div>
                  </div>
                </div>
                <button class="buy-btn ${canBuy ? 'can-buy' : ''}" data-action="buy-training" data-key="${t.key}" ${canBuy ? '' : 'disabled'}>
                  <span>훈련</span>
                  <small>🪙 ${fmtNum(cost)}</small>
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
          <span class="medal-badge">🏅 ${fmtNum(s.medals)}</span>
        </div>

        <div class="return-card">
          <div>
            <div class="return-title">🏰 원정 귀환 (훈장 정산)</div>
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
                  <span class="row-icon">${f.icon}</span>
                  <div>
                    <div class="row-title">${f.name} <span class="lv-tag">Lv.${lv}/${f.maxLevel}</span></div>
                    <div class="row-desc">${f.desc}</div>
                  </div>
                </div>
                <button class="buy-btn medal-buy ${canBuy ? 'can-buy' : ''}" data-action="buy-facility" data-key="${f.key}" ${canBuy ? '' : 'disabled'}>
                  <span>${isMax ? 'MAX' : '증축'}</span>
                  <small>${isMax ? '' : `🏅 ${cost}`}</small>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>원정 일지 &amp; 전투 기록</h4>
            <p>현재 원정대 전력과 누적 업적</p>
          </div>
          <span class="ore-badge">최고 STG ${s.highestStage}</span>
        </div>

        <div class="stat-grid">
          <div class="stat-cell"><span>기사 공격력</span><strong>${fmtNum(stats.atk)}</strong></div>
          <div class="stat-cell"><span>공격속도</span><strong>${stats.aps.toFixed(2)}/s</strong></div>
          <div class="stat-cell"><span>치명타 확률</span><strong>${(stats.critChance * 100).toFixed(1)}%</strong></div>
          <div class="stat-cell"><span>방어력</span><strong>${fmtNum(stats.def)}</strong></div>
          <div class="stat-cell"><span>최대 체력</span><strong>${fmtNum(stats.maxHp)}</strong></div>
          <div class="stat-cell"><span>초당 회복</span><strong>${stats.regenPerSec.toFixed(1)}/s</strong></div>
          <div class="stat-cell"><span>골드 배율</span><strong>${(stats.goldMult * 100).toFixed(0)}%</strong></div>
          <div class="stat-cell"><span>광석 배율</span><strong>${(stats.oreMult * 100).toFixed(0)}%</strong></div>
          <div class="stat-cell"><span>누적 처치</span><strong>${fmtNum(s.totalKills)}</strong></div>
          <div class="stat-cell"><span>누적 단조</span><strong>${fmtNum(s.totalForges)}회</strong></div>
          <div class="stat-cell"><span>왕국 귀환</span><strong>${s.expeditionReturns}회</strong></div>
          <div class="stat-cell"><span>원정 시간</span><strong>${fmtTime(s.totalPlaySeconds)}</strong></div>
        </div>

        <div class="danger-zone">
          <button class="btn btn-danger btn-sm" data-action="reset-save">세이브 초기화</button>
        </div>
      `;
    }
  }

  function updateHud(): void {
    const s = engine.state;
    const stats = engine.computeStats();
    const zone = getZoneForStage(s.stage);

    root.querySelector('#hud-stage')!.textContent = `STAGE ${s.stage}-${s.wave}`;
    root.querySelector('#hud-zone')!.textContent = zone.name;
    root.querySelector('#hud-gold')!.textContent = `🪙 ${fmtNum(s.gold)}`;
    root.querySelector('#hud-ore')!.textContent = `⛏️ ${fmtNum(s.ore)}`;
    root.querySelector('#hud-dps')!.textContent = `DPS ${fmtNum(stats.dps)}`;
    root.querySelector('#hud-rank')!.textContent = stats.rankTitle;
    root.querySelector('#hud-medals')!.textContent = `🏅 훈장 ${fmtNum(s.medals)} · 대장간 Lv.${stats.forgeLevel}`;

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

    const rallyBtn = root.querySelector<HTMLButtonElement>('#btn-rally')!;
    const rallySub = root.querySelector('#rally-sub')!;
    const ready = s.morale >= 100 && s.rallyTimer <= 0;
    rallyBtn.classList.toggle('ready', ready);
    rallyBtn.classList.toggle('active', s.rallyTimer > 0);
    rallyBtn.disabled = !ready;
    rallySub.textContent = s.rallyTimer > 0 ? `돌격 ${s.rallyTimer.toFixed(1)}s` : `${Math.floor(s.morale)}%`;
  }

  function refreshButtonsLightweight(): void {
    const s = engine.state;
    if (activeTab === 'forge') {
      const btn = panelBody.querySelector<HTMLButtonElement>('[data-action="forge-now"]');
      const oreBadge = panelBody.querySelector('.ore-badge');
      if (oreBadge) oreBadge.textContent = `⛏️ ${fmtNum(s.ore)}`;
      if (btn) {
        const can = s.ore >= engine.getForgeCost() && !s.pendingForgeItem;
        btn.disabled = !can;
        btn.classList.toggle('ready', can);
      }
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
        const def = TRAININGS.find((t) => t.key === key)!;
        const can = s.gold >= getTrainingCost(def, s.training[key]);
        btn.disabled = !can;
        btn.classList.toggle('can-buy', can);
      });
    }
  }

  updateStanceButtons();
  updateQuickButtons();
  renderTab();
  updateHud();

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
    window.removeEventListener('beforeunload', onUnload);
    writeSaveData(engine.toSaveData());
  };
}
