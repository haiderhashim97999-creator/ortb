"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Global error:", error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={30} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">
          An unexpected error occurred. Please try again or contact support if the issue persists.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 text-left mb-6 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw size={14} /> Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
