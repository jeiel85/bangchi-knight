import { BIOMES, KNIGHT_TIERS } from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, BangchiEngine } from '../engine/gameEngine';
import { renderArena } from '../renderer/canvasRenderer';

const REPO_URL = 'https://github.com/jeiel85/bangchi-knight';

export function mountLanding(root: HTMLElement, onPlay: () => void): () => void {
  root.innerHTML = `
    <div class="landing-page">
      <header class="landing-nav">
        <div class="nav-inner">
          <div class="brand">
            <span class="brand-moon" aria-hidden="true"></span>
            <div>
              <div class="brand-title">방치 나이트</div>
              <div class="brand-sub">BANGCHI KNIGHT</div>
            </div>
          </div>
          <nav class="nav-links">
            <a href="#features">핵심 재미</a>
            <a href="#world">던전 &amp; 진화</a>
            <a href="#roadmap">웹 → 네이티브 로드맵</a>
            <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <button class="btn btn-gold btn-sm" id="nav-play-btn">⚔️ 바로 플레이</button>
        </div>
      </header>

      <main>
        <section class="hero-section">
          <div class="hero-bg-glow" aria-hidden="true"></div>
          <div class="hero-inner">
            <div class="hero-copy">
              <div class="eyebrow">DARK FANTASY PIXEL ROGUELITE · WEB-FIRST</div>
              <h1 class="hero-title">
                어둠의 던전을 베어 넘기는<br />
                <span class="text-gold">방치 나이트</span>
              </h1>
              <p class="hero-desc">
                설치 없이 브라우저에서 바로 즐기는 도트 방치형 로그라이트 액션 RPG.
                자동사냥의 쾌적함 위에 <strong>타이밍 일섬 반격</strong>,
                <strong>3장 카드 각성</strong>, <strong>흑월 폭주</strong>의 손맛을 더했습니다.
              </p>
              <div class="pill-row">
                <span class="pill">⚔️ 자동사냥</span>
                <span class="pill">⚡ 일섬 반격</span>
                <span class="pill">🃏 3장 카드 각성</span>
                <span class="pill">🌑 흑월 폭주</span>
                <span class="pill">📱 모바일 웹 / PWA</span>
              </div>
              <div class="hero-actions">
                <button class="btn btn-gold btn-lg" id="hero-play-btn">
                  ⚔️ 지금 웹에서 바로 플레이
                </button>
                <a class="btn btn-ghost btn-lg" href="${REPO_URL}" target="_blank" rel="noreferrer">
                  GitHub 소스 보기 ↗
                </a>
              </div>
              <div class="hero-meta">
                <span>무설치 즉시 실행</span>
                <span>·</span>
                <span>로컬 자동 저장</span>
                <span>·</span>
                <span>향후 Capacitor / 네이티브 확장 설계</span>
              </div>
            </div>

            <div class="hero-preview-wrap">
              <div class="preview-phone">
                <div class="preview-phone-bar">
                  <span class="dot red"></span>
                  <span class="dot gold"></span>
                  <span class="dot green"></span>
                  <span class="preview-label">LIVE ENGINE PREVIEW</span>
                </div>
                <div class="preview-canvas-box">
                  <canvas id="landing-preview-canvas" width="${ARENA_WIDTH}" height="${ARENA_HEIGHT}"></canvas>
                  <div class="preview-badge">STG 1 · 어둠의 지하묘지</div>
                </div>
                <div class="preview-controls">
                  <button class="btn btn-cyan btn-sm" id="preview-counter-btn">⚡ 일섬 반격 체험</button>
                  <button class="btn btn-gold btn-sm" id="preview-launch-btn">전체 게임 열기 ▸</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="features">
          <div class="section-inner">
            <div class="section-head">
              <span class="section-kicker">CORE GAMEPLAY LOOP</span>
              <h2>방치의 편안함과 액션의 쾌감을 하나로</h2>
              <p>지켜만 봐도 강해지고, 한 번의 반격과 카드 선택으로 전투의 판도를 뒤집습니다.</p>
            </div>
            <div class="card-grid four">
              <article class="feature-card">
                <div class="feature-icon">⚔️</div>
                <h3>쾌속 자동사냥 &amp; 6종 성장</h3>
                <p>공격력, 공속, 치명타, 체력, 재생, 골드 획득을 x1·x10·MAX로 시원하게 강화하며 무한 스테이지를 돌파합니다.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>일섬 반격 (Parry Flash)</h3>
                <p>적의 공격 예고(!) 순간에 일섬 반격을 발동하면 화면을 가르는 황금빛 일격과 기절, 보너스 골드를 획득합니다.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">🃏</div>
                <h3>3장 카드 로그라이트 각성</h3>
                <p>보스 격파와 레벨업마다 등장하는 12종 각성 카드 중 선택해 흡혈, 연쇄 번개, 보스 학살 빌드를 완성합니다.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">🌑</div>
                <h3>흑월 폭주 &amp; 성소 환생</h3>
                <p>흑월 게이지 100% 폭주로 화력을 폭발시키고, 3스테이지 이후 환생해 영혼 유물로 영구 성장을 누적합니다.</p>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-alt" id="world">
          <div class="section-inner">
            <div class="section-head">
              <span class="section-kicker">DUNGEON &amp; EVOLUTION</span>
              <h2>5개 다크 판타지 구역과 기사 진화</h2>
              <p>스테이지를 돌파할수록 던전의 분위기와 보스, 그리고 기사의 외형이 진화합니다.</p>
            </div>

            <div class="biome-grid">
              ${BIOMES.map(
                (b, i) => `
                <div class="biome-card" style="--biome-accent: ${b.moonTint}; --biome-bg: ${b.skyBottom};">
                  <div class="biome-stage">ZONE 0${i + 1}</div>
                  <h3>${b.name}</h3>
                  <div class="biome-sub">${b.subtitle}</div>
                  <div class="biome-boss">👑 BOSS: ${b.bossName}</div>
                </div>
              `
              ).join('')}
            </div>

            <div class="tier-strip">
              ${KNIGHT_TIERS.map(
                (t, i) => `
                <div class="tier-item">
                  <span class="tier-swatch" style="background: ${t.capeColor}; box-shadow: 0 0 12px ${t.auraColor};"></span>
                  <div>
                    <div class="tier-step">TIER ${i + 1} · STG ${t.minStage}+</div>
                    <div class="tier-name">${t.name}</div>
                  </div>
                </div>
              `
              ).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="roadmap">
          <div class="section-inner">
            <div class="section-head">
              <span class="section-kicker">WEB-FIRST TO NATIVE ARCHITECTURE</span>
              <h2>웹에서 빠르게 검증하고, 네이티브 앱으로 확장합니다</h2>
              <p>
                전투 시뮬레이션 엔진(<code>src/engine</code>)을 DOM과 완전히 분리해 설계했습니다.
                브라우저에서 즉시 테스트·개선한 뒤 <strong>Capacitor 모바일 래핑</strong> 또는 네이티브 포팅으로 자연스럽게 이어갑니다.
              </p>
            </div>

            <div class="roadmap-grid">
              <div class="roadmap-card active">
                <div class="roadmap-badge">PHASE 1 · NOW</div>
                <h3>웹 프로토타입 &amp; 랜딩 페이지</h3>
                <ul>
                  <li>순수 TypeScript 헤드리스 전투 엔진</li>
                  <li>HTML5 Canvas 픽셀 아트 렌더러 &amp; Web Audio SFX</li>
                  <li>자동사냥 · 일섬 반격 · 3장 각성 · 성소 환생 · 로컬 저장</li>
                  <li>GitHub Pages 자동 배포 &amp; PWA 매니페스트</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 2 · NEXT</div>
                <h3>콘텐츠 확장 &amp; 도트 리소스 고도화</h3>
                <ul>
                  <li>장비 드랍/강화 · 스킬 도감 · 오프라인 방치 보상</li>
                  <li>보스 고유 패턴 &amp; 전용 스프라이트 시트 확장</li>
                  <li>기사 진화 연출(Burst Effect) &amp; BGM 추가</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 3 · LIVE</div>
                <h3>실시간 랭킹 &amp; 클라우드 세이브</h3>
                <ul>
                  <li>최고 층 실시간 리더보드 &amp; 시즌 챌린지</li>
                  <li>간편 소셜 로그인 + 크로스 디바이스 세이브 동기화</li>
                  <li>안티 치트 검증 서버 연동</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 4 · NATIVE</div>
                <h3>모바일 앱 출시 (Android / iOS)</h3>
                <ul>
                  <li>1차: Capacitor 래핑으로 Android/iOS 스토어 빌드 (햅틱·푸시·로컬 저장 어댑터)</li>
                  <li>2차: 성능·플랫폼 요구에 따라 엔진 로직 기반 네이티브 포팅</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section class="cta-section">
          <div class="cta-inner">
            <h2>지금 바로 첫 번째 던전에 도전해보세요</h2>
            <p>별도 설치나 로그인 없이 브라우저에서 즉시 플레이할 수 있습니다.</p>
            <div class="hero-actions center">
              <button class="btn btn-gold btn-lg" id="footer-play-btn">⚔️ 방치 나이트 플레이하기</button>
              <a class="btn btn-ghost btn-lg" href="${REPO_URL}" target="_blank" rel="noreferrer">★ GitHub Star 남기기</a>
            </div>
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <div class="footer-inner">
          <div>
            <strong>방치 나이트 (Bangchi Knight)</strong> · Open-source Web-First Idle Roguelite RPG
          </div>
          <div class="footer-links">
            <a href="#play">웹 플레이</a>
            <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
            <a href="${REPO_URL}/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">아키텍처 문서</a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Wire play triggers
  const triggerPlay = () => onPlay();
  root.querySelector('#nav-play-btn')?.addEventListener('click', triggerPlay);
  root.querySelector('#hero-play-btn')?.addEventListener('click', triggerPlay);
  root.querySelector('#preview-launch-btn')?.addEventListener('click', triggerPlay);
  root.querySelector('#footer-play-btn')?.addEventListener('click', triggerPlay);

  // Live animated preview canvas using the real BangchiEngine in demoMode
  const canvas = root.querySelector<HTMLCanvasElement>('#landing-preview-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  const previewEngine = new BangchiEngine(null, { demoMode: true });
  previewEngine.state.upgrades.atk = 3;
  previewEngine.state.upgrades.atkSpeed = 3;
  previewEngine.state.upgrades.crit = 4;

  root.querySelector('#preview-counter-btn')?.addEventListener('click', () => {
    previewEngine.state.counterCooldown = 0;
    previewEngine.triggerManualCounter();
  });

  let rafId = 0;
  let lastTime = performance.now();

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    previewEngine.step(dt);
    if (previewEngine.state.stage > 2) {
      previewEngine.state.stage = 1;
      previewEngine.state.wave = 1;
    }

    if (ctx) {
      renderArena(ctx, previewEngine.state, now / 1000);
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
  };
}
