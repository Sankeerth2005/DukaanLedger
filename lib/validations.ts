import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Name too long"),
  buyingPrice: z.number().min(0, "Buying price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  discount: z.number().min(0).max(100).optional().default(0),
  stock: z.number().int().min(0).optional().default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  buyingPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
});

export const saleItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  discount: z.number().min(0).max(100).optional().default(0),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1, "At least one item is required"),
});

export const shopSettingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(200),
  address: z.string().max(500).optional().default(""),
  phone: z.string().max(20).optional().default(""),
  gstNumber: z.string().max(20).optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  currencySymbol: z.string().min(1).max(5).optional().default("₹"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
