import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProducts,
  createProduct,
} from "@/lib/services/productService";
import { productSchema } from "@/lib/validations";

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
    const search = searchParams.get("search") || undefined;

    const products = await getProducts(shopId, search);
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ success: false, error: "Only owners can create products" }, { status: 403 });
  }

  const shopId = (session.user as any).shopId;
  if (!shopId) {
    return NextResponse.json({ success: false, error: "No shop linked. Please sign out and sign in again." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors.map(e => e.message).join(", ");
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const product = await createProduct(shopId, result.data);

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
