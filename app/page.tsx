"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesTrendChart } from "@/components/sales-trend-chart";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type { DashboardStats, Product } from "@/lib/types";

const periods = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "week" },
  { label: "30 Days", value: "month" },
  { label: "All Time", value: "all" },
];

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [trendDays, setTrendDays] = useState(7);
  const isOwner = session?.user?.role === "OWNER";

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchStats() {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard?period=${period}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s what&apos;s happening in your shop
            </p>
          </div>
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <Card className="stat-card-sales border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Total Sales
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(stats?.totalSales || 0)}
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    {period === "today" ? "Today" : period === "week" ? "Last 7 days" : period === "month" ? "Last 30 days" : "All time"}
                  </p>
                </CardContent>
              </Card>

              {isOwner && (
                <Card className="stat-card-profit border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/80">
                      Total Profit
                    </CardTitle>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(stats?.totalProfit || 0)}
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      Net profit after costs
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="stat-card-transactions border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Transactions
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats?.totalTransactions || 0}
                  </div>
                  <p className="text-xs text-white/70 mt-1">Total bills processed</p>
                </CardContent>
              </Card>

              <Card className="stat-card-stock border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Low Stock
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats?.lowStockProducts?.length || 0}
                  </div>
                  <p className="text-xs text-white/70 mt-1">Items need restocking</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Trend Chart — full width */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Performance Trend</h2>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    trendDays === d
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <SalesTrendChart days={trendDays} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.lowStockProducts.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.stock} units remaining
                        </p>
                      </div>
                      <Badge
                        variant={product.stock === 0 ? "destructive" : "secondary"}
                        className={product.stock > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0" : ""}
                      >
                        {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">Stock levels look great!</p>
                  <p className="text-xs text-muted-foreground mt-1">All products are well stocked</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Top Sellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : stats?.topProducts && stats.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {stats.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                          index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                          index === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                          index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.totalQuantity} units sold
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium">No sales recorded</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first bill on the Billing page</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
