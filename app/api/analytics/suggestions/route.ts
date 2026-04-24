import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Returns top 3 products frequently bought alongside a given product
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const shopId = (session.user as any).shopId;
  if (!shopId) return NextResponse.json({ success: false, error: "No shop linked" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ success: true, data: [] });

  try {
    // Find all sale IDs that contain this product
    const saleIdsWithProduct = await prisma.saleItem.findMany({
      where: { productId, sale: { shopId } },
      select: { saleId: true },
      take: 200,
    });

    const saleIds = saleIdsWithProduct.map((s: { saleId: string }) => s.saleId);
    if (saleIds.length === 0) return NextResponse.json({ success: true, data: [] });

    // Find other products in those same sales (co-purchased)
    const coProducts = await prisma.saleItem.groupBy({
      by: ["productId", "productName"],
      where: {
        saleId: { in: saleIds },
        productId: { notIn: [productId], not: undefined },
      },
      _count: { saleId: true },
      orderBy: { _count: { saleId: "desc" } },
      take: 3,
    });

    // Get current stock for these products
    const productIds = coProducts.map(p => p.productId).filter(Boolean) as string[];
    const stocks = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId, stock: { gt: 0 } },
      select: { id: true, name: true, sellingPrice: true, discount: true, stock: true },
    });

    const stockMap = new Map(stocks.map(p => [p.id, p]));
    const suggestions = coProducts
      .map(p => {
        const product = stockMap.get(p.productId!);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          discount: product.discount,
          stock: product.stock,
          coCount: p._count.saleId,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
