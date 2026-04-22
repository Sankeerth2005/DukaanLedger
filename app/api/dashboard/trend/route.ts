import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SalesTrend } from "@/lib/types";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

// GET /api/dashboard/trend?days=7 - Get sales trend for last N days
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "7"), 30);
    const prisma = await getPrisma();

    const trend: SalesTrend[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const agg = await prisma.sale.aggregate({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
        _sum: { totalAmount: true, totalProfit: true },
        _count: { id: true },
      });

      trend.push({
        date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        sales: agg._sum.totalAmount ?? 0,
        profit: agg._sum.totalProfit ?? 0,
        transactions: agg._count.id ?? 0,
      });
    }

    return NextResponse.json(trend);
  } catch (error) {
    console.error("Error fetching trend:", error);
    return NextResponse.json({ error: "Failed to fetch trend" }, { status: 500 });
  }
}
