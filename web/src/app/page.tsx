"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { useAuthStore } from "@/lib/auth-store";
import { AISummaryCard } from "@/components/ai-summary-card";
import { AxisCard, type FactorItem } from "@/components/axis-card";
// PeriodTabs removed — Daily only for now
import { NewsTimeline, type NewsItem } from "@/components/news-timeline";
import { DatePicker } from "@/components/date-picker";
import { WatchlistManager, type WatchlistItem } from "@/components/watchlist-manager";
import { StockChart } from "@/components/stock-chart";
// LiveNews merged into NewsTimeline
import { LiveClock } from "@/components/live-clock";
import { TargetPriceCard } from "@/components/target-price-card";
import { TickerLogo } from "@/components/ticker-logo";
import { useTargetPrice } from "@/hooks/use-target-price";
import { useGeminiAnalysis } from "@/hooks/use-gemini-analysis";
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
  currency: string;
  verdict: { verdict: Verdict; confidence: number; summary: string };
  aiSummary: { sentiment: "positive" | "negative" | "neutral"; summary: string };
  macro: { positive: FactorItem[]; negative: FactorItem[]; score: number }; // -1 to 1
  industry: { positive: FactorItem[]; negative: FactorItem[]; score: number };
  stock: { positive: FactorItem[]; negative: FactorItem[]; score: number };
  news: NewsItem[];
  events: UpcomingEvent[];
};

