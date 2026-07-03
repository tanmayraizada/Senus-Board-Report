"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex-1 min-w-[180px]">
      <div className="text-[10.5px] tracking-wide text-gray-500 font-mono uppercase">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1.5">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1.5">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financials")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(String(e)));
    fetch("/api/insights").then((r) => r.json()).then(setInsights).catch(() => {});
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-canvas p-10">
        <div className="max-w-xl bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-display text-xl font-semibold mb-2">Setup required</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <pre className="text-xs bg-gray-50 rounded p-3 mt-3">npm run setup</pre>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="min-h-screen bg-canvas flex items-center justify-center text-gray-500">Loading financials…</main>;
  }

  const { current, prior, metrics, trajectory } = data;
  const revBars = [
    { name: prior.label, Revenue: prior.revenue },
    { name: current.label, Revenue: current.revenue },
  ];

  return (
    <main className="min-h-screen bg-canvas p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-1">
        {data.company.ticker} · {data.company.isin} · {data.company.market}
      </div>
      <h1 className="font-display text-3xl font-semibold mb-6">Senus PLC — Board Report</h1>

      <div className="flex gap-4 flex-wrap mb-8">
        <Kpi label={`Revenue ${current.label}`} value={fmtEUR(current.revenue)} sub={`+${fmtPct(metrics.revenueGrowthYoY)} YoY`} />
        <Kpi label="Gross Margin" value={fmtPct(metrics.grossMargin)} sub={`vs ${fmtPct(metrics.grossMarginPrior)} prior`} />
        <Kpi label="Operating Loss" value={fmtEUR(current.operatingProfit)} sub={`${fmtPct(metrics.operatingLossImprovement)} improvement`} />
        <Kpi label="Cash Runway" value={`${metrics.cashRunwayMonths.toFixed(1)} mo.`} sub={`pro-forma ${metrics.proFormaRunwayMonths.toFixed(0)} mo.`} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-display text-lg font-semibold mb-4">Revenue, {prior.label} → {current.label}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revBars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBD5C4" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtEUR(v)} />
            <Bar dataKey="Revenue" fill="#3E6B52" radius={[5, 5, 0, 0]} barSize={70} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {metrics.flags?.length > 0 && (
        <div className="bg-[#F0E0D8] rounded-lg p-4 mb-8 text-sm text-[#5c2f1f]">
          <div className="font-semibold mb-1">Metrics not calculable from disclosed data</div>
          <ul className="list-disc pl-5 space-y-1">
            {metrics.flags.map((f: any, i: number) => (
              <li key={i}><strong>{f.metric}:</strong> {f.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">AI Board Commentary</h3>
          {insights && <span className="text-[10.5px] font-mono text-gray-400 uppercase">{insights.source}</span>}
        </div>
        <div className="flex flex-col gap-5">
          {insights?.insights?.map((ins: any, i: number) => (
            <div key={i}>
              <div className="text-[11px] font-mono uppercase text-gray-500 mb-1">{ins.theme}</div>
              <div className="font-display font-semibold text-[15px] mb-1">{ins.title}</div>
              <p className="text-sm text-gray-700 leading-relaxed">{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
