import { prisma } from "@/lib/prisma";
import { CreateSaleInput, SaleItemInput } from "@/lib/types";
import { calculateBill, validateBill, calculateCartItem } from "./billingService";
import { getProductById } from "./productService";

export async function createSale(data: CreateSaleInput) {
  const bill = await calculateBill(data.items);
  
  const validationError = validateBill(bill.items);
  if (validationError) {
    throw new Error(validationError);
  }

  return await prisma.$transaction(async (tx) => {
    // Create the sale
    const sale = await tx.sale.create({
      data: {
        totalAmount: bill.totalAmount,
        totalProfit: bill.totalProfit,
        totalDiscount: bill.totalDiscount,
      },
    });

    // Create sale items and update stock
    for (const item of bill.items) {
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
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return await tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: true,
      },
    });
  });
}

export async function getSales(limit: number = 50, offset: number = 0) {
  const sales = await prisma.sale.findMany({
    take: limit,
    skip: offset,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });
  return sales;
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });
  return sale;
}

export async function getDashboardStats(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate || endDate ? {
    createdAt: {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    },
  } : {};

  // Get total sales and profit
  const salesAggregation = await prisma.sale.aggregate({
    where: dateFilter,
    _sum: {
      totalAmount: true,
      totalProfit: true,
    },
    _count: {
      id: true,
    },
  });

  // Get low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: 10,
      },
    },
    orderBy: {
      stock: "asc",
    },
    take: 5,
  });

  // Get top selling products
  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId", "productName"],
    where: {
      sale: dateFilter,
    },
    _sum: {
      quantity: true,
      finalPrice: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  return {
    totalSales: salesAggregation._sum.totalAmount ?? 0,
    totalProfit: salesAggregation._sum.totalProfit ?? 0,
    totalTransactions: salesAggregation._count.id ?? 0,
    lowStockProducts,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      totalQuantity: p._sum.quantity ?? 0,
      totalRevenue: (p._sum.finalPrice ?? 0) * (p._sum.quantity ?? 0),
    })),
  };
}

export async function getTodaySales() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getDashboardStats(today, tomorrow);
}
