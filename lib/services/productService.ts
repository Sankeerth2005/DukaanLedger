import { CreateProductInput, UpdateProductInput } from "@/lib/types";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getProducts(search?: string) {
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
  const product = await prisma.product.findUnique({
    where: { id },
  });
  return product;
}

export async function createProduct(data: CreateProductInput) {
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
  await prisma.product.delete({
    where: { id },
  });
}

export async function searchProducts(query: string) {
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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
