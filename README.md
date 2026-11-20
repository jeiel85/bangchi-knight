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

## ✨ 핵심 시스템 (v0.5)

- **🔥 3종 전술 진형 전환 & 보스전 철벽 퍼펙트 가드**
  - **돌격 진형** · **철벽 진형** · **약탈 진형** 원터치 전환 + 보스 강타 예고 타이밍 철벽 전환 시 **퍼펙트 가드**(보스 기절·보호막·사기 충전)
  - 보스 패배 시 안전한 **반복 파밍 모드** 자동 전환 + **`⚔️ 보스 도전`** 재도전
- **⚔️ 기사단 액티브 스킬 3종 & 자동 시전**
  - `회전 참격`(광역 베기), `왕국의 심판`(단일 극딜+기절), `기사단의 맹세`(회복+치명·공속 폭증) 3종 스킬 강화 및 자동 시전 토글
- **⛏️ 특수 던전 2종 (`왕실 광산 토벌` · `보스 러시 투기장`)**
  - 3분마다 자동 충전(오프라인 포함)되는 열쇠로 입장하는 25~35초 제한시간 던전, 단계(Lv) 클리어 시 다음 티어 해금 및 대량 광석·골드·훈장 획득
- **🔨 실시간 대장간 단조 · 스마트 자동 단조 · 골드 제련(+30) · 신화 특성**
  - `일반 → 고급 → 희귀 → 영웅 → 신화` 5등급 외형 진화 15종 장비 + **자동단조 필터(`상위`/`희귀+`/`영웅+`)** + 슬롯 제련 + 고유 특성 4종
- **👑 기사 계급 승급전 · 월드맵 빠른 이동 · 실시간 전투력(CP)**
  - 스테이지 도달에 따른 5단계 계급 승급 보상(영구 공격력 승수 + 훈장), 해금 구역으로 자유롭게 이동하는 **월드맵**, 실시간 **전투력(CP) 증감 피드백**
- **👥 원정대 동료 3인 · 📜 연속 퀘스트 · 📦 오프라인 전리품 · 📖 픽셀 도감**
  - 리아(궁수)·카인(마법사)·엘렌(성기사) 전장 참전, 스토리+무한 현상금 퀘스트 바, 최대 12시간 오프라인 정산, 몬스터·보스 12종 도감(+2.5% ATK/종), 8-bit BGM/SFX, Base64 세이브 백업
- **🗺️ 5개 국경 원정 구역 & 21종 오리지널 픽셀 아트 PNG 애셋**
  - `여명의 초원` → `황혼의 협곡` → `안개 늪지대` → `설원의 요새` → `용암 성채` 네이티브 도트 배경 + 전 영역 픽셀 스프라이트/아이콘/스킬/던전/모루/보물상자/엠블럼 (`scripts/pixel_art/` 재생성 가능)

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
