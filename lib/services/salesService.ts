import { prisma } from "@/lib/prisma";
import { CreateSaleInput } from "@/lib/types";
import { calculateBill, validateBill } from "./billingService";

/**
 * Service to manage sales transactions with strict atomicity and stock consistency.
 */

export async function createSale(shopId: string, data: CreateSaleInput) {
  // 1. Calculate and validate the bill locally first
  const bill = await calculateBill(shopId, data.items);
  const validationError = validateBill(bill.items);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Execute within a DB transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // A. Re-verify stock levels within the transaction to prevent race conditions
    for (const item of bill.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, shopId },
        select: { stock: true, name: true }
      });

      if (!product) {
        throw new Error(`Product ${item.name} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }
    }

    // B. Create the master sale record
    const sale = await tx.sale.create({
      data: {
        shopId,
        totalAmount: bill.totalAmount,
        totalProfit: bill.totalProfit,
        totalDiscount: bill.totalDiscount,
      },
    });

    // C. Create sale items and update stock concurrently
    await Promise.all(
      bill.items.map(async (item) => {
        // Create detail record
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            buyingPrice: item.buyingPrice,
            sellingPrice: item.sellingPrice,
            discount: item.discount,
            finalPrice: item.finalPrice,
            profit: item.profit,
            lineTotal: item.total,
          },
        });

        // Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      })
    );

    // D. Return the fully hydrated sale object
    return await tx.sale.findFirst({
      where: { id: sale.id, shopId },
      include: { items: true },
    });
  });
}

export async function getSales(shopId: string, limit: number = 50, offset: number = 0, fromDate?: Date, toDate?: Date) {
  const dateFilter = fromDate || toDate ? {
    createdAt: {
      ...(fromDate && { gte: fromDate }),
      ...(toDate && { lte: toDate }),
    },
  } : {};

  return await prisma.sale.findMany({
    take: limit,
    skip: offset,
    where: { shopId, ...dateFilter },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getSaleById(shopId: string, id: string) {
  return await prisma.sale.findFirst({
    where: { id, shopId },
    include: { items: true },
  });
}

export async function getDashboardStats(shopId: string, startDate?: Date, endDate?: Date) {
  const dateFilter = startDate || endDate ? {
    createdAt: {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    },
  } : {};

  // Parallelize basic aggregations
  const [salesAggregation, lowStockProducts, topProducts] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, ...dateFilter },
      _sum: { totalAmount: true, totalProfit: true },
      _count: { id: true },
    }),
    prisma.product.findMany({
      where: { shopId, stock: { lte: 10 } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.saleItem.groupBy({
      by: ["productId", "productName"],
      where: { sale: { shopId, ...dateFilter } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    })
  ]);

  return {
    totalSales: salesAggregation._sum.totalAmount ?? 0,
    totalProfit: salesAggregation._sum.totalProfit ?? 0,
    totalTransactions: salesAggregation._count.id ?? 0,
    lowStockProducts,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      totalQuantity: p._sum.quantity ?? 0,
      totalRevenue: p._sum.lineTotal ?? 0,
    })),
  };
}

export async function getTodaySales(shopId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDashboardStats(shopId, today, tomorrow);
}
