"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Receipt,
  History,
  LogOut,
  Store,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Sales", href: "/sales", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full navbar-glass">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm group-hover:shadow-md transition-shadow">
            <Store className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base hidden sm:inline tracking-tight">
            Dukaan<span className="text-primary">Ledger</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-indicator flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "active bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}

          {session?.user?.role === "OWNER" && (
            <Link
              href="/settings"
              className={cn(
                "nav-indicator flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                pathname === "/settings"
                  ? "active bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {session?.user && (
            <span className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-2 px-2 h-7 rounded-full bg-secondary">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-medium text-foreground">{session.user.name}</span>
              <span className="capitalize">{session.user.role?.toLowerCase()}</span>
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
