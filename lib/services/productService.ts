import { prisma } from "@/lib/prisma";
import { CreateProductInput, UpdateProductInput } from "@/lib/types";

/**
 * Service to manage products with shop-level isolation.
 */

export async function getProducts(shopId: string, search?: string) {
  return await prisma.product.findMany({
    where: {
      shopId: shopId,
      ...(search ? {
        name: { contains: search, mode: "insensitive" }
      } : {}),
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getProductById(shopId: string, id: string) {
  if (!id) return null;
  return await prisma.product.findFirst({
    where: { id, shopId },
  });
}

export async function createProduct(shopId: string, data: CreateProductInput) {
  return await prisma.product.create({
    data: {
      shopId,
      name: data.name,
      buyingPrice: data.buyingPrice,
      sellingPrice: data.sellingPrice,
      discount: data.discount ?? 0,
      stock: data.stock ?? 0,
    },
  });
}

export async function updateProduct(shopId: string, id: string, data: UpdateProductInput) {
  // Triple check ownership before any update
  const existing = await prisma.product.findFirst({
    where: { id, shopId: shopId },
    select: { id: true }
  });
  
  if (!existing) {
    throw new Error("Product not found or access denied");
  }

  return await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.buyingPrice !== undefined && { buyingPrice: data.buyingPrice }),
      ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.stock !== undefined && { stock: data.stock }),
    },
  });
}

export async function deleteProduct(shopId: string, id: string) {
  // Triple check ownership before any deletion
  const existing = await prisma.product.findFirst({
    where: { id, shopId: shopId },
    select: { id: true }
  });
  
  if (!existing) {
    throw new Error("Product not found or access denied");
  }

  await prisma.product.delete({
    where: { id },
  });
}

export async function searchProducts(shopId: string, query: string) {
  return await prisma.product.findMany({
    where: {
      shopId,
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: 10,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getLowStockProducts(shopId: string, threshold: number = 10) {
  return await prisma.product.findMany({
    where: {
      shopId,
      stock: {
        lte: threshold,
      },
    },
    orderBy: {
      stock: "asc",
    },
  });
}
