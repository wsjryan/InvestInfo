# AI Analysis 구동 과정 & 프롬프트 문서

## 1. 전체 흐름

```
사용자가 [▶ AI 분석 실행] 또는 [Refresh] 버튼 클릭
    │
    ▼
프론트엔드: refreshGemini(true) 호출
    │  (web/src/hooks/use-gemini-analysis.ts → fetchOne(symbol, forceRefresh=true))
    │
    ▼
API 호출: GET /api/analysis?symbol=GOOGL&refresh=1
    │  (web/src/app/api/analysis/route.ts)
    │
    ├─ 1) 서버 캐시 확인 (1시간 TTL)
    │     - refresh=1 이면 캐시 무시
    │     - refresh 없으면 캐시 있으면 캐시 반환 ← ⚠️ 이것 때문에 "같은 내용" 나올 수 있음
    │
    ├─ 2) Yahoo Finance에서 현재 주가 가져오기 (priceInfo)
    │     GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
    │
    ├─ 3) Gemini API 호출 (1회)
    │     POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent
    │     - 429 시 3초 대기 후 1회 재시도 (총 2회)
    │
    ├─ 4) 응답 JSON 파싱 → result 객체 생성
    │
    └─ 5) 서버 캐시에 저장 + 클라이언트에 반환
              │
              ▼
    프론트엔드: geminiAnalysis 상태 업데이트
              │
              ├─ Verdict 카드 갱신
              ├─ AI Summary 카드 갱신
              ├─ 3축 카드 (Macro/Industry/Stock) 갱신
              ├─ Upcoming Events 갱신
              └─ Target Price 카드 갱신 (useTargetPrice가 geminiData prop으로 받음)
```

## 2. 프롬프트 전문

**파일 위치:** `web/src/app/api/analysis/route.ts` (55~82행)

```
You are a senior investment analyst. Current: {UTC시각}. Analyze "{종목명}" ({티커}). {현재가 정보}

Return ONLY JSON:
{
  "verdict": "strong_buy"|"buy"|"hold"|"sell"|"strong_sell",
  "confidence": <0-100>,
  "verdictSummary": "<2 sentences Korean>",
  "aiSentiment": "positive"|"negative"|"neutral",
  "aiSummary": "<3 sentences Korean covering macro+industry+stock>",
  "macro": {"score":<-1 to 1>,"positive":[{"text":"<Korean ≤25chars>","source":"<name>","sourceUrl":"<Google News search URL>","date":"<MM/DD HH:MM>"}],"negative":[...]},
  "industry": {"score":<-1 to 1>,"positive":[...],"negative":[...]},
  "stock": {"score":<-1 to 1>,"positive":[...],"negative":[...]},
  "events": [{"date":"<MM/DD>","title":"<name>","type":"earnings"|"conference"|"economic"|"policy"|"product","impact":"high"|"medium"|"low","axis":"macro"|"industry"|"stock","description":"<Korean>","url":"<URL>","daysUntil":<num>}],
  "targetHigh": <number>, "targetLow": <number>, "targetMean": <number>,
  "numberOfAnalysts": <number>,
  "recommendation": "buy"|"hold"|"sell",
  "recommendationMean": <1.0-5.0>,
  "reasoning": "<Korean: [매크로] ... → [산업] ... → [종목] ... → [총평] ...>",
  "analystSources": [{"name":"<firm>","target":<price>,"rating":"buy"|"hold"|"sell","reason":"<1 sentence Korean>","url":"<Google News search URL for this report>"}]
}

Rules:
- Each axis: 2-4 factors. sourceUrl = Google News search for actual article.
- Target prices realistic vs current price (±30%). KRW for .KS, USD for US.
- reasoning: [매크로]→[산업]→[종목]→[총평] sections.
- analystSources: 3-5 firms with reasons. URLs = Google News search, NOT homepages.
- events: 3-5 items within 30 days.
- Be balanced.
```

## 3. Gemini에 전달되는 동적 변수

