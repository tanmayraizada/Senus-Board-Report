import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  LogIn, TrendingUp, PiggyBank, Shield, Target, Users, Sparkles,
  LayoutGrid, ArrowUpRight, ArrowDownRight, AlertTriangle, Leaf, ChevronRight,
} from "lucide-react";

/* ============================================================================
   DESIGN TOKENS
   Canvas: warm parchment (financial-ledger paper, not generic AI cream/terracotta)
   Ink: deep forest-charcoal — structural chrome
   Moss: brand green — positive movement
   Soil: muted clay-brown — negative movement / attention (deliberately not red)
   Gold: strategy targets / benchmarks
   ========================================================================= */
const T = {
  canvas: "#F5F2EA",
  panel: "#FFFFFF",
  ink: "#14231C",
  inkSoft: "#2B392F",
  moss: "#3E6B52",
  mossSoft: "#DCE7DE",
  soil: "#8B4A34",
  soilSoft: "#F0E0D8",
  slate: "#63706A",
  hair: "#DBD5C4",
  gold: "#AD8A3D",
  goldSoft: "#F1E7D2",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

/* ============================================================================
   DATA — extracted without material adjustment from the Senus PLC Information
   Document (Section 7.1 Summary Financial Information). See data/senus_extracted.json
   and README for full provenance + the AI extraction workflow used.
   ========================================================================= */
const DATA = {
  company: {
    name: "Senus PLC", ticker: "SENUS", isin: "IE000O0F49R3",
    market: "Euronext Access+ Dublin", listed: "22 Dec 2025",
    employees: 18, sharesInIssue: 2561332, admissionPrice: 5.126, marketCap: 13130000,
    placement: 1100000,
  },
  FY2024: {
    label: "FY2024", revenue: 688317, grossProfit: 432477, cogs: 255840,
    admin: 1560853, opLoss: -1130729, pbt: -1130458, pat: -1098095,
    rdPct: 0.22, netAssets: 574681, retained: -275425,
    debtors: 142361, creditors: 26768, cashClose: 424639, cashOpen: 1628654,
    cfOp: -1166697, cfInv: -33472, cfFin: -3846, cfNet: -1204015,
    intlPct: 0.05,
  },
  FY2025: {
    label: "FY2025", revenue: 836991, grossProfit: 648450, cogs: 188541,
    admin: 1286058, opLoss: -633694, pbt: -635768, pat: -590256,
    rdPct: 0.17, netAssets: -15575, retained: -865681,
    debtors: 66990, creditors: 55246, cashClose: 140135, cashOpen: 424639,
    cfOp: -374820, cfInv: -3451, cfFin: 93767, cfNet: -284504,
    intlPct: 0.22,
    customers: { total: 138, enterprise: 36, independent: 98, rd: 4 },
    mixPct: { enterprise: 0.69, independent: 0.04, rd: 0.27 },
    acv: { soil: 12309, terrain: 21524, era: 58900 },
    newLoan: 100000, creditorsOver1yrIncrease: 83655,
  },
  strategy: {
    cagr: 0.50, ebitdaTarget: "FY2028", enterpriseTarget2030: 100,
    acvTarget2030: 50000, irelandShareTarget2030: 0.50,
  },
  dataGaps: [
    "No separate EBITDA / D&A is disclosed — Operating Loss is the closest disclosed EBIT proxy; a true EBITDA bridge can't be built without a D&A line.",
    "No interest rate or amortisation schedule is disclosed for the SBCI-backed term loan, so Debt Service Coverage Ratio is not reliably calculable — flagged, not estimated.",
    "No full balance sheet (total assets, fixed assets) is disclosed, only summary net asset/liability and named working-capital lines, so ROCE is not reliably calculable.",
    "No H1 FY2026 (to 31 Dec 2025) results were publicly available at extraction time — this report is built on audited FY2024/FY2025 annuals.",
  ],
};

const fmtEUR = (n, opts = {}) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0, ...opts }).format(n);
const fmtPct = (n, dp = 1) => `${(n * 100).toFixed(dp)}%`;
const pp = (a, b) => `${((a - b) * 100).toFixed(1)}pp`;

