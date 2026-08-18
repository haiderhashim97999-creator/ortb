"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Clock, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface PaymentRecord {
  id: string;
  monthKey: string;
  grossRevenue: number;
  revenueShare: number;
  publisherAmount: number;
  impressions: number;
  status: string;
  paidAt: string | null;
  paidNote: string;
}

interface Summary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function RevenuePage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalEarned: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/publisher/revenue")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRecords(d.records);
          setSummary(d.summary);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-500 text-sm mt-1">Monthly earnings and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Earned",
            value: formatCurrency(summary.totalEarned),
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Total Paid",
            value: formatCurrency(summary.totalPaid),
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Pending Balance",
            value: formatCurrency(summary.totalPending),
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment terms notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <DollarSign size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">NET-60 Payment Terms</span> — Payments are processed within 60 days after the end of each month. Minimum payout threshold is $50.
        </div>
      </div>

      {/* Monthly breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={16} />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Loading...</div>
          ) : records.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500 text-sm font-medium">No revenue records yet</p>
              <p className="text-gray-400 text-xs mt-1">Revenue data will appear here once your ads start generating impressions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Impressions</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross Revenue</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Your Share</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Your Earnings</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {monthLabel(r.monthKey)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {r.impressions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(r.grossRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {r.revenueShare}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(r.publisherAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 size={11} />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <Clock size={11} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {r.paidAt
                          ? new Date(r.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                        {r.paidNote && (
                          <p className="text-gray-400 mt-0.5 truncate max-w-[140px]" title={r.paidNote}>
                            {r.paidNote}
                          </p>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {records.reduce((s, r) => s + r.impressions, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(records.reduce((s, r) => s + r.grossRevenue, 0))}
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {formatCurrency(summary.totalEarned)}
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
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
