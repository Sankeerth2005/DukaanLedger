"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesTrend } from "@/lib/types";
import { TrendingUp } from "lucide-react";

// Dynamically import Recharts to prevent SSR issues and re-render loops
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart = dynamic(() => import("recharts").then(m => m.ComposedChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-card/95 backdrop-blur p-3 shadow-xl text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium">
              {entry.name === "transactions"
                ? entry.value
                : `₹${entry.value.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function SalesTrendChart({ days = 7 }: { days?: number }) {
  const [data, setData] = useState<SalesTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchTrend() {
      try {
        const res = await fetch(`/api/dashboard/trend?days=${days}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch trend", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTrend();
  }, [days]);

  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Sales & Profit Trend ({days} Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#salesGrad)"
              name="sales"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#profitGrad)"
              name="profit"
              isAnimationActive={false}
            />
            <Bar
              dataKey="transactions"
              fill="#a855f7"
              opacity={0.6}
              name="transactions"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

