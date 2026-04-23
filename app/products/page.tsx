"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, calculateFinalPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Plus, Search, Edit2, Trash2, Package, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/components/motion";

export default function ProductsPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [noShop, setNoShop] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "", buyingPrice: "", sellingPrice: "", discount: "0", stock: "0",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const response = await fetch(`/api/products${query}`);
      const result = await response.json();
      if (response.status === 400 && result.error?.includes("No shop")) {
        setNoShop(true);
        return;
      }
      if (result.success) {
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.error || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      buyingPrice: parseFloat(formData.buyingPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      discount: parseFloat(formData.discount) || 0,
      stock: parseInt(formData.stock) || 0,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save product");
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to save product");
      toast({ title: "Success", description: editingProduct ? "Product updated" : "Product created" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) {
      toast({ title: "Permission denied", description: "Only owners can delete products", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to delete product");
      toast({ title: "Deleted", description: "Product removed successfully" });
      setProducts((current) => current.filter((p) => p.id !== id));
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      buyingPrice: product.buyingPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      discount: product.discount.toString(),
      stock: product.stock.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => setFormData({ name: "", buyingPrice: "", sellingPrice: "", discount: "0", stock: "0" });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        {noShop && (
          <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-400">⚠️ Session needs refresh</p>
              <p className="text-sm text-amber-300/80 mt-0.5">Your session is missing shop data. Sign out and sign back in to fix this instantly.</p>
            </div>
            <Button size="sm" variant="outline" className="border-amber-400/60 text-amber-400 shrink-0"
              onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out & fix
            </Button>
          </div>
        )}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif" }}>
              <Package className="h-6 w-6 text-primary" />
              <span className="gradient-text">Products</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {products.length} products •{" "}
              {outOfStockCount > 0 && (
                <span className="text-red-500">{outOfStockCount} out of stock • </span>
              )}
              {lowStockCount > 0 && (
                <span className="text-amber-500">{lowStockCount} low stock</span>
              )}
            </p>
          </div>
          {isOwner && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingProduct(null); resetForm(); setIsDialogOpen(true); }}
                  className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                    <Input id="name" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name" className="h-11" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyingPrice" className="text-sm font-medium">Buying Price (₹) *</Label>
                      <Input id="buyingPrice" type="number" min="0" step="0.01"
                        value={formData.buyingPrice}
                        onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                        placeholder="0.00" className="h-11" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (₹) *</Label>
                      <Input id="sellingPrice" type="number" min="0" step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        placeholder="0.00" className="h-11" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount" className="text-sm font-medium">Discount (%)</Label>
                      <Input id="discount" type="number" min="0" max="100"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        placeholder="0" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium">Stock Quantity</Label>
                      <Input id="stock" type="number" min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0" className="h-11" />
                    </div>
                  </div>
                  {/* Margin preview & Warning */}
                  {formData.buyingPrice && formData.sellingPrice && (
                    <div className="space-y-2">
                      {parseFloat(formData.buyingPrice) > parseFloat(formData.sellingPrice) && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 p-3 text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Warning: Buying price is higher than selling price!</span>
                        </div>
                      )}
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Final Selling Price</span>
                          <span className="font-medium">
                            {formatCurrency(calculateFinalPrice(parseFloat(formData.sellingPrice) || 0, parseFloat(formData.discount) || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Margin per unit</span>
                          <span className={`${
                            calculateFinalPrice(parseFloat(formData.sellingPrice) || 0, parseFloat(formData.discount) || 0) - (parseFloat(formData.buyingPrice) || 0) < 0
                              ? "text-red-600 dark:text-red-400 font-bold"
                              : "text-green-700 dark:text-green-400 font-semibold"
                          }`}>
                            {formatCurrency(
                              calculateFinalPrice(parseFloat(formData.sellingPrice) || 0, parseFloat(formData.discount) || 0) -
                              (parseFloat(formData.buyingPrice) || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 font-semibold">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">{searchQuery ? "No products found" : "No products yet"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "Add your first product to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {isOwner && <TableHead>Buying Price</TableHead>}
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Final Price</TableHead>
                      {isOwner && <TableHead>Margin</TableHead>}
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, idx) => {
                      const finalPrice = calculateFinalPrice(product.sellingPrice, product.discount);
                      const margin = finalPrice - product.buyingPrice;
                      return (
                        <motion.tr key={product.id}
                          className="border-b transition-colors hover:bg-secondary/40"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.3 }}>
                          <TableCell className="font-medium text-sm">{product.name}</TableCell>
                          {isOwner && <TableCell className="text-sm text-muted-foreground">{formatCurrency(product.buyingPrice)}</TableCell>}
                          <TableCell className="text-sm">{formatCurrency(product.sellingPrice)}</TableCell>
                          <TableCell>
                            {product.discount > 0 ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0 font-medium">
                                {product.discount}%
                              </Badge>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{formatCurrency(finalPrice)}</TableCell>
                          {isOwner && (
                            <TableCell className={`text-sm font-medium flex items-center gap-1 ${margin > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                              <TrendingUp className="h-3 w-3" />
                              {formatCurrency(margin)}
                            </TableCell>
                          )}
                          <TableCell>
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-md ${
                              product.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                              product.stock <= 10 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                              "text-foreground"
                            }`}>
                              {product.stock === 0 ? "Out" : product.stock}
                              {product.stock === 0 && <span className="ml-1 text-xs">of stock</span>}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {isOwner && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"
                                  onClick={() => handleDelete(product.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </TableCell>

                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
