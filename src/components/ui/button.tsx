import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = [
      "inline-flex items-center justify-center font-semibold rounded-xl",
      "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.97]",
    ].join(" ");

    const variants = {
      primary:   "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm hover:shadow-md hover:-translate-y-0.5",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400",
      danger:    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md hover:-translate-y-0.5",
      ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400",
      outline:   "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-indigo-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5 h-8",
      md: "px-4 py-2 text-sm gap-2 h-9",
      lg: "px-6 py-2.5 text-sm gap-2.5 h-11",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
