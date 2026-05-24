"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarDays, Lock, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import type { UserRole } from "@/types";

type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@hotel.com",
      password: "password123"
    }
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as LoginResponse | { message?: string };

      if (!response.ok || !("user" in payload)) {
        throw new Error("message" in payload && payload.message ? payload.message : "Login failed");
      }

      toast.success(`Welcome back, ${payload.user.name}`);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      const fallback = payload.user.role === "ADMIN" ? "/admin" : "/staff";
      const canUseRedirect = Boolean(redirect?.startsWith("/") && (payload.user.role === "ADMIN" || !redirect.startsWith("/admin")));
      router.push(canUseRedirect && redirect ? redirect : fallback);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 p-4">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #f4b63b 0, transparent 30%), radial-gradient(circle at 80% 30%, #365486 0, transparent 25%)" }} />
      <Card className="relative w-full max-w-md border-white/10 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500 text-navy-950 shadow-lg">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 text-3xl">Grand Mandalay</CardTitle>
          <p className="text-sm text-slate-500">Sign in to the Hotel Administration System</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => form.reset({ email: "admin@hotel.com", password: "password123" })}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => form.reset({ email: "receptionist@hotel.com", password: "password123" })}
              >
                <CalendarDays className="h-4 w-4" />
                Receptionist
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input id="email" className="pl-10" placeholder="admin@hotel.com" {...form.register("email")} />
              </div>
              {form.formState.errors.email ? <p className="text-sm text-red-600">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input id="password" className="pl-10" type="password" placeholder="password123" {...form.register("password")} />
              </div>
              {form.formState.errors.password ? <p className="text-sm text-red-600">{form.formState.errors.password.message}</p> : null}
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Default credentials</p>
            <p>Admin: admin@hotel.com / password123</p>
            <p>Receptionist: receptionist@hotel.com / password123</p>
          </div>
          <Link href="/" className="mt-5 block text-center text-sm font-semibold text-gold-600 hover:text-gold-500">
            Return to hotel home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
