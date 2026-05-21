"use client";

import { useState, useCallback, useMemo } from "react";
import { AppHeader } from "@/components/app-header";
import { AISummaryCard } from "@/components/ai-summary-card";
import { AxisCard, type FactorItem } from "@/components/axis-card";
import { PeriodTabs, type Period } from "@/components/period-tabs";
import { NewsTimeline, type NewsItem } from "@/components/news-timeline";
import { DatePicker } from "@/components/date-picker";
import { WatchlistManager, type WatchlistItem } from "@/components/watchlist-manager";
import { StockChart } from "@/components/stock-chart";
import { LiveNews } from "@/components/live-news";
import { UpcomingEvents, type UpcomingEvent } from "@/components/upcoming-events";
import { VerdictCard, type Verdict } from "@/components/verdict-card";
import { QuoteBadge } from "@/components/quote-badge";
import { PriceTickerBar } from "@/components/price-ticker-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useQuotes } from "@/hooks/use-quotes";

// ─── Mock data per ticker ─────────────────────────────────────

type TickerData = {
  name: string;
  verdict: { verdict: Verdict; confidence: number; summary: string };
  aiSummary: { sentiment: "positive" | "negative" | "neutral"; summary: string };
  macro: { positive: FactorItem[]; negative: FactorItem[] };
  industry: { positive: FactorItem[]; negative: FactorItem[] };
  stock: { positive: FactorItem[]; negative: FactorItem[] };
  news: NewsItem[];
  events: UpcomingEvent[];
};

