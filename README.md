# Senus PLC — Board Report

An AI-native board reporting platform built on Senus PLC's audited FY2024/FY2025 financials, for Management, the Board, Equity Investors and Credit Providers.

**Live demo (React artifact):** `senus_board_report_app.jsx` — a fully interactive, self-contained build of the app. This is the fastest way to see the product; open it in a React sandbox (e.g. Claude, CodeSandbox, StackBlitz) and it runs with no setup.

**Production codebase:** the rest of this repo — a Next.js + Prisma + SQLite full-stack app with real API routes, a relational data model, and an AI extraction pipeline, structured to be cloned and run locally (`npm run setup && npm run dev`).

---

## 1. What this is, in one paragraph

Senus's Euronext Information Document discloses real but partial financials for a pre-profitability, growth-stage SaaS company. Rather than building a generic "chart the numbers" dashboard, I built a reporting tool that (a) extracts the disclosed figures faithfully, (b) computes every metric a board report should show, and (c) is explicit — to the point of refusing to compute a number — when the source disclosure genuinely doesn't support a calculation (EBITDA, DSCR, ROCE). That last decision is the one I'd most want a reviewer to notice: a board report that quietly guesses at ROCE is worse than one that says "we can't calculate this and here's exactly why."

## 2. Architecture

```
senus-board-report/
├── senus_board_report_app.jsx   ← interactive demo build (React, single file)
├── data/
│   ├── senus_extracted.json     ← AI-extracted structured financials (source of truth)
│   └── fallback_insights.json   ← cached, human-validated AI commentary
├── scripts/
│   └── extract_financials.py    ← AI extraction pipeline (PDF → structured JSON)
├── prisma/
│   ├── schema.prisma            ← relational data model
│   └── seed.ts                  ← loads senus_extracted.json into the DB
└── src/
    ├── lib/
    │   ├── metrics.ts           ← deterministic financial calculation engine
    │   └── ai-insights.ts       ← Claude API wrapper + cached fallback
    └── app/
        ├── page.tsx             ← login/landing
        ├── dashboard/page.tsx   ← client dashboard (fetches from API routes)
        └── api/
            ├── financials/route.ts
            └── insights/route.ts
```

**Data flow:** source PDF → `extract_financials.py` (AI extraction, validated) → `senus_extracted.json` → `prisma/seed.ts` → SQLite → `/api/financials` (deterministic metrics via `lib/metrics.ts`) → dashboard. `/api/insights` takes the *computed* metrics (not raw text) and asks Claude for board commentary, with `data/fallback_insights.json` served whenever `ANTHROPIC_API_KEY` is unset — the app never breaks demo-time on a missing key or a network hiccup.

**Why Next.js + Prisma + SQLite, not a bigger stack:** the assignment rewards clear technical decisions over maximal infrastructure. SQLite means a reviewer can clone the repo and have a working DB in one command with zero external services, while the Prisma schema is written to be Postgres-compatible on day one — swapping `provider = "sqlite"` for `"postgresql"` and pointing `DATABASE_URL` at a real instance is the only change needed to scale it (see §6).

**Why two deliverables (artifact + codebase) instead of one:** I don't have a way to `npm install` or run a live Node/Postgres server in the sandboxed environment I built this in (no package-registry network access — see §5). Rather than hand over unverified backend code as "the demo," I built the actual interactive product as a dependency-light React build I could fully exercise, and the production Next.js/Prisma/API layer as the real, cloneable codebase for the GitHub repo. Both share the same data, the same metrics logic, and the same design system — the artifact is not a mockup of the codebase, it's the same app built two ways.

## 3. AI-assisted development workflow

- **Extraction:** `scripts/extract_financials.py` sends the source PDF to Claude with a strict JSON-schema system prompt that (a) forbids computing derived figures at extraction time — margins, growth rates, EBITDA — and (b) requires every gap in disclosure to be recorded in a `dataGaps` array rather than silently dropped. A second, non-AI validation pass (`validate_extraction()`) re-derives simple accounting identities (revenue − COGS = gross profit; cash roll-forward reconciles) from the extracted figures and fails loudly if they don't hold. For this submission, the dataset in `data/senus_extracted.json` was produced by an equivalent AI-assisted reading pass in an interactive Claude session against the same source document (I didn't have API-key/network access to execute the script end-to-end in the sandbox it was built in) — see §7 for exactly how each figure was cross-checked.
- **Calculation:** deliberately *not* AI. `src/lib/metrics.ts` is plain, deterministic TypeScript. Margins, growth rates, cash runway and the growth trajectory are arithmetic on already-extracted numbers — there's no reason to spend a model call (or introduce model variance) on subtraction and division. This was the main reliability decision in the pipeline.
- **Commentary:** `src/lib/ai-insights.ts` is the one place AI generates prose, and it's given the *computed* metrics object as its only input, with an explicit system-prompt rule to name a metric as unavailable rather than approximate it when it's in the `flags` array.
- **Tooling used to build this:** Claude (Anthropic), used for architecture/design decisions, code generation, and the financial-document extraction pass described above. I reviewed every extracted figure against the source document's own numbers (§7) and every calculated metric by hand before including it.

