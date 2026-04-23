"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { FloatingStars, fadeUp, stagger } from "@/components/motion";
import { Store, ArrowRight, Lock, Mail, Zap, TrendingUp, Package } from "lucide-react";

const features = [
  { icon: Package, text: "Smart Inventory" },
  { icon: TrendingUp, text: "Profit Analytics" },
  { icon: Zap, text: "Instant Billing" },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a0533 0%, #0f1729 40%, #0a0f1e 100%)" }}>
        <FloatingStars count={25} />

        {/* Grid overlay */}
        <div className="absolute inset-0 animated-grid opacity-30" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)" }} />

        {/* Top logo */}
        <motion.div className="relative z-10 p-10"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DukaanLedger</span>
          </div>
        </motion.div>

        {/* Center content */}
        <motion.div className="relative z-10 px-10 space-y-6"
          variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300">
            <Zap className="h-3 w-3" />
            Smart business management
          </motion.div>
          <motion.h2 variants={fadeUp}
            className="text-5xl font-black text-white leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
            Manage your shop
            <br />
            <span className="gradient-text">smarter, faster.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 text-lg leading-relaxed">
            Complete billing, inventory & analytics<br />— all in one place.
          </motion.p>
          <motion.div variants={stagger} className="flex flex-col gap-3">
            {features.map(({ icon: Icon, text }) => (
              <motion.div key={text} variants={fadeUp}
                className="flex items-center gap-3 text-white/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                  <Icon className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom stats */}
        <motion.div className="relative z-10 p-10 flex gap-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          {[["100%", "Uptime"], ["0s", "Setup"], ["∞", "Insights"]].map(([stat, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white">{stat}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 hero-bg">
        <motion.div className="w-full max-w-sm space-y-6"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">DukaanLedger</span>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to manage your shop</p>
          </div>

          {/* Google OAuth */}
          <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-3 font-medium text-sm glass border-border/60 hover:border-primary/40 transition-all btn-glow"
              onClick={() => { setIsGoogleLoading(true); signIn("google", { callbackUrl: "/" }).finally(() => setIsGoogleLoading(false)); }}
              disabled={isGoogleLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed opacity-40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">or sign in with email</span>
            </div>
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <motion.div
                animate={{ boxShadow: focusedField === "email" ? "0 0 0 3px rgba(168,85,247,0.2)" : "none" }}
                className="relative rounded-lg transition-all"
              >
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  className="pl-10 h-12 input-magic" required />
              </motion.div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <motion.div
                animate={{ boxShadow: focusedField === "password" ? "0 0 0 3px rgba(168,85,247,0.2)" : "none" }}
                className="relative rounded-lg transition-all"
              >
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                  className="pl-10 h-12 input-magic" required />
              </motion.div>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className="w-full h-12 gap-2 font-semibold text-base btn-glow ripple" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-4">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
