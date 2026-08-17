"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  revenue: number;
  impressions: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  metric?: "revenue" | "impressions";
}

export function RevenueChart({ data, metric = "revenue" }: RevenueChartProps) {
  const color = metric === "revenue" ? "#6366f1" : "#10b981";
  const label = metric === "revenue" ? "Revenue ($)" : "Impressions";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v) => v.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => metric === "revenue" ? `$${v}` : v.toLocaleString()}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}
          formatter={(v: unknown) => {
            const val = Number(v) || 0;
            return metric === "revenue"
              ? [`$${val.toFixed(2)}`, label]
              : [val.toLocaleString(), label];
          }}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${metric})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
