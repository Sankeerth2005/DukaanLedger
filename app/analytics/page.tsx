"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsPanel } from "@/components/insights-panel";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { AnimatedNumber, fadeUp, stagger } from "@/components/motion";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  BarChart2, Percent, Sparkles, Target,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend,
} from "recharts";
import type { Insight } from "@/lib/services/insightsService";

interface AnalyticsSummary {
  totalRevenue: number;
  totalProfit: number;
  totalDiscount: number;
  totalOrders: number;
  avgOrderValue: number;
  profitMargin: number;
}

interface DailyPoint { date: string; revenue: number; profit: number; orders: number; }
interface TopProduct { name: string; revenue: number; quantity: number; profit: number; margin: number; }
interface AnalyticsData {
  summary: AnalyticsSummary;
  daily: DailyPoint[];
  topProducts: TopProduct[];
  insights: Insight[];
}

const PERIOD_OPTIONS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "All Time", days: 365 },
];

const PRODUCT_COLORS = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function KpiCard({ label, value, icon: Icon, sub, positive }: {
  label: string; value: string | number; icon: any; sub?: string; positive?: boolean;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-300 group">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
            {typeof value === "number" ? <AnimatedNumber value={value} prefix="₹" /> : value}
          </p>
          {sub && (
            <p className={`text-xs font-medium flex items-center gap-1 ${positive ? "text-emerald-400" : "text-muted-foreground"}`}>
              {sub}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card/95 backdrop-blur p-3 shadow-xl text-xs">
      <p className="font-semibold mb-2 text-sm">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium">
            {entry.name === "orders" ? entry.value : `₹${Number(entry.value).toLocaleString("en-IN")}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const analyticsRes = await fetch(`/api/analytics?days=${days}`);
      const analyticsJson = await analyticsRes.json();
      if (analyticsJson.success) setData(analyticsJson.data);
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const summary = data?.summary;

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight gradient-text" style={{ fontFamily: "Syne, sans-serif" }}>
                Business Analytics
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                AI-powered insights and real-time data for <strong>{session?.user?.name?.split(" ")[0]}'s</strong> shop
              </p>
            </div>
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 glass border border-border/40">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setDays(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    days === opt.days
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
        >
          {loading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            <>
              <KpiCard label="Revenue" value={summary?.totalRevenue ?? 0} icon={DollarSign} sub={`${days}d total`} />
              <KpiCard label="Profit" value={summary?.totalProfit ?? 0} icon={TrendingUp} positive={true} sub={`${summary?.profitMargin.toFixed(1)}% margin`} />
              <KpiCard label="Orders" value={`${summary?.totalOrders ?? 0}`} icon={ShoppingBag} sub={`${days} day window`} />
              <KpiCard label="Avg Order" value={summary?.avgOrderValue ?? 0} icon={Target} sub="per transaction" />
              <KpiCard label="Discounts" value={summary?.totalDiscount ?? 0} icon={Percent} sub="total given" />
              <KpiCard label="Margin %" value={`${summary?.profitMargin.toFixed(1) ?? 0}%`} icon={BarChart2} positive={(summary?.profitMargin ?? 0) > 20} sub={(summary?.profitMargin ?? 0) > 20 ? "Healthy ✓" : "Below 20%"} />
            </>
          )}
        </motion.div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue + Profit Trend */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  Revenue & Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.daily ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
                      <Area type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2} fill="url(#proGrad)"  name="profit"  />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <div>
            <Card className="glass-card border-white/10 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[320px] pr-1 scrollbar-thin">
                <InsightsPanel insights={data?.insights ?? []} loading={loading} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by product — horizontal bar */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4 text-purple-400" />
                Top Products by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (data?.topProducts ?? []).length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data?.topProducts ?? []).slice(0, 7)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="revenue" radius={[0, 6, 6, 0]}>
                      {(data?.topProducts ?? []).slice(0, 7).map((_, i) => (
                        <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Margin Leaderboard */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Percent className="h-4 w-4 text-emerald-400" />
                Profit Margin Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (data?.topProducts ?? []).length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <div className="space-y-2.5">
                  {[...( data?.topProducts ?? [])]
                    .sort((a, b) => b.margin - a.margin)
                    .slice(0, 7)
                    .map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <span className={`text-xs font-bold ml-2 ${p.margin > 30 ? "text-emerald-400" : p.margin > 15 ? "text-amber-400" : "text-red-400"}`}>
                              {p.margin.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: p.margin > 30 ? "#10b981" : p.margin > 15 ? "#f59e0b" : "#ef4444" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(p.margin, 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
