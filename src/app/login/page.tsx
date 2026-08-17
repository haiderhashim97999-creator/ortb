"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, Mail, ArrowRight, Zap } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" as const },
});

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      window.location.href = data.user.role === "admin" ? "/admin" : "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Left panel — branding ─────────────────── */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)" }}>

        {/* Floating orbs */}
        <div className="absolute top-16 left-12 w-64 h-64 rounded-full opacity-20 blur-3xl animate-float"
          style={{ background: "radial-gradient(circle,#6366f1,transparent)" }} />
        <div className="absolute bottom-20 right-8 w-48 h-48 rounded-full opacity-15 blur-2xl animate-float"
          style={{ background: "radial-gradient(circle,#8b5cf6,transparent)", animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-16 w-32 h-32 rounded-full opacity-10 blur-2xl animate-float"
          style={{ background: "radial-gradient(circle,#06b6d4,transparent)", animationDelay: "0.8s" }} />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 mx-auto glow-brand"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <TrendingUp size={28} className="text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">YieldProsper</h1>
          <p className="text-indigo-300 text-lg mb-10">Publisher Ad Network</p>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: Zap,        text: "Real-time ad performance reporting" },
              { icon: TrendingUp, text: "oRTB header bidding" },
              { icon: Lock,       text: "Secure publisher portal" },
            ].map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3 bg-white/[0.07] border border-white/[0.1] rounded-xl px-4 py-3"
              >
                <f.icon size={16} className="text-indigo-300 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right panel — form ───────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <motion.div {...fadeUp(0)} className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              <TrendingUp size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">YieldProsper</h1>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            <motion.div {...fadeUp(0.05)} className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your publisher account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div {...fadeUp(0.1)}>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.15)}>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <motion.div {...fadeUp(0.2)}>
                <Button type="submit" className="w-full h-11 text-sm" loading={loading}>
                  {!loading && (
                    <>Sign in <ArrowRight size={15} /></>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.p {...fadeUp(0.25)} className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                Apply as publisher
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
