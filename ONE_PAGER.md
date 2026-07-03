# Senus PLC Board Report — One-Page Summary

**What I built:** An AI-native board reporting platform for Senus PLC covering Growth & Revenue, Profitability, Cash & Liquidity, Solvency & Returns, and AI-generated board commentary — built on real, audited FY2024/FY2025 financials extracted from Senus's Euronext Information Document, with role-based views for Management, the Board, Equity Investors, and Credit Providers.

**Architecture:** Next.js (App Router) + TypeScript + Prisma/SQLite + Tailwind, with a Python AI extraction pipeline (Claude) feeding a relational data model, a deterministic TypeScript calculation engine, and a Claude-powered commentary API with a cached fallback. A fully interactive React build of the same product is included as the demo artifact.

**The decision I'd most defend:** keeping AI out of arithmetic. The extraction pipeline uses Claude to *retrieve* disclosed figures (with a validation pass re-checking accounting identities like cash roll-forward), but every margin, growth rate, and runway calculation is deterministic TypeScript. AI is used again, deliberately, only for the one task well-suited to it — turning computed metrics into board-appropriate prose — and even there it's told to name a metric as unavailable rather than approximate it.

**Where the source data ran out, and what I did about it:** the Information Document doesn't disclose D&A, a debt service schedule, or a full balance sheet — so EBITDA, DSCR, and ROCE aren't reliably calculable. Rather than estimate them (which would be presented to Credit Providers and investors), the app flags each one explicitly, with the specific missing disclosure named, in both the data model (`dataGaps`) and the UI. No H1 FY2026 figures were publicly available at extraction time, so the report is built on the audited annuals and says so on the first screen, rather than implying it's more current than it is.

**Validation:** every extracted figure reconciles against the source's own accounting identities (revenue − COGS = gross profit; the FY2025 cash roll-forward ties out exactly to disclosed closing cash) and against the document's own stated YoY deltas (e.g. "-44% operating loss," "-18% admin costs," both independently reproduced from the extracted line items).

**What I'd do with more time:** wire the extraction pipeline to run automatically against new Euronext regulated-news filings (the schema already supports multiple periods); add a real auth layer instead of the demo persona-selector; and, once H1 FY2026 figures are published, add a MoM view — the current annual-only disclosure doesn't support one without fabricating interim data points.

**Tools used:** Claude (Anthropic) for architecture, code generation, and the document extraction/validation pass, with every extracted figure and calculated metric checked by hand against the source document before inclusion.
