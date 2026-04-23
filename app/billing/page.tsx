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
import type { Product, CartItem, Sale, ShopSettings } from "@/lib/types";
import { Search, Plus, Minus, Trash2, Receipt, ShoppingCart, Printer, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [shopSettings, setShopSettings] = useState<Partial<ShopSettings>>({ shopName: "My Shop" });
  const [smartSuggestions, setSmartSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    searchInputRef.current?.focus();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setShopSettings(res.data);
      })
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
          const result = await response.json();
          const results = result.success && Array.isArray(result.data) ? result.data : [];
          setSearchResults(results.slice(0, 6));

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

  // Fetch co-purchase suggestions when last cart item changes
  useEffect(() => {
    const lastItem = cart[cart.length - 1];
    if (!lastItem?.productId) { setSmartSuggestions([]); return; }
    fetch(`/api/analytics/suggestions?productId=${lastItem.productId}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          // Filter out items already in cart
          const cartIds = new Set(cart.map(c => c.productId));
          const filtered = res.data.filter((p: any) => !cartIds.has(p.productId)) as Product[];
          setSmartSuggestions(filtered);
        }
      })
      .catch(() => setSmartSuggestions([]));
  }, [cart.length]);

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
        const result = await response.json();
        throw new Error(result.error || "Failed to process sale");
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to process sale");
      const sale = result.data;
      setLastSale(sale);
      toast({ title: "✓ Sale completed!", description: `Bill #${sale.id.slice(-6).toUpperCase()} • ${formatCurrency(sale.totalAmount)}` });
      setCart([]);
      if (printAfter) {
        setTimeout(() => printReceipt(sale, shopSettings), 300);
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
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
              <Receipt className="h-6 w-6 text-primary" />
              New <span className="gradient-text">Sale</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Search for products and add them to the cart</p>
          </div>
          {lastSale && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => printReceipt(lastSale, shopSettings)}>
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
                  <>
                    {/* Smart Suggestions */}
                    <AnimatePresence>
                      {smartSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3"
                        >
                          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Often bought together
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {smartSuggestions.map(p => (
                              <motion.button
                                key={p.id}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => addToCart(p)}
                                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/60 px-3 py-1.5 text-xs font-medium hover:border-primary/60 hover:bg-primary/10 transition-all"
                              >
                                <Plus className="h-3 w-3 text-primary" />
                                {p.name}
                                <span className="text-muted-foreground ml-1">₹{p.sellingPrice}</span>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        <AnimatePresence>
                        {cart.map((item, idx) => (
                          <motion.tr key={item.productId}
                            className="border-b"
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}>
                            <TableCell className="font-medium text-sm">{item.name}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(item.finalPrice)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="outline" size="icon" className="h-7 w-7"
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                                <motion.span
                                  key={item.quantity}
                                  className="w-7 text-center text-sm font-bold"
                                  initial={{ scale: 1.4, color: "#a855f7" }}
                                  animate={{ scale: 1, color: "inherit" }}
                                  transition={{ duration: 0.2 }}>
                                  {item.quantity}
                                </motion.span>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="outline" size="icon" className="h-7 w-7"
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="number" min="0" max="100" value={item.discount}
                                onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-16 h-7 text-center" />
                            </TableCell>
                            <motion.td
                              key={item.total}
                              className="px-4 py-2 font-semibold text-sm"
                              initial={{ color: "#a855f7" }}
                              animate={{ color: "inherit" }}
                              transition={{ duration: 0.4 }}>
                              {formatCurrency(item.total)}
                            </motion.td>
                            <TableCell>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                                  onClick={() => removeFromCart(item.productId)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </motion.div>
                            </TableCell>
                          </motion.tr>
                        ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </>
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
