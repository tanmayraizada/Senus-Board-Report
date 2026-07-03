// Loads data/senus_extracted.json into the Prisma-modelled SQLite DB.
// This is the "pre-loaded" path described in the README: the extraction
// pipeline (scripts/extract_financials.py) already produced this JSON from
// the source PDF; seeding just materialises it into the relational model
// that the API routes and metrics engine query at runtime.

import { PrismaClient } from "@prisma/client";
import raw from "../data/senus_extracted.json";

const prisma = new PrismaClient();

async function main() {
  const d: any = raw;

  const company = await prisma.company.create({
    data: {
      name: d.company.name,
      ticker: d.company.ticker,
      isin: d.company.isin,
      market: d.company.market,
      employees: d.company.employees.total,
      sharesInIssue: d.company.sharesInIssue,
      admissionPrice: d.company.admissionSharePrice,
      marketCap: d.company.marketCapAtListing,
    },
  });

  for (const [label, p] of Object.entries<any>(d.periods)) {
    const period = await prisma.financialPeriod.create({
      data: {
        companyId: company.id,
        label,
        periodEnd: new Date(label === "FY2024" ? "2024-06-30" : "2025-06-30"),
        revenue: p.pnl.revenue,
        grossProfit: p.pnl.grossProfit,
        cogs: p.pnl.cogs,
        adminExpenses: p.pnl.adminExpenses,
        operatingProfit: p.pnl.operatingProfitLoss,
        profitBeforeTax: p.pnl.profitLossBeforeTax,
        profitAfterTax: p.pnl.profitLossAfterTax,
        rdPctOfRevenue: p.pnl.rdPctOfRevenue,
        netAssets: p.balanceSheet.netAssetsLiabilities,
        retainedEarnings: p.balanceSheet.retainedEarnings,
        tradeDebtors: p.balanceSheet.tradeDebtors,
        tradeCreditors: p.balanceSheet.tradeCreditors,
        cashClosing: p.balanceSheet.cashClosing,
        cashOpening: p.balanceSheet.cashOpening,
        cfOperating: p.cashFlow.operating,
        cfInvesting: p.cashFlow.investing,
        cfFinancing: p.cashFlow.financing,
        internationalPct: p.revenueMix?.internationalPct ?? null,
        customerTotal: p.customers?.total ?? null,
        customerEnterprise: p.customers?.enterprise ?? null,
        customerIndependent: p.customers?.independent ?? null,
        customerRd: p.customers?.rd ?? null,
      },
    });

    // Product-level ACV and related-party lines go into the flexible LineItem table
    if (p.customers?.enterpriseACVByProduct) {
      for (const [product, value] of Object.entries<number>(p.customers.enterpriseACVByProduct)) {
        await prisma.lineItem.create({
          data: { periodId: period.id, category: `acv.${product}`, label: `Enterprise ACV — ${product}`, value },
        });
      }
    }
  }

  console.log(`Seeded ${company.name} with ${Object.keys(d.periods).length} periods.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
