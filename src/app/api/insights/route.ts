import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeMetrics } from "@/lib/metrics";
import { generateInsights } from "@/lib/ai-insights";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET() {
  const company = await prisma.company.findFirst({ include: { periods: { orderBy: { periodEnd: "asc" } } } });
  if (!company || company.periods.length < 2) {
    return NextResponse.json({ error: "Expected at least two seeded periods." }, { status: 500 });
  }

  const [prior, current] = company.periods.slice(-2) as any;
  const metrics = computeMetrics(prior, current, 1_100_000);
  const metricsHash = crypto.createHash("sha256").update(JSON.stringify(metrics)).digest("hex").slice(0, 16);

  // Serve a cached insight for this exact metrics snapshot if we already generated one
  const cached = await prisma.insight.findMany({ where: { metricsHash }, orderBy: { createdAt: "asc" } });
  if (cached.length) {
    return NextResponse.json({ insights: cached, source: "db-cache" });
  }

  const { insights, source } = await generateInsights({ company: company.name, prior, current, metrics });

  if (source === "live") {
    await prisma.insight.createMany({
      data: insights.map((i) => ({
        periodId: current.id, theme: i.theme, title: i.title, body: i.body, metricsHash,
      })),
    });
  }

  return NextResponse.json({ insights, source });
}
