"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Globe, Code2, BarChart3, Users,
  Settings, LogOut, Zap, Shield, TrendingUp, ChevronRight,
} from "lucide-react";

interface NavItem { label: string; href: string; icon: React.ElementType }

const publisherNav: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",          icon: LayoutDashboard },
  { label: "Sites",      href: "/dashboard/sites",     icon: Globe },
  { label: "Ad Units",   href: "/dashboard/adunits",   icon: Code2 },
  { label: "Reports",    href: "/dashboard/reports",   icon: BarChart3 },
  { label: "Settings",   href: "/dashboard/settings",  icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview",    href: "/admin",              icon: LayoutDashboard },
  { label: "Publishers",  href: "/admin/publishers",   icon: Users },
  { label: "Reports",     href: "/admin/reports",      icon: TrendingUp },
  { label: "oRTB Demand", href: "/admin/ortb",         icon: Zap },
  { label: "Settings",    href: "/admin/settings",     icon: Shield },
];

interface SidebarProps {
  role: "admin" | "publisher";
  userName: string;
  onLogout: () => void;
  onClose?: () => void;
}

const itemVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export function Sidebar({ role, userName, onLogout, onClose }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "admin" ? adminNav : publisherNav;

  return (
    <aside className="w-64 h-full flex flex-col" style={{ background: "var(--sidebar-bg)" }}>

      {/* ── Logo ────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href={role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-3 group" onClick={onClose}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-brand"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}>
              <TrendingUp size={17} className="text-white" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 70%)" }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-wide">YieldProsper</p>
            <p className="text-xs text-slate-400 leading-tight">Ad Network</p>
          </div>
        </Link>
      </div>

      {/* ── User badge ──────────────────────────────── */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: "rgba(255,255,255,.04)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: role === "admin" ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "linear-gradient(135deg,#06b6d4,#6366f1)" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{userName}</p>
            <p className="text-xs mt-0.5" style={{ color: role === "admin" ? "#a78bfa" : "#67e8f9" }}>
              {role === "admin" ? "Administrator" : "Publisher"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "#475569" }}>
          {role === "admin" ? "Management" : "Navigation"}
        </p>
        {nav.map((item, i) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <motion.div key={item.href} custom={i} variants={itemVariants} initial="hidden" animate="visible">
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {/* Active background */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "linear-gradient(135deg,rgba(99,102,241,.35) 0%,rgba(139,92,246,.2) 100%)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {/* Active left bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-indigo-400" />
                )}

                <Icon size={16} className={cn("relative z-10 flex-shrink-0 transition-transform duration-200", active ? "text-indigo-300" : "group-hover:scale-110")} />
                <span className="relative z-10 flex-1">{item.label}</span>
                {active && <ChevronRight size={13} className="relative z-10 text-indigo-400 opacity-70" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Logout ──────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={onLogout}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
        >
          <LogOut size={16} className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
