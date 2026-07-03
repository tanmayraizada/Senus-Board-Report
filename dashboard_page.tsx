"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

const T = {
  canvas: "#F5F2EA", panel: "#FFFFFF", ink: "#14231C", inkSoft: "#2B392F",
  moss: "#3E6B52", mossSoft: "#DCE7DE", soil: "#8B4A34", soilSoft: "#F0E0D8",
  slate: "#63706A", hair: "#DBD5C4", gold: "#AD8A3D", goldSoft: "#F1E7D2",
};

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "moss" | "gold" }) {
  const map = { slate: { bg: "#EDEAE0", fg: T.slate }, moss: { bg: T.mossSoft, fg: T.moss }, gold: { bg: T.goldSoft, fg: T.gold } };
  const c = map[tone];
  return (
    <span style={{ background: c.bg, color: c.fg, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>
      {children}
    </span>
  );
}

function Kpi({ label, value, sub, deltaUp }: { label: string; value: string; sub?: string; deltaUp?: boolean }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 180 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 0.5, color: T.slate, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 26, color: T.ink, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: deltaUp === undefined ? T.slate : deltaUp ? T.moss : T.soil, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Card({ eyebrow, title, note, children }: { eyebrow?: string; title?: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 10, padding: 22, marginBottom: 22 }}>
      {eyebrow && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 1, color: T.slate, textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>}
      {title && <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, color: T.ink, margin: "0 0 14px" }}>{title}</h3>}
      {children}
      {note && <p style={{ fontSize: 12, color: T.slate, marginTop: 10 }}>{note}</p>}
    </div>
  );
}

function Callout({ tone = "gold", title, children }: { tone?: "gold" | "soil"; title: string; children: React.ReactNode }) {
  const bg = tone === "gold" ? T.goldSoft : T.soilSoft;
  const fg = tone === "gold" ? T.gold : T.soil;
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "16px 18px", marginBottom: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: fg, marginBottom: 4 }}>{title}</div>
      <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55, margin: 0 }}>{children}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financials").then((r) => r.json()).then((d) => (d.error ? setError(d.error) : setData(d))).catch((e) => setError(String(e)));
    fetch("/api/insights").then((r) => r.json()).then(setInsights).catch(() => {});
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: T.canvas, padding: 40, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 520, background: "#fff", border: `1px solid ${T.hair}`, borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif" }}>Setup required</h2>
          <p style={{ fontSize: 13, color: T.slate }}>{error}</p>
          <pre style={{ background: T.canvas, padding: 12, borderRadius: 6, fontSize: 12 }}>npm run setup</pre>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div style={{ minHeight: "100vh", background: T.canvas, display: "flex", alignItems: "center", justifyContent: "center", color: T.slate, fontFamily: "'Inter', sans-serif" }}>Loading financials…</div>;
  }

  const { company, prior, current, metrics } = data;
  const revBars = [{ name: prior.label, Revenue: prior.revenue }, { name: current.label, Revenue: current.revenue }];
  const marginBars = [
    { name: "Gross Margin", [prior.label]: prior.grossProfit / prior.revenue, [current.label]: metrics.grossMargin },
    { name: "Operating Margin", [prior.label]: prior.operatingProfit / prior.revenue, [current.label]: metrics.operatingMargin },
    { name: "Net Margin", [prior.label]: prior.profitAfterTax / prior.revenue, [current.label]: metrics.netMargin },
  ];
  const mix = current.customerEnterprise != null ? [
    { name: "Enterprise", value: 0.69, fill: T.moss }, { name: "R&D", value: 0.27, fill: T.gold }, { name: "Independent", value: 0.04, fill: T.soil },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: T.canvas, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: T.ink, padding: "22px 32px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16 }}>Senus — Board Report</div>
          <div style={{ color: "#9AA79E", fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace" }}>LIVE &middot; NEXT.JS + PRISMA</div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 32px 80px" }}>
        <div>
          <Badge>{company.ticker}</Badge> <Badge>{company.isin}</Badge> <Badge tone="moss">{company.market}</Badge>
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 30, margin: "10px 0 0" }}>Senus PLC — Board Report</h1>
        <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", margin: "20px 0 32px" }}>
          {[T.ink, T.moss, T.gold, T.soil, T.slate].map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
          <Kpi label={`Revenue ${current.label}`} value={fmtEUR(current.revenue)} sub={`▲ ${fmtPct(metrics.revenueGrowthYoY)} YoY`} deltaUp />
          <Kpi label="Gross Margin" value={fmtPct(metrics.grossMargin)} sub={`vs ${fmtPct(metrics.grossMarginPrior)} prior`} />
          <Kpi label="Operating Loss" value={fmtEUR(current.operatingProfit)} sub={`▲ ${fmtPct(metrics.operatingLossImprovement)} improvement`} deltaUp />
          <Kpi label="Cash Runway" value={`${metrics.cashRunwayMonths.toFixed(1)} mo.`} sub={`pro-forma ${metrics.proFormaRunwayMonths.toFixed(0)} mo.`} />
        </div>

        <Callout tone="gold" title="Since year-end (not yet reflected in these financials)">
          Loamin Ltd acquisition, €1.1m Private Placement, and Euronext Access+ listing all occurred after 30 June 2025. This report is built on the audited FY2024/FY2025 annuals.
        </Callout>

        <div style={{ display: "grid", gridTemplateColumns: mix.length ? "1fr 1fr" : "1fr", gap: 22 }}>
          <Card eyebrow="Growth" title={`Revenue, ${prior.label} → ${current.label}`} note={`Revenue growth ${fmtPct(metrics.revenueGrowthYoY)} YoY`}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revBars}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtEUR(v)} />
                <Bar dataKey="Revenue" fill={T.moss} radius={[5, 5, 0, 0]} barSize={70} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {mix.length > 0 && (
            <Card eyebrow="By channel" title="Revenue mix, FY2025">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2}>
                    {mix.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${(v * 100).toFixed(0)}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        <Card eyebrow="Profitability" title="Margin trajectory" note="Admin expenses fell 18% YoY even as revenue grew — the strongest signal in these accounts.">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={marginBars}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11.5 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={(v: number) => fmtPct(v)} />
              <Bar dataKey={prior.label} fill={T.slate} radius={[4, 4, 0, 0]} />
              <Bar dataKey={current.label} fill={T.moss} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {metrics.flags?.length > 0 && metrics.flags.map((f: any, i: number) => (
          <Callout key={i} tone="soil" title={`${f.metric} — not calculable from disclosed data`}>{f.reason}</Callout>
        ))}

        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, margin: "8px 0 16px" }}>AI board commentary</h2>
        {insights?.insights?.map((ins: any, i: number) => (
          <div key={i} style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "18px 20px", marginBottom: 12 }}>
            <Badge tone="moss">{ins.theme}</Badge>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15, margin: "10px 0 6px" }}>{ins.title}</div>
            <p style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, margin: 0 }}>{ins.body}</p>
          </div>
        ))}

        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.slate, marginTop: 30 }}>
          Source: Euronext Information Document &middot; served live from /api/financials + /api/insights
        </p>
      </div>
    </div>
  );
}
