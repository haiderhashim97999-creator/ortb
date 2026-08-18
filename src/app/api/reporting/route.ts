import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReport, getDateRange, flattenRows } from "@/lib/omnidex";
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

    // Always fetch with Domain dimension so we can filter by publisher's sites
    const requestedDimensions: string[] = dimensions || ["Date"];
    const fetchDimensions = requestedDimensions.includes("Domain")
      ? requestedDimensions
      : [...requestedDimensions, "Domain"];

    const result = await getReport({
      from: dateFrom,
      to: dateTo,
      dimensions: fetchDimensions,
      metrics: metrics || ["Impressions", "Revenue", "CPM"],
    });

    // Flatten nested OmniDex row structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawRows: any[] = result?.data?.rows || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let flatRows: any[] = rawRows.map((row: any) => {
      if (row.dimensions || row.metrics) {
        return { ...row.dimensions, ...row.metrics };
      }
      return row;
    });

    // Filter by publisher's domains (non-admin only)
    if (session.role !== "admin" && session.publisherId) {
      const sites = await prisma.site.findMany({
        where: { publisherId: session.publisherId },
        select: { domain: true },
      });
      const domains = sites.map((s) => s.domain.toLowerCase().replace(/^www\./, ""));

      flatRows = flatRows.filter((row) => {
        const rowDomain = (row.Domain || "").toLowerCase().replace(/^www\./, "");
        return domains.some((d) => rowDomain === d || rowDomain.endsWith("." + d) || d.endsWith("." + rowDomain));
      });
    }

    // Remove Domain from rows if it wasn't requested
    if (!requestedDimensions.includes("Domain")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flatRows = flatRows.map((row: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { Domain, ...rest } = row;
        return rest;
      });
    }

    // Aggregate by requested dimension (e.g. group by Date summing across domains)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aggregated: Record<string, any> = {};
    for (const row of flatRows) {
      const key = requestedDimensions.map((d) => row[d] || "").join("|");
      if (!aggregated[key]) {
        aggregated[key] = { ...row, Impressions: 0, Revenue: 0, CPM: 0, _count: 0 };
      }
      aggregated[key].Impressions += Number(row.Impressions) || 0;
      aggregated[key].Revenue     += Number(row.Revenue)     || 0;
      aggregated[key]._count      += 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalRows = Object.values(aggregated).map((row: any) => {
      const imp = row.Impressions;
      const rev = row.Revenue;
      return {
        ...row,
        CPM: imp > 0 ? (rev / imp) * 1000 : 0,
        _count: undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rows: finalRows,
        meta: result?.data?.meta,
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
