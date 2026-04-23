import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const shopId = (session.user as any).shopId;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");

  try {
    const { prisma } = await import("@/lib/prisma");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = await prisma.sale.groupBy({
      by: ["createdAt"],
      where: {
        shopId,
        createdAt: { gte: startDate },
      },
      _sum: { totalAmount: true, totalProfit: true },
      _count: { id: true },
    });

    // Formatting for chart
    const formatted = trend.map(t => ({
      date: t.createdAt.toISOString().split("T")[0],
      sales: t._sum.totalAmount || 0,
      profit: t._sum.totalProfit || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Trend analysis error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch trend data" }, { status: 500 });
  }
}
