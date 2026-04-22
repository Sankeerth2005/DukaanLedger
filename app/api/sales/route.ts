import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSale, getSales } from "@/lib/services/salesService";
import { createSaleSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/sales - List all sales with optional date filtering
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : undefined;
    let toDate = to ? new Date(to) : undefined;
    if (toDate) {
      // End of day
      toDate.setHours(23, 59, 59, 999);
    }

    const sales = await getSales(limit, offset, fromDate, toDate);
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors;
      const message = Object.values(firstError).flat()[0] || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const sale = await createSale(parsed.data);
    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 }
    );
  }
}
