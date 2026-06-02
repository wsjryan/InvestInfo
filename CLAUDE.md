# CLAUDE.md

## Project

투자 정보 분석 / 차트 / 뉴스 자동화 웹앱. 모노레포 구조 — 실제 Next.js 앱은 `web/` 안에 있음. `web/CLAUDE.md` 에 상세 가이드.

## Architecture

```
web/              — Next.js 16 앱 (App Router, Supabase, Anthropic SDK, lightweight-charts)
securities/       — 종목 데이터 / 스크립트
supabase/         — DB 마이그레이션
docs/, PRD.md     — 설계 문서
```

## 일상 명령

```bash
cd web
npm install
npx vercel env pull .env.local   # Supabase / Anthropic 키
npm run dev                       # http://localhost:3000
```
