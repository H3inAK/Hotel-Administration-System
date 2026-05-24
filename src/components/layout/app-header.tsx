"use client";

import { Building2, CalendarDays, Home, LogIn, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

const navItems = [
  { href: "/", label: "Home", icon: Home, roles: ["ADMIN", "RECEPTIONIST"] as UserRole[] },
  { href: "/staff", label: "Staff Dashboard", icon: CalendarDays, roles: ["ADMIN", "RECEPTIONIST"] as UserRole[] },
  { href: "/admin", label: "Admin Dashboard", icon: Shield, roles: ["ADMIN"] as UserRole[] }
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const isLandingPage = pathname === "/";
  const visibleNavItems = navItems.filter((item) => user && !isLandingPage && item.roles.includes(user.role));

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as MeResponse;
      })
      .then((payload) => {
        if (mounted && payload?.user) {
          setUser(payload.user);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out successfully");
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500 text-navy-950 shadow-md">
            <Building2 className="h-6 w-6" />
          </span>
          <span className="hotel-heading text-2xl font-bold tracking-tight">Grand Mandalay</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white",
                  active && "bg-white/15 text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="gold" size="sm">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
