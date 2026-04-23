import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsData, generateInsights } from "@/lib/services/insightsService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);
    const includeInsights = searchParams.get("insights") !== "false";

    const [analytics, insights] = await Promise.all([
      getAnalyticsData(shopId, days),
      includeInsights ? generateInsights(shopId) : Promise.resolve([]),
    ]);

    return NextResponse.json({ success: true, data: { ...analytics, insights } });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
