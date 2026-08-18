/**
 * OmniDex Publisher API Service
 * Base URL: https://api.portal.omni-dex.io/publisher-api/v1
 */

const OMNIDEX_API_BASE = "https://api.portal.omni-dex.io/publisher-api/v1";
const OMNIDEX_API_KEY = process.env.OMNIDEX_API_KEY || "pub_live_3a66bd06d798e8d0552dc3450bd49c14";

export interface OmniDexReportRow {
  Date?: string;
  Country?: string;
  Site?: string;
  AdUnit?: string;
  Impressions: number;
  Revenue: number;
  Clicks?: number;
  CPM?: number;
}

export interface OmniDexReportResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    rows: OmniDexReportRow[];
    totals?: Partial<OmniDexReportRow>;
    meta?: {
      timeZone?: string;
      degraded?: boolean;
      dataCompleteThrough?: string;
      missingDates?: string[];
    };
  };
}

export interface ReportParams {
  from: string;       // ISO date string
  to: string;         // ISO date string
  timeZone?: string;
  dimensions?: string[];
  metrics?: string[];
  filters?: Record<string, string[]>;
}

async function omnidexFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${OMNIDEX_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-API-Key": OMNIDEX_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`OmniDex API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getReport(params: ReportParams): Promise<OmniDexReportResponse> {
  return omnidexFetch<OmniDexReportResponse>("/reporting", {
    method: "POST",
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      timeZone: params.timeZone || "UTC",
      dimensions: params.dimensions || ["Date"],
      metrics: params.metrics || ["Impressions", "Revenue"],
      filters: params.filters,
    }),
  });
}

export async function getPaginatedReport(params: ReportParams & {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  return omnidexFetch("/paginated", {
    method: "POST",
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      timeZone: params.timeZone || "UTC",
      dimensions: params.dimensions || ["Date"],
      metrics: params.metrics || ["Impressions", "Revenue"],
      filters: params.filters,
      page: params.page || 1,
      pageSize: params.pageSize || 30,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    }),
  });
}

export async function getAvailableOptions() {
  return omnidexFetch("/options");
}

export async function getFilterOptions() {
  return omnidexFetch("/filter-options");
}

export function flattenRows(rows: OmniDexReportRow[]): OmniDexReportRow[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((row: any) => {
    if (row.dimensions || row.metrics) {
      return { ...row.dimensions, ...row.metrics } as OmniDexReportRow;
    }
    return row as OmniDexReportRow;
  });
}
export function getLast30Days(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().replace("T", "T").split(".")[0] + ".000Z",
    to: to.toISOString().replace("T", "T").split(".")[0] + ".999Z",
  };
}

export function getDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function getToday(): { from: string; to: string } {
  return getDateRange(1);
}

export function getYesterday(): { from: string; to: string } {
  const from = new Date();
  from.setDate(from.getDate() - 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setHours(23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
