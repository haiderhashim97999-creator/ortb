import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getReport, getDateRange } from "@/lib/omnidex";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const range = getDateRange(30);
    const report = await getReport({
      from: range.from,
      to: range.to,
      dimensions: ["Date"],
      metrics: ["Impressions", "Revenue"],
    });

    const totals = { impressions: 0, revenue: 0 };
    if (report.success && report.data?.rows) {
      report.data.rows.forEach((r: {
        dimensions?: Record<string, string>;
        metrics?: Record<string, number>;
        Impressions?: number;
        Revenue?: number;
      }) => {
        // Handle nested structure
        const imp = r.metrics?.Impressions ?? r.Impressions ?? 0;
        const rev = r.metrics?.Revenue ?? r.Revenue ?? 0;
        totals.impressions += imp;
        totals.revenue += rev;
      });
    }

    return NextResponse.json({
      success: true,
      last30Days: totals,
      meta: report.data?.meta,
    });
  } catch {
    return NextResponse.json({ success: false, last30Days: { impressions: 0, revenue: 0 } });
  }
}
