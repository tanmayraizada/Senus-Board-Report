import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeMetrics, growthTrajectory } from "@/lib/metrics";

const prisma = new PrismaClient();

export async function GET() {
  const company = await prisma.company.findFirst({
    include: { periods: { orderBy: { periodEnd: "asc" }, include: { lineItems: true } } },
  });

  if (!company || company.periods.length < 2) {
    return NextResponse.json({ error: "Expected at least two seeded periods. Run `npm run seed`." }, { status: 500 });
  }

  const [prior, current] = company.periods.slice(-2) as any;
  const metrics = computeMetrics(prior, current, /* Dec-2025 placement */ 1_100_000);
  const trajectory = growthTrajectory(current.revenue, 0.5, 2026, 2030);

  return NextResponse.json({ company, prior, current, metrics, trajectory });
}
