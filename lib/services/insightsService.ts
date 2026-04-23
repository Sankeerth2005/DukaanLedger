import { prisma } from "@/lib/prisma";

export type InsightSeverity = "positive" | "warning" | "critical" | "info";

export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  value?: string;
}

export async function generateInsights(shopId: string): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();

  // Date boundaries
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

  try {
    // Parallel data fetch
    const [
      thisWeekSales,
      lastWeekSales,
      topProducts,
      lowStockProducts,
      allProducts,
      recentItems,
      todaySales,
    ] = await Promise.all([
      // This week revenue
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: weekAgo } },
        _sum: { totalAmount: true, totalProfit: true },
        _count: { id: true },
      }),
      // Last week revenue
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
        _sum: { totalAmount: true, totalProfit: true },
        _count: { id: true },
      }),
      // Top products by revenue (last 30 days)
      prisma.saleItem.groupBy({
        by: ["productName"],
        where: { sale: { shopId, createdAt: { gte: monthAgo } } },
        _sum: { lineTotal: true, quantity: true, profit: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 5,
      }),
      // Low stock products
      prisma.product.findMany({
        where: { shopId, stock: { lte: 5, gt: 0 } },
        orderBy: { stock: "asc" },
        take: 5,
      }),
      // All products (for slow mover detection)
      prisma.product.findMany({
        where: { shopId },
        select: { id: true, name: true, stock: true },
      }),
      // Items sold last 30 days (for slow mover)
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { shopId, createdAt: { gte: monthAgo } } },
        _sum: { quantity: true },
      }),
      // Today sales
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: todayStart } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    // 1. Week-over-week revenue growth
    const thisWeekRev = thisWeekSales._sum.totalAmount ?? 0;
    const lastWeekRev = lastWeekSales._sum.totalAmount ?? 0;
    if (lastWeekRev > 0) {
      const growthPct = ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100;
      if (growthPct >= 10) {
        insights.push({
          id: "growth-positive",
          icon: "📈",
          title: "Revenue Growing!",
          description: `This week's revenue is ${growthPct.toFixed(1)}% higher than last week.`,
          severity: "positive",
          value: `+${growthPct.toFixed(1)}%`,
        });
      } else if (growthPct <= -10) {
        insights.push({
          id: "growth-warning",
          icon: "📉",
          title: "Revenue Dip Detected",
          description: `Revenue dropped ${Math.abs(growthPct).toFixed(1)}% compared to last week. Consider running a promotion.`,
          severity: "warning",
          value: `${growthPct.toFixed(1)}%`,
        });
      }
    }

    // 2. Profit margin health
    const thisWeekProfit = thisWeekSales._sum.totalProfit ?? 0;
    if (thisWeekRev > 0) {
      const marginPct = (thisWeekProfit / thisWeekRev) * 100;
      if (marginPct >= 30) {
        insights.push({
          id: "margin-healthy",
          icon: "💰",
          title: "Healthy Profit Margin",
          description: `Your profit margin this week is ${marginPct.toFixed(1)}% — above the 30% benchmark.`,
          severity: "positive",
          value: `${marginPct.toFixed(1)}%`,
        });
      } else if (marginPct < 15 && thisWeekRev > 0) {
        insights.push({
          id: "margin-low",
          icon: "⚠️",
          title: "Low Profit Margin",
          description: `Margin is only ${marginPct.toFixed(1)}%. Review your product pricing or buying costs.`,
          severity: "warning",
          value: `${marginPct.toFixed(1)}%`,
        });
      }
    }

    // 3. Best selling product
    if (topProducts.length > 0) {
      const best = topProducts[0];
      insights.push({
        id: "top-product",
        icon: "🏆",
        title: "Top Seller This Month",
        description: `"${best.productName}" generated ₹${(best._sum.lineTotal ?? 0).toLocaleString("en-IN")} in revenue (${best._sum.quantity ?? 0} units sold).`,
        severity: "info",
        value: `₹${((best._sum.lineTotal ?? 0) / 1000).toFixed(1)}k`,
      });
    }

    // 4. Low stock alerts
    if (lowStockProducts.length > 0) {
      const names = lowStockProducts.slice(0, 3).map(p => `${p.name} (${p.stock} left)`).join(", ");
      insights.push({
        id: "low-stock",
        icon: "📦",
        title: `${lowStockProducts.length} Product${lowStockProducts.length > 1 ? "s" : ""} Running Low`,
        description: `Restock soon: ${names}.`,
        severity: lowStockProducts.some(p => p.stock <= 2) ? "critical" : "warning",
        value: `${lowStockProducts.length} items`,
      });
    }

    // 5. Slow movers (stock > 10, 0 sales in 30 days)
    const soldProductIds = new Set(recentItems.map(i => i.productId).filter(Boolean));
    const slowMovers = allProducts.filter(p => p.stock > 10 && !soldProductIds.has(p.id));
    if (slowMovers.length > 0) {
      insights.push({
        id: "slow-movers",
        icon: "🐌",
        title: `${slowMovers.length} Slow-Moving Product${slowMovers.length > 1 ? "s" : ""}`,
        description: `These have stock but 0 sales in 30 days: ${slowMovers.slice(0, 3).map(p => p.name).join(", ")}. Consider discounting.`,
        severity: "warning",
        value: `${slowMovers.length} items`,
      });
    }

    // 6. Today's performance
    const todayRev = todaySales._sum.totalAmount ?? 0;
    const todayOrders = todaySales._count.id ?? 0;
    if (todayOrders > 0) {
      insights.push({
        id: "today-performance",
        icon: "☀️",
        title: "Today's Performance",
        description: `${todayOrders} order${todayOrders > 1 ? "s" : ""} placed today with ₹${todayRev.toLocaleString("en-IN")} in revenue.`,
        severity: "info",
        value: `₹${(todayRev / 1000).toFixed(1)}k`,
      });
    }

    // 7. Out of stock alert
    const outOfStock = await prisma.product.count({ where: { shopId, stock: 0 } });
    if (outOfStock > 0) {
      insights.push({
        id: "out-of-stock",
        icon: "🚨",
        title: `${outOfStock} Product${outOfStock > 1 ? "s" : ""} Out of Stock`,
        description: `${outOfStock} product${outOfStock > 1 ? "s are" : " is"} out of stock and cannot be sold. Restock immediately.`,
        severity: "critical",
        value: `${outOfStock} items`,
      });
    }

  } catch (error) {
    console.error("Error generating insights:", error);
  }

  // Sort: critical first, then warning, then positive, then info
  const order = { critical: 0, warning: 1, positive: 2, info: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

export async function getAnalyticsData(shopId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [sales, topProducts, revenueByDay] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, createdAt: { gte: since } },
      _sum: { totalAmount: true, totalProfit: true, totalDiscount: true },
      _count: { id: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productName"],
      where: { sale: { shopId, createdAt: { gte: since } } },
      _sum: { lineTotal: true, quantity: true, profit: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 10,
    }),
    prisma.sale.findMany({
      where: { shopId, createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true, totalProfit: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group revenue by day
  const dailyMap = new Map<string, { revenue: number; profit: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    dailyMap.set(key, { revenue: 0, profit: 0, orders: 0 });
  }
  for (const sale of revenueByDay) {
    const key = sale.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const existing = dailyMap.get(key) || { revenue: 0, profit: 0, orders: 0 };
    dailyMap.set(key, {
      revenue: existing.revenue + sale.totalAmount,
      profit: existing.profit + sale.totalProfit,
      orders: existing.orders + 1,
    });
  }

  return {
    summary: {
      totalRevenue: sales._sum.totalAmount ?? 0,
      totalProfit: sales._sum.totalProfit ?? 0,
      totalDiscount: sales._sum.totalDiscount ?? 0,
      totalOrders: sales._count.id ?? 0,
      avgOrderValue: sales._count.id > 0 ? (sales._sum.totalAmount ?? 0) / sales._count.id : 0,
      profitMargin: (sales._sum.totalAmount ?? 0) > 0
        ? ((sales._sum.totalProfit ?? 0) / (sales._sum.totalAmount ?? 0)) * 100
        : 0,
    },
    daily: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    topProducts: topProducts.map(p => ({
      name: p.productName,
      revenue: p._sum.lineTotal ?? 0,
      quantity: p._sum.quantity ?? 0,
      profit: p._sum.profit ?? 0,
      margin: (p._sum.lineTotal ?? 0) > 0
        ? ((p._sum.profit ?? 0) / (p._sum.lineTotal ?? 0)) * 100
        : 0,
    })),
  };
}
