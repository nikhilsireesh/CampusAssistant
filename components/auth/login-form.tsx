"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type Portal = "student" | "admin";

const DEMO_ACCOUNT: Record<Portal, { email: string; password: string }> = {
  student: { email: "student@mictech.edu.in", password: "Student@123" },
  admin: { email: "admin@mictech.edu.in", password: "Admin@123" },
};

export function LoginForm({ portal }: { portal: Portal }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", portal },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, portal }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Login failed. Please try again.");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith(`/${json.data.role}`) ? next : json.data.redirectTo);
      router.refresh();
    } catch {
      setServerError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    const demo = DEMO_ACCOUNT[portal];
    setValue("email", demo.email);
    setValue("password", demo.password);
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">College email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@mictech.edu.in"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          DEMO ACCOUNT
          <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent/50"
        >
          Autofill {portal} demo credentials
        </button>
      </div>
    </div>
  );
}
