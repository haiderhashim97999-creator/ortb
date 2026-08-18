"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { statusBadge } from "@/components/ui/badge";
import { CheckCircle, Ban, Eye, CreditCard, DollarSign, TrendingUp, RefreshCw, Globe, XCircle } from "lucide-react";

interface Site {
  id: string;
  name: string;
  domain: string;
  status: string;
  adagioSite: string;
  createdAt: string;
  publisher: {
    companyName: string;
    user: { name: string; email: string };
  };
  adUnits: { id: string }[];
}

interface Publisher {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  publisher?: {
    id: string;
    companyName: string;
    website: string;
    revenueShare: number;
    notes: string;
    sellerId: string;
    sites: { id: string; name: string; domain: string; adUnits: { id: string }[] }[];
  };
}

interface PaymentProfile {
  accountName?: string;
  accountDetail?: string;
}

interface NetworkRevenue {
  revenue: number;
  impressions: number;
}

function parseNotes(notes: string): { paymentProfile: PaymentProfile | null; adminNotes: string } {
  try {
    const p = JSON.parse(notes || "{}");
    return { paymentProfile: p.paymentProfile || null, adminNotes: p.adminNotes || "" };
  } catch {
    return { paymentProfile: null, adminNotes: notes || "" };
  }
}

function fmt(n: number) {
  return "$" + n.toFixed(2);
}
function fmtN(n: number) {
  return n.toLocaleString();
}

