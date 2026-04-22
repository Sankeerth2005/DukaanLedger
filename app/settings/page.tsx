"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ShopSettings } from "@/lib/types";
import {
  Settings,
  Store,
  Phone,
  MapPin,
  FileText,
  Mail,
  CreditCard,
  Save,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [form, setForm] = useState({
    shopName: "",
    address: "",
    phone: "",
    gstNumber: "",
    email: "",
    currencySymbol: "₹",
  });

  const isOwner = session?.user?.role === "OWNER";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchSettings();
  }, [status]);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
      setForm({
        shopName: data.shopName || "",
        address: data.address || "",
        phone: data.phone || "",
        gstNumber: data.gstNumber || "",
        email: data.email || "",
        currencySymbol: data.currencySymbol || "₹",
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSettings(data);
      toast({ title: "Settings saved", description: "Shop information updated successfully." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const field = (update: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...update }));

  return (
    <>
      <Navbar />
      <main className="flex-1 container py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Shop Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your business profile and preferences
          </p>
        </div>

        {/* Access Restriction Banner */}
        {!isOwner && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">View-only mode</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Only Owners can modify shop settings. Contact your shop owner to make changes.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Shop Profile form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-primary" />
                  Business Profile
                </CardTitle>
                <CardDescription>Basic information about your shop that appears on receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shopName" className="text-sm font-medium">
                        Shop Name *
                      </Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="shopName"
                          value={form.shopName}
                          onChange={(e) => field({ shopName: e.target.value })}
                          className="pl-10 h-11"
                          placeholder="My Shop"
                          disabled={!isOwner}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <textarea
                          id="address"
                          value={form.address}
                          onChange={(e) => field({ address: e.target.value })}
                          className="w-full pl-10 pt-2 pb-2 pr-3 rounded-lg border border-input bg-background text-sm resize-none h-20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                          placeholder="Shop address..."
                          disabled={!isOwner}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={form.phone}
                            onChange={(e) => field({ phone: e.target.value })}
                            className="pl-10 h-11"
                            placeholder="+91 98765 43210"
                            disabled={!isOwner}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => field({ email: e.target.value })}
                            className="pl-10 h-11"
                            placeholder="shop@example.com"
                            disabled={!isOwner}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber" className="text-sm font-medium">GST Number</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="gstNumber"
                            value={form.gstNumber}
                            onChange={(e) => field({ gstNumber: e.target.value.toUpperCase() })}
                            className="pl-10 h-11 font-mono"
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                            disabled={!isOwner}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol" className="text-sm font-medium">Currency Symbol</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currencySymbol"
                            value={form.currencySymbol}
                            onChange={(e) => field({ currencySymbol: e.target.value })}
                            className="pl-10 h-11"
                            placeholder="₹"
                            maxLength={5}
                            disabled={!isOwner}
                          />
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <Button
                        type="submit"
                        className="w-full h-11 gap-2 font-semibold"
                        disabled={saving}
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receipt Preview</CardTitle>
                <CardDescription>How your shop appears on receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border p-4 font-mono text-xs space-y-1 bg-secondary/40">
                  <p className="font-bold text-sm text-center">{form.shopName || "Your Shop"}</p>
                  {form.address && (
                    <p className="text-muted-foreground text-center whitespace-pre-line">{form.address}</p>
                  )}
                  {form.phone && <p className="text-muted-foreground text-center">📞 {form.phone}</p>}
                  {form.gstNumber && <p className="text-muted-foreground text-center">GST: {form.gstNumber}</p>}
                  <div className="border-t my-2 border-dashed" />
                  <p className="text-center text-muted-foreground">Item             Total</p>
                  <p className="text-center text-muted-foreground">Product A × 2   {form.currencySymbol}200</p>
                  <div className="border-t my-2 border-dashed" />
                  <p className="font-bold text-center">Total: {form.currencySymbol}200</p>
                  <p className="text-muted-foreground text-center text-xs mt-2">Thank you for your purchase!</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{session?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-xs">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className={`font-semibold capitalize ${isOwner ? "text-primary" : "text-muted-foreground"}`}>
                    {session?.user?.role?.toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
