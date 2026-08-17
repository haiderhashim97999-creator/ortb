import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReport, getDateRange } from "@/lib/omnidex";
import { StatCard } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Users, Globe, DollarSign, Eye, Clock, Ban, CheckCircle, Code2, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getAdminStats() {
  const range = getDateRange(30);
  const [total, pending, banned, sites, adUnits] = await Promise.all([
    prisma.user.count({ where: { role: "publisher" } }),
    prisma.user.count({ where: { role: "publisher", status: "pending" } }),
    prisma.user.count({ where: { role: "publisher", status: "banned" } }),
    prisma.site.count(),
    prisma.adUnit.count(),
  ]);

  let revenue30 = 0, impressions30 = 0;
  try {
    const r = await getReport({ from: range.from, to: range.to, dimensions: [], metrics: ["Impressions","Revenue"] });
    if (r.success && r.data.rows.length > 0) {
      revenue30     = r.data.rows[0].Revenue     || 0;
      impressions30 = r.data.rows[0].Impressions || 0;
    }
  } catch { /* API unavailable */ }

  return { total, pending, banned, active: total - pending - banned, sites, adUnits, revenue30, impressions30 };
}

export default async function AdminPage() {
  try { await requireAdmin(); } catch { return null; }
  const s = await getAdminStats();

  const cards = [
    { label: "Total Publishers",  value: s.total.toString(),              sub: "registered",                  icon: Users,        color: "text-indigo-600",  bg: "bg-indigo-50",  delay: 0 },
    { label: "Active Publishers", value: s.active.toString(),             sub: "currently serving ads",       icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50", delay: 0.07 },
    { label: "Pending Approval",  value: s.pending.toString(),            sub: "awaiting review",             icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   delay: 0.14 },
    { label: "Banned",            value: s.banned.toString(),             sub: "suspended accounts",          icon: Ban,          color: "text-red-600",     bg: "bg-red-50",     delay: 0.21 },
    { label: "Total Sites",       value: s.sites.toString(),              sub: "registered domains",          icon: Globe,        color: "text-sky-600",     bg: "bg-sky-50",     delay: 0.07 },
    { label: "Total Ad Units",    value: s.adUnits.toString(),            sub: "banner + video",              icon: Code2,        color: "text-violet-600",  bg: "bg-violet-50",  delay: 0.14 },
    { label: "Revenue (30d)",     value: formatCurrency(s.revenue30),    sub: "network total",               icon: DollarSign,   color: "text-emerald-600", bg: "bg-emerald-50", delay: 0.21 },
    { label: "Impressions (30d)", value: formatNumber(s.impressions30),  sub: "across all publishers",       icon: Eye,          color: "text-cyan-600",    bg: "bg-cyan-50",    delay: 0.28 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="animate-fade-down">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={22} className="text-indigo-500" />
              Admin Overview
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Network-wide statistics & management</p>
          </div>
          <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            MongoDB Atlas · Live
          </div>
        </div>
      </div>

      {/* Pending alert */}
      {s.pending > 0 && (
        <div className="animate-fade-down flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-amber-900 font-semibold text-sm">
                {s.pending} publisher{s.pending > 1 ? "s" : ""} waiting for approval
              </p>
              <p className="text-amber-700 text-xs mt-0.5">Review and approve to activate their accounts</p>
            </div>
          </div>
          <Link href="/admin/publishers" className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors flex-shrink-0">
            Review <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Quick nav tiles */}
      <div className="animate-fade-up stagger-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/publishers", label: "Publishers",  icon: Users,     color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
          { href: "/admin/reports",    label: "Reports",     icon: BarChart3, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { href: "/admin/ortb",       label: "oRTB Demand", icon: Code2,     color: "bg-violet-50 text-violet-700 border-violet-100" },
          { href: "/admin/settings",   label: "Settings",    icon: Globe,     color: "bg-sky-50 text-sky-700 border-sky-100" },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <a key={q.href} href={q.href}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${q.color}`}>
              <Icon size={15} />
              {q.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
