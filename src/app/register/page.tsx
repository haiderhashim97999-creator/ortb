"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, CheckCircle, User, Mail, Lock, Building2, Globe, ArrowRight } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

interface FieldProps {
  icon: React.ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
}
function Field({ icon: Icon, label, type = "text", value, onChange, placeholder, required, minLength }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form,    setForm]    = useState({ name: "", email: "", password: "", companyName: "", website: "" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your publisher account is pending admin review. You&apos;ll be notified once approved.
          </p>
          <Link href="/login">
            <Button className="px-8">Back to sign in</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <motion.div {...fadeUp(0)} className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <TrendingUp size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">YieldProsper</h1>
          <p className="text-gray-500 text-sm mt-1">Publisher Application</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
        >
          <motion.div {...fadeUp(0.05)} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Apply as a publisher</h2>
            <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <motion.div {...fadeUp(0.08)}>
              <Field icon={User} label="Full name" value={form.name} onChange={update("name")} placeholder="John Smith" required />
            </motion.div>
            <motion.div {...fadeUp(0.12)}>
              <Field icon={Mail} label="Email address" type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required />
            </motion.div>
            <motion.div {...fadeUp(0.16)}>
              <Field icon={Lock} label="Password" type="password" value={form.password} onChange={update("password")} placeholder="Min. 8 characters" required minLength={8} />
            </motion.div>
            <motion.div {...fadeUp(0.20)}>
              <Field icon={Building2} label="Company name" value={form.companyName} onChange={update("companyName")} placeholder="Acme Media Inc" required />
            </motion.div>
            <motion.div {...fadeUp(0.24)}>
              <Field icon={Globe} label="Website" type="url" value={form.website} onChange={update("website")} placeholder="https://yoursite.com" required />
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

            <motion.div {...fadeUp(0.28)}>
              <Button type="submit" className="w-full h-11 text-sm mt-1" loading={loading}>
                {!loading && (<>Submit application <ArrowRight size={15} /></>)}
              </Button>
            </motion.div>
          </form>

          <motion.p {...fadeUp(0.32)} className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
