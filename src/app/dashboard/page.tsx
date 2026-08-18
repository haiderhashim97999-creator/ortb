import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReport, getDateRange, getYesterday, flattenRows } from "@/lib/omnidex";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Eye, DollarSign, Globe, ArrowUpRight, Activity } from "lucide-react";

async function getStats(publisherId: string) {
  const range30   = getDateRange(30);
  const yesterday = getYesterday();

  let totalRevenue = 0, totalImpressions = 0;
  let yesterdayRevenue = 0, yesterdayImpressions = 0;
  let chartData: { date: string; revenue: number; impressions: number }[] = [];

  // Get publisher's domains for filtering
  const sites = await prisma.site.findMany({
    where: { publisherId, status: "active" },
    select: { domain: true },
  });
  const domains = sites.map((s) => s.domain.toLowerCase().replace(/^www\./, ""));

  try {
    const [r30, rY] = await Promise.all([
      getReport({ from: range30.from,   to: range30.to,   dimensions: ["Date", "Domain"], metrics: ["Impressions","Revenue"] }),
      getReport({ from: yesterday.from, to: yesterday.to, dimensions: ["Domain"],          metrics: ["Impressions","Revenue"] }),
    ]);

    if (r30.success) {
      const rows = flattenRows(r30.data.rows);
      // Filter by publisher domains
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = rows.filter((r: any) => {
        const d = (r.Domain || "").toLowerCase().replace(/^www\./, "");
        return domains.some((pub) => d === pub || d.endsWith("." + pub));
      });
      // Aggregate by Date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const byDate: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered.forEach((r: any) => {
        const date = r.Date || "";
        if (!byDate[date]) byDate[date] = { Date: date, Revenue: 0, Impressions: 0 };
        byDate[date].Revenue     += Number(r.Revenue)     || 0;
        byDate[date].Impressions += Number(r.Impressions) || 0;
      });
      Object.values(byDate).forEach((r) => {
        totalRevenue     += r.Revenue;
        totalImpressions += r.Impressions;
        chartData.push({ date: r.Date, revenue: r.Revenue, impressions: r.Impressions });
      });
    }

    if (rY.success) {
      const yRows = flattenRows(rY.data.rows);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yFiltered = yRows.filter((r: any) => {
        const d = (r.Domain || "").toLowerCase().replace(/^www\./, "");
        return domains.some((pub) => d === pub || d.endsWith("." + pub));
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yFiltered.forEach((r: any) => {
        yesterdayRevenue     += Number(r.Revenue)     || 0;
        yesterdayImpressions += Number(r.Impressions) || 0;
      });
    }
  } catch { /* API unavailable */ }

  const siteCount = sites.length;
  const adUnits   = await prisma.adUnit.count({ where: { site: { publisherId } } });

  return { totalRevenue, totalImpressions, yesterdayRevenue, yesterdayImpressions, chartData, sites: siteCount, adUnits };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.publisherId) return null;

  const stats     = await getStats(session.publisherId);
  const avgCpm    = stats.totalImpressions > 0 ? (stats.totalRevenue / stats.totalImpressions) * 1000 : 0;

  const statCards = [
    {
      label: "Revenue (30d)",
      value: formatCurrency(stats.totalRevenue),
      sub: `Yesterday ${formatCurrency(stats.yesterdayRevenue)}`,
      icon: DollarSign,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      delay: 0,
    },
    {
      label: "Impressions (30d)",
      value: formatNumber(stats.totalImpressions),
      sub: `Yesterday ${formatNumber(stats.yesterdayImpressions)}`,
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      delay: 0.07,
    },
    {
      label: "Active Sites",
      value: stats.sites.toString(),
      sub: `${stats.adUnits} ad units`,
      icon: Globe,
      color: "text-sky-600",
      bg: "bg-sky-50",
      delay: 0.14,
    },
    {
      label: "Avg CPM",
      value: `$${avgCpm.toFixed(2)}`,
      sub: "last 30 days",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      delay: 0.21,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── Hero header ────────────────────────────── */}
      <div className="animate-fade-down">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={22} className="text-indigo-500" />
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Performance overview — last 30 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-500 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live data
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="animate-fade-up stagger-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <DollarSign size={15} className="text-indigo-500" />
                Revenue trend
                <span className="ml-auto text-xs font-normal text-gray-400">30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={stats.chartData} metric="revenue" />
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-up stagger-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Eye size={15} className="text-emerald-500" />
                Impressions trend
                <span className="ml-auto text-xs font-normal text-gray-400">30 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={stats.chartData} metric="impressions" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Quick links ─────────────────────────────── */}
      <div className="animate-fade-up stagger-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/dashboard/sites",    label: "Manage Sites",   color: "bg-sky-50 text-sky-700 border-sky-100" },
          { href: "/dashboard/adunits",  label: "Create Ad Unit", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          { href: "/dashboard/reports",  label: "Full Reports",   color: "bg-violet-50 text-violet-700 border-violet-100" },
        ].map((q) => (
          <a key={q.href} href={q.href}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${q.color}`}>
            {q.label}
            <ArrowUpRight size={15} />
          </a>
        ))}
      </div>
    </div>
  );
}
