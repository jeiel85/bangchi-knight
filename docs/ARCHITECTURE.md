# Bangchi Knight — Architecture & Web-to-Native Strategy

**방치 나이트 (Bangchi Knight)** 는 **웹(Browser / PWA)에서 먼저 빠르게 플레이·검증**하고, 이후 **모바일 앱(Capacitor 래핑 또는 네이티브 포팅)** 으로 매끄럽게 확장할 수 있도록 계층을 분리해 설계했습니다.

## 1. 계층 분리 구조

```text
src/
├── engine/        # 순수 TypeScript 헤드리스 게임 시뮬레이션 (DOM/Canvas 의존성 0)
│   ├── types.ts   # 진형, 장비, 동료, 구역, 시설, 투사체, 세이브 타입
│   ├── data.ts    # 5개 원정 구역, 3종 전술 진형, 5등급 장비 단조 공식, 동료 3인, 왕국 시설 4종
│   ├── gameEngine.ts # 고정 스텝 전투, 대장간 단조, 동료 AI/투사체, 진격 나팔, 왕국 귀환
│   └── storage.ts # StorageAdapter 추상화 (localStorage / Capacitor Preferences / Cloud)
├── renderer/      # 360x250 16-bit 픽셀 아트 HTML5 Canvas 2D 렌더러
│   ├── sprites.ts
│   └── canvasRenderer.ts
├── audio/         # Web Audio API 기반 프로시저럴 8-bit 효과음 (모루 타격, 나팔, 화살, 화염구)
│   └── sfx.ts
└── ui/            # 프레젠테이션 레이어 (공식 랜딩 페이지 + 세로 모바일 쉘)
    ├── landing.ts
    └── gameShell.ts
```

## 2. 왜 `src/engine` 을 DOM과 분리했는가?

1. **즉시 테스트 및 밸런싱**: 브라우저 없이도 Node/Vitest로 수천 웨이브 시뮬레이션 및 장비 드랍률·골드/광석 인플레이션 밸런싱을 검증할 수 있습니다.
2. **Capacitor 모바일 래핑 즉시 대응**:
   - `npm run build` 로 생성된 `dist/` 를 Capacitor (`@capacitor/android`, `@capacitor/ios`) 에 감싸 스토어용 모바일 앱 빌드로 전환할 수 있습니다.
   - `StorageAdapter` 만 `@capacitor/preferences` 또는 SQLite/클라우드 어댑터로 교체하면 기존 저장 로직을 그대로 유지합니다.
   - `forgeRare`(희귀/신화 장비 단조), `rally`(진격 나팔), `bossWarning` 이벤트를 구독해 모바일 햅틱(`@capacitor/haptics`)을 한 줄로 연결할 수 있습니다.
3. **향후 네이티브 포팅 단일 스펙**:
   - 모든 수치 공식(`data.ts`)과 상태 전이(`gameEngine.ts`)가 고정 스텝(`step(dt)`)과 명시적 `GameState` 에 모여 있어 Kotlin/Swift/Godot/Unity 등으로 포팅할 때도 명확한 기준 문서가 됩니다.

## 3. 단계별 로드맵

| Phase | 목표 | 핵심 작업 |
| --- | --- | --- |
| **Phase 1 (현재)** | 웹 프로토타입 & 랜딩 페이지 | 헤드리스 엔진, 16-bit Canvas, 3종 전술 진형, 실시간 대장간 단조, 동료 3인, 왕국 귀환, GitHub Pages 배포 |
| **Phase 2** | 장비 깊이 & 오프라인 원정 | 신화 장비 고유 패시브, 제련 강화, 오프라인 방치 전리품 정산, 일일 토벌 의뢰 |
| **Phase 3** | 원정대 랭킹 & 클라우드 | 시즌별 최고 구역 리더보드, 클라우드 세이브 동기화, 원정 기록 공유 |
| **Phase 4** | Android / iOS 앱 출시 | PWA 최적화 → Capacitor 래핑(햅틱·푸시·스토어 빌드) 또는 `src/engine` 기반 네이티브 포팅 |
