import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReport, getDateRange } from "@/lib/omnidex";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { from, to, dimensions, metrics, range } = body;

    let dateFrom = from;
    let dateTo = to;

    if (!dateFrom || !dateTo) {
      const r = getDateRange(range || 30);
      dateFrom = r.from;
      dateTo = r.to;
    }

    // Get publisher's domains for filtering (non-admin only)
    let domainFilter: string[] | null = null;
    if (session.role !== "admin" && session.publisherId) {
      const sites = await prisma.site.findMany({
        where: { publisherId: session.publisherId, status: "active" },
        select: { domain: true },
      });
      domainFilter = sites.map((s) => s.domain);
    }

    const result = await getReport({
      from: dateFrom,
      to: dateTo,
      dimensions: dimensions || ["Date"],
      metrics: metrics || ["Impressions", "Revenue"],
      // Filter by publisher's domains if not admin
      filters: domainFilter && domainFilter.length > 0
        ? { Site: domainFilter }
        : undefined,
    });

    // Normalize nested OmniDex row structure to flat format
    // OmniDex returns: { dimensions: { Date: "..." }, metrics: { Impressions: 0 } }
    // Dashboard expects: { Date: "...", Impressions: 0, Revenue: 0 }
    const rawRows = result?.data?.rows || [];
    const flatRows = rawRows.map((row: {
      dimensions?: Record<string, string>;
      metrics?: Record<string, number>;
      [key: string]: unknown;
    }) => {
      if (row.dimensions || row.metrics) {
        return { ...row.dimensions, ...row.metrics };
      }
      return row; // already flat
    });

    return NextResponse.json({
      success: true,
      data: {
        rows: flatRows,
        meta: result?.data?.meta,
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
