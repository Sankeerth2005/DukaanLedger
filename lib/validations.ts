import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  buyingPrice: z.number().min(0, "Buying price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  discount: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
});

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  discount: z.number().min(0).max(100).optional(),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const shopSettingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().max(15).optional(),
  email: z.string().email().optional().or(z.literal("")),
  currencySymbol: z.string().max(5).default("₹"),
});


