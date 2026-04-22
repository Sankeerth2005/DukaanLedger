"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { printReceipt } from "@/components/receipt-printer";
import type { Sale } from "@/lib/types";
import { History, Eye, Receipt, Printer, CalendarIcon, X, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";

export default function SalesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("My Shop");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasFilter, setHasFilter] = useState(false);

  // Summary stats
  const totalSales = sales.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = sales.reduce((s, t) => s + t.totalProfit, 0);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setShopName(d.shopName || "My Shop")).catch(() => {});
    fetchSales();
  }, []);

  async function fetchSales(from?: string, to?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await fetch(`/api/sales?${params.toString()}`);
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter() {
    if (!fromDate && !toDate) {
      toast({ title: "No dates selected", description: "Select at least one date to filter", variant: "destructive" });
      return;
    }
    setHasFilter(true);
    fetchSales(fromDate || undefined, toDate || undefined);
  }

  function clearFilter() {
    setFromDate("");
    setToDate("");
    setHasFilter(false);
    fetchSales();
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Sales History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Browse and filter past transactions</p>
        </div>

        {/* Summary Cards */}
        {!loading && sales.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">Total Revenue</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(totalSales)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            {isOwner && (
              <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs font-medium">Total Profit</p>
                      <p className="text-xl font-bold mt-1">{formatCurrency(totalProfit)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100 text-xs font-medium">Transactions</p>
                    <p className="text-xl font-bold mt-1">{sales.length}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-violet-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> From
                </label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> To
                </label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40" />
              </div>
              <Button onClick={applyFilter} size="sm" className="h-9 gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> Filter
              </Button>
              {hasFilter && (
                <Button variant="outline" onClick={clearFilter} size="sm" className="h-9 gap-1.5">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              {hasFilter && (
                <span className="text-xs text-muted-foreground">
                  Showing filtered results ({sales.length} transactions)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">No sales found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasFilter ? "Try different dates or clear the filter" : "Create your first sale from the Billing page"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      {isOwner && <TableHead>Profit</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-secondary/40">
                        <TableCell className="font-mono font-semibold text-sm text-primary">
                          #{sale.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</TableCell>
                        <TableCell className="text-sm">{sale.items.length} item{sale.items.length > 1 ? "s" : ""}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sale.totalDiscount > 0 ? `- ${formatCurrency(sale.totalDiscount)}` : "—"}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                        {isOwner && (
                          <TableCell className="text-green-600 dark:text-green-400 font-medium text-sm">
                            {formatCurrency(sale.totalProfit)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View details dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                                  <Eye className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[620px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-primary" />
                                    Bill #{sale.id.slice(-6).toUpperCase()}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{formatDate(sale.createdAt)}</span>
                                  </div>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Disc%</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sale.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell className="text-sm">{item.productName}</TableCell>
                                          <TableCell className="text-sm">{item.quantity}</TableCell>
                                          <TableCell className="text-sm">{formatCurrency(item.sellingPrice)}</TableCell>
                                          <TableCell className="text-sm">{item.discount}%</TableCell>
                                          <TableCell className="text-right text-sm font-medium">
                                            {formatCurrency(item.finalPrice * item.quantity)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  <div className="border-t pt-4 space-y-2">
                                    {sale.totalDiscount > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Discount</span>
                                        <span className="text-green-600">- {formatCurrency(sale.totalDiscount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold">
                                      <span>Total</span>
                                      <span className="text-primary">{formatCurrency(sale.totalAmount)}</span>
                                    </div>
                                    {isOwner && (
                                      <div className="flex justify-between text-sm text-green-600">
                                        <span>Profit</span>
                                        <span className="font-medium">{formatCurrency(sale.totalProfit)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <Button className="w-full gap-2" variant="outline" onClick={() => printReceipt(sale, shopName)}>
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {/* Quick print */}
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5"
                              onClick={() => printReceipt(sale, shopName)}>
                              <Printer className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