/* ---- derived metrics (computed, not hardcoded, from the two periods) ---- */
function useMetrics() {
  return useMemo(() => {
    const a = DATA.FY2024, b = DATA.FY2025;
    const grossMarginA = a.grossProfit / a.revenue, grossMarginB = b.grossProfit / b.revenue;
    const opMarginA = a.opLoss / a.revenue, opMarginB = b.opLoss / b.revenue;
    const netMarginA = a.pat / a.revenue, netMarginB = b.pat / b.revenue;
    const revGrowth = (b.revenue - a.revenue) / a.revenue;
    const gpGrowth = (b.grossProfit - a.grossProfit) / a.grossProfit;
    const opLossImprovement = (Math.abs(a.opLoss) - Math.abs(b.opLoss)) / Math.abs(a.opLoss);
    const netLossImprovement = (Math.abs(a.pat) - Math.abs(b.pat)) / Math.abs(a.pat);
    const fcfA = a.cfOp + a.cfInv, fcfB = b.cfOp + b.cfInv;
    const monthlyBurn = Math.abs(b.cfOp) / 12;
    const runwayMonths = b.cashClose / monthlyBurn;
    const proFormaCash = b.cashClose + DATA.company.placement;
    const proFormaRunwayMonths = proFormaCash / monthlyBurn;
    const trajectory = [];
    let rev = b.revenue;
    for (let y = 2026; y <= 2030; y++) { rev = rev * (1 + DATA.strategy.cagr); trajectory.push({ year: `FY${y}`, revenue: Math.round(rev) }); }
    return {
      grossMarginA, grossMarginB, opMarginA, opMarginB, netMarginA, netMarginB,
      revGrowth, gpGrowth, opLossImprovement, netLossImprovement, fcfA, fcfB,
      monthlyBurn, runwayMonths, proFormaCash, proFormaRunwayMonths, trajectory,
    };
  }, []);
}

function buildWaterfall(steps) {
  let running = 0; const out = [];
  steps.forEach((s, i) => {
    if (s.total) { out.push({ name: s.name, base: 0, value: s.value, isTotal: true }); running = s.value; return; }
    const start = running, end = running + s.value;
    out.push({ name: s.name, base: Math.min(start, end), value: Math.abs(s.value), delta: s.value, isTotal: false });
    running = end;
  });
  return out;
}

/* ============================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */
function Badge({ children, tone = "slate" }) {
  const map = {
    moss: { bg: T.mossSoft, fg: T.moss }, soil: { bg: T.soilSoft, fg: T.soil },
    gold: { bg: T.goldSoft, fg: T.gold }, slate: { bg: "#EDEAE0", fg: T.slate },
  };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 0.3, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function DeltaTag({ value, goodIfUp = true, format = fmtPct }) {
  const up = value >= 0;
  const good = goodIfUp ? up : !up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: good ? T.moss : T.soil, fontSize: 12.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
      <Icon size={13} strokeWidth={2.5} />{format(Math.abs(value))}
    </span>
  );
}

function Card({ title, eyebrow, action, children, style }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "20px 22px", ...style }}>
      {(title || eyebrow) && (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            {eyebrow && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 1, color: T.slate, textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>}
            {title && <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, color: T.ink, margin: 0 }}>{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, delta, goodIfUp = true, icon: Icon }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 180 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 0.6, color: T.slate, textTransform: "uppercase" }}>{label}</div>
        {Icon && <Icon size={15} color={T.slate} strokeWidth={1.8} />}
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: T.ink, marginTop: 6 }}>{value}</div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        {delta !== undefined && <DeltaTag value={delta} goodIfUp={goodIfUp} />}
        {sub && <span style={{ fontSize: 12, color: T.slate }}>{sub}</span>}
      </div>
    </div>
  );
}

