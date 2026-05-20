# InvestInfo - Product Requirements Document

> **우선순위**: 대시보드 웹사이트 (반응형) > 데이터 파이프라인 > AI 분석 > 알림 봇  
> **알림 봇(Slack/카톡)은 후순위** — 대시보드가 완성된 이후 진행

## 1. 제품 개요

**InvestInfo**는 투자 의사결정에 필요한 정보를 **매크로(Macro) × 산업(Industry) × 종목(Stock-specific)** 3축으로 분류·수집하여, 시간대별 원페이저 리포트로 제공하는 **반응형 투자 정보 대시보드**이다.

### 핵심 가치
- 흩어진 투자 정보를 3축 프레임워크로 구조화
- 긍정/부정 요인을 한눈에 파악
- AI 기반 종합 의견 생성
- **데스크톱/태블릿/모바일** 어디서든 동일한 경험
- Google 로그인으로 개인화된 관심 종목 관리

---

## 2. 사용자 및 사용 시나리오

| 페르소나 | 시나리오 |
|---------|---------|
| 개인 투자자 (본인) | 출근길 폰으로 일일 브리핑 확인 → 데스크톱에서 상세 분석 → 장중 폰으로 시간별 업데이트 체크 |

---

## 3. 3축 투자 정보 프레임워크

```
주가 = f(Macro, Industry, Stock-specific)
```

### 3.1 Macro (거시경제)
- 금리 (Fed 금리, 한은 기준금리)
- 환율 (USD/KRW, DXY)
- 주요 지수 (S&P500, KOSPI, KOSDAQ, VIX)
- 경제 지표 (CPI, PMI, 고용지표)
- 중앙은행/정부 정책 뉴스
- 지정학 리스크

### 3.2 Industry (산업)
- 섹터별 ETF 등락
- 산업 관련 뉴스 및 규제 변화
- 공급망/원자재 가격 변동
- 경쟁사 동향
- 애널리스트 섹터 리포트

### 3.3 Stock-specific (종목)
- 실시간 주가 및 거래량
- 재무제표 요약 (PER, PBR, ROE 등)
- 공시/IR 자료
- 종목 뉴스 및 루머
- 애널리스트 목표가 / 컨센서스
- 내부자 거래, 대량 보유 변동

---

## 4. 인증 (Google Login)

> sq3_experiments 프로젝트와 동일한 아키텍처를 재사용한다.

### 4.0.1 인증 스택

| 구성요소 | 기술 | 비고 |
|---------|------|------|
| Auth Provider | **Supabase Auth** | Google OAuth 연동 |
| 클라이언트 상태 | **Zustand** (`useAuthStore`) | 세션 관리, 로딩 상태 |
| Supabase SDK | `@supabase/supabase-js` | 브라우저 클라이언트 |
| 미들웨어 | 없음 (클라이언트 사이드) | sq3 동일 패턴 |

### 4.0.2 인증 흐름

```
[Login 버튼] → signInWithOAuth({ provider: "google" })
    → Supabase OAuth 엔드포인트
    → Google 로그인
    → /auth/callback (exchangeCodeForSession)
    → Zustand 상태 업데이트 → 홈으로 리다이렉트
```

### 4.0.3 구현 파일 (sq3_experiments 기준)

| 파일 | 역할 |
|------|------|
| `src/lib/supabase.ts` | Supabase 클라이언트 싱글톤, 환경변수 체크, offline 모드 지원 |
| `src/lib/auth-store.ts` | Zustand 스토어 — user, loading, signIn/signOut, `useInitAuth()` 훅 |
| `src/app/auth/callback/page.tsx` | OAuth 콜백 — code → session 교환 |
| `src/components/app-header.tsx` | 로그인/로그아웃 UI (아바타, 이메일 표시) |

### 4.0.4 Supabase 설정 요건

