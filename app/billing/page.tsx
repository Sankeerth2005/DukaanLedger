"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, calculateFinalPrice } from "@/lib/utils";
import { printReceipt } from "@/components/receipt-printer";
import type { Product, CartItem, Sale } from "@/lib/types";
import { Search, Plus, Minus, Trash2, Receipt, ShoppingCart, Printer, CheckCircle } from "lucide-react";

export default function BillingPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isOwner = session?.user?.role === "OWNER";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [shopName, setShopName] = useState("My Shop");

  useEffect(() => {
    searchInputRef.current?.focus();
    fetch("/api/settings").then((r) => r.json()).then((d) => setShopName(d.shopName || "My Shop")).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSearchResults(data.slice(0, 6));
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({ title: "Stock limit", description: `Only ${product.stock} units available`, variant: "destructive" });
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (product.stock <= 0) {
        toast({ title: "Out of Stock", description: "This product is out of stock", variant: "destructive" });
        return;
      }
      const finalPrice = calculateFinalPrice(product.sellingPrice, product.discount);
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        discount: product.discount,
        quantity: 1,
        stock: product.stock,
        finalPrice,
        total: finalPrice,
        profit: finalPrice - product.buyingPrice,
      };
      setCart([...cart, newItem]);
    }
    setSearchQuery("");
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) { removeFromCart(productId); return; }
    const item = cart.find((i) => i.productId === productId);
    if (item && newQuantity > item.stock) {
      toast({ title: "Stock limit", description: `Only ${item.stock} units available`, variant: "destructive" });
      return;
    }
    setCart(cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: newQuantity, total: item.finalPrice * newQuantity, profit: (item.finalPrice - item.buyingPrice) * newQuantity };
      }
      return item;
    }));
  };

  const updateDiscount = (productId: string, newDiscount: number) => {
    if (newDiscount < 0 || newDiscount > 100) return;
    setCart(cart.map((item) => {
      if (item.productId === productId) {
        const finalPrice = calculateFinalPrice(item.sellingPrice, newDiscount);
        return { ...item, discount: newDiscount, finalPrice, total: finalPrice * item.quantity, profit: (finalPrice - item.buyingPrice) * item.quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.productId !== productId));

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((s, i) => s + (i.sellingPrice - i.finalPrice) * i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.total, 0);
  const totalProfit = cart.reduce((s, i) => s + i.profit, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async (printAfter = false) => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add products to cart first", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, discount: item.discount })) }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process sale");
      }
      const sale = await response.json();
      setLastSale(sale);
      toast({ title: "✓ Sale completed!", description: `Bill #${sale.id.slice(-6).toUpperCase()} • ${formatCurrency(sale.totalAmount)}` });
      setCart([]);
      if (printAfter) {
        setTimeout(() => printReceipt(sale, shopName), 300);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              New Sale
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Search for products and add them to the cart</p>
          </div>
          {lastSale && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => printReceipt(lastSale, shopName)}>
              <Printer className="h-4 w-4" />
              Reprint Last Receipt
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4 text-primary" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Type product name to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-xl overflow-hidden">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center justify-between transition-colors border-b last:border-b-0"
                          onMouseDown={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Stock: {product.stock} •{" "}
                              <span className={product.discount > 0 ? "text-green-600 font-medium" : ""}>
                                {formatCurrency(calculateFinalPrice(product.sellingPrice, product.discount))}
                              </span>
                              {product.discount > 0 && ` (${product.discount}% off)`}
                            </p>
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Plus className="h-4 w-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Cart
                  </span>
                  {cart.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {totalItems} item{totalItems > 1 ? "s" : ""}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-muted-foreground">Cart is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">Search for products above to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Disc %</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium text-sm">{item.name}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(item.finalPrice)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" max="100" value={item.discount}
                                onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 text-center" />
                            </TableCell>
                            <TableCell className="font-semibold text-sm">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                                onClick={() => removeFromCart(item.productId)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bill Summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-green-600 font-medium">- {formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span>{totalItems}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {isOwner && totalProfit !== 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 dark:text-green-400">Est. Profit</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(totalProfit)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                <Button className="w-full h-12 text-base font-semibold gap-2" onClick={() => handleCheckout(false)}
                  disabled={cart.length === 0 || isProcessing}>
                  <CheckCircle className="h-5 w-5" />
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Button>
                <Button variant="outline" className="w-full h-10 gap-2" onClick={() => handleCheckout(true)}
                  disabled={cart.length === 0 || isProcessing}>
                  <Printer className="h-4 w-4" />
                  Save & Print Receipt
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
