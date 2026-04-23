import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSale, getSales } from "@/lib/services/salesService";
import { saleSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopId = (session.user as any).shopId;
    if (!shopId) {
      return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const sales = await getSales(
      shopId,
      limit,
      offset,
      fromDate,
      toDate
    );

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopId = (session.user as any).shopId;
    if (!shopId) {
      return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
    }

    const body = await request.json();
    const result = saleSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const sale = await createSale(shopId, result.data);

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create sale" },
      { status: 500 }
    );
  }
}
