import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm animate-scale-in">
        <div
          className="text-8xl font-black mb-4"
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Home size={15} /> Go home
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} /> Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
