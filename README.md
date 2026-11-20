# 🛡️ 방치 나이트 (Bangchi Knight)

> **16-bit 픽셀 원정 방치형 RPG — 3종 전술 진형 · 실시간 대장간 단조 · 원정대 동료 합류 · 왕국 귀환**  
> 설치 없이 브라우저에서 바로 출정하고, 향후 모바일 네이티브 앱까지 확장하는 웹 퍼스트 프로젝트

[![Live Landing & Play](https://img.shields.io/badge/▶_랜딩_&_웹_플레이-GitHub_Pages-f59e0b?style=for-the-badge)](https://jeiel85.github.io/bangchi-knight/)
[![Play Direct](https://img.shields.io/badge/⚔️_게임_바로_출정-Browser_Play-3b82f6?style=for-the-badge)](https://jeiel85.github.io/bangchi-knight/#play)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](./LICENSE)

---

## 🎮 게임 소개

**방치 나이트 (Bangchi Knight)** 는 왕국 국경 원정대를 이끄는 **오리지널 16-bit 픽셀 방치형 원정 RPG**입니다.  
단순히 숫자만 올리는 방치형에서 벗어나, **전술 진형 전환**, **전투 중 캐낸 광석으로 즉시 두드리는 대장간 장비 단조**, 그리고 **전장에 직접 합류해 화살·화염구·치유를 퍼붓는 동료 용병단**의 재미를 한 화면에 담았습니다.

웹 브라우저와 모바일 웹(PWA)에서 먼저 빠르게 재미를 다듬고, 추후 **Capacitor 모바일 앱 래핑(Android/iOS)** 및 네이티브 확장까지 이어질 수 있도록 엔진과 렌더러를 분리해 설계했습니다.

- 🌐 **공식 랜딩 페이지**: https://jeiel85.github.io/bangchi-knight/
- ⚔️ **웹에서 바로 출정하기**: https://jeiel85.github.io/bangchi-knight/#play

---

## ✨ 핵심 시스템 (v0.3)

- **🔥 3종 전술 진형 전환 & 보스전 철벽 퍼펙트 가드**
  - **돌격 진형** (공격 +35%, 공속 +20%) · **철벽 진형** (피해 -40%, 보호막) · **약탈 진형** (골드·광석 +55%)
  - 보스 강타 예고(`⚠ 강타 예고!`) 타이밍에 **철벽 진형**으로 전환하면 **퍼펙트 가드** 발동 → 보스 기절(STUN), 보호막 생성, 사기 +24%!
  - 보스전에서 패배 시 무한 사망 대신 **반복 파밍 모드**로 자동 전환되어 안전하게 성장 후 **`⚔️ 보스 도전`** 가능
- **🔨 실시간 대장간 단조 · 자동 단조 · 장비 제련(+30) · 신화 특성**
  - 철광석(`⛏️`)으로 무기·방패·갑옷 즉시 단조 (`일반 → 고급 → 희귀 → 영웅 → 신화`)
  - **⚡ 자동 단조(Auto-Forge)**: 하위 장비는 자동 분해(골드·광석·숙련도 환원), 상위 장비나 영웅/신화 등장 시에만 비교 팝업으로 정지
  - 각 슬롯 **골드 제련(+1 ~ +30)** 및 영웅/신화 고유 패시브 특성(`연쇄 일격`, `흡혈 강철`, `광산 축복`, `거신 분쇄`)
- **👥 원정대 동료 합류 & `x1/x10` 기사단 훈련**
  - **🏹 숲의 궁수 리아** · **🔮 불꽃 마법사 카인** · **🎺 군악 성기사 엘렌** 전장 직접 참전
- **📜 연속 퀘스트 바 · 오프라인 방치 전리품 · 픽셀 몬스터/보스 도감**
  - 상단 1줄 연속 퀘스트로 성장 목표와 보상 지속 제공 (스토리 10종 + 무한 반복 현상금 퀘스트)
  - 최대 12시간 **오프라인 원정 전리품 정산 모달** 지원
  - 마주친 몬스터 7종 & 보스 5종 픽셀 도감 (발견 1종당 영구 공격력 +2.5%)
- **🎺 진격 나팔 · 🏰 왕국 귀환 · 🎵 8-bit BGM & 세이브 백업**
  - `1x / 2x / 3x` 배속, 콤보 카운터, 타격 넉백, 프로시저럴 8-bit 어드벤처 BGM/SFX 분리 토글, 인앱 커스텀 모달, Base64 세이브 코드 백업/복원
- **🗺️ 5개 국경 원정 구역 & 20종 오리지널 픽셀 아트 PNG 애셋**
  - `여명의 초원` → `황혼의 협곡` → `안개 늪지대` → `설원의 요새` → `용암 성채` 5종 네이티브 도트 배경
  - 기사·동료 3인·몬스터 7종·구역 보스 5종·등급별 장비 15종·전술/왕국 시설 7종·투사체/가드 충격파/드랍 코인·광석·모루 애니메이션·보물상자·원정대 문장 엠블럼까지 전 영역 PNG 적용 (`scripts/pixel_art/` 재생성 가능)

---

## 🏗️ 프로젝트 구조 & 웹 → 네이티브 전략

자세한 설계 문서는 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 를 참고하세요.

```text
bangchi-knight/
├── .github/workflows/deploy.yml   # GitHub Pages 자동 빌드/배포
├── docs/ARCHITECTURE.md           # 웹 → Capacitor / 네이티브 확장 아키텍처
├── public/
│   ├── favicon.svg                # 왕국 방패 문장 아이콘
│   └── manifest.webmanifest       # 모바일 PWA 설치 지원
└── src/
    ├── engine/                    # 순수 TypeScript 헤드리스 게임 엔진 (DOM 의존성 0)
    │   ├── types.ts
    │   ├── data.ts                # 5개 구역, 3종 진형, 단조 확률, 동료, 왕국 시설
    │   ├── gameEngine.ts          # 전투·진형·단조·동료 투사체·왕국 귀환 시뮬레이션
    │   └── storage.ts             # StorageAdapter (추후 Capacitor/Cloud 교체 가능)
    ├── renderer/                  # 16-bit 픽셀 2D Canvas 렌더러 & 스프라이트
    ├── audio/                     # Web Audio API 8-bit 프로시저럴 효과음
    └── ui/
        ├── landing.ts             # 라이브 원정 프리뷰 포함 공식 랜딩 페이지
        └── gameShell.ts           # 세로형 모바일 쉘 플레이 화면
```

### 🗺️ 로드맵

- [x] **Phase 1 — 웹 프로토타입 & 랜딩 페이지**: 헤드리스 엔진, 16-bit 도트 Canvas, 3종 전술 진형, 실시간 대장간 단조, 동료 3인, 왕국 귀환, GitHub Pages 배포
- [ ] **Phase 2 — 장비 깊이 & 오프라인 원정**: 신화 장비 고유 패시브, 제련 강화, 오프라인 방치 전리품 정산, 일일 토벌 의뢰
- [ ] **Phase 3 — 원정대 랭킹 & 클라우드**: 시즌별 최고 구역 리더보드, 클라우드 세이브 동기화
- [ ] **Phase 4 — Android / iOS 앱 출시**: Capacitor 래핑(햅틱·푸시·스토어 빌드) 및 필요 시 엔진 스펙 기반 네이티브 포팅

---

## 🚀 로컬 실행 방법

Node.js 20+ 환경에서 바로 실행할 수 있습니다.

```bash
# 1. 저장소 클론
git clone https://github.com/jeiel85/bangchi-knight.git
cd bangchi-knight

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행 (랜딩: http://localhost:5173 / 게임: http://localhost:5173/#play)
npm run dev

# 4. 타입 체크 & 프로덕션 빌드
npm run build
```

---

## 📄 라이선스

[MIT License](./LICENSE) © 2026 jeiel85