- Google Cloud Console에서 OAuth Client ID/Secret 발급
- Supabase Auth → Providers → Google에 Client ID/Secret 등록
- Supabase URL Configuration에 리다이렉트 URL 추가:
  - `https://<vercel-domain>.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- 기존 Supabase 프로젝트(`owpcbufmpdlshtqzhcnz`) 재사용 또는 신규 프로젝트 생성

### 4.0.5 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

### 4.0.6 인증 기반 기능

- **비로그인**: 대시보드 열람 가능 (공개 데이터)
- **로그인**: 관심 종목 관리, 개인 설정, 알림 설정
- **RLS**: 모든 사용자 데이터 테이블에 `user_id` 기반 Row Level Security 적용

---

## 5. 기능 요구사항

### 5.1 원페이저 대시보드 (핵심)

각 시간 단위(시간/일/주/월)별로 하나의 페이지에 아래 정보를 표시:

```
┌─────────────────────────────────────────────────┐
│  📊 종합 의견 (AI Summary)                       │
│  "단기 중립, 중기 긍정 — 매크로 불확실성 존재하나  │
│   산업 모멘텀과 실적 서프라이즈가 상쇄"             │
├────────────┬────────────┬───────────────────────┤
│  🌍 Macro  │  🏭 Industry │  📈 Stock-specific   │
├────────────┼────────────┼───────────────────────┤
│ ✅ 긍정     │ ✅ 긍정     │ ✅ 긍정               │
│ - CPI 둔화  │ - AI 투자↑  │ - 실적 서프라이즈      │
│ - 금리 동결 │ - 수주 증가  │ - 신제품 출시          │
├────────────┼────────────┼───────────────────────┤
│ ❌ 부정     │ ❌ 부정     │ ❌ 부정               │
│ - 지정학 긴장│ - 규제 강화 │ - 내부자 매도          │
│ - DXY 강세  │ - 원자재 상승│ - 컨센서스 하향        │
└────────────┴────────────┴───────────────────────┘
│  📰 주요 뉴스 타임라인                            │
│  📈 주요 지표 차트                                │
└─────────────────────────────────────────────────┘
```

### 5.2 시간 단위별 리포트

| 단위 | 주기 | 내용 |
|------|------|------|
| Hourly | 장중 매 정시 | 주가 변동, 긴급 뉴스, 거래량 이상 |
| Daily | 장 마감 후 | 일간 종합 리포트 |
| Weekly | 매주 금요일 | 주간 트렌드, 주요 이벤트 요약 |
| Monthly | 매월 1일 | 월간 성과, 매크로 전망 변화 |

### 5.3 관심 종목 관리
- 관심 종목 등록/삭제
- 종목별 개별 원페이저
- 포트폴리오 전체 뷰

### 5.4 알림 봇 (후순위 — 대시보드 완성 후)
- **Slack**: Incoming Webhook 기반 리포트 푸시
- **KakaoTalk**: 카카오 알림톡 또는 자체 챗봇
- 알림 시간/빈도 설정 가능
- 긴급 이벤트 (급등락, 주요 뉴스) 즉시 알림

### 5.5 AI 종합 의견
- 3축 정보를 종합하여 AI가 요약 의견 생성
- 긍정/부정/중립 판정 + 근거 제시
- Claude API 또는 OpenAI API 활용

---

## 6. 반응형 디자인 전략

### 6.1 브레이크포인트

| 디바이스 | 너비 | 레이아웃 |
|---------|------|---------|
| Mobile | < 640px | 1열 — 3축 카드 수직 스택, 접이식(accordion) |
| Tablet | 640–1024px | 2열 — Macro+Industry 나란히, Stock 아래 |
| Desktop | > 1024px | 3열 — 3축 카드 나란히 (원페이저 풀 뷰) |

### 6.2 모바일 최적화

```
┌──────────────────────┐
│ 🔍 종목 선택 (드롭다운) │
├──────────────────────┤
│ 📊 종합 의견           │
│ AI 요약 (접기/펼치기)   │
├──────────────────────┤
│ 🌍 Macro [▼]          │  ← 탭하면 펼쳐짐
│ ✅ CPI 둔화            │
│ ❌ DXY 강세            │
├──────────────────────┤
│ 🏭 Industry [▼]       │
├──────────────────────┤
│ 📈 Stock [▼]          │
├──────────────────────┤
│ 📰 뉴스 타임라인       │
├──────────────────────┤
│ 시간|일|주|월 (탭 바)   │
└──────────────────────┘
```

### 6.3 구현 방식
- **Tailwind CSS** 반응형 유틸리티 (`sm:`, `md:`, `lg:`)
- **shadcn/ui Accordion** 모바일 접기/펼치기
- **Bottom Tab Bar** 모바일에서 시간 단위 전환
- **Touch-friendly**: 최소 터치 타겟 44px, 스와이프 제스처 고려
- **PWA 지원 (선택)**: 홈 화면 추가 시 앱처럼 동작

---

## 7. 기술 아키텍처

### 7.1 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Frontend | **Next.js 15 (App Router)** | SSR, 타임존 처리, API Routes 통합 |
| UI | **Tailwind CSS + shadcn/ui** | 빠른 UI 개발, 다크모드, 차트 친화적 |
| Backend / API | **Next.js API Routes** | 풀스택 통합, Vercel 배포 최적화 |
| Database | **Supabase (PostgreSQL)** | 실시간 구독, Row Level Security, 무료 티어 |
| AI | **Claude API (via Vercel AI Gateway)** | 요약/분석 생성 |
| 데이터 수집 | **Cron Jobs + External APIs** | 뉴스/시세 정기 수집 |
| 알림 | **Slack Webhook** | MVP 우선, 이후 카카오 확장 |
| 배포 | **Vercel** | GitHub 연동, 자동 배포, 서버리스 |
| 패키지 관리 | **pnpm** | 빠른 설치, 디스크 효율 |

### 7.2 데이터 수집 파이프라인

```
[외부 API / RSS / 크롤링]
        │
        ▼
  Cron Job (Vercel)
        │
        ▼
  데이터 정규화 + 긍부정 태깅 (AI)
        │
        ▼
  Supabase (저장)
        │
        ├──▶ 웹 대시보드 (실시간)
        └──▶ 알림 봇 (Slack / KakaoTalk)
