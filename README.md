# ⚔️ 방치 나이트 (Bangchi Knight)

> **다크 판타지 픽셀 아트 방치형 로그라이트 액션 RPG**  
> 설치 없이 브라우저에서 바로 즐기는 자동사냥 · 일섬 반격 · 3장 카드 각성 · 흑월 폭주 · 성소 환생

[![Live Demo](https://img.shields.io/badge/▶_Live_Landing_&_Play-GitHub_Pages-f5b942?style=for-the-badge)](https://jeiel85.github.io/bangchi-knight/)
[![Play Direct](https://img.shields.io/badge/⚔️_웹에서_바로_플레이-Browser_RPG-38bdf8?style=for-the-badge)](https://jeiel85.github.io/bangchi-knight/#play)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=flat-square)](./LICENSE)

---

## 🎮 게임 소개

**방치 나이트 (Bangchi Knight)** 는 **웹 퍼스트(Web-First)** 로 제작 중인 도트 감성의 다크 판타지 방치형 로그라이트 RPG입니다.  
켜두기만 해도 멈추지 않는 쾌속 자동사냥 위에, 적의 공격 예고 순간 터지는 **일섬 반격(Parry Flash)** 과 **3장 카드 각성(Roguelite Build)** 의 손맛을 결합했습니다.

웹 브라우저와 모바일 웹(PWA)에서 먼저 빠르게 검증하고 재미를 끌어올린 뒤, **Capacitor 모바일 앱 래핑(Android/iOS)** 및 네이티브 확장까지 고려해 엔진과 UI를 깔끔하게 분리해 설계했습니다.

- 🌐 **랜딩 페이지**: https://jeiel85.github.io/bangchi-knight/
- ⚔️ **웹 플레이 바로가기**: https://jeiel85.github.io/bangchi-knight/#play

---

## ✨ 현재 구현된 핵심 기능 (Phase 1)

- **⚔️ 픽셀 아트 자동사냥 & 5개 다크 판타지 던전**
  - 외부 이미지 에셋 없이 코드로 렌더링되는 360×270 도트 Canvas 전투 화면
  - 5개 구역 순환(`어둠의 지하묘지`, `피의 회랑`, `서리 망루`, `심연의 제단`, `흑월의 왕좌`)과 4단계 기사 진화 외형
  - 4웨이브 일반 전투 + 5웨이브 보스전 루프
- **⚡ 일섬 반격 (Parry Flash)**
  - 몬스터와 보스의 공격 예고(`!`) 타이밍에 맞춰 반격을 발동하면 화면을 가르는 황금빛 일격, 기절(STUN), 보너스 골드 및 폭주 게이지 획득
- **🃏 3장 카드 로그라이트 각성**
  - 보스 처치 및 레벨업 마일스톤마다 12종의 각성 카드(`일반` / `희귀` / `영웅` / `전설`) 중 1장을 선택해 빌드 조합 (흡혈, 연쇄 번개, 처형자, 보스 학살자, 흑월 가속 등)
- **🌑 흑월 폭주 (Eclipse Fever) & 액티브 스킬 4종**
  - `월광참`, `일섬 돌진`, `흑월 방패`, `심연 폭풍` 4종 스킬 + 자동 시전/2배속 토글
  - 흑월 게이지 100% 달성 시 8초간 공격력·공속 대폭 증가
- **🏛️ 6종 골드 강화 + 성소 환생(Rebirth)**
  - `x1` / `x10` / `MAX` 일괄 강화 지원 (`공격력`, `공격속도`, `치명타`, `최대 체력`, `체력 재생`, `골드 획득`)
  - STAGE 3 이상 도달 시 환생하여 **영혼(Soul)** 획득 → 영구 유물 강화
- **🔊 프로시저럴 Web Audio SFX & 자동 로컬 저장**
  - 외부 사운드 파일 없이 Web Audio API로 합성한 레트로 효과음
  - `localStorage` 자동 저장 (8초 주기 및 페이지 이탈 시 저장)

---

## 🏗️ 아키텍처 & 웹 → 네이티브 확장 전략

자세한 설계 문서는 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 를 참고하세요.

```text
bangchi-knight/
├── .github/workflows/deploy.yml   # GitHub Pages 자동 빌드/배포
├── docs/ARCHITECTURE.md           # 웹 → Capacitor / 네이티브 확장 아키텍처
├── public/
│   ├── favicon.svg
│   └── manifest.webmanifest       # 모바일 PWA 설치 지원
└── src/
    ├── engine/                    # 순수 TypeScript 헤드리스 게임 엔진 (DOM 의존성 0)
    │   ├── types.ts
    │   ├── data.ts                # 바이옴·강화·유물·스킬·12종 각성 카드 데이터
    │   ├── gameEngine.ts          # 전투·반격·폭주·웨이브·환생 시뮬레이션
    │   └── storage.ts             # StorageAdapter (추후 Capacitor/Cloud 교체 가능)
    ├── renderer/                  # 픽셀 아트 2D Canvas 렌더러 & 스프라이트 매트릭스
    ├── audio/                     # Web Audio API 8-bit 프로시저럴 SFX
    └── ui/
        ├── landing.ts             # 라이브 전투 프리뷰 포함 공식 랜딩 페이지
        └── gameShell.ts           # 세로형 모바일 쉘 플레이 화면
```

### 🗺️ 로드맵

- [x] **Phase 1 — 웹 프로토타입 & 랜딩 페이지**: 헤드리스 전투 엔진, 픽셀 Canvas, 일섬 반격, 3장 카드 각성, 성소 환생, 랜딩 페이지, GitHub Pages 배포
- [ ] **Phase 2 — 콘텐츠 & 비주얼 고도화**: 장비 파밍/강화, 오프라인 방치 보상, 전용 스프라이트 시트 & BGM, 스킬 도감 및 업적
- [ ] **Phase 3 — 실시간 랭킹 & 클라우드**: 최고 층 실시간 리더보드, 간편 로그인, 클라우드 세이브 동기화
- [ ] **Phase 4 — 모바일 앱 출시 (Capacitor / Native)**: Capacitor로 Android/iOS 앱 래핑(햅틱·푸시·스토어 빌드) 및 필요 시 엔진 코어 기반 네이티브 포팅

---

## 🚀 로컬 실행 방법

Node.js 20+ 환경에서 바로 실행할 수 있습니다.

```bash
# 1. 저장소 클론
git clone https://github.com/jeiel85/bangchi-knight.git
cd bangchi-knight

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행 (랜딩 페이지: http://localhost:5173 / 게임: http://localhost:5173/#play)
npm run dev

# 4. 타입 체크 & 프로덕션 빌드
npm run build
```

---

## 📄 라이선스

[MIT License](./LICENSE) © 2026 jeiel85