function SoilRule() {
  const bands = [T.ink, T.moss, T.gold, T.soil, T.slate];
  return (
    <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", margin: "18px 0 28px" }}>
      {bands.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
    </div>
  );
}

function Callout({ tone = "gold", title, children }) {
  const map = { gold: { bg: T.goldSoft, fg: T.gold }, soil: { bg: T.soilSoft, fg: T.soil }, moss: { bg: T.mossSoft, fg: T.moss } };
  const c = map[tone];
  return (
    <div style={{ background: c.bg, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <AlertTriangle size={16} color={c.fg} style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        {title && <div style={{ fontWeight: 700, fontSize: 13, color: c.fg, marginBottom: 3 }}>{title}</div>}
        <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>
  );
}

/* ============================================================================
   LOGIN
   ========================================================================= */
function Login({ onEnter }) {
  const [persona, setPersona] = useState("management");
  const personas = [
    { id: "management", label: "Management", desc: "Full operating detail" },
    { id: "board", label: "Board", desc: "Strategy vs. Senus 2030 targets" },
    { id: "investor", label: "Equity Investor", desc: "Growth & returns lens" },
    { id: "credit", label: "Credit Provider", desc: "Liquidity & solvency lens" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{FONTS}</style>
      <div style={{ width: 420, background: T.canvas, borderRadius: 14, padding: "36px 34px", boxShadow: "0 30px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Leaf size={20} color={T.moss} strokeWidth={2} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1.5, color: T.slate }}>SENUS · BOARD REPORT</span>
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 28, color: T.ink, margin: "10px 0 2px" }}>Natural Capital,<br />measured in euros.</h1>
        <p style={{ color: T.slate, fontSize: 13.5, lineHeight: 1.5, margin: "8px 0 22px" }}>
          FY2024–FY2025 audited financials, live modelled against the Senus 2030 strategy. Choose how you'd like to read it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
          {personas.map(p => (
            <button key={p.id} onClick={() => setPersona(p.id)}
              style={{
                textAlign: "left", cursor: "pointer", border: `1.5px solid ${persona === p.id ? T.moss : T.hair}`,
                background: persona === p.id ? T.mossSoft : T.panel, borderRadius: 9, padding: "10px 12px",
              }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{p.label}</div>
              <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={() => onEnter(persona)} style={{
          width: "100%", background: T.ink, color: "#fff", border: "none", borderRadius: 9, padding: "12px 0",
          fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <LogIn size={15} /> Enter Board Report
        </button>
        <div style={{ marginTop: 14, fontSize: 11, color: T.slate, textAlign: "center" }}>
          Demo credentials pre-filled · no data leaves this session
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SECTIONS
   ========================================================================= */
function Overview({ m, persona }) {
  const a = DATA.FY2024, b = DATA.FY2025;
  const focus = {
    management: "Full operating detail across growth, cost discipline and cash.",
    board: "Progress against the Senus 2030 strategy: 50%+ CAGR and EBITDA-positive by FY2028.",
    investor: "Revenue growth, margin trajectory and the path to scale.",
    credit: "Cash runway, working capital and disclosed debt obligations.",
  };
  return (
    <div>
      <Card eyebrow="Board Report · Overview" title={`Senus PLC — FY2025 performance vs. FY2024`}
        action={<Badge tone="gold">Focus: {focus[persona] ? persona : "management"}</Badge>}>
        <p style={{ color: T.inkSoft, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{focus[persona]}</p>
      </Card>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "16px 0" }}>
        <KpiCard label="Revenue FY2025" value={fmtEUR(b.revenue)} delta={m.revGrowth} sub="vs FY2024" icon={TrendingUp} />
        <KpiCard label="Gross Margin" value={fmtPct(m.grossMarginB, 1)} delta={m.grossMarginB - m.grossMarginA} sub={pp(m.grossMarginB, m.grossMarginA) + " vs FY24"} icon={Target} />
        <KpiCard label="Operating Loss" value={fmtEUR(b.opLoss)} delta={m.opLossImprovement} sub="improvement YoY" icon={Shield} />
        <KpiCard label="Cash on hand" value={fmtEUR(b.cashClose)} sub={`~${m.runwayMonths.toFixed(1)} mo. runway at FY25 burn`} icon={PiggyBank} />
        <KpiCard label="Customers" value={b.customers.total} sub={`${b.customers.enterprise} Enterprise · ${b.customers.independent} Independent · ${b.customers.rd} R&D`} icon={Users} />
      </div>
      <Callout tone="gold" title="Since year-end (not yet reflected in FY2025 financials)">
        Senus completed the Loamin Ltd acquisition (14 Nov 2025), a €1.1m Private Placement (Dec 2025), and listed on Euronext Access+ Dublin (22 Dec 2025) at a €13.13m market cap. No H1 FY2026 results were publicly available at the time this report was generated.
      </Callout>
    </div>
  );
}

function GrowthRevenue({ m }) {
  const b = DATA.FY2025;
  const revBars = [
    { name: "FY2024", Revenue: DATA.FY2024.revenue }, { name: "FY2025", Revenue: b.revenue },
  ];
  const mix = [
    { name: "Enterprise", value: b.mixPct.enterprise, customers: b.customers.enterprise, fill: T.moss },
    { name: "R&D", value: b.mixPct.rd, customers: b.customers.rd, fill: T.gold },
    { name: "Independent", value: b.mixPct.independent, customers: b.customers.independent, fill: T.soil },
  ];
  const acv = [
    { name: "Senus SOIL", ACV: b.acv.soil }, { name: "Senus TERRAIN", ACV: b.acv.terrain }, { name: "Senus ERA", ACV: b.acv.era },
  ];
  const geo = [
    { name: "FY2024", Ireland: (1 - DATA.FY2024.intlPct) * 100, International: DATA.FY2024.intlPct * 100 },
    { name: "FY2025", Ireland: (1 - b.intlPct) * 100, International: b.intlPct * 100 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Revenue, FY2024 → FY2025" eyebrow="Growth" style={{ flex: 2, minWidth: 320 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revBars} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.slate }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.hair}` }} />
              <Bar dataKey="Revenue" fill={T.moss} radius={[5, 5, 0, 0]} barSize={70} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 6 }}><DeltaTag value={m.revGrowth} /> <span style={{ fontSize: 12, color: T.slate, marginLeft: 6 }}>revenue growth YoY · €{(b.revenue - DATA.FY2024.revenue).toLocaleString()} added</span></div>
        </Card>
        <Card title="Revenue mix, FY2025" eyebrow="By channel" style={{ flex: 1, minWidth: 260 }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2}>
                {mix.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [`${(v * 100).toFixed(0)}% · ${p.payload.customers} customers`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {mix.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkSoft }}><span style={{ width: 8, height: 8, borderRadius: 8, background: e.fill, display: "inline-block" }} />{e.name}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: T.slate }}>{(e.value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Enterprise ACV by product" eyebrow="Contract value, FY2025" style={{ flex: 1, minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={acv} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="ACV" fill={T.gold} radius={[0, 5, 5, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Board target: average Enterprise ACV &gt; {fmtEUR(DATA.strategy.acvTarget2030)} by FY2030.</div>
        </Card>
        <Card title="Geographic mix" eyebrow="Ireland vs. international revenue" style={{ flex: 1, minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={geo} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v.toFixed(0)}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="Ireland" stackId="g" fill={T.moss} radius={[0, 0, 0, 0]} />
              <Bar dataKey="International" stackId="g" fill={T.gold} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>International share grew from ~5% (FY24) to 22% (FY25). Board target: Ireland &lt; 50% of revenue by FY2030.</div>
        </Card>
      </div>
      <Card title="Senus 2030 — illustrative growth trajectory" eyebrow="Strategy modelling, not guidance">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={[{ year: "FY2025", revenue: b.revenue }, ...m.trajectory]} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1e6).toFixed(1)}m`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="revenue" stroke={T.gold} strokeWidth={2.5} dot={{ r: 3.5, fill: T.gold }} strokeDasharray="6 4" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Line plots the Board's minimum 50% CAGR target (Senus 2030) from the FY2025 base of {fmtEUR(b.revenue)} — this is a target trajectory, not a management forecast.</div>
      </Card>
    </div>
  );
}

function Profitability({ m }) {
  const a = DATA.FY2024, b = DATA.FY2025;
  const margins = [
    { name: "Gross Margin", FY2024: a.grossProfit / a.revenue, FY2025: b.grossProfit / b.revenue },
    { name: "Operating Margin", FY2024: a.opLoss / a.revenue, FY2025: b.opLoss / b.revenue },
    { name: "Net Margin", FY2024: a.pat / a.revenue, FY2025: b.pat / b.revenue },
  ];
  const costs = [
    { name: "FY2024", COGS: a.cogs, Admin: a.admin }, { name: "FY2025", COGS: b.cogs, Admin: b.admin },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KpiCard label="Gross Margin" value={fmtPct(m.grossMarginB)} delta={m.grossMarginB - m.grossMarginA} sub={`vs ${fmtPct(m.grossMarginA)} FY24`} icon={Target} />
        <KpiCard label="Operating Margin" value={fmtPct(m.opMarginB)} sub={`vs ${fmtPct(m.opMarginA)} FY24`} delta={m.opLossImprovement} icon={TrendingUp} />
        <KpiCard label="Net Margin" value={fmtPct(m.netMarginB)} sub={`vs ${fmtPct(m.netMarginA)} FY24`} delta={m.netLossImprovement} icon={Shield} />
        <KpiCard label="R&D Intensity" value={fmtPct(b.rdPct)} sub={`of revenue, vs ${fmtPct(a.rdPct)} FY24`} delta={a.rdPct - b.rdPct} icon={Sparkles} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Margin trajectory" eyebrow="FY2024 vs FY2025" style={{ flex: 1, minWidth: 320 }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={margins} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11.5, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtPct(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="FY2024" fill={T.slate} radius={[4, 4, 0, 0]} />
              <Bar dataKey="FY2025" fill={T.moss} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Cost base" eyebrow="COGS vs. Admin expenses" style={{ flex: 1, minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={costs} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="COGS" stackId="c" fill={T.soil} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Admin" stackId="c" fill={T.gold} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Admin expenses fell 18% YoY (staff cost optimisation) even as revenue grew 22%.</div>
        </Card>
      </div>
    </div>
  );
}

function CashLiquidity({ m }) {
  const b = DATA.FY2025, a = DATA.FY2024;
  const wf = buildWaterfall([
    { name: "Opening Cash", value: b.cashOpen, total: true },
    { name: "Operating CF", value: b.cfOp },
    { name: "Investing CF", value: b.cfInv },
    { name: "Financing CF", value: b.cfFin },
    { name: "Closing Cash", value: b.cashClose, total: true },
  ]);
  const wcap = [
    { name: "Trade Debtors", FY2024: a.debtors, FY2025: b.debtors },
    { name: "Trade Creditors", FY2024: a.creditors, FY2025: b.creditors },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KpiCard label="Cash on hand" value={fmtEUR(b.cashClose)} sub="at 30 Jun 2025" icon={PiggyBank} />
        <KpiCard label="Operating cash burn" value={fmtEUR(m.monthlyBurn)} sub="per month, FY25 run-rate" icon={TrendingUp} goodIfUp={false} />
        <KpiCard label="Runway (FY25 cash)" value={`${m.runwayMonths.toFixed(1)} mo.`} sub="at FY25 burn, pre-placement" icon={Shield} />
        <KpiCard label="Pro-forma runway" value={`${m.proFormaRunwayMonths.toFixed(0)} mo.`} sub={`incl. €1.1m Dec-25 placement`} icon={Sparkles} />
      </div>
      <Card title="Cash bridge, FY2025" eyebrow="Opening → operating → investing → financing → closing">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={wf} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: "#fff", border: `1px solid ${T.hair}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div>{fmtEUR(d.isTotal ? d.value : d.delta)}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="base" stackId="w" fill="transparent" />
            <Bar dataKey="value" stackId="w" radius={[4, 4, 4, 4]}>
              {wf.map((e, i) => <Cell key={i} fill={e.isTotal ? T.ink : e.delta >= 0 ? T.moss : T.soil} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Net cash used in operations fell 68% YoY (€1.17m → €375k) as the operating loss narrowed and working capital improved.</div>
      </Card>
      <Card title="Working capital" eyebrow="Trade debtors & creditors">
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={wcap} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="FY2024" fill={T.slate} radius={[4, 4, 0, 0]} />
            <Bar dataKey="FY2025" fill={T.moss} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Debtors fell €51.7k (faster collection); trade creditors rose €28.5k — both net working-capital inflows that helped narrow the cash burn.</div>
      </Card>
    </div>
  );
}

function SolvencyReturns() {
  const a = DATA.FY2024, b = DATA.FY2025;
  const netA = [{ name: "FY2024", value: a.netAssets }, { name: "FY2025", value: b.netAssets }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <KpiCard label="Net Assets / (Liabilities)" value={fmtEUR(b.netAssets)} sub={`vs ${fmtEUR(a.netAssets)} FY24`} icon={Shield} goodIfUp={true} delta={undefined} />
        <KpiCard label="Disclosed term debt" value={fmtEUR(b.newLoan)} sub="new SBCI-backed loan, FY25" icon={PiggyBank} />
        <KpiCard label="Retained earnings" value={fmtEUR(b.retained)} sub={`vs ${fmtEUR(a.retained)} FY24`} icon={Target} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Net asset position" eyebrow="Solvency" style={{ flex: 1, minWidth: 280 }}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={netA} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.slate }} axisLine={{ stroke: T.hair }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.slate }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={70}>
                {netA.map((e, i) => <Cell key={i} fill={e.value >= 0 ? T.moss : T.soil} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, color: T.slate, marginTop: 4 }}>Senus moved to a small net liability position (€(15,575)) at FY25 year-end, driven by accumulated losses during the development phase — a normal pattern for a pre-profitability growth-stage technology company, and one the Dec-2025 €1.1m placement addresses.</div>
        </Card>
        <Card title="Alternative returns lens" eyebrow="Revenue efficiency" style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {[
              { label: "Revenue per employee", value: fmtEUR(b.revenue / DATA.company.employees) },
              { label: "Revenue per Enterprise customer", value: fmtEUR((b.revenue * b.mixPct.enterprise) / b.customers.enterprise) },
              { label: "Revenue per R&D account", value: fmtEUR((b.revenue * b.mixPct.rd) / b.customers.rd) },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 2 ? `1px solid ${T.hair}` : "none" }}>
                <span style={{ fontSize: 13, color: T.inkSoft }}>{r.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: T.ink }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Callout tone="soil" title="Debt Service Coverage Ratio — not calculable from disclosed information">
        The Information Document discloses the existence of a new SBCI-backed term loan and increases in creditors falling due after one year, but does not disclose an interest rate or principal amortisation schedule. DSCR requires both EBITDA and scheduled debt service — recommend requesting the facility agreement from management before this metric is presented to Credit Providers.
      </Callout>
      <Callout tone="soil" title="ROCE — not meaningful for FY2025">
        A full balance sheet (total assets, fixed assets) is not disclosed in the source document, so Capital Employed cannot be reliably derived. In any case, with a FY2025 net liability position of €(15,575), ROCE would be negative and not a meaningful measure of performance for a business still in its development phase.
      </Callout>
    </div>
  );
}

function AIInsights({ m }) {
  const insights = [
    {
      tag: "Growth", tone: "moss", title: "Revenue growth is real but off a small base",
      body: "Revenue grew 21.6% YoY to €836,991, with international revenue nearly quadrupling as a share of the business (5% → 22%). That's encouraging directional evidence for the UK/EU expansion thesis, but the FY2025 base is still under €1m — the Senus 2030 target of 50%+ CAGR through 2030 requires this growth rate to roughly double and sustain for five years. The Board should track whether growth is broadening (more Enterprise logos, higher ACV) or concentrating (a few large R&D contracts), since the current mix is still 27% R&D-project revenue, which is typically lumpier and less recurring than subscription revenue.",
    },
    {
      tag: "Profitability", tone: "gold", title: "Margin expansion is the strongest signal in these accounts",
      body: "Gross margin expanded 14.6 percentage points (62.8% → 77.5%) while admin costs fell 18% in absolute terms — a rare combination of revenue growth and cost discipline that drove the operating loss down 44% and net loss down 46%. This is a materially better story than the revenue growth alone suggests, and is the single strongest evidence for the FY2028 EBITDA-positive target being achievable, provided the cost base doesn't need to re-inflate to support international expansion.",
    },
    {
      tag: "Liquidity", tone: "soil", title: "Cash runway was tight at FY25 year-end — the December placement was well-timed",
      body: `At the FY25 burn rate of roughly ${fmtEUR(m.monthlyBurn)}/month, the €140,135 cash balance implied only ~${m.runwayMonths.toFixed(1)} months of runway on a standalone basis. The €1.1m Private Placement completed in December 2025 extends this materially (pro-forma ~${m.proFormaRunwayMonths.toFixed(0)} months at the same burn rate), but that assumes burn doesn't increase — and the placement proceeds are explicitly earmarked for sales hires, internationalisation and the Loamin integration, all of which typically increase cash burn before they increase revenue. Recommend the Board request a 12-month cash flow forecast reflecting the intended use of proceeds, not just the historical burn rate.`,
    },
    {
      tag: "Solvency", tone: "soil", title: "Two data gaps limit what Credit Providers can assess today",
      body: "Neither EBITDA (no D&A disclosed) nor a debt service schedule (no interest/amortisation terms disclosed for the new SBCI loan) can be derived from the Information Document. Both are standard requirements for credit analysis. This isn't a red flag in itself — it reflects the limited disclosure requirements of Euronext Access+ relative to a regulated market — but it should be flagged as a follow-up request before this report is relied upon for a credit decision.",
    },
    {
      tag: "Strategy", tone: "moss", title: "Post-year-end events materially change the story that FY2025 alone tells",
      body: "The Loamin acquisition, Direct Listing, and €1.1m placement all occurred after 30 June 2025 and are not reflected in these financial statements. Management and the Board are the only audiences with visibility into how H1 FY2026 trading has progressed since — the source materials reference a trading update expected Jan/Feb 2026 that was not available at the time this report was generated. This is the single most important caveat for readers of this report.",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card eyebrow="AI-generated analysis" title="Board commentary"
        action={<Badge tone="gold"><Sparkles size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />Generated from FY24/FY25 data</Badge>}>
        <p style={{ fontSize: 13, color: T.slate, margin: 0, lineHeight: 1.55 }}>
          The commentary below was generated by analysing the extracted FY2024/FY2025 dataset against Senus's own disclosed strategy (Senus 2030) and stated KPIs. In production this panel calls the Anthropic API (see <code style={{ background: T.canvas, padding: "1px 5px", borderRadius: 4 }}>/api/insights</code> in the repo) with the live metrics as context; it's pre-computed here for a fast, reliable demo — see README for the exact prompt and validation approach.
        </p>
      </Card>
      {insights.map((ins, i) => (
        <Card key={i}>
          <div style={{ display: "flex", gap: 12 }}>
            <Badge tone={ins.tone}>{ins.tag}</Badge>
          </div>
          <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 15.5, fontWeight: 600, color: T.ink, margin: "10px 0 6px" }}>{ins.title}</h4>
          <p style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, margin: 0 }}>{ins.body}</p>
        </Card>
      ))}
      <Card eyebrow="Transparency" title="Known data gaps in this report">
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {DATA.dataGaps.map((g, i) => <li key={i} style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>{g}</li>)}
        </ul>
      </Card>
    </div>
  );
}

/* ============================================================================
   SHELL
   ========================================================================= */
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "growth", label: "Growth & Revenue", icon: TrendingUp },
  { id: "profitability", label: "Profitability", icon: Target },
  { id: "cash", label: "Cash & Liquidity", icon: PiggyBank },
  { id: "solvency", label: "Solvency & Returns", icon: Shield },
  { id: "ai", label: "AI Insights", icon: Sparkles },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("overview");
  const m = useMetrics();

  if (!session) return <Login onEnter={(persona) => { setSession(persona); setTab(persona === "credit" ? "cash" : persona === "investor" ? "growth" : "overview"); }} />;

  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: "'Inter', sans-serif", display: "flex" }}>
      <style>{FONTS}</style>
      {/* Sidebar */}
      <div style={{ width: 216, background: T.ink, padding: "24px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px" }}>
          <Leaf size={18} color={T.mossSoft} />
          <span style={{ color: "#fff", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15 }}>Senus</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => {
            const active = tab === n.id, Icon = n.icon;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7, border: "none",
                background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#fff" : "#9AA79E",
                fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left",
              }}>
                <Icon size={15} strokeWidth={1.8} />{n.label}
                {active && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14 }}>
            <div style={{ color: "#9AA79E", fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace" }}>SIGNED IN AS</div>
            <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>{session}</div>
            <button onClick={() => setSession(null)} style={{ marginTop: 8, background: "none", border: "none", color: "#9AA79E", fontSize: 11.5, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Switch view</button>
          </div>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: "26px 34px 60px", maxWidth: 1180 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge tone="slate">{DATA.company.ticker}</Badge><Badge tone="slate">{DATA.company.isin}</Badge><Badge tone="moss">{DATA.company.market}</Badge>
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: T.ink, margin: "10px 0 0" }}>Senus PLC — Board Report</h1>
          </div>
          <div style={{ textAlign: "right", fontSize: 11.5, color: T.slate, fontFamily: "'IBM Plex Mono', monospace" }}>
            Period: FY2024 – FY2025<br />Source: Euronext Information Document
          </div>
        </div>
        <SoilRule />
        {tab === "overview" && <Overview m={m} persona={session} />}
        {tab === "growth" && <GrowthRevenue m={m} />}
        {tab === "profitability" && <Profitability m={m} />}
        {tab === "cash" && <CashLiquidity m={m} />}
        {tab === "solvency" && <SolvencyReturns />}
        {tab === "ai" && <AIInsights m={m} />}
      </div>
    </div>
  );
}