const MOCK_DATA: Record<string, TickerData> = {
  "005930.KS": {
    name: "Samsung Electronics",
    verdict: {
      verdict: "hold",
      confidence: 55,
      summary:
        "매크로 불확실성(지정학, DXY 강세)과 산업 모멘텀(AI 반도체)이 상쇄. 내부자 매도 시그널 주의하며 관망 추천. 실적 서프라이즈 확인 후 진입 고려.",
    },
    aiSummary: {
      sentiment: "neutral",
      summary:
        "단기 중립 전망. CPI 둔화와 금리 동결 기대감이 긍정적이나, 지정학 리스크와 수출 규제 불확실성이 상쇄. 산업 내 AI 반도체 모멘텀은 지속되나 종목 레벨에서 내부자 매도 시그널 주의 필요.",
    },
    macro: {
      positive: [
        { text: "CPI 둔화 추세 지속 (3.2% → 2.9%)", source: "FRED", sourceUrl: "https://fred.stlouisfed.org/" },
        { text: "Fed 금리 동결 시사", source: "Reuters", sourceUrl: "https://www.reuters.com/" },
      ],
      negative: [
        { text: "지정학 리스크 고조 (중동)", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/" },
        { text: "DXY 강세 (105.3)", source: "Investing.com", sourceUrl: "https://www.investing.com/" },
      ],
    },
    industry: {
      positive: [
        { text: "AI 반도체 투자 확대", source: "TechCrunch", sourceUrl: "https://techcrunch.com/" },
        { text: "데이터센터 수주 증가", source: "Industry Report" },
      ],
      negative: [
        { text: "중국 수출 규제 강화 가능성", source: "FT", sourceUrl: "https://www.ft.com/" },
        { text: "원자재 가격 상승 (구리 +8%)", source: "Commodity" },
      ],
    },
    stock: {
      positive: [
        { text: "2Q 실적 컨센서스 상회 (+12%)", source: "DART", sourceUrl: "https://dart.fss.or.kr/" },
        { text: "신규 고객사 확보 공시", source: "DART", sourceUrl: "https://dart.fss.or.kr/" },
      ],
      negative: [
        { text: "내부자 매도 3건 (최근 30일)", source: "공시", sourceUrl: "https://dart.fss.or.kr/" },
        { text: "애널리스트 목표가 하향 (2건)", source: "증권사" },
      ],
    },
    news: [
      { title: "Fed 파월 의장, 추가 금리 인상 가능성 일축", source: "Reuters", sourceUrl: "https://www.reuters.com/", time: "09:30", sentiment: "positive", axis: "macro" },
      { title: "삼성전자 HBM3E 양산 계획 발표", source: "연합뉴스", sourceUrl: "https://www.yna.co.kr/", time: "10:15", sentiment: "positive", axis: "industry" },
      { title: "중국 상무부, 반도체 수출 규제 검토 보도", source: "FT", sourceUrl: "https://www.ft.com/", time: "11:00", sentiment: "negative", axis: "industry" },
      { title: "목표주가 하향 조정 — 키움증권", source: "증권사", time: "13:30", sentiment: "negative", axis: "stock" },
      { title: "2분기 잠정 실적 발표 — 매출 전년 대비 +18%", source: "DART", sourceUrl: "https://dart.fss.or.kr/", time: "16:00", sentiment: "positive", axis: "stock" },
    ],
    events: [
      { date: "05/28", title: "삼성전자 주주총회", type: "conference", impact: "medium", axis: "stock", daysUntil: 8, description: "2026년 사업 전략 발표 예정" },
      { date: "06/05", title: "미국 고용지표 발표", type: "economic", impact: "high", axis: "macro", daysUntil: 16 },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23, description: "금리 결정 및 점도표 공개" },
      { date: "06/18", title: "SEMICON West 2026", type: "conference", impact: "medium", axis: "industry", daysUntil: 29, description: "반도체 산업 최대 컨퍼런스" },
    ],
  },
  GOOGL: {
    name: "Alphabet (Google)",
    verdict: {
      verdict: "buy",
      confidence: 72,
      summary:
        "Google I/O 2026에서 발표된 Gemini 2.5 및 AI 통합 전략이 강력한 모멘텀. 광고 매출 견조하고 클라우드 성장 가속. 매크로 리스크 감안해도 현 밸류에이션에서 매수 매력 충분.",
    },
    aiSummary: {
      sentiment: "positive",
      summary:
        "Google I/O 2026 (5/19) 행사에서 Gemini 2.5 발표, AI 검색 통합 강화, Android AI 기능 대폭 업데이트. 시장 반응 긍정적. 클라우드 사업 분기 성장률 28%로 가속. 매크로 우려 일부 상존하나 개별 종목 모멘텀이 압도.",
    },
    macro: {
      positive: [
        { text: "CPI 둔화 추세 — 기술주 밸류에이션 부담 완화", source: "FRED", sourceUrl: "https://fred.stlouisfed.org/" },
        { text: "Fed 금리 동결 기조 유지", source: "Reuters", sourceUrl: "https://www.reuters.com/" },
      ],
      negative: [
        { text: "미 정부 빅테크 규제 논의 진행 중", source: "WSJ", sourceUrl: "https://www.wsj.com/" },
        { text: "DXY 강세 — 해외 매출 환산 불리", source: "Investing.com", sourceUrl: "https://www.investing.com/" },
      ],
    },
    industry: {
      positive: [
        { text: "AI 검색 시장 급성장 — Google 점유율 90%+", source: "StatCounter", sourceUrl: "https://gs.statcounter.com/" },
        { text: "클라우드 인프라 지출 증가 (YoY +22%)", source: "Gartner" },
        { text: "디지털 광고 시장 회복세", source: "eMarketer" },
      ],
      negative: [
        { text: "OpenAI ChatGPT 검색 경쟁 심화", source: "The Verge", sourceUrl: "https://www.theverge.com/" },
        { text: "EU 디지털 시장법(DMA) 규제 리스크", source: "Reuters", sourceUrl: "https://www.reuters.com/" },
      ],
    },
    stock: {
      positive: [
        { text: "Google I/O 2026 — Gemini 2.5 발표, AI 통합 강화", source: "Google Blog", sourceUrl: "https://blog.google/" },
        { text: "1Q 실적 서프라이즈 (EPS +15% beat)", source: "Earnings" },
        { text: "자사주 매입 $70B 승인", source: "SEC", sourceUrl: "https://www.sec.gov/" },
      ],
      negative: [
        { text: "반독점 소송 진행 중 (검색 독점)", source: "DOJ" },
        { text: "CFO, 향후 CAPEX 대폭 증가 경고", source: "Earnings Call" },
      ],
    },
    news: [
      { title: "Google I/O 2026: Gemini 2.5 공개, AI 에이전트 시대 선언", source: "Google Blog", sourceUrl: "https://blog.google/", time: "10:00", sentiment: "positive", axis: "stock" },
      { title: "Alphabet 시간외 +3.2% — I/O 발표 호재", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/", time: "16:30", sentiment: "positive", axis: "stock" },
      { title: "AI 검색 광고 단가 상승 — 수익성 개선 기대", source: "eMarketer", time: "11:00", sentiment: "positive", axis: "industry" },
      { title: "EU, Google에 DMA 위반 경고서 발송 예정", source: "Reuters", sourceUrl: "https://www.reuters.com/", time: "14:00", sentiment: "negative", axis: "stock" },
      { title: "OpenAI, GPT-5 출시 일정 공개 — 경쟁 심화", source: "The Verge", sourceUrl: "https://www.theverge.com/", time: "09:00", sentiment: "negative", axis: "industry" },
    ],
    events: [
      { date: "05/19", title: "Google I/O 2026", type: "conference", impact: "high", axis: "stock", daysUntil: -1, description: "Gemini 2.5, Android AI, Cloud 업데이트 발표" },
      { date: "06/05", title: "미국 고용지표 발표", type: "economic", impact: "high", axis: "macro", daysUntil: 16 },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23 },
      { date: "06/15", title: "EU DMA 1차 컴플라이언스 기한", type: "policy", impact: "high", axis: "stock", daysUntil: 26, description: "Google 검색/쇼핑 규제 대상" },
      { date: "07/22", title: "Alphabet 2Q 실적 발표", type: "earnings", impact: "high", axis: "stock", daysUntil: 63, description: "I/O 이후 AI 수익화 지표 주목" },
    ],
  },
  "000660.KS": {
    name: "SK Hynix",
    verdict: {
      verdict: "buy",
      confidence: 68,
      summary:
        "HBM 시장 지배력과 AI 수요 확대로 강한 실적 모멘텀. DRAM/NAND 가격 반등과 함께 업사이클 진입. 다만 중국 리스크 모니터링 필요.",
    },
    aiSummary: {
      sentiment: "positive",
      summary:
        "HBM3E 독점 공급 지위 강화. AI 서버 수요 폭발로 매출/이익 동반 성장. DRAM 가격 반등 시작. 매크로 리스크 일부 상존하나 메모리 업사이클 진입 확인.",
    },
    macro: {
      positive: [
        { text: "글로벌 IT 투자 증가 추세", source: "Gartner" },
        { text: "Fed 금리 동결 — 기술 투자 환경 호전", source: "Reuters", sourceUrl: "https://www.reuters.com/" },
      ],
      negative: [
        { text: "USD/KRW 환율 불안정 (1,350원대)", source: "한국은행" },
        { text: "지정학 리스크 — 한반도 긴장", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/" },
      ],
    },
    industry: {
      positive: [
        { text: "HBM 시장 CAGR 45% 성장 전망", source: "TrendForce" },
        { text: "DRAM 현물가 +12% (최근 1개월)", source: "DRAMeXchange" },
        { text: "AI 서버 출하량 2배 증가 예상", source: "IDC" },
      ],
      negative: [
        { text: "중국 자체 메모리 개발 가속 (CXMT)", source: "IC Insights" },
        { text: "삼성전자 HBM3E 양산 추격", source: "연합뉴스", sourceUrl: "https://www.yna.co.kr/" },
      ],
    },
    stock: {
      positive: [
        { text: "HBM3E NVIDIA 독점 공급 계약", source: "공시", sourceUrl: "https://dart.fss.or.kr/" },
        { text: "1Q 영업이익 컨센서스 상회 (+22%)", source: "DART", sourceUrl: "https://dart.fss.or.kr/" },
      ],
      negative: [
        { text: "CAPEX 대폭 증가 — FCF 압박 우려", source: "IR" },
        { text: "미국 중국향 AI칩 수출 규제 확대 리스크", source: "Reuters", sourceUrl: "https://www.reuters.com/" },
      ],
    },
    news: [
      { title: "SK하이닉스, HBM3E 12H 양산 돌입", source: "공시", sourceUrl: "https://dart.fss.or.kr/", time: "09:00", sentiment: "positive", axis: "stock" },
      { title: "NVIDIA H200 수요 폭발 — HBM 수혜", source: "Reuters", sourceUrl: "https://www.reuters.com/", time: "10:30", sentiment: "positive", axis: "industry" },
      { title: "DRAM 가격 3개월 연속 상승", source: "DRAMeXchange", time: "11:00", sentiment: "positive", axis: "industry" },
      { title: "미상무부, 중국향 AI칩 규제 검토 보도", source: "WSJ", sourceUrl: "https://www.wsj.com/", time: "14:00", sentiment: "negative", axis: "macro" },
    ],
    events: [
      { date: "06/03", title: "Computex 2026", type: "conference", impact: "high", axis: "industry", daysUntil: 14, description: "AI/HBM 관련 발표 예정" },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23 },
      { date: "07/25", title: "SK하이닉스 2Q 실적 발표", type: "earnings", impact: "high", axis: "stock", daysUntil: 66 },
    ],
  },
};

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOSPI" },
  { ticker: "GOOGL", name: "Alphabet (Google)", market: "NASDAQ" },
  { ticker: "000660.KS", name: "SK Hynix", market: "KOSPI" },
];

