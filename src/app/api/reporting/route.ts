import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getReport, getDateRange } from "@/lib/omnidex";

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

    const result = await getReport({
      from: dateFrom,
      to: dateTo,
      dimensions: dimensions || ["Date"],
      metrics: metrics || ["Impressions", "Revenue"],
    });

    // Publishers only see their own data — OmniDex API key is network-wide,
    // so we return the data as-is (same API key = same publisher view).
    // In a multi-tenant setup with separate OmniDex PIDs per publisher, you'd filter here.
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
