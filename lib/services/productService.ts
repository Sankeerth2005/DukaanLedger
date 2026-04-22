import { prisma } from "@/lib/prisma";
import { CreateProductInput, UpdateProductInput } from "@/lib/types";

export async function getProducts(search?: string) {
  const products = await prisma.product.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: {
      name: "asc",
    },
  });
  return products;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  return product;
}

export async function createProduct(data: CreateProductInput) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      buyingPrice: data.buyingPrice,
      sellingPrice: data.sellingPrice,
      discount: data.discount ?? 0,
      stock: data.stock ?? 0,
    },
  });
  return product;
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.buyingPrice !== undefined && { buyingPrice: data.buyingPrice }),
      ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.stock !== undefined && { stock: data.stock }),
    },
  });
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id },
  });
}

export async function searchProducts(query: string) {
  const products = await prisma.product.findMany({
    where: {
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
  return products;
}

export async function getLowStockProducts(threshold: number = 10) {
  const products = await prisma.product.findMany({
    where: {
      stock: {
        lte: threshold,
      },
    },
    orderBy: {
      stock: "asc",
    },
  });
  return products;
}
