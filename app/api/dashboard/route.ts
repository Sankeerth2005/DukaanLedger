import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodaySales, getDashboardStats } from "@/lib/services/salesService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop associated" }, { status: 400 });
  }

  try {
    const stats = await getTodaySales(shopId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
