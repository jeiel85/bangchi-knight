import { sfx } from '../audio/sfx';
import {
  AWAKENING_CARDS,
  KNIGHT_TIERS,
  RELICS,
  SKILLS,
  UPGRADES,
  getBiomeForStage,
  getRelicCost,
} from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, BangchiEngine } from '../engine/gameEngine';
import { clearSaveData, loadSaveData, writeSaveData } from '../engine/storage';
import type { BuyMode, CardRarity, RelicKey, SkillId, UpgradeKey } from '../engine/types';
import { renderArena } from '../renderer/canvasRenderer';

type TabKey = 'upgrade' | 'build' | 'sanctuary' | 'info';

const RARITY_LABELS: Record<CardRarity, string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
};

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
  const saved = loadSaveData();
  const engine = new BangchiEngine(saved);
  sfx.enabled = engine.state.soundEnabled;

  let activeTab: TabKey = 'upgrade';
  let lastUiUpdate = 0;
  let lastSaveTime = performance.now();
  let lastModalSignature = '';

  root.innerHTML = `
    <div class="game-viewport">
      <div class="phone-shell">
        <header class="shell-topbar">
          <button class="shell-back-btn" id="back-landing-btn" title="랜딩 페이지로">← 홈</button>
          <div class="stage-cluster">
            <span class="stage-code" id="hud-stage">STG 1-1</span>
            <span class="stage-biome" id="hud-biome">어둠의 지하묘지</span>
          </div>
          <div class="currency-cluster">
            <span class="currency gold" id="hud-gold">🪙 0</span>
            <span class="currency soul" id="hud-soul">🔮 0</span>
          </div>
        </header>

        <div class="wave-bar-row">
          <div class="wave-pips" id="hud-wave-pips"></div>
          <div class="dps-pill" id="hud-dps">DPS 0</div>
        </div>

        <div class="hero-hud">
          <div class="hero-badge">
            <span class="hero-crest">⚔️</span>
            <div>
              <div class="hero-tier-name" id="hud-tier">견습 흑기사</div>
              <div class="hero-lv" id="hud-lv">LV.1 · EXP 0%</div>
            </div>
          </div>
          <div class="hero-bars">
            <div class="bar-track hp-track">
              <div class="bar-fill hp-fill" id="hud-hp-fill"></div>
              <div class="bar-fill shield-fill" id="hud-shield-fill"></div>
              <span class="bar-text" id="hud-hp-text">HP 120 / 120</span>
            </div>
            <div class="bar-track exp-track">
              <div class="bar-fill exp-fill" id="hud-exp-fill"></div>
            </div>
          </div>
        </div>

        <div class="arena-container">
          <canvas id="game-canvas" width="${ARENA_WIDTH}" height="${ARENA_HEIGHT}"></canvas>
          <button class="arena-overlay-btn counter-btn" id="btn-counter">
            <span>⚡ 일섬 반격</span>
            <small id="counter-sub">READY</small>
          </button>
          <button class="arena-overlay-btn fever-btn" id="btn-fever">
            <span>🌑 흑월</span>
            <small id="fever-sub">0%</small>
          </button>
          <button class="arena-awake-pill hidden" id="btn-open-awakening">
            🃏 각성 선택 (<span id="awake-count">0</span>)
          </button>
        </div>

        <div class="action-strip">
          <div class="skill-bar" id="skill-bar"></div>
          <div class="quick-bar">
            <button class="quick-btn" id="q-auto">자동</button>
            <button class="quick-btn" id="q-speed">1x</button>
            <button class="quick-btn" id="q-sound">소리</button>
            <button class="quick-btn" id="q-save">저장</button>
          </div>
        </div>

        <section class="panel-body" id="panel-body"></section>

        <nav class="bottom-nav">
          <button class="nav-tab active" data-tab="upgrade">⚔️<span>강화</span></button>
          <button class="nav-tab" data-tab="build">🃏<span>빌드</span></button>
          <button class="nav-tab" data-tab="sanctuary">🏛️<span>성소</span></button>
          <button class="nav-tab" data-tab="info">📊<span>정보</span></button>
        </nav>

        <div class="modal-backdrop hidden" id="awakening-modal">
          <div class="modal-card">
            <div class="modal-kicker">ROGUELITE AWAKENING</div>
            <h3>각성 카드 1장을 선택하세요</h3>
            <div class="card-choice-list" id="card-choice-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const panelBody = root.querySelector<HTMLElement>('#panel-body')!;
  const skillBar = root.querySelector<HTMLElement>('#skill-bar')!;
  const awakeningModal = root.querySelector<HTMLElement>('#awakening-modal')!;
  const cardChoiceList = root.querySelector<HTMLElement>('#card-choice-list')!;

  const unlockAudio = () => sfx.unlock();
  root.addEventListener('pointerdown', unlockAudio, { once: true });

  root.querySelector('#back-landing-btn')?.addEventListener('click', () => {
    writeSaveData(engine.toSaveData());
    onBackToLanding();
  });

  root.querySelector('#btn-counter')?.addEventListener('click', () => {
    sfx.unlock();
    engine.triggerManualCounter();
  });

  root.querySelector('#btn-fever')?.addEventListener('click', () => {
    sfx.unlock();
    engine.triggerFever();
  });

  root.querySelector('#btn-open-awakening')?.addEventListener('click', () => {
    engine.openAwakeningIfReady();
    renderModalIfNeeded();
  });

  // Quick toggles
  const qAuto = root.querySelector<HTMLButtonElement>('#q-auto')!;
  const qSpeed = root.querySelector<HTMLButtonElement>('#q-speed')!;
  const qSound = root.querySelector<HTMLButtonElement>('#q-sound')!;
  const qSave = root.querySelector<HTMLButtonElement>('#q-save')!;

  qAuto.addEventListener('click', () => {
    engine.state.autoSkill = !engine.state.autoSkill;
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
    }, 900);
  });

  // Bottom tabs
  root.querySelectorAll<HTMLButtonElement>('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.tab as TabKey;
      if (!next) return;
      activeTab = next;
      root.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b === btn));
      renderActiveTab();
    });
  });

  // Delegated events inside panelBody
  panelBody.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    sfx.unlock();

    const action = target.dataset.action;
    if (action === 'buy-mode') {
      const val = target.dataset.mode;
      engine.state.buyMode = (val === 'MAX' ? 'MAX' : Number(val)) as BuyMode;
      renderActiveTab();
    } else if (action === 'buy-upgrade') {
      const key = target.dataset.key as UpgradeKey;
      if (engine.buyUpgrade(key)) {
        renderActiveTab();
      }
    } else if (action === 'buy-relic') {
      const key = target.dataset.key as RelicKey;
      if (engine.buyRelic(key)) {
        renderActiveTab();
      }
    } else if (action === 'rebirth') {
      if (engine.canRebirth()) {
        const reward = engine.getRebirthSoulReward();
        if (window.confirm(`환생하여 영혼 +${reward}개를 획득하고 1스테이지부터 다시 시작할까요?\n(성소 유물과 영혼은 영구 유지됩니다)`)) {
          engine.performRebirth();
          writeSaveData(engine.toSaveData());
          renderActiveTab();
        }
      }
    } else if (action === 'reset-save') {
      if (window.confirm('모든 진행 기록과 영혼 유물을 초기화할까요?')) {
        clearSaveData();
        engine.resetForNewGame();
        renderActiveTab();
      }
    }
  });

  // Skill bar buttons
  skillBar.innerHTML = SKILLS.map(
    (sk) => `
    <button class="skill-slot" data-skill="${sk.id}" title="${sk.name}: ${sk.desc}">
      <span class="skill-icon">${sk.icon}</span>
      <span class="skill-name">${sk.name}</span>
      <span class="skill-cd" id="cd-${sk.id}"></span>
    </button>
  `
  ).join('');

  skillBar.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-skill]');
    if (!btn) return;
    sfx.unlock();
    engine.castSkill(btn.dataset.skill as SkillId);
  });

  // Awakening choice click
  cardChoiceList.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-card-id]');
    if (!btn) return;
    const cardId = btn.dataset.cardId!;
    if (engine.chooseAwakeningCard(cardId)) {
      renderModalIfNeeded();
      renderActiveTab();
    }
  });

  function updateQuickButtons(): void {
    qAuto.classList.toggle('on', engine.state.autoSkill);
    qAuto.textContent = engine.state.autoSkill ? '자동 ON' : '자동 OFF';
    qSpeed.classList.toggle('on', engine.state.speedMult === 2);
    qSpeed.textContent = `${engine.state.speedMult}배속`;
    qSound.classList.toggle('on', engine.state.soundEnabled);
    qSound.textContent = engine.state.soundEnabled ? '소리 ON' : '음소거';
  }

  function renderModalIfNeeded(): void {
    const choices = engine.state.activeCardChoices;
    const sig = choices ? choices.map((c) => c.id).join(',') : '';
    if (sig === lastModalSignature) return;
    lastModalSignature = sig;

    if (!choices) {
      awakeningModal.classList.add('hidden');
      return;
    }

    awakeningModal.classList.remove('hidden');
    cardChoiceList.innerHTML = choices
      .map((card) => {
        const curStack = engine.state.cards[card.id] ?? 0;
        return `
        <button class="awake-choice rarity-${card.rarity}" data-card-id="${card.id}">
          <div class="awake-head">
            <span class="awake-icon">${card.icon}</span>
            <div class="awake-title-wrap">
              <div class="awake-name">${card.name}</div>
              <div class="awake-meta">
                <span class="rarity-tag ${card.rarity}">${RARITY_LABELS[card.rarity]}</span>
                <span class="tag-chip">${card.tag}</span>
                <span>Lv.${curStack} → ${curStack + 1}</span>
              </div>
            </div>
          </div>
          <p class="awake-desc">${card.desc}</p>
        </button>
      `;
      })
      .join('');
  }

  function renderActiveTab(): void {
    const s = engine.state;
    const stats = engine.computeStats();

    if (activeTab === 'upgrade') {
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>전투 능력 강화</h4>
            <p>골드로 기본 스탯을 즉시 끌어올리세요</p>
          </div>
          <div class="buy-mode-group">
            ${([1, 10, 'MAX'] as BuyMode[])
              .map(
                (m) => `
              <button class="mode-btn ${s.buyMode === m ? 'active' : ''}" data-action="buy-mode" data-mode="${m}">
                ${m === 'MAX' ? 'MAX' : `x${m}`}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
        <div class="upgrade-list">
          ${UPGRADES.map((u) => {
            const lv = s.upgrades[u.key];
            const batch = engine.getUpgradeBatchInfo(u.key, s.buyMode);
            return `
              <div class="upgrade-row">
                <div class="upgrade-left">
                  <span class="upgrade-icon">${u.icon}</span>
                  <div>
                    <div class="upgrade-title">${u.name} <span class="lv-tag">Lv.${lv}</span></div>
                    <div class="upgrade-desc">${u.shortDesc}</div>
                  </div>
                </div>
                <button
                  class="buy-btn ${batch.canAfford ? 'can-buy' : ''}"
                  data-action="buy-upgrade"
                  data-key="${u.key}"
                  ${batch.canAfford ? '' : 'disabled'}
                >
                  <span class="buy-cost">🪙 ${fmtNum(batch.totalCost)}</span>
                  <span class="buy-qty">+${batch.count}</span>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (activeTab === 'build') {
      const owned = AWAKENING_CARDS.filter((c) => (s.cards[c.id] ?? 0) > 0);
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>각성 빌드 &amp; 기사 진화</h4>
            <p>보스 처치와 3레벨마다 새로운 각성 카드를 획득합니다</p>
          </div>
          <span class="count-badge">${owned.length} / ${AWAKENING_CARDS.length}</span>
        </div>

        <div class="evo-strip">
          ${KNIGHT_TIERS.map(
            (t, idx) => `
            <div class="evo-node ${idx <= stats.tierIndex ? 'unlocked' : ''}">
              <span class="evo-dot" style="background:${t.capeColor}"></span>
              <span>${t.name}</span>
              <small>STG ${t.minStage}</small>
            </div>
          `
          ).join('')}
        </div>

        ${
          owned.length === 0
            ? `<div class="empty-state">아직 획득한 각성 카드가 없습니다.<br/>LV.3 달성 또는 스테이지 보스 격파 시 첫 각성이 열립니다!</div>`
            : `<div class="owned-card-grid">
                ${owned
                  .map((c) => {
                    const lv = s.cards[c.id] ?? 0;
                    return `
                    <div class="owned-card rarity-${c.rarity}">
                      <div class="owned-top">
                        <span>${c.icon} ${c.name}</span>
                        <strong>Lv.${lv}/${c.maxStack}</strong>
                      </div>
                      <p>${c.desc}</p>
                    </div>
                  `;
                  })
                  .join('')}
              </div>`
        }
      `;
    } else if (activeTab === 'sanctuary') {
      const rebirthReward = engine.getRebirthSoulReward();
      const canRebirth = engine.canRebirth();
      panelBody.innerHTML = `
        <div class="panel-header">
          <div>
            <h4>흑월의 성소 (영구 강화)</h4>
            <p>영혼(Soul) 유물은 환생 후에도 영원히 유지됩니다</p>
          </div>
          <span class="soul-pill">🔮 ${fmtNum(s.soul)}</span>
        </div>

        <div class="rebirth-box">
          <div>
            <div class="rebirth-title">🌀 성소 환생 (Rebirth)</div>
            <div class="rebirth-desc">
              ${
                canRebirth
                  ? `지금 환생하면 <strong>영혼 +${rebirthReward}</strong> 획득 (누적 ${s.rebirthCount}회)`
                  : `STAGE 3 도달 시 환생 가능 (현재 STG ${s.stage})`
              }
            </div>
          </div>
          <button
            class="btn btn-sm ${canRebirth ? 'btn-gold' : 'btn-muted'}"
            data-action="rebirth"
            ${canRebirth ? '' : 'disabled'}
          >
            환생하기
          </button>
        </div>

        <div class="upgrade-list">
          ${RELICS.map((r) => {
            const lv = s.relics[r.key];
            const isMax = lv >= r.maxLevel;
            const cost = getRelicCost(r, lv);
            const canBuy = !isMax && s.soul >= cost;
            return `
              <div class="upgrade-row">
                <div class="upgrade-left">
                  <span class="upgrade-icon">${r.icon}</span>
                  <div>
                    <div class="upgrade-title">${r.name} <span class="lv-tag">Lv.${lv}/${r.maxLevel}</span></div>
                    <div class="upgrade-desc">${r.desc}</div>
                  </div>
                </div>
                <button
                  class="buy-btn soul-buy ${canBuy ? 'can-buy' : ''}"
                  data-action="buy-relic"
                  data-key="${r.key}"
                  ${canBuy ? '' : 'disabled'}
                >
                  <span class="buy-cost">${isMax ? 'MAX' : `🔮 ${cost}`}</span>
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
            <h4>기사 전투 정보</h4>
            <p>현재 빌드 능력치 및 누적 기록</p>
          </div>
          <span class="count-badge">최고 STG ${s.highestStage}</span>
        </div>

        <div class="stat-grid">
          <div class="stat-cell"><span>공격력</span><strong>${fmtNum(stats.atk)}</strong></div>
          <div class="stat-cell"><span>공격속도</span><strong>${stats.aps.toFixed(2)}/s</strong></div>
          <div class="stat-cell"><span>치명타 확률</span><strong>${(stats.critChance * 100).toFixed(1)}%</strong></div>
          <div class="stat-cell"><span>치명타 배율</span><strong>${(stats.critMult * 100).toFixed(0)}%</strong></div>
          <div class="stat-cell"><span>최대 체력</span><strong>${fmtNum(stats.maxHp)}</strong></div>
          <div class="stat-cell"><span>초당 재생</span><strong>${stats.regenPerSec.toFixed(1)}/s</strong></div>
          <div class="stat-cell"><span>일섬 반격 배율</span><strong>${(stats.counterMult * 100).toFixed(0)}%</strong></div>
          <div class="stat-cell"><span>골드 획득 배율</span><strong>${(stats.goldMult * 100).toFixed(0)}%</strong></div>
          <div class="stat-cell"><span>누적 처치</span><strong>${fmtNum(s.totalKills)}</strong></div>
          <div class="stat-cell"><span>일섬 반격 성공</span><strong>${fmtNum(s.totalCounters)}</strong></div>
          <div class="stat-cell"><span>누적 환생</span><strong>${s.rebirthCount}회</strong></div>
          <div class="stat-cell"><span>플레이 시간</span><strong>${fmtTime(s.totalPlaySeconds)}</strong></div>
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
    const biome = getBiomeForStage(s.stage);

    root.querySelector('#hud-stage')!.textContent = `STG ${s.stage}-${s.wave}`;
    root.querySelector('#hud-biome')!.textContent = biome.name;
    root.querySelector('#hud-gold')!.textContent = `🪙 ${fmtNum(s.gold)}`;
    root.querySelector('#hud-soul')!.textContent = `🔮 ${fmtNum(s.soul)}`;
    root.querySelector('#hud-dps')!.textContent = `DPS ${fmtNum(stats.dps)}`;
    root.querySelector('#hud-tier')!.textContent = stats.tierName;

    const expPct = Math.min(100, Math.floor((s.exp / s.expToNext) * 100));
    root.querySelector('#hud-lv')!.textContent = `LV.${s.level} · EXP ${expPct}%`;

    const hpPct = Math.max(0, Math.min(100, (s.heroHp / s.heroMaxHp) * 100));
    const shieldPct = Math.max(0, Math.min(100, (s.heroShield / s.heroMaxHp) * 100));
    (root.querySelector('#hud-hp-fill') as HTMLElement).style.width = `${hpPct}%`;
    (root.querySelector('#hud-shield-fill') as HTMLElement).style.width = `${shieldPct}%`;
    (root.querySelector('#hud-exp-fill') as HTMLElement).style.width = `${expPct}%`;
    root.querySelector('#hud-hp-text')!.textContent = `HP ${fmtNum(s.heroHp)} / ${fmtNum(s.heroMaxHp)}${
      s.heroShield > 0 ? ` (+${fmtNum(s.heroShield)})` : ''
    }`;

    // Wave pips
    const pipsEl = root.querySelector('#hud-wave-pips')!;
    let pipsHtml = '';
    for (let w = 1; w <= 5; w++) {
      const cls = w < s.wave ? 'done' : w === s.wave ? 'current' : '';
      const bossCls = w === 5 ? 'boss' : '';
      pipsHtml += `<span class="wave-pip ${cls} ${bossCls}">${w === 5 ? '☠' : ''}</span>`;
    }
    pipsEl.innerHTML = pipsHtml;

    // Counter button state
    const counterBtn = root.querySelector<HTMLButtonElement>('#btn-counter')!;
    const counterSub = root.querySelector('#counter-sub')!;
    const enemyWinding = s.enemies.some((e) => e.windup > 0.12);
    counterBtn.classList.toggle('telegraph', enemyWinding && s.counterCooldown <= 0);
    counterBtn.disabled = s.counterCooldown > 0;
    counterSub.textContent =
      s.counterCooldown > 0 ? `${s.counterCooldown.toFixed(1)}s` : enemyWinding ? '지금 반격!' : 'READY';

    // Fever button state
    const feverBtn = root.querySelector<HTMLButtonElement>('#btn-fever')!;
    const feverSub = root.querySelector('#fever-sub')!;
    const feverReady = s.feverGauge >= 100 && s.feverActiveTimer <= 0;
    feverBtn.classList.toggle('ready', feverReady);
    feverBtn.classList.toggle('active', s.feverActiveTimer > 0);
    feverBtn.disabled = !feverReady;
    feverSub.textContent =
      s.feverActiveTimer > 0 ? `폭주 ${s.feverActiveTimer.toFixed(1)}s` : `${Math.floor(s.feverGauge)}%`;

    // Pending awakening pill
    const awakeBtn = root.querySelector('#btn-open-awakening')!;
    awakeBtn.classList.toggle('hidden', s.pendingAwakenings <= 0 || Boolean(s.activeCardChoices));
    root.querySelector('#awake-count')!.textContent = String(s.pendingAwakenings);

    // Skills cooldowns
    for (const sk of SKILLS) {
      const btn = skillBar.querySelector<HTMLButtonElement>(`[data-skill="${sk.id}"]`)!;
      const cdEl = root.querySelector(`#cd-${sk.id}`)!;
      const locked = s.stage < sk.unlockStage;
      const cd = s.skillCooldowns[sk.id];
      btn.classList.toggle('locked', locked);
      btn.classList.toggle('cooling', cd > 0);
      btn.disabled = locked || cd > 0;
      cdEl.textContent = locked ? `STG ${sk.unlockStage}` : cd > 0 ? `${cd.toFixed(1)}s` : '';
    }
  }

  updateQuickButtons();
  renderActiveTab();
  updateHud();

  let rafId = 0;
  let lastFrame = performance.now();

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    engine.step(dt);

    // Drain sound events
    const events = engine.drainEvents();
    for (const ev of events) {
      sfx.play(ev.type);
    }

    renderArena(ctx, engine.state, now / 1000);

    // Throttle DOM HUD & tab refresh to ~8Hz for smooth performance
    if (now - lastUiUpdate >= 120) {
      lastUiUpdate = now;
      updateHud();
      renderModalIfNeeded();
      if (activeTab === 'upgrade' || activeTab === 'sanctuary') {
        // Lightweight affordability update without losing scroll position
        refreshAffordability();
      }
    }

    // Auto-save every 8 seconds
    if (now - lastSaveTime >= 8000) {
      lastSaveTime = now;
      writeSaveData(engine.toSaveData());
    }

    rafId = requestAnimationFrame(loop);
  };

  function refreshAffordability(): void {
    const s = engine.state;
    if (activeTab === 'upgrade') {
      panelBody.querySelectorAll<HTMLButtonElement>('[data-action="buy-upgrade"]').forEach((btn) => {
        const key = btn.dataset.key as UpgradeKey;
        const batch = engine.getUpgradeBatchInfo(key, s.buyMode);
        btn.disabled = !batch.canAfford;
        btn.classList.toggle('can-buy', batch.canAfford);
        const costEl = btn.querySelector('.buy-cost');
        const qtyEl = btn.querySelector('.buy-qty');
        if (costEl) costEl.textContent = `🪙 ${fmtNum(batch.totalCost)}`;
        if (qtyEl) qtyEl.textContent = `+${batch.count}`;
      });
    } else if (activeTab === 'sanctuary') {
      panelBody.querySelectorAll<HTMLButtonElement>('[data-action="buy-relic"]').forEach((btn) => {
        const key = btn.dataset.key as RelicKey;
        const def = RELICS.find((r) => r.key === key)!;
        const lv = s.relics[key];
        const isMax = lv >= def.maxLevel;
        const cost = getRelicCost(def, lv);
        const canBuy = !isMax && s.soul >= cost;
        btn.disabled = !canBuy;
        btn.classList.toggle('can-buy', canBuy);
      });
    }
  }

  const handleBeforeUnload = () => {
    writeSaveData(engine.toSaveData());
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    writeSaveData(engine.toSaveData());
  };
}