| 변수 | 예시 | 출처 |
|------|------|------|
| `{UTC시각}` | `2026-05-24T09:30:00.000Z` | `new Date().toISOString()` |
| `{종목명}` | `Alphabet (Google)` | `TICKER_NAMES` 맵 |
| `{티커}` | `GOOGL` | URL 파라미터 |
| `{현재가 정보}` | `Current price: USD 387.66. Previous close: 388.91.` | Yahoo Finance API |

## 4. 반환 JSON → 프론트 매핑

| Gemini 응답 필드 | 프론트엔드 컴포넌트 | 설명 |
|-----------------|-------------------|------|
| `verdict`, `confidence`, `verdictSummary` | VerdictCard | Buy/Hold/Sell 판단 |
| `aiSentiment`, `aiSummary` | AISummaryCard | 종합 요약 |
| `macro.positive/negative` | AxisCard (Macro) | 거시경제 긍부정 |
| `industry.positive/negative` | AxisCard (Industry) | 산업 긍부정 |
| `stock.positive/negative` | AxisCard (Stock) | 종목 긍부정 |
| `events` | UpcomingEvents | 예정 이벤트 |
| `targetHigh/Low/Mean` | TargetPriceCard | 목표가 |
| `numberOfAnalysts`, `recommendation` | TargetPriceCard | 컨센서스 |
| `reasoning` | TargetPriceCard | [매크로→산업→종목→총평] |
| `analystSources` | TargetPriceCard | 애널리스트별 목표가 |

## 5. 캐시 구조

### 서버 캐시 (API route 내 메모리)
- 키: `symbol` (예: `GOOGL`)
- TTL: **1시간**
- `refresh=1` 파라미터 시 캐시 무시하고 Gemini 재호출
- Vercel 서버리스 특성상 함수 인스턴스가 재시작되면 캐시 초기화

### 클라이언트 캐시 (브라우저 메모리)
- `analysisCache` 객체 (use-gemini-analysis.ts)
- TTL: **1시간**
- `forceRefresh=true` 시 캐시 무시

## 6. 알려진 이슈

### 이슈 1: "같은 내용이 계속 나옴"
- **원인 1:** 서버 캐시 (1시간) — `refresh=1` 파라미터가 전달되면 캐시를 무시하므로, 버튼 클릭 시에는 새로운 결과가 나와야 함
- **원인 2:** Gemini의 `temperature: 0.2` — 낮은 temperature라 비슷한 결과가 나올 수 있음
- **원인 3:** Vercel 서버리스 Cold Start — 새 인스턴스에서는 캐시가 비어있으므로 항상 새로 호출
- **원인 4:** mock 데이터 우선 문제 — ✅ 수정 완료 (gemini > mock 우선)

### 이슈 2: "목표가만 안 나옴"
- **원인:** Gemini 응답에서 `targetMean`이 0이거나 누락되는 경우
- **확인 방법:** 브라우저에서 직접 `https://investinfos.vercel.app/api/analysis?symbol=GOOGL&refresh=1` 호출 → `targetMean` 값 확인
- **해결:** target 관련 필드가 Gemini 프롬프트 하단에 있어 잘릴 수 있음 → 프롬프트 구조 변경 검토

### 이슈 3: Gemini 429 Rate Limit
- **무료 tier:** 분당 제한 있음
- **현재 대응:** 자동 호출 OFF, 수동 버튼만, 3초 대기 후 1회 재시도
- **서버 캐시:** 같은 종목은 1시간 내 재호출 안 함 (refresh=1 제외)

## 7. 디버깅 방법

1. **Gemini 응답 직접 확인:**
   ```
   https://investinfos.vercel.app/api/analysis?symbol=GOOGL&refresh=1
   ```
   → JSON에서 `targetMean`, `verdict`, `aiSummary` 등 확인

2. **캐시 확인:**
   ```
   https://investinfos.vercel.app/api/analysis?symbol=GOOGL
   ```
   → `refresh=1` 없이 호출하면 캐시된 결과 반환

3. **Gemini API 직접 테스트:**
   ```bash
   curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
   ```
