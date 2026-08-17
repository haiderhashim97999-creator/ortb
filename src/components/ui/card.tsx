import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 transition-all duration-200 hover:shadow-md",
        className
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4 border-b border-gray-100", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold text-gray-800 flex items-center gap-2", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

/* Stat card — animated number + icon */
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  delay?: number;
}

export function StatCard({ label, value, sub, icon: Icon, color, bg, delay = 0 }: StatCardProps) {
  return (
    <div
      className="animate-fade-up bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group cursor-default"
      style={{ boxShadow: "var(--shadow-sm)", animationDelay: `${delay}s` }}
    >
      <div className={`${bg} p-3 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight animate-count-up"
          style={{ animationDelay: `${delay + 0.1}s` }}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