// ─── Page ────────────────────────────────────────────────────

export default function HomePage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [selectedTicker, setSelectedTicker] = useState("005930.KS");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const data = MOCK_DATA[selectedTicker] ?? MOCK_DATA["005930.KS"];

  const symbols = useMemo(() => watchlist.map((w) => w.ticker), [watchlist]);
  const { quotes, loading: quotesLoading } = useQuotes(symbols);

  const handleAddTicker = useCallback((item: WatchlistItem) => {
    setWatchlist((prev) => (prev.some((w) => w.ticker === item.ticker) ? prev : [...prev, item]));
  }, []);

  const handleRemoveTicker = useCallback(
    (ticker: string) => {
      setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
      if (selectedTicker === ticker) {
        setSelectedTicker(watchlist[0]?.ticker ?? "005930.KS");
      }
    },
    [selectedTicker, watchlist]
  );

  const handleReorder = useCallback((reordered: WatchlistItem[]) => {
    setWatchlist(reordered);
  }, []);

  return (
    <TooltipProvider>
      <AppHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Watchlist */}
        <WatchlistManager
          items={watchlist}
          selected={selectedTicker}
          onSelect={setSelectedTicker}
          onAdd={handleAddTicker}
          onRemove={handleRemoveTicker}
          onReorder={handleReorder}
        />

        {/* Price ticker bar — all watchlist quotes */}
        <PriceTickerBar
          quotes={quotes}
          watchlist={watchlist.map((w) => ({ ticker: w.ticker, name: w.name }))}
          selected={selectedTicker}
          loading={quotesLoading}
        />

        {/* Controls: Ticker info + Quote + Date + Period */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold">{data.name}</h2>
              <QuoteBadge quote={quotes[selectedTicker]} loading={quotesLoading} />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{selectedTicker}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
            <PeriodTabs value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Verdict — Buy/Hold/Sell */}
        <VerdictCard
          verdict={data.verdict.verdict}
          confidence={data.verdict.confidence}
          summary={data.verdict.summary}
        />

        {/* AI Summary */}
        <AISummaryCard
          ticker={selectedTicker}
          sentiment={data.aiSummary.sentiment}
          summary={data.aiSummary.summary}
          updatedAt={selectedDate.toLocaleDateString("ko-KR") + " 16:30 KST"}
        />

        {/* 3-Axis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AxisCard
            title="Macro"
            icon="🌍"
            positive={data.macro.positive}
            negative={data.macro.negative}
            collapsible={isMobile}
          />
          <AxisCard
            title="Industry"
            icon="🏭"
            positive={data.industry.positive}
            negative={data.industry.negative}
            collapsible={isMobile}
          />
          <AxisCard
            title="Stock"
            icon="📈"
            positive={data.stock.positive}
            negative={data.stock.negative}
            collapsible={isMobile}
          />
        </div>

        {/* Stock Chart */}
        <StockChart symbol={selectedTicker} />

        {/* Upcoming Events + Live News side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UpcomingEvents events={data.events} />
          <LiveNews ticker={selectedTicker} tickerName={data.name} />
        </div>

        {/* Mock News (will be replaced by live data) */}
        <NewsTimeline items={data.news} />
      </main>
    </TooltipProvider>
  );
}
