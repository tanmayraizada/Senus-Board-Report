// Pure calculation layer. No I/O here on purpose: given two period rows it
// returns every derived metric the Board Report needs, plus a `flags` array
// for anything that legitimately cannot be calculated from disclosed data
// (see README §"Data gaps and how we handled them").

export type Period = {
  label: string;
  revenue: number;
  grossProfit: number;
  cogs: number;
  adminExpenses: number;
  operatingProfit: number;
  profitBeforeTax: number;
  profitAfterTax: number;
  rdPctOfRevenue: number;
  netAssets: number;
  retainedEarnings: number;
  tradeDebtors: number;
  tradeCreditors: number;
  cashClosing: number;
  cashOpening: number;
  cfOperating: number;
  cfInvesting: number;
  cfFinancing: number;
  internationalPct?: number | null;
  customerTotal?: number | null;
  customerEnterprise?: number | null;
};

export type MetricFlag = { metric: string; reason: string };

export function computeMetrics(prior: Period, current: Period, placementProceeds = 0) {
  const flags: MetricFlag[] = [];

  const grossMargin = current.grossProfit / current.revenue;
  const grossMarginPrior = prior.grossProfit / prior.revenue;
  const operatingMargin = current.operatingProfit / current.revenue;
  const netMargin = current.profitAfterTax / current.revenue;

  const revenueGrowthYoY = (current.revenue - prior.revenue) / prior.revenue;
  const grossProfitGrowthYoY = (current.grossProfit - prior.grossProfit) / prior.grossProfit;
  const operatingLossImprovement =
    (Math.abs(prior.operatingProfit) - Math.abs(current.operatingProfit)) / Math.abs(prior.operatingProfit);
  const netLossImprovement =
    (Math.abs(prior.profitAfterTax) - Math.abs(current.profitAfterTax)) / Math.abs(prior.profitAfterTax);

  const freeCashFlow = current.cfOperating + current.cfInvesting;
  const freeCashFlowPrior = prior.cfOperating + prior.cfInvesting;

  const monthlyBurn = Math.abs(current.cfOperating) / 12;
  const cashRunwayMonths = current.cashClosing / monthlyBurn;
  const proFormaCash = current.cashClosing + placementProceeds;
  const proFormaRunwayMonths = proFormaCash / monthlyBurn;

  // --- Metrics we deliberately do NOT compute, with the reason why ---
  flags.push({
    metric: "EBITDA",
    reason: "No D&A line is disclosed separately from Operating Profit/Loss in the source document.",
  });
  flags.push({
    metric: "Debt Service Coverage Ratio",
    reason: "No interest rate or amortisation schedule is disclosed for the SBCI-backed term loan.",
  });
  flags.push({
    metric: "ROCE",
    reason: "No full balance sheet (total assets, fixed assets) is disclosed to derive Capital Employed.",
  });

  return {
    grossMargin, grossMarginPrior, operatingMargin, netMargin,
    revenueGrowthYoY, grossProfitGrowthYoY, operatingLossImprovement, netLossImprovement,
    freeCashFlow, freeCashFlowPrior, monthlyBurn, cashRunwayMonths, proFormaCash, proFormaRunwayMonths,
    flags,
  };
}

/// Illustrative trajectory at the Board's stated minimum CAGR — explicitly
/// NOT a forecast. Kept as a pure function so the UI can label it correctly
/// and so it's trivially testable.
export function growthTrajectory(baseRevenue: number, cagr: number, fromYear: number, toYear: number) {
  const out: { year: string; revenue: number }[] = [];
  let rev = baseRevenue;
  for (let y = fromYear; y <= toYear; y++) {
    rev = rev * (1 + cagr);
    out.push({ year: `FY${y}`, revenue: Math.round(rev) });
  }
  return out;
}
