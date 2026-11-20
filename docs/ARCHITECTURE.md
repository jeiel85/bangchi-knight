# Bangchi Knight — Architecture & Web-to-Native Strategy

**방치 나이트 (Bangchi Knight)** 는 **웹(Browser / PWA)으로 가장 먼저 빠르게 플레이·검증**하고, 이후 **모바일 앱(Capacitor 래핑 또는 네이티브 포팅)** 으로 매끄럽게 확장할 수 있도록 계층을 분리해 설계했습니다.

## 1. 계층 분리 구조

```text
src/
├── engine/        # 순수 TypeScript 헤드리스 게임 시뮬레이션 (DOM/Canvas 의존성 0)
│   ├── types.ts
│   ├── data.ts
│   ├── gameEngine.ts
│   └── storage.ts # StorageAdapter 추상화 (localStorage / Capacitor Preferences / Cloud)
├── renderer/      # 360x270 픽셀 아트 HTML5 Canvas 2D 렌더러
│   ├── sprites.ts
│   └── canvasRenderer.ts
├── audio/         # Web Audio API 기반 프로시저럴 8-bit 효과음
│   └── sfx.ts
└── ui/            # 프레젠테이션 레이어 (랜딩 페이지 + 세로 모바일 쉘)
    ├── landing.ts
    └── gameShell.ts
```

## 2. 왜 `src/engine` 을 DOM과 분리했는가?

1. **즉시 테스트 및 밸런싱**: 브라우저 없이도 Node/Vitest로 수천 웨이브 시뮬레이션 및 DPS/골드 인플레이션 테스트가 가능합니다.
2. **Capacitor 모바일 래핑 즉시 대응**:
   - `npm run build` 로 생성된 `dist/` 를 Capacitor (`@capacitor/android`, `@capacitor/ios`) 에 그대로 감싸 스토어용 앱 빌드로 전환할 수 있습니다.
   - `StorageAdapter` 만 `@capacitor/preferences` 또는 SQLite/클라우드 어댑터로 교체하면 기존 저장 로직을 그대로 유지합니다.
   - 일섬 반격(`counter`), 보스 등장(`bossWarning`) 이벤트를 구독해 모바일 햅틱(`@capacitor/haptics`)을 한 줄로 연결할 수 있습니다.
3. **향후 네이티브 포팅 용이성**:
   - 모든 수치 공식(`data.ts`)과 상태 전이(`gameEngine.ts`)가 고정 스텝(`step(dt)`)과 명시적 `GameState` 에 모여 있어 Kotlin/Swift/Godot/Unity 등으로 포팅할 때도 단일 스펙 역할을 합니다.

## 3. 단계별 로드맵

| Phase | 목표 | 핵심 작업 |
| --- | --- | --- |
| **Phase 1 (현재)** | 웹 프로토타입 & 랜딩 페이지 | 헤드리스 엔진, 픽셀 Canvas 렌더러, 6종 강화, 일섬 반격, 3장 각성, 성소 환생, GitHub Pages 배포 |
| **Phase 2** | 콘텐츠 깊이 확장 | 장비 드랍/강화, 오프라인 방치 보상, 전용 스프라이트 시트 & BGM, 도감/업적 |
| **Phase 3** | 실시간 랭킹 & 클라우드 | 최고 층 리더보드, 소셜 로그인, 클라우드 세이브, 시즌 던전 |
| **Phase 4** | 모바일 앱 출시 | PWA 설치 최적화 → Capacitor Android/iOS 래핑 (햅틱·푸시·스토어 심사) 또는 네이티브 포팅 |
