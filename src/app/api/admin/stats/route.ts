import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReport, getDateRange } from "@/lib/omnidex";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalPublishers, pendingPublishers, bannedPublishers, totalSites] = await Promise.all([
    prisma.user.count({ where: { role: "publisher" } }),
    prisma.user.count({ where: { role: "publisher", status: "pending" } }),
    prisma.user.count({ where: { role: "publisher", status: "banned" } }),
    prisma.site.count(),
  ]);

  // Fetch last 30 days revenue from OmniDex
  let revenue = 0;
  let impressions = 0;
  try {
    const range = getDateRange(30);
    const report = await getReport({
      from: range.from,
      to: range.to,
      dimensions: [],
      metrics: ["Impressions", "Revenue"],
    });
    if (report.success && report.data?.rows?.length > 0) {
      report.data.rows.forEach((r) => {
        revenue += r.Revenue || 0;
        impressions += r.Impressions || 0;
      });
    }
  } catch {
    // API may be unavailable; return zeros
  }

  return NextResponse.json({
    totalPublishers,
    pendingPublishers,
    bannedPublishers,
    activePublishers: totalPublishers - pendingPublishers - bannedPublishers,
    totalSites,
    last30Days: { revenue, impressions },
  });
}
