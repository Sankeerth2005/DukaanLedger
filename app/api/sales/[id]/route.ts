import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSaleById } from "@/lib/services/salesService";

// GET /api/sales/:id - Get a specific sale
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const shopId = (session.user as any).shopId;
    if (!shopId) return NextResponse.json({ error: "No shop linked" }, { status: 400 });
    const sale = await getSaleById(shopId, id);
    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}
