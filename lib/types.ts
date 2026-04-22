import { UserRole } from "@prisma/client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  discount: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface SaleItemOutput {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  discount: number;
  finalPrice: number;
  profit: number;
}

export interface Sale {
  id: string;
  totalAmount: number;
  totalProfit: number;
  totalDiscount: number;
  createdAt: Date;
  items: SaleItemOutput[];
}

export interface CartItem {
  productId: string;
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  discount: number;
  quantity: number;
  stock: number;
  finalPrice: number;
  total: number;
  profit: number;
}

export interface CreateProductInput {
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  discount?: number;
  stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  discount?: number;
  stock?: number;
}

export interface CreateSaleInput {
  items: SaleItemInput[];
}

export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  lowStockProducts: Product[];
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export interface SalesTrend {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
}

export interface ShopSettings {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  gstNumber: string;
  email: string;
  currencySymbol: string;
  updatedAt: Date;
}
