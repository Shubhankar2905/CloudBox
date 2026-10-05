"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/auth/password-input";

type SignInErrors = Partial<Record<"email" | "password" | "general", string>>;

export function SignInForm() {
  const [errors, setErrors] = useState<SignInErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const nextErrors: SignInErrors = {};

    if (!email) {
      nextErrors.email = "Please enter your email address.";
    }

    if (!password) {
      nextErrors.password = "Please enter your password.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.error || "Invalid email or password.",
        });

        return;
      }

      console.log("Login successful:", data.user);

      // Login successful
      window.location.href = "/dashboard"; // Redirect to the dashboard or desired page
    } catch (error) {
      console.error("Login request failed:", error);

      setErrors({
        general: "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <CardHeader className="gap-5 px-6 pb-2 pt-7 sm:px-8 sm:pt-8">
        <Brand />

        <div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            Welcome back
          </CardTitle>

          <CardDescription className="mt-2 text-sm leading-6 text-slate-400">
            Sign in to continue to your CloudBox workspace.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pt-5">
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sign-in-email" className="text-slate-200">
              Email Address
            </Label>

            <Input
              id="sign-in-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className="h-10 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
            />

            {errors.email && (
              <p className="text-xs text-red-300">{errors.email}</p>
            )}
          </div>

          <PasswordInput
            id="sign-in-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password}
          />

          {errors.general && (
            <p className="text-sm text-red-300">{errors.general}</p>
          )}

          <div className="flex justify-end">
            <Link
              href="#"
              className="text-xs font-medium text-sky-300 transition-colors hover:text-sky-200 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full bg-sky-300 font-semibold text-slate-950 hover:bg-sky-200"
          >
            {isSubmitting && (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            )}

            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="mt-5 flex-col gap-4 border-white/10 bg-transparent px-6 pb-7 pt-0 sm:px-8 sm:pb-8">
        <Separator className="bg-white/10" />

        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-sky-300 hover:text-sky-200 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0d12] px-4 py-10 text-foreground sm:px-6">
      <Card className="w-full max-w-[440px] border-white/10 bg-[#11161e] shadow-2xl shadow-black/30">
        {children}
      </Card>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-200/70">
          CloudBox
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Secure file storage
        </p>
      </div>
    </div>
  );
}