## 4. Assumptions made

- **No H1 FY2026 data.** The brief notes Senus reported half-year results (to 31 Dec 2025) in March 2026, but no version of that report with figures was available in the source materials I could access. The report is built on the audited FY2024/FY2025 annuals and says so explicitly on the Overview screen, rather than presenting stale FY2025 data as if it were current.
- **Growth trajectory is a target, not a forecast.** The "Senus 2030" chart applies the Board's own stated minimum 50% CAGR to the FY2025 base — it's labelled "illustrative... not guidance" everywhere it appears, and isn't used as an input to any other metric.
- **Pro-forma cash runway is a simplification.** It adds the disclosed €1.1m December 2025 placement to FY2025 closing cash and holds the FY2025 burn rate constant. The AI commentary panel flags, unprompted, that this likely understates real burn once placement proceeds are deployed into growth hires and the Loamin integration.
- **MoM revenue was intentionally omitted.** The source document discloses annual (FY) and some FY-level channel data only — no monthly series exists to report accurately, so I didn't fabricate one. YoY and channel/geographic trends are used instead.

## 5. How outputs were validated

1. **Accounting identity checks** (also automated in `extract_financials.py`): FY2025 revenue (€836,991) − COGS (€188,541) = €648,450, matching disclosed gross profit exactly. FY2025 cash roll-forward: €424,639 opening + (−€374,820 operating) + (−€3,451 investing) + €93,767 financing = €140,135, matching disclosed closing cash exactly. Both reconciled with no adjustment — a good sign the extraction was faithful.
2. **Cross-check against the document's own stated deltas.** The Information Document states admin expenses "decreased by 18%" and operating loss "decreased by 44%" YoY; I independently recomputed both from the extracted P&L lines and got 17.6% and 43.96% respectively — consistent with the source's own rounding.
3. **Explicit non-calculation over estimation.** Wherever a standard board metric (EBITDA, DSCR, ROCE) could not be traced to a disclosed figure, it's flagged rather than modelled — see `dataGaps` in `senus_extracted.json`, the `flags` array from `computeMetrics()`, and the "Known data gaps" panel in the AI Insights tab.

## 6. Scaling to Postgres / production

- `prisma/schema.prisma`: change `datasource db { provider = "sqlite" }` to `"postgresql"` and point `DATABASE_URL` at a managed instance (Neon, RDS, Supabase). No model changes required.
- `scripts/extract_financials.py` is designed to run as a scheduled job against new regulated-news filings (half-year/full-year results), writing a new period into `senus_extracted.json` / the DB rather than replacing it — the schema already supports multiple periods per company.
- `src/lib/ai-insights.ts` caches generated insights against a hash of the metrics they were generated from (`Insight.metricsHash` in the schema), so re-deploys and repeat page loads don't re-call the model unless the underlying numbers actually changed.

## 7. Running it locally

```bash
npm run setup   # install deps, create the SQLite DB, seed it from data/senus_extracted.json
npm run dev     # http://localhost:3000
```

To exercise the live AI extraction pipeline against a fresh filing:

```bash
pip install -r scripts/requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python scripts/extract_financials.py --pdf ./some_filing.pdf --out ./data/senus_extracted.json
npm run seed
```

To enable live AI board commentary instead of the cached fallback, set `ANTHROPIC_API_KEY` in `.env` before `npm run dev`.

**A note on what I could and couldn't verify:** this codebase was written in a sandboxed environment without package-registry network access, so I wasn't able to run `npm install` / `npx prisma db push` / `npm run dev` myself to execute-test the Next.js app end-to-end. I checked every file for syntactic and type correctness by hand and kept the calculation logic identical to the artifact build (which I could and did fully exercise). Please run `npm run setup && npm run dev` locally before recording the demo or submitting, and open an issue/ping me if anything doesn't come up cleanly — happy to fix it live.

## 8. Source

Senus PLC, *Information Document — Direct Listing on Euronext Access* (filed 17 Dec 2025): https://live.euronext.com/sites/default/files/2025-12/SENUS%20PLC%20-%20Information%20Document.pdf
