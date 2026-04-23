import { CartItem, SaleItemInput } from "@/lib/types";
import { calculateFinalPrice, calculateProfit } from "@/lib/utils";
import { getProductById } from "./productService";

export interface BillingCalculation {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  totalProfit: number;
}

export async function calculateCartItem(
  shopId: string,
  productId: string,
  quantity: number,
  discount: number = 0
): Promise<CartItem | null> {
  const product = await getProductById(shopId, productId);
  if (!product) return null;

  if (product.stock < quantity) {
    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
  }

  const finalPrice = calculateFinalPrice(product.sellingPrice, discount);
  const total = finalPrice * quantity;
  const profit = calculateProfit(finalPrice, product.buyingPrice, quantity);

  return {
    productId: product.id,
    name: product.name,
    buyingPrice: product.buyingPrice,
    sellingPrice: product.sellingPrice,
    discount,
    quantity,
    stock: product.stock,
    finalPrice,
    total,
    profit,
  };
}

export async function calculateBill(shopId: string, items: SaleItemInput[]): Promise<BillingCalculation> {
  const cartItems: CartItem[] = [];
  
  for (const item of items) {
    const cartItem = await calculateCartItem(
      shopId,
      item.productId,
      item.quantity,
      item.discount ?? 0
    );
    if (cartItem) {
      cartItems.push(cartItem);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalDiscount = cartItems.reduce(
    (sum, item) => sum + (item.sellingPrice - item.finalPrice) * item.quantity,
    0
  );
  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = cartItems.reduce((sum, item) => sum + item.profit, 0);

  return {
    items: cartItems,
    subtotal,
    totalDiscount,
    totalAmount,
    totalProfit,
  };
}

export function validateBill(items: CartItem[]): string | null {
  for (const item of items) {
    if (item.quantity <= 0) {
      return `Invalid quantity for ${item.name}`;
    }
    if (item.stock < item.quantity) {
      return `Insufficient stock for ${item.name}. Available: ${item.stock}`;
    }
    if (item.discount < 0 || item.discount > 100) {
      return `Invalid discount for ${item.name}. Must be between 0 and 100`;
    }
  }
  return null;
}
