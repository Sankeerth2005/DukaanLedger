import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProducts,
  createProduct,
  searchProducts,
} from "@/lib/services/productService";

export const dynamic = "force-dynamic";

// GET /api/products - List all products
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const products = await getProducts(search);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, buyingPrice, sellingPrice, discount, stock } = body;

    // Validation
    if (!name || buyingPrice === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: "Name, buying price, and selling price are required" },
        { status: 400 }
      );
    }

    if (buyingPrice < 0 || sellingPrice < 0) {
      return NextResponse.json(
        { error: "Prices cannot be negative" },
        { status: 400 }
      );
    }

    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return NextResponse.json(
        { error: "Discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (stock !== undefined && stock < 0) {
      return NextResponse.json(
        { error: "Stock cannot be negative" },
        { status: 400 }
      );
    }

    const product = await createProduct({
      name,
      buyingPrice,
      sellingPrice,
      discount,
      stock,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