const MOCK_DATA: Record<string, TickerData> = {
  "005930.KS": {
    name: "Samsung Electronics",
    currency: "KRW",
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
      score: 0.1,
      positive: [
        { text: "CPI 둔화 추세 지속 (3.2% → 2.9%)", source: "FRED", sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL", date: "05/18 08:30" },
        { text: "Fed 금리 동결 시사", source: "Reuters", sourceUrl: "https://www.reuters.com/business/finance/", date: "05/19 21:00" },
      ],
      negative: [
        { text: "지정학 리스크 고조 (중동)", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/news/articles/2026-05-17/middle-east-tensions", date: "05/17 07:30" },
        { text: "DXY 강세 (105.3)", source: "Investing.com", sourceUrl: "https://www.investing.com/indices/usdollar", date: "05/20 15:00" },
      ],
    },
    industry: {
      score: 0.4,
      positive: [
        { text: "AI 반도체 투자 확대", source: "TechCrunch", sourceUrl: "https://techcrunch.com/tag/semiconductors/", date: "05/19 11:00" },
        { text: "데이터센터 수주 증가", source: "Industry Report", date: "05/16 09:00" },
      ],
      negative: [
        { text: "중국 수출 규제 강화 가능성", source: "FT", sourceUrl: "https://www.ft.com/technology", date: "05/20 06:00" },
        { text: "원자재 가격 상승 (구리 +8%)", source: "Commodity", date: "05/18 10:00" },
      ],
    },
    stock: {
      score: 0.0,
      positive: [
        { text: "2Q 실적 컨센서스 상회 (+12%)", source: "DART", sourceUrl: "https://dart.fss.or.kr/dsab001/main.do?autoSearch=true&textCrpNm=삼성전자", date: "05/20 16:00" },
        { text: "신규 고객사 확보 공시", source: "DART", sourceUrl: "https://dart.fss.or.kr/dsab001/main.do?autoSearch=true&textCrpNm=삼성전자", date: "05/19 09:00" },
      ],
      negative: [
        { text: "내부자 매도 3건 (최근 30일)", source: "공시", sourceUrl: "https://dart.fss.or.kr/dsab001/main.do?autoSearch=true&textCrpNm=삼성전자", date: "05/15 18:00" },
        { text: "애널리스트 목표가 하향 (2건)", source: "증권사", date: "05/18 08:00" },
      ],
    },
    news: [
      { title: "Fed 파월 의장, 추가 금리 인상 가능성 일축", source: "Reuters", sourceUrl: "https://www.google.com/search?q=Fed+파월+금리+인상+일축+Reuters", time: "05/21 09:30", sentiment: "positive", axis: "macro" },
      { title: "삼성전자 HBM3E 양산 계획 발표", source: "연합뉴스", sourceUrl: "https://www.google.com/search?q=삼성전자+HBM3E+양산+연합뉴스", time: "05/21 10:15", sentiment: "positive", axis: "industry" },
      { title: "중국 상무부, 반도체 수출 규제 검토 보도", source: "FT", sourceUrl: "https://www.google.com/search?q=중국+반도체+수출+규제+FT", time: "05/21 11:00", sentiment: "negative", axis: "industry" },
      { title: "목표주가 하향 조정 — 키움증권", source: "증권사", sourceUrl: "https://www.google.com/search?q=삼성전자+목표주가+하향+키움증권", time: "05/21 13:30", sentiment: "negative", axis: "stock" },
      { title: "2분기 잠정 실적 발표 — 매출 전년 대비 +18%", source: "DART", sourceUrl: "https://dart.fss.or.kr/dsab001/main.do?autoSearch=true&textCrpNm=삼성전자", time: "05/21 16:00", sentiment: "positive", axis: "stock" },
    ],
    events: [
      { date: "05/28", title: "삼성전자 주주총회", type: "conference", impact: "medium", axis: "stock", daysUntil: 8, description: "2026년 사업 전략 발표 예정", url: "https://www.samsung.com/sec/ir/" },
      { date: "06/05", title: "미국 고용지표 발표", type: "economic", impact: "high", axis: "macro", daysUntil: 16, url: "https://www.bls.gov/news.release/empsit.nr0.htm" },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23, description: "금리 결정 및 점도표 공개", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
      { date: "06/18", title: "SEMICON West 2026", type: "conference", impact: "medium", axis: "industry", daysUntil: 29, description: "반도체 산업 최대 컨퍼런스", url: "https://www.semiconwest.org/" },
    ],
  },
  GOOGL: {
    name: "Alphabet (Google)",
    currency: "USD",
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
      score: 0.2,
      positive: [
        { text: "CPI 둔화 추세 — 기술주 밸류에이션 부담 완화", source: "FRED", sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL", date: "05/18 08:30" },
        { text: "Fed 금리 동결 기조 유지", source: "Reuters", sourceUrl: "https://www.reuters.com/business/finance/", date: "05/19 21:00" },
      ],
      negative: [
        { text: "미 정부 빅테크 규제 논의 진행 중", source: "WSJ", sourceUrl: "https://www.wsj.com/tech/", date: "05/16 11:00" },
        { text: "DXY 강세 — 해외 매출 환산 불리", source: "Investing.com", sourceUrl: "https://www.investing.com/indices/usdollar", date: "05/20 15:00" },
      ],
    },
    industry: {
      score: 0.5,
      positive: [
        { text: "AI 검색 시장 급성장 — Google 점유율 90%+", source: "StatCounter", sourceUrl: "https://gs.statcounter.com/search-engine-market-share", date: "05/19 10:00" },
        { text: "클라우드 인프라 지출 증가 (YoY +22%)", source: "Gartner", sourceUrl: "https://www.gartner.com/en/newsroom", date: "05/17 09:00" },
        { text: "디지털 광고 시장 회복세", source: "eMarketer", sourceUrl: "https://www.emarketer.com/", date: "05/18 14:00" },
      ],
      negative: [
        { text: "OpenAI ChatGPT 검색 경쟁 심화", source: "The Verge", sourceUrl: "https://www.theverge.com/openai", date: "05/20 08:30" },
        { text: "EU 디지털 시장법(DMA) 규제 리스크", source: "Reuters", sourceUrl: "https://www.reuters.com/technology/", date: "05/16 16:00" },
      ],
    },
    stock: {
      score: 0.6,
      positive: [
        { text: "Google I/O 2026 — Gemini 2.5 발표, AI 통합 강화", source: "Google Blog", sourceUrl: "https://blog.google/technology/ai/", date: "05/19 18:00" },
        { text: "1Q 실적 서프라이즈 (EPS +15% beat)", source: "Earnings", sourceUrl: "https://abc.xyz/investor/", date: "05/14 16:30" },
        { text: "자사주 매입 $70B 승인", source: "SEC", sourceUrl: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=alphabet", date: "05/14 17:00" },
      ],
      negative: [
        { text: "반독점 소송 진행 중 (검색 독점)", source: "DOJ", sourceUrl: "https://www.justice.gov/atr", date: "05/12 10:00" },
        { text: "CFO, 향후 CAPEX 대폭 증가 경고", source: "Earnings Call", sourceUrl: "https://abc.xyz/investor/", date: "05/14 17:30" },
      ],
    },
    news: [
      { title: "Google I/O 2026: Gemini 2.5 공개, AI 에이전트 시대 선언", source: "Google Blog", sourceUrl: "https://blog.google/", time: "05/21 10:00", sentiment: "positive", axis: "stock" },
      { title: "Alphabet 시간외 +3.2% — I/O 발표 호재", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/", time: "05/21 16:30", sentiment: "positive", axis: "stock" },
      { title: "AI 검색 광고 단가 상승 — 수익성 개선 기대", source: "eMarketer", sourceUrl: "https://www.google.com/search?q=AI+search+ad+pricing+eMarketer", time: "05/21 11:00", sentiment: "positive", axis: "industry" },
      { title: "EU, Google에 DMA 위반 경고서 발송 예정", source: "Reuters", sourceUrl: "https://www.reuters.com/", time: "05/21 14:00", sentiment: "negative", axis: "stock" },
      { title: "OpenAI, GPT-5 출시 일정 공개 — 경쟁 심화", source: "The Verge", sourceUrl: "https://www.theverge.com/", time: "05/21 09:00", sentiment: "negative", axis: "industry" },
    ],
    events: [
      { date: "05/19", title: "Google I/O 2026", type: "conference", impact: "high", axis: "stock", daysUntil: -1, description: "Gemini 2.5, Android AI, Cloud 업데이트 발표", url: "https://io.google/2026/" },
      { date: "06/05", title: "미국 고용지표 발표", type: "economic", impact: "high", axis: "macro", daysUntil: 16, url: "https://www.bls.gov/news.release/empsit.nr0.htm" },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23, url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
      { date: "06/15", title: "EU DMA 1차 컴플라이언스 기한", type: "policy", impact: "high", axis: "stock", daysUntil: 26, description: "Google 검색/쇼핑 규제 대상", url: "https://digital-markets-act.ec.europa.eu/" },
      { date: "07/22", title: "Alphabet 2Q 실적 발표", type: "earnings", impact: "high", axis: "stock", daysUntil: 63, description: "I/O 이후 AI 수익화 지표 주목", url: "https://abc.xyz/investor/" },
    ],
  },
  "000660.KS": {
    name: "SK Hynix",
    currency: "KRW",
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
      score: 0.1,
      positive: [
        { text: "글로벌 IT 투자 증가 추세", source: "Gartner", date: "05/15 09:00" },
        { text: "Fed 금리 동결 — 기술 투자 환경 호전", source: "Reuters", sourceUrl: "https://www.reuters.com/", date: "05/19 21:00" },
      ],
      negative: [
        { text: "USD/KRW 환율 불안정 (1,350원대)", source: "한국은행", date: "05/20 09:30" },
        { text: "지정학 리스크 — 한반도 긴장", source: "Bloomberg", sourceUrl: "https://www.bloomberg.com/", date: "05/18 07:00" },
      ],
    },
    industry: {
      score: 0.7,
      positive: [
        { text: "HBM 시장 CAGR 45% 성장 전망", source: "TrendForce", date: "05/16 10:00" },
        { text: "DRAM 현물가 +12% (최근 1개월)", source: "DRAMeXchange", date: "05/20 11:00" },
        { text: "AI 서버 출하량 2배 증가 예상", source: "IDC", date: "05/14 14:00" },
      ],
      negative: [
        { text: "중국 자체 메모리 개발 가속 (CXMT)", source: "IC Insights", date: "05/17 09:00" },
        { text: "삼성전자 HBM3E 양산 추격", source: "연합뉴스", sourceUrl: "https://www.yna.co.kr/", date: "05/19 10:30" },
      ],
    },
    stock: {
      score: 0.5,
      positive: [
        { text: "HBM3E NVIDIA 독점 공급 계약", source: "공시", sourceUrl: "https://dart.fss.or.kr/", date: "05/12 09:00" },
        { text: "1Q 영업이익 컨센서스 상회 (+22%)", source: "DART", sourceUrl: "https://dart.fss.or.kr/", date: "05/08 16:00" },
      ],
      negative: [
        { text: "CAPEX 대폭 증가 — FCF 압박 우려", source: "IR", date: "05/08 17:00" },
        { text: "미국 중국향 AI칩 수출 규제 확대 리스크", source: "Reuters", sourceUrl: "https://www.reuters.com/", date: "05/20 14:00" },
      ],
    },
    news: [
      { title: "SK하이닉스, HBM3E 12H 양산 돌입", source: "공시", sourceUrl: "https://dart.fss.or.kr/", time: "05/21 09:00", sentiment: "positive", axis: "stock" },
      { title: "NVIDIA H200 수요 폭발 — HBM 수혜", source: "Reuters", sourceUrl: "https://www.reuters.com/", time: "05/21 10:30", sentiment: "positive", axis: "industry" },
      { title: "DRAM 가격 3개월 연속 상승", source: "DRAMeXchange", sourceUrl: "https://www.google.com/search?q=DRAM+가격+상승+DRAMeXchange", time: "05/21 11:00", sentiment: "positive", axis: "industry" },
      { title: "미상무부, 중국향 AI칩 규제 검토 보도", source: "WSJ", sourceUrl: "https://www.wsj.com/", time: "05/21 14:00", sentiment: "negative", axis: "macro" },
    ],
    events: [
      { date: "06/03", title: "Computex 2026", type: "conference", impact: "high", axis: "industry", daysUntil: 14, description: "AI/HBM 관련 발표 예정", url: "https://www.computextaipei.com.tw/" },
      { date: "06/12", title: "FOMC 회의", type: "policy", impact: "high", axis: "macro", daysUntil: 23, url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
      { date: "07/25", title: "SK하이닉스 2Q 실적 발표", type: "earnings", impact: "high", axis: "stock", daysUntil: 66, url: "https://www.skhynix.com/ir/" },
    ],
  },
};

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { ticker: "005930.KS", name: "Samsung Electronics", market: "KOSPI" },
  { ticker: "GOOGL", name: "Alphabet (Google)", market: "NASDAQ" },
  { ticker: "000660.KS", name: "SK Hynix", market: "KOSPI" },
];

// ─── Page ────────────────────────────────────────────────────

// Persist watchlist to localStorage (and Supabase when logged in)
function usePersistentWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const user = useAuthStore((s) => s.user);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("investinfo_watchlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setWatchlist(parsed);
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("investinfo_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  return { watchlist, setWatchlist, user };
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { watchlist, setWatchlist, user } = usePersistentWatchlist();
  const [selectedTicker, setSelectedTicker] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("investinfo_watchlist");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].ticker;
        } catch {}
      }
    }
    return "005930.KS";
  });
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
      setLastUpdated(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Find the display name from watchlist for tickers not in mock data
  const selectedWatchItem = watchlist.find((w) => w.ticker === selectedTicker);
  const fallbackData: TickerData = {
    name: selectedWatchItem?.name ?? selectedTicker,
    currency: selectedTicker.endsWith(".KS") ? "KRW" : "USD",
    verdict: { verdict: "hold", confidence: 50, summary: "데이터 수집 중입니다." },
    aiSummary: { sentiment: "neutral", summary: "이 종목은 아직 분석 데이터가 준비되지 않았습니다." },
    macro: { score: 0, positive: [], negative: [] },
    industry: { score: 0, positive: [], negative: [] },
    stock: { score: 0, positive: [], negative: [] },
    news: [],
    events: [],
  };
  const { data: geminiAnalysis, loading: geminiLoading, refresh: refreshGemini } = useGeminiAnalysis(selectedTicker);
  // Merge: mock > gemini > fallback
  const mockData = MOCK_DATA[selectedTicker];
  const ga = geminiAnalysis;
  const data = mockData ?? (ga ? {
    name: selectedWatchItem?.name ?? selectedTicker,
    currency: selectedTicker.endsWith(".KS") ? "KRW" : "USD",
    verdict: { verdict: ga.verdict as any, confidence: ga.confidence, summary: ga.verdictSummary },
    aiSummary: { sentiment: ga.aiSentiment as any, summary: ga.aiSummary },
    macro: ga.macro,
    industry: ga.industry,
    stock: ga.stock,
    news: [],
    events: ga.events,
  } : fallbackData);

  const symbols = useMemo(() => watchlist.map((w) => w.ticker), [watchlist]);
  const { quotes, loading: quotesLoading } = useQuotes(symbols, refreshKey);
  const { data: liveTarget, loading: targetLoading, lastFetched: targetLastFetched, refresh: refreshTarget } = useTargetPrice(selectedTicker);

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
          onSelect={setSelectedTicker}
          onReorder={(fromTicker, toTicker) => {
            const fromIdx = watchlist.findIndex((w) => w.ticker === fromTicker);
            const toIdx = watchlist.findIndex((w) => w.ticker === toTicker);
            if (fromIdx === -1 || toIdx === -1) return;
            const reordered = [...watchlist];
            const [removed] = reordered.splice(fromIdx, 1);
            reordered.splice(toIdx, 0, removed);
            handleReorder(reordered);
          }}
        />

        {/* Controls: Ticker info + Quote + Date + Period */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <TickerLogo ticker={selectedTicker} size={32} />
              <h2 className="text-lg font-bold">{data.name}</h2>
              <QuoteBadge quote={quotes[selectedTicker]} loading={quotesLoading} />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">{selectedTicker}</p>
              <LiveClock />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>

        {/* Stock Chart — right below ticker info */}
        <StockChart symbol={selectedTicker} />

        {/* Target Price — Macro × Industry × Stock = Price */}
        <TargetPriceCard
          currentPrice={quotes[selectedTicker]?.price ?? 0}
          currency={data.currency}
          liveTarget={liveTarget}
          liveTargetLoading={targetLoading}
          lastFetched={targetLastFetched}
          onRefresh={refreshTarget}
          macroScore={data.macro.score}
          industryScore={data.industry.score}
          stockScore={data.stock.score}
        />

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
          summary={geminiLoading ? "AI 분석 중..." : data.aiSummary.summary}
          updatedAt={ga?.queryTime ? new Date(ga.queryTime).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }) + " KST (Gemini)" : selectedDate.toLocaleDateString("ko-KR") + " KST"}
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

        {/* Upcoming Events */}
        <UpcomingEvents events={data.events} />

        {/* News Timeline — live + mock merged, positive/negative split */}
        <NewsTimeline ticker={selectedTicker} tickerName={data.name} mockItems={[]} />
      </main>
    </TooltipProvider>
  );
}
