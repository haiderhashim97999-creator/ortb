import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "gray" | "purple";
}

export function Badge({ variant = "gray", className, children, ...props }: BadgeProps) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50  text-amber-700  border-amber-200",
    danger:  "bg-red-50    text-red-700    border-red-200",
    info:    "bg-blue-50   text-blue-700   border-blue-200",
    gray:    "bg-gray-100  text-gray-600   border-gray-200",
    purple:  "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string; dot: string }> = {
    active:  { variant: "success", label: "Active",  dot: "bg-emerald-500" },
    pending: { variant: "warning", label: "Pending", dot: "bg-amber-500" },
    banned:  { variant: "danger",  label: "Banned",  dot: "bg-red-500" },
    paused:  { variant: "gray",    label: "Paused",  dot: "bg-gray-400" },
  };
  const cfg = map[status] ?? { variant: "gray" as const, label: status, dot: "bg-gray-400" };
  return (
    <Badge variant={cfg.variant}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {cfg.label}
    </Badge>
  );
}