```

### 7.3 외부 데이터 소스 (후보)

| 소스 | 데이터 | 비용 |
|------|--------|------|
| Yahoo Finance API | 주가, 재무제표 | 무료 |
| FRED API | 미국 경제지표 | 무료 |
| 한국은행 Open API | 한국 경제지표 | 무료 |
| KRX 정보데이터시스템 | KOSPI/KOSDAQ 데이터 | 무료 |
| NewsAPI / Google News RSS | 뉴스 수집 | 무료/유료 |
| Alpha Vantage | 글로벌 시세 | 무료 티어 있음 |

---

## 8. 개발 로드맵

> 대시보드 우선. 알림 봇은 대시보드 완성 후 별도 Phase.

### Phase 1: 프로젝트 셋업 + 인증 (1주)
- [ ] Next.js 15 + Tailwind + shadcn/ui 프로젝트 초기화
- [ ] Supabase 프로젝트 생성 + Google OAuth 설정
- [ ] 인증 구현 (sq3_experiments 패턴 재사용)
- [ ] GitHub 리포지토리 + Vercel 배포 파이프라인
- [ ] DB 스키마 마이그레이션

### Phase 2: 대시보드 UI (2주)
- [ ] 반응형 레이아웃 쉘 (Header, Sidebar, Main)
- [ ] 3축 카드 컴포넌트 (Macro / Industry / Stock)
- [ ] 긍정/부정 요인 리스트 컴포넌트
- [ ] AI 종합 의견 카드
- [ ] 시간별/일별/주별/월별 탭 전환
- [ ] 모바일 최적화 (Accordion, Bottom Tab)
- [ ] 다크모드
- [ ] 관심 종목 관리 (추가/삭제)

### Phase 3: 데이터 파이프라인 (2주)
- [ ] 외부 API 연동 (주가, 뉴스, 경제지표)
- [ ] Cron 기반 데이터 수집
- [ ] 데이터 정규화 및 Supabase 저장

### Phase 4: AI 분석 (1주)
- [ ] 뉴스/정보 긍부정 분류 (Claude API)
- [ ] 3축 종합 의견 생성
- [ ] 리포트 캐싱 및 갱신 로직

### Phase 5: 알림 봇 (후순위)
- [ ] Slack Webhook 연동
- [ ] 리포트 포매팅 및 스케줄링
- [ ] 카카오톡 연동

---

## 9. DB 스키마 (초안)

```sql
-- 관심 종목 (로그인 사용자별)
watchlist (
  id, user_id (→ auth.users), ticker, name, market, sector, created_at
)

-- 수집된 뉴스/정보
news_items (
  id, title, summary, source_url, source_name,
  axis (macro | industry | stock),
  sentiment (positive | negative | neutral),
  sentiment_score,
  related_ticker,
  published_at, collected_at
)

-- 경제 지표
indicators (
  id, name, category, value, previous_value,
  unit, source, recorded_at
)

-- AI 생성 리포트
reports (
  id, ticker, period_type (hourly | daily | weekly | monthly),
  period_start, period_end,
  macro_positive, macro_negative,
  industry_positive, industry_negative,
  stock_positive, stock_negative,
  ai_summary, ai_sentiment,
  created_at
)

-- 알림 설정 (로그인 사용자별)
notification_settings (
  id, user_id (→ auth.users),
  channel (slack | kakao), webhook_url,
  hourly_enabled, daily_enabled, weekly_enabled, monthly_enabled,
  alert_on_emergency,
  created_at
)
```

---

## 10. 비기능 요구사항

- **성능**: 대시보드 초기 로딩 < 2초
- **비용**: 무료/저비용 API 우선 사용, AI API 호출 최소화 (캐싱)
- **보안**: Supabase RLS, API Key 환경변수 관리
- **확장성**: 종목 수 증가에 대응 가능한 구조

---

## 11. 성공 지표

- 웹 대시보드에서 3축 정보를 한눈에 확인 가능
- 모바일에서도 불편 없이 정보 확인 (반응형)
- Google 로그인 후 관심 종목 저장/복원 정상 동작
- AI 요약의 체감 정확도 70% 이상
- 대시보드 초기 로딩 < 2초

---

## 12. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 무료 API 호출 한도 초과 | 캐싱 적극 활용, 여러 소스 분산 |
| AI 요약 품질 부족 | 프롬프트 튜닝, few-shot 예시 활용 |
| 뉴스 크롤링 차단 | RSS 우선, 공식 API 대체 |
| KakaoTalk 연동 복잡성 | MVP에서 Slack 우선, 카카오는 Phase 5 |

---

## 13. MVP 범위 (첫 배포)

MVP = **대시보드 사이트** 한정:

1. **Google 로그인** (Supabase Auth)
2. **반응형 원페이저 대시보드** (데스크톱 + 모바일)
3. **1개 종목** 기준 3축 정보 표시
4. **일별 리포트** (시간별/주별/월별은 이후)
5. **뉴스 + 주가 데이터** (재무제표는 이후)
6. **AI 요약** (Claude API)
7. **Vercel 배포** + GitHub 연동

> 알림 봇(Slack/카톡)은 MVP 범위 밖