export default function PublishersPage() {
  const [tab, setTab] = useState<"publishers" | "sites">("publishers");
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteLoading, setSiteLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("pending");

  // Modal state
  const [selected, setSelected] = useState<Publisher | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editRevShare, setEditRevShare] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [paymentProfile, setPaymentProfile] = useState<PaymentProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Network revenue (last 30 days from reporting API)
  const [netRevenue, setNetRevenue] = useState<NetworkRevenue | null>(null);
  const [revLoading, setRevLoading] = useState(false);

  const fetchPublishers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/publishers");
    const data = await res.json();
    setPublishers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const fetchSites = useCallback(async () => {
    setSiteLoading(true);
    const res = await fetch("/api/admin/sites");
    const data = await res.json();
    setSites(data.success ? data.sites : []);
    setSiteLoading(false);
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevLoading(true);
    try {
      const res = await fetch("/api/admin/publisher-revenue");
      const data = await res.json();
      if (data.success) setNetRevenue(data.last30Days);
    } catch { /* silent */ }
    setRevLoading(false);
  }, []);

  useEffect(() => {
    fetchPublishers();
    fetchRevenue();
    fetchSites();
  }, [fetchPublishers, fetchRevenue, fetchSites]);

  async function siteAction(siteId: string, action: "approve" | "reject" | "suspend") {
    await fetch("/api/admin/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, action }),
    });
    await fetchSites();
  }

  function calcPublisherRevenue(revShare: number, totalRevenue: number) {
    return (totalRevenue * revShare) / 100;
  }

  async function action(userId: string, act: "approve" | "ban" | "unban" | "update") {
    setSaving(true);
    await fetch("/api/admin/publishers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action: act,
        revenueShare: act === "update" ? parseFloat(editRevShare) : undefined,
        adminNotes: act === "update" ? editNotes : undefined,
      }),
    });
    await fetchPublishers();
    setSaving(false);
    if (act === "update") setDetailOpen(false);
  }

  function openDetail(pub: Publisher) {
    setSelected(pub);
    setEditRevShare(pub.publisher?.revenueShare?.toString() || "70");
    const { paymentProfile: pp, adminNotes } = parseNotes(pub.publisher?.notes || "");
    setPaymentProfile(pp);
    setEditNotes(adminNotes);
    setDetailOpen(true);
  }

  const filtered = publishers.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const activeCount = publishers.filter((p) => p.status === "active").length;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publishers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage accounts, revenue & payouts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("publishers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "publishers" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Publishers
          </button>
          <button
            onClick={() => setTab("sites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${tab === "sites" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Sites
            {sites.filter((s) => s.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {sites.filter((s) => s.status === "pending").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── SITES TAB ────────────────────────────── */}
      {tab === "sites" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["pending", "active", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setSiteFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${siteFilter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1.5 text-xs opacity-70">
                  ({f === "all" ? sites.length : sites.filter((s) => s.status === f).length})
                </span>
              </button>
            ))}
            <button onClick={fetchSites} className="ml-auto text-gray-400 hover:text-indigo-600 p-1.5">
              <RefreshCw size={14} className={siteLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Site</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Domain</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Publisher</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Adagio Site</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ad Units</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {siteLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : sites.filter((s) => siteFilter === "all" || s.status === siteFilter).length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No sites found</td></tr>
                ) : (
                  sites
                    .filter((s) => siteFilter === "all" || s.status === siteFilter)
                    .map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{site.name}</td>
                        <td className="px-4 py-3">
                          <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1">
                            <Globe size={12} />
                            {site.domain}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{site.publisher?.user?.name}</p>
                          <p className="text-xs text-gray-400">{site.publisher?.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <AdagioSiteInput siteId={site.id} current={site.adagioSite} onSave={fetchSites} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">{site.adUnits?.length || 0}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(site.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-center">{statusBadge(site.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {site.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => siteAction(site.id, "approve")}>
                                  <CheckCircle size={13} /> Approve
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => siteAction(site.id, "reject")}>
                                  <XCircle size={13} /> Reject
                                </Button>
                              </>
                            )}
                            {site.status === "active" && (
                              <Button size="sm" variant="outline" onClick={() => siteAction(site.id, "suspend")}>
                                Suspend
                              </Button>
                            )}
                            {(site.status === "rejected" || site.status === "suspended") && (
                              <Button size="sm" variant="outline" onClick={() => siteAction(site.id, "approve")}>
                                Re-approve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PUBLISHERS TAB ───────────────────────── */}
      {tab === "publishers" && (<>
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "active", "banned"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({publishers.filter((p) => p.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Network Revenue Summary (last 30 days) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">Network Revenue (30d)</p>
            <button onClick={fetchRevenue} className="text-gray-400 hover:text-indigo-600" title="Refresh">
              <RefreshCw size={13} className={revLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {netRevenue ? fmt(netRevenue.revenue) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {netRevenue ? fmtN(netRevenue.impressions) + " impressions" : "Loading..."}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 font-medium">Active Publishers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">out of {publishers.length} total</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-500 font-medium">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {publishers.filter((p) => p.status === "pending").length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">need review</p>
        </div>
      </div>

      {/* Publishers Table */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Publisher</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sites</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rev Share</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Est. Revenue (30d)</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((pub) => {
                const { paymentProfile: pp } = parseNotes(pub.publisher?.notes || "");
                const revShare = pub.publisher?.revenueShare || 70;
                // Individual publisher revenue = their share of total network revenue
                // (proportional split — in production this would be per-publisher reporting)
                const pubRevenue = netRevenue
                  ? calcPublisherRevenue(revShare, netRevenue.revenue / Math.max(activeCount, 1))
                  : null;

                return (
                  <tr key={pub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{pub.name}</p>
                      <p className="text-xs text-gray-400">{pub.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pub.publisher?.companyName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{pub.publisher?.sites?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-indigo-700">{revShare}%</span>
                    </td>
                    <td className="px-4 py-3">
                      {pub.status === "active" ? (
                        <span className="font-medium text-green-700">
                          {pubRevenue !== null ? fmt(pubRevenue) : "—"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pp?.accountDetail ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          ✓ BEP20
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(pub.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(pub)} className="text-gray-400 hover:text-indigo-600 p-1.5" title="View & edit">
                          <Eye size={15} />
                        </button>
                        {pub.status === "pending" && (
                          <button onClick={() => action(pub.id, "approve")} className="text-green-500 hover:text-green-700 p-1.5" title="Approve">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {pub.status === "active" && (
                          <button onClick={() => action(pub.id, "ban")} className="text-red-400 hover:text-red-600 p-1.5" title="Ban">
                            <Ban size={15} />
                          </button>
                        )}
                        {pub.status === "banned" && (
                          <button onClick={() => action(pub.id, "unban")} className="text-blue-400 hover:text-blue-600 p-1.5" title="Unban">
                            <RotateCcwIcon size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No publishers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      </>)}

      {/* Detail / Edit Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected?.publisher?.companyName || "Publisher Details"}
        className="max-w-xl"
      >
        {selected && (() => {
          const revShare = parseFloat(editRevShare) || 70;
          const pubNetRev = netRevenue
            ? netRevenue.revenue / Math.max(activeCount, 1)
            : 0;
          const pubEarnings = calcPublisherRevenue(revShare, pubNetRev);
          const networkShare = 100 - revShare;
          const networkEarnings = pubNetRev - pubEarnings;

          return (
            <div className="space-y-5">

              {/* Basic info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Name", selected.name],
                  ["Email", selected.email],
                  ["Status", selected.status],
                  ["Website", selected.publisher?.website || "—"],
                  ["Sites", selected.publisher?.sites?.length?.toString() || "0"],
                  ["Joined", new Date(selected.createdAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-gray-400 text-xs">{k}</p>
                    <p className="font-medium text-gray-800 truncate">{v}</p>
                  </div>
                ))}
              </div>

              {/* Sites */}
              {selected.publisher?.sites && selected.publisher.sites.length > 0 && (
                <Card>
                  <CardContent className="py-3 space-y-1">
                    {selected.publisher.sites.map((s) => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{s.domain}</span>
                        <span className="text-gray-400">{s.adUnits.length} ad units</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Revenue breakdown */}
              <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={15} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-indigo-800">Revenue Breakdown (last 30d)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-gray-500">Publisher earnings</p>
                    <p className="text-lg font-bold text-green-600">{fmt(pubEarnings)}</p>
                    <p className="text-xs text-gray-400">{revShare}% share</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-gray-500">Network share</p>
                    <p className="text-lg font-bold text-indigo-600">{fmt(networkEarnings)}</p>
                    <p className="text-xs text-gray-400">{networkShare}% share</p>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-2 opacity-70">
                  * Based on proportional share of total network revenue. NET-60 payment terms apply.
                </p>
              </div>

              {/* Payment Profile */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={15} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Payment Profile</h3>
                </div>
                {paymentProfile?.accountDetail ? (
                  <div className="space-y-2 text-sm">
                    <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      BNB BEP20 (USDT/USDC)
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-xs">Account name</span>
                        <span className="font-medium text-gray-800 text-xs">{paymentProfile.accountName || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block mb-0.5">Wallet address (BEP20)</span>
                        <span className="font-mono text-xs text-gray-800 bg-gray-50 px-2 py-1 rounded block break-all">
                          {paymentProfile.accountDetail}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600 text-sm">
                    <span className="text-lg">⚠️</span>
                    <span>Publisher has not set payment details yet. Cannot process payout.</span>
                  </div>
                )}
              </div>

              {/* Revenue Share + Admin Notes */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={15} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Revenue & Payout Settings</h3>
                </div>
                <Input
                  label="Revenue share (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editRevShare}
                  onChange={(e) => setEditRevShare(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin notes (internal)</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Payment sent Feb 2026, USDT $230 BEP20..."
                  />
                </div>
              </div>

              {/* Save + Status Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => action(selected.id, "update")} loading={saving} className="flex-1">Save changes</Button>
              </div>

              <div className="flex gap-2 border-t pt-4 flex-wrap">
                {selected.status === "pending" && (
                  <Button variant="primary" size="sm" onClick={() => action(selected.id, "approve")} loading={saving}>
                    <CheckCircle size={14} /> Approve
                  </Button>
                )}
                {selected.status === "active" && (
                  <Button variant="danger" size="sm" onClick={() => action(selected.id, "ban")} loading={saving}>
                    <Ban size={14} /> Ban publisher
                  </Button>
                )}
                {selected.status === "banned" && (
                  <Button variant="secondary" size="sm" onClick={() => action(selected.id, "unban")} loading={saving}>
                    <RotateCcwIcon size={14} /> Unban
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function RotateCcwIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// Inline editable Adagio site slug field
function AdagioSiteInput({ siteId, current, onSave }: { siteId: string; current: string; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, adagioSite: value }),
    });
    setSaving(false);
    setEditing(false);
    onSave();
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors">
        {current || "set slug..."}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. trendsbuild-xyz"
        className="border border-gray-300 rounded px-2 py-0.5 text-xs font-mono w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button onClick={save} disabled={saving}
        className="text-green-600 hover:text-green-700 text-xs font-semibold">
        {saving ? "..." : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
    </div>
  );
}
