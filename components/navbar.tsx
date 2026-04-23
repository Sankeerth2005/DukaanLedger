"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, Package, Receipt, History,
  LogOut, Store, Settings, Users, BarChart2,
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
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (val) => {
    setScrolled(val > 12);
  });

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 navbar-glass",
        scrolled ? "h-12 shadow-lg" : "h-14"
      )}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container flex h-full items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 shrink-0 group">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Store className="h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="font-bold text-base hidden sm:inline tracking-tight">
            Dukaan<span className="gradient-text">Ledger</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-1 items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-indicator relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "active text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.name}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                    layoutId="nav-active-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  />
                )}
              </Link>
            );
          })}

          {session?.user?.role === "OWNER" && (
            <>
              <Link
                href="/staff"
                className={cn(
                  "nav-indicator relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  pathname === "/staff"
                    ? "active text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Staff</span>
                {pathname === "/staff" && (
                  <motion.div className="absolute inset-0 rounded-lg bg-primary/10 -z-10" layoutId="nav-active-bg" transition={{ type: "spring", stiffness: 380, damping: 36 }} />
                )}
              </Link>
              <Link
                href="/analytics"
                className={cn(
                  "nav-indicator relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  pathname === "/analytics"
                    ? "active text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <BarChart2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Analytics</span>
                {pathname === "/analytics" && (
                  <motion.div className="absolute inset-0 rounded-lg bg-primary/10 -z-10" layoutId="nav-active-bg" transition={{ type: "spring", stiffness: 380, damping: 36 }} />
                )}
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "nav-indicator flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  pathname === "/settings"
                    ? "active text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {session?.user && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/profile"
                className={cn(
                  "hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-1 px-3 h-7 rounded-full transition-all duration-200 cursor-pointer",
                  "glass border border-border/50 hover:border-primary/40 hover:text-foreground",
                  pathname === "/profile" && "border-primary/50 text-foreground"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                <span className="font-medium text-foreground">{session.user.name}</span>
                <span className="capitalize opacity-70">{session.user.role?.toLowerCase()}</span>
              </Link>
            </motion.div>
          )}
          <ThemeToggle />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
