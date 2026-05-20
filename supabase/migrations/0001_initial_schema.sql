-- ============================================================
-- InvestInfo: Initial Schema
-- ============================================================

-- 1. Watchlist (per user)
create table if not exists watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  name        text not null,
  market      text not null default '',
  sector      text,
  created_at  timestamptz not null default now(),
  unique(user_id, ticker)
);

create index idx_watchlist_user on watchlist(user_id);

alter table watchlist enable row level security;
create policy "users own their watchlist" on watchlist
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. News items (collected from external sources)
create table if not exists news_items (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  summary         text,
  source_url      text,
  source_name     text not null,
  axis            text not null check (axis in ('macro', 'industry', 'stock')),
  sentiment       text not null default 'neutral' check (sentiment in ('positive', 'negative', 'neutral')),
  sentiment_score real,
  related_ticker  text,
  published_at    timestamptz,
  collected_at    timestamptz not null default now()
);

create index idx_news_ticker_date on news_items(related_ticker, published_at desc);
create index idx_news_axis on news_items(axis, published_at desc);

-- News is public read, only system writes
alter table news_items enable row level security;
create policy "news public read" on news_items
  for select using (true);

-- 3. Economic indicators
create table if not exists indicators (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text not null default 'macro',
  value           real not null,
  previous_value  real,
  unit            text not null default '',
  source          text not null,
  source_url      text,
  recorded_at     date not null,
  collected_at    timestamptz not null default now()
);

create index idx_indicators_name_date on indicators(name, recorded_at desc);

alter table indicators enable row level security;
create policy "indicators public read" on indicators
  for select using (true);

-- 4. AI-generated reports
create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null,
  period_type     text not null check (period_type in ('hourly', 'daily', 'weekly', 'monthly')),
  period_date     date not null,
  -- Verdict
  verdict         text not null default 'hold' check (verdict in ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')),
  verdict_confidence integer not null default 50,
  verdict_summary text,
  -- AI summary
  ai_sentiment    text not null default 'neutral' check (ai_sentiment in ('positive', 'negative', 'neutral')),
  ai_summary      text,
  -- 3-axis factors (JSONB arrays of {text, source, sourceUrl, sentiment})
  macro_factors   jsonb not null default '[]'::jsonb,
  industry_factors jsonb not null default '[]'::jsonb,
  stock_factors   jsonb not null default '[]'::jsonb,
  -- Metadata
  created_at      timestamptz not null default now(),
  unique(ticker, period_type, period_date)
);

create index idx_reports_ticker_date on reports(ticker, period_type, period_date desc);

alter table reports enable row level security;
create policy "reports public read" on reports
  for select using (true);

-- 5. Upcoming events
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  event_date  date not null,
  event_type  text not null check (event_type in ('earnings', 'conference', 'economic', 'policy', 'product', 'ipo', 'dividend')),
  impact      text not null default 'medium' check (impact in ('high', 'medium', 'low')),
  axis        text not null check (axis in ('macro', 'industry', 'stock')),
  description text,
  related_ticker text,
  source_url  text,
  created_at  timestamptz not null default now()
);

create index idx_events_date on events(event_date);
create index idx_events_ticker on events(related_ticker, event_date);

alter table events enable row level security;
create policy "events public read" on events
  for select using (true);

-- 6. Notification settings (per user, future use)
create table if not exists notification_settings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  channel         text not null check (channel in ('slack', 'kakao')),
  webhook_url     text,
  hourly_enabled  boolean not null default false,
  daily_enabled   boolean not null default true,
  weekly_enabled  boolean not null default true,
  monthly_enabled boolean not null default false,
  alert_on_emergency boolean not null default true,
  created_at      timestamptz not null default now(),
  unique(user_id, channel)
);

alter table notification_settings enable row level security;
create policy "users own their notification settings" on notification_settings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
