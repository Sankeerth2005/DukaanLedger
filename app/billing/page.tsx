"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, calculateFinalPrice } from "@/lib/utils";
import type { Product, CartItem } from "@/lib/types";
import { Search, Plus, Minus, Trash2, Receipt, ShoppingCart } from "lucide-react";

export default function BillingPage() {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Focus search input on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSearchResults(data.slice(0, 5));
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Error",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (product.stock <= 0) {
        toast({
          title: "Error",
          description: "Product is out of stock",
          variant: "destructive",
        });
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
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.productId === productId);
    if (item && newQuantity > item.stock) {
      toast({
        title: "Error",
        description: `Only ${item.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const total = item.finalPrice * newQuantity;
          const profit = (item.finalPrice - item.buyingPrice) * newQuantity;
          return { ...item, quantity: newQuantity, total, profit };
        }
        return item;
      })
    );
  };

  const updateDiscount = (productId: string, newDiscount: number) => {
    if (newDiscount < 0 || newDiscount > 100) return;

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const finalPrice = calculateFinalPrice(item.sellingPrice, newDiscount);
          const total = finalPrice * item.quantity;
          const profit = (finalPrice - item.buyingPrice) * item.quantity;
          return { ...item, discount: newDiscount, finalPrice, total, profit };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalDiscount = cart.reduce(
    (sum, item) => sum + (item.sellingPrice - item.finalPrice) * item.quantity,
    0
  );
  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            discount: item.discount,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process sale");
      }

      const sale = await response.json();
      
      toast({
        title: "Success",
        description: `Sale completed! Bill #${sale.id.slice(-6)}`,
      });

      // Clear cart
      setCart([]);
      
      // Print receipt option could be added here
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Billing
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Search */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Type to search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-lg"
                  />
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center justify-between"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Stock: {product.stock} | 
                              {formatCurrency(
                                calculateFinalPrice(product.sellingPrice, product.discount)
                              )}
                            </p>
                          </div>
                          <Plus className="h-5 w-5 text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Search and add products to cart
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Discount %</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) =>
                                updateDiscount(item.productId, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bill Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Profit</span>
                  <span>{formatCurrency(totalProfit)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
