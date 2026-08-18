"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2, Clock, DollarSign, RefreshCw,
  Users, TrendingUp, CreditCard, Plus, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface PaymentRecord {
  id: string;
  publisherId: string;
  monthKey: string;
  grossRevenue: number;
  revenueShare: number;
  publisherAmount: number;
  impressions: number;
  status: string;
  paidAt: string | null;
  paidNote: string;
  publisher: {
    companyName: string;
    name: string;
    email: string;
    notes: string;
  } | null;
}

interface Publisher {
  id: string;
  name: string;
  email: string;
  status: string;
  publisher?: {
    id: string;
    companyName: string;
    revenueShare: number;
  };
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getWallet(notes: string) {
  try {
    const p = JSON.parse(notes || "{}");
    return p.paymentProfile?.accountDetail || null;
  } catch { return null; }
}

export default function AdminPaymentsPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  // Mark as paid modal
  const [paidModal, setPaidModal] = useState(false);
  const [selected, setSelected] = useState<PaymentRecord | null>(null);
  const [paidNote, setPaidNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Add record modal
  const [addModal, setAddModal] = useState(false);
  const [newPubId, setNewPubId] = useState("");
  const [newMonth, setNewMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newGross, setNewGross] = useState("");
  const [newImpressions, setNewImpressions] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/payments");
    const data = await res.json();
    if (data.success) setRecords(data.records);
    setLoading(false);
  }, []);

  const fetchPublishers = useCallback(async () => {
    const res = await fetch("/api/admin/publishers");
    const data = await res.json();
    setPublishers(Array.isArray(data) ? data.filter((p: Publisher) => p.status === "active") : []);
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchPublishers();
  }, [fetchRecords, fetchPublishers]);

  async function markPaid() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId: selected.id, paidNote }),
    });
    await fetchRecords();
    setSaving(false);
    setPaidModal(false);
    setPaidNote("");
    setSelected(null);
  }

  async function addRecord() {
    if (!newPubId || !newMonth || !newGross) return;
    setAdding(true);
    const pub = publishers.find((p) => p.publisher?.id === newPubId);
    const revShare = pub?.publisher?.revenueShare || 70;
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publisherId: newPubId,
        monthKey: newMonth,
        grossRevenue: parseFloat(newGross),
        revenueShare: revShare,
        impressions: parseInt(newImpressions) || 0,
      }),
    });
    await fetchRecords();
    setAdding(false);
    setAddModal(false);
    setNewGross("");
    setNewImpressions("");
  }

  const filtered = records.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const totalPending = records
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.publisherAmount, 0);
  const totalPaid = records
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.publisherAmount, 0);
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publisher Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly revenue & payout management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRecords} loading={loading}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button onClick={() => setAddModal(true)}>
            <Plus size={14} />
            Add Record
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Payouts", value: formatCurrency(totalPending), icon: Clock, color: "text-orange-600", bg: "bg-orange-50", sub: `${pendingCount} records` },
          { label: "Total Paid Out", value: formatCurrency(totalPaid), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", sub: `${records.filter((r) => r.status === "paid").length} records` },
          { label: "Active Publishers", value: publishers.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", sub: "receiving payments" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
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

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === "all" ? records.length : records.filter((r) => r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Records table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Publisher</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Impressions</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross Revenue</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Rev Share</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Publisher Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Wallet</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No records found</td></tr>
            ) : (
              filtered.map((r) => {
                const wallet = r.publisher ? getWallet(r.publisher.notes) : null;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.publisher?.companyName || r.publisher?.name || "—"}</p>
                      <p className="text-xs text-gray-400">{r.publisher?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Calendar size={13} className="text-gray-400" />
                        {monthLabel(r.monthKey)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(r.grossRevenue)}</td>
                    <td className="px-4 py-3 text-right text-indigo-700 font-semibold">{r.revenueShare}%</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(r.publisherAmount)}</td>
                    <td className="px-4 py-3">
                      {wallet ? (
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded truncate block max-w-[120px]" title={wallet}>
                          {wallet.slice(0, 8)}...{wallet.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <CheckCircle2 size={11} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => { setSelected(r); setPaidModal(true); }}
                        >
                          <DollarSign size={13} />
                          Mark Paid
                        </Button>
                      )}
                      {r.status === "paid" && r.paidAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(r.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mark as Paid Modal */}
      <Modal
        open={paidModal}
        onClose={() => { setPaidModal(false); setPaidNote(""); }}
        title="Mark Payment as Paid"
        className="max-w-md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Publisher</span>
                <span className="font-semibold text-gray-900">{selected.publisher?.companyName || selected.publisher?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Month</span>
                <span className="font-semibold text-gray-900">{monthLabel(selected.monthKey)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">Amount to pay</span>
                <span className="font-bold text-green-600 text-base">{formatCurrency(selected.publisherAmount)}</span>
              </div>
            </div>

            {/* Wallet */}
            {selected.publisher && getWallet(selected.publisher.notes) && (
              <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={13} className="text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">BEP20 Wallet</span>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all">
                  {getWallet(selected.publisher.notes)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment note (optional)
              </label>
              <textarea
                value={paidNote}
                onChange={(e) => setPaidNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. USDT 45.20 sent via BEP20 — TxHash: 0x..."
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPaidModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={markPaid} loading={saving} className="flex-1">
                <CheckCircle2 size={14} />
                Confirm Paid
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Record Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Monthly Revenue Record"
        className="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Publisher</label>
            <select
              value={newPubId}
              onChange={(e) => setNewPubId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select publisher...</option>
              {publishers.map((p) => (
                <option key={p.publisher?.id} value={p.publisher?.id}>
                  {p.name} — {p.publisher?.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Gross Revenue ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newGross}
              onChange={(e) => setNewGross(e.target.value)}
              placeholder="e.g. 120.50"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Impressions</label>
            <input
              type="number"
              min="0"
              value={newImpressions}
              onChange={(e) => setNewImpressions(e.target.value)}
              placeholder="e.g. 45000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {newPubId && newGross && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rev Share</span>
                <span className="font-semibold">{publishers.find((p) => p.publisher?.id === newPubId)?.publisher?.revenueShare || 70}%</span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-indigo-100">
                <span className="text-gray-600 font-medium">Publisher earns</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(
                    (parseFloat(newGross) *
                      (publishers.find((p) => p.publisher?.id === newPubId)?.publisher?.revenueShare || 70)) /
                      100
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={addRecord} loading={adding} className="flex-1" disabled={!newPubId || !newMonth || !newGross}>
              <TrendingUp size={14} />
              Add Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
