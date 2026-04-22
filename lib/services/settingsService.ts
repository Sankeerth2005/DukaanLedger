import type { ShopSettings } from "@/lib/types";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const SINGLETON_ID = "singleton";

export async function getShopSettings(): Promise<ShopSettings> {
  const prisma = await getPrisma();
  
  let settings = await prisma.shopSettings.findUnique({
    where: { id: SINGLETON_ID },
  });

  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.shopSettings.create({
      data: {
        id: SINGLETON_ID,
        shopName: "My Shop",
        address: "",
        phone: "",
        gstNumber: "",
        email: "",
        currencySymbol: "₹",
      },
    });
  }

  return settings as ShopSettings;
}

export async function updateShopSettings(data: {
  shopName?: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  email?: string;
  currencySymbol?: string;
}): Promise<ShopSettings> {
  const prisma = await getPrisma();
  
  const settings = await prisma.shopSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      shopName: data.shopName ?? "My Shop",
      address: data.address ?? "",
      phone: data.phone ?? "",
      gstNumber: data.gstNumber ?? "",
      email: data.email ?? "",
      currencySymbol: data.currencySymbol ?? "₹",
    },
    update: {
      ...(data.shopName !== undefined && { shopName: data.shopName }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.currencySymbol !== undefined && { currencySymbol: data.currencySymbol }),
    },
  });
  
  return settings as ShopSettings;
}
