"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, RefreshCw, AlertTriangle } from "lucide-react";

interface Row {
  Date?: string;
  Country?: string;
  Impressions: number;
  Revenue: number;
  CPM?: number;
}

interface ReportData {
  rows: Row[];
  meta?: { degraded?: boolean; dataCompleteThrough?: string };
}

export default function ReportsPage() {
  const [range, setRange] = useState("30");
  const [dimension, setDimension] = useState("Date");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reporting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: parseInt(range),
          dimensions: [dimension],
          metrics: ["Impressions", "Revenue", "CPM"],
        }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Failed to load report"); return; }
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to load report");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [range, dimension]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const totals = data?.rows?.reduce(
    (acc, r) => ({
      impressions: acc.impressions + (r.Impressions || 0),
      revenue: acc.revenue + (r.Revenue || 0),
    }),
    { impressions: 0, revenue: 0 }
  ) || { impressions: 0, revenue: 0 };

  const avgCpm = totals.impressions > 0 ? (totals.revenue / totals.impressions) * 1000 : 0;

  const chartData = (data?.rows || [])
    .filter((r) => r.Date)
    .map((r) => ({
      date: r.Date!,
      revenue: r.Revenue || 0,
      impressions: r.Impressions || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Ad performance data</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-36"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="w-40"
          >
            <option value="Date">By Date</option>
            <option value="Country">By Country</option>
          </Select>
          <Button variant="outline" onClick={fetchReport} loading={loading}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Degraded data warning */}
      {data?.meta?.degraded && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle size={16} />
          Data may be incomplete. Complete through: {data.meta.dataCompleteThrough?.slice(0, 10)}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totals.revenue) },
          { label: "Total Impressions", value: formatNumber(totals.impressions) },
          { label: "Avg CPM", value: `$${avgCpm.toFixed(2)}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart (only for date dimension) */}
      {dimension === "Date" && chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
            <CardContent><RevenueChart data={chartData} metric="revenue" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Impression trend</CardTitle></CardHeader>
            <CardContent><RevenueChart data={chartData} metric="impressions" /></CardContent>
          </Card>
        </div>
      )}

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={16} />
            Detailed breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-6 py-8 text-center text-red-500 text-sm">{error}</div>
          ) : loading ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : !data?.rows?.length ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No data for selected period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      {dimension}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Impressions</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">CPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rows.map((row, i) => {
                    const cpm = row.CPM ?? (row.Impressions > 0 ? (row.Revenue / row.Impressions) * 1000 : 0);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.Date || row.Country || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatNumber(row.Impressions)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(row.Revenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          ${cpm.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatNumber(totals.impressions)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(totals.revenue)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">${avgCpm.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
