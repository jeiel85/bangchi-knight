import { COMPANIONS, STANCES, ZONES } from '../engine/data';
import { ARENA_HEIGHT, ARENA_WIDTH, BangchiEngine } from '../engine/gameEngine';
import { renderArena } from '../renderer/canvasRenderer';

const REPO_URL = 'https://github.com/jeiel85/bangchi-knight';

export function mountLanding(root: HTMLElement, onPlay: () => void): () => void {
  root.innerHTML = `
    <div class="landing-page">
      <header class="landing-nav">
        <div class="nav-inner">
          <div class="brand">
            <img class="brand-portrait" src="./assets/ui/knight-portrait.png" alt="방치 나이트 초상화" width="38" height="38" />
            <div>
              <div class="brand-title">방치 나이트</div>
              <div class="brand-sub">BANGCHI KNIGHT · EXPEDITION</div>
            </div>
          </div>
          <nav class="nav-links">
            <a href="#features">핵심 시스템</a>
            <a href="#world">원정 구역 &amp; 동료</a>
            <a href="#roadmap">웹 → 네이티브 로드맵</a>
            <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <button class="btn btn-amber btn-sm" id="nav-play-btn">⚔️ 바로 플레이</button>
        </div>
      </header>

      <main>
        <section class="hero-section">
          <div class="hero-inner">
            <div class="hero-copy">
              <div class="eyebrow">16-BIT PIXEL EXPEDITION IDLE RPG · WEB-FIRST</div>
              <h1 class="hero-title">
                대장간을 두드리고,<br />
                원정대를 이끌어라 — <span class="text-amber">방치 나이트</span>
              </h1>
              <p class="hero-desc">
                설치 없이 브라우저에서 즉시 출정하는 정통 도트 방치형 원정 RPG.
                <strong>돌격·철벽·약탈 3종 전술 진형</strong>을 전환하고,
                전투에서 캐낸 광석으로 <strong>실시간 대장간 단조</strong>를 돌리며
                궁수·마법사·성기사 동료와 함께 왕국 국경을 돌파하세요.
              </p>
              <div class="pill-row">
                <span class="pill">🔥 3종 전술 진형</span>
                <span class="pill">🔨 실시간 대장간 단조</span>
                <span class="pill">👥 원정대 동료 합류</span>
                <span class="pill">🎺 진격 나팔 총공세</span>
                <span class="pill">🎨 풀 픽셀 아트 스프라이트</span>
              </div>
              <div class="hero-actions">
                <button class="btn btn-amber btn-lg" id="hero-play-btn">
                  ⚔️ 지금 웹에서 출정하기
                </button>
                <a class="btn btn-ghost btn-lg" href="${REPO_URL}" target="_blank" rel="noreferrer">
                  GitHub 저장소 ↗
                </a>
              </div>
              <div class="hero-meta">
                <span>무설치 · 무로그인 즉시 체험</span>
                <span>·</span>
                <span>로컬 자동 저장</span>
                <span>·</span>
                <span>Capacitor / 네이티브 확장 아키텍처</span>
              </div>
            </div>

            <div class="hero-preview-wrap">
              <div class="preview-phone">
                <div class="preview-phone-bar">
                  <span class="dot red"></span>
                  <span class="dot amber"></span>
                  <span class="dot green"></span>
                  <span class="preview-label">LIVE PIXEL EXPEDITION</span>
                </div>
                <div class="preview-canvas-box">
                  <canvas id="landing-preview-canvas" width="${ARENA_WIDTH}" height="${ARENA_HEIGHT}"></canvas>
                  <div class="preview-badge" id="preview-stance-badge">🔥 돌격 진형 · 여명의 초원</div>
                </div>
                <div class="preview-controls">
                  <button class="btn btn-cobalt btn-sm" id="preview-stance-btn">🛡️ 진형 전환 체험</button>
                  <button class="btn btn-amber btn-sm" id="preview-launch-btn">전체 게임 열기 ▸</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="features">
          <div class="section-inner">
            <div class="section-head">
              <span class="section-kicker">ORIGINAL GAMEPLAY LOOP</span>
              <h2>방치로 모으고, 대장간과 전술로 돌파한다</h2>
              <p>단순 숫자 클릭을 넘어 장비 파밍, 진형 판단, 원정대 편성의 재미를 정통 도트 그래픽에 담았습니다.</p>
            </div>
            <div class="card-grid four">
              <article class="feature-card">
                <div class="feature-icon">🔥</div>
                <h3>3종 전술 진형 전환</h3>
                <p>돌격(폭딜), 철벽(방어막 &amp; 피해감소), 약탈(골드·광석 +55%) 진형을 상황에 맞게 원터치로 전환합니다.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">🔨</div>
                <h3>실시간 대장간 단조</h3>
                <p>전투에서 얻은 광석으로 검·방패·갑옷을 즉시 단조합니다. 일반부터 신화까지 비교 후 장착하거나 분해해 숙련도를 올리세요.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">👥</div>
                <h3>원정대 동료 합류</h3>
                <p>혼자 싸우지 않습니다. 궁수의 관통 화살, 마법사의 광역 화염구, 성기사의 치유가 전장에 직접 펼쳐집니다.</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">🏰</div>
                <h3>진격 나팔 &amp; 왕국 귀환</h3>
                <p>사기 100% 진격 나팔로 전군 일제 공세를 펼치고, 원정 귀환 훈장으로 왕국 영구 시설을 건설하세요.</p>
              </article>
            </div>
          </div>
        </section>

        <section class="section section-alt" id="world">
          <div class="section-inner">
            <div class="section-head">
              <span class="section-kicker">FRONTIER ZONES &amp; SQUAD</span>
              <h2>5개 국경 원정 구역과 동행 용병단</h2>
              <p>직접 제작한 16-bit 도트 배경과 5종의 구역 보스, 그리고 원정대 동료들이 전장을 채웁니다.</p>
            </div>

            <div class="biome-grid">
              ${ZONES.map(
                (z, i) => `
                <div class="biome-card has-thumb" style="--zone-accent: ${z.accent};">
                  <div class="zone-thumb-wrap">
                    <img class="zone-thumb" src="./assets/bg/${z.id}.png" alt="${z.name}" loading="lazy" />
                    <span class="biome-stage-pill">REGION 0${i + 1}</span>
                  </div>
                  <div class="biome-body">
                    <h3>${z.name}</h3>
                    <div class="biome-sub">${z.subtitle}</div>
                    <div class="biome-boss">👑 ${z.bossName}</div>
                  </div>
                </div>
              `
              ).join('')}
            </div>

            <div class="squad-showcase">
              ${COMPANIONS.map(
                (c) => `
                <div class="squad-card">
                  <span class="squad-sprite-box" style="border-color:${c.color}">
                    <span class="companion-sprite-thumb lg" style="background-image:url('./assets/sprites/${c.id}.png');"></span>
                  </span>
                  <div>
                    <div class="squad-role" style="color:${c.color}">${c.role}</div>
                    <h4>${c.name}</h4>
                    <p>${c.desc}</p>
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
              <h2>웹에서 빠르게 재미를 검증하고, 네이티브 앱으로 확장</h2>
              <p>
                전투·단조·진형 시뮬레이션(<code>src/engine</code>)을 DOM/Canvas와 완전히 분리했습니다.
                웹에서 즉시 플레이하며 밸런스를 다듬은 뒤, <strong>Capacitor 모바일 래핑</strong> 및 네이티브 포팅으로 이어집니다.
              </p>
            </div>

            <div class="roadmap-grid">
              <div class="roadmap-card active">
                <div class="roadmap-badge">PHASE 1 · NOW</div>
                <h3>웹 플레이어블 &amp; 픽셀 애셋</h3>
                <ul>
                  <li>순수 TypeScript 헤드리스 게임 엔진</li>
                  <li>14종 16-bit 픽셀 스프라이트·배경·VFX·아이콘 PNG</li>
                  <li>전술 진형 · 대장간 단조 · 동료 3종 · 왕국 귀환</li>
                  <li>GitHub Pages 자동 배포 &amp; PWA 지원</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 2 · NEXT</div>
                <h3>장비 세트 &amp; 오프라인 원정</h3>
                <ul>
                  <li>신화 장비 고유 패시브 &amp; 제련 강화</li>
                  <li>오프라인 방치 전리품 정산 &amp; 일일 토벌 의뢰</li>
                  <li>보스 고유 패턴 &amp; BGM 사운드트랙 추가</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 3 · ONLINE</div>
                <h3>원정대 랭킹 &amp; 클라우드 동기화</h3>
                <ul>
                  <li>시즌별 최고 구역 랭킹 &amp; 길드 원정 통계</li>
                  <li>계정 연동 클라우드 세이브</li>
                  <li>원정 기록 공유 카드 생성</li>
                </ul>
              </div>
              <div class="roadmap-card">
                <div class="roadmap-badge">PHASE 4 · NATIVE</div>
                <h3>Android / iOS 앱 패키징</h3>
                <ul>
                  <li>Capacitor 래핑으로 스토어 앱 빌드(햅틱·푸시·로컬 어댑터)</li>
                  <li>장기 확장 시 <code>src/engine</code> 스펙 기반 네이티브 포팅</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section class="cta-section">
          <div class="cta-inner">
            <h2>지금 바로 원정 기사단을 이끌어보세요</h2>
            <p>브라우저에서 바로 첫 장비를 단조하고 국경 돌파를 시작할 수 있습니다.</p>
            <div class="hero-actions center">
              <button class="btn btn-amber btn-lg" id="footer-play-btn">⚔️ 방치 나이트 출정하기</button>
              <a class="btn btn-ghost btn-lg" href="${REPO_URL}" target="_blank" rel="noreferrer">★ GitHub 보기</a>
            </div>
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <div class="footer-inner">
          <div><strong>방치 나이트 (Bangchi Knight)</strong> · Open-Source Web-First Pixel Expedition RPG</div>
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

  root.querySelector('#nav-play-btn')?.addEventListener('click', onPlay);
  root.querySelector('#hero-play-btn')?.addEventListener('click', onPlay);
  root.querySelector('#preview-launch-btn')?.addEventListener('click', onPlay);
  root.querySelector('#footer-play-btn')?.addEventListener('click', onPlay);

  const canvas = root.querySelector<HTMLCanvasElement>('#landing-preview-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  const badge = root.querySelector<HTMLElement>('#preview-stance-badge');

  const previewEngine = new BangchiEngine(null, { demoMode: true });
  previewEngine.state.training.swordplay = 4;
  previewEngine.state.companions = { ranger: 2, pyro: 1, banneret: 1 };

  let stanceIdx = 0;
  root.querySelector('#preview-stance-btn')?.addEventListener('click', () => {
    stanceIdx = (stanceIdx + 1) % STANCES.length;
    const next = STANCES[stanceIdx];
    previewEngine.setStance(next.id);
    if (badge) badge.textContent = `${next.icon} ${next.name} 진형 · 여명의 초원`;
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
  return () => cancelAnimationFrame(rafId);
}
