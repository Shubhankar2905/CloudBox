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

type SignUpErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

export function SignUpForm() {
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data.error);
        return;
      }

      console.log("Signup successful:", data);

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0d12] px-4 py-10 text-foreground sm:px-6">
      <Card className="w-full max-w-[440px] border-white/10 bg-[#11161e] shadow-2xl shadow-black/30">
        <CardHeader className="gap-5 px-6 pb-2 pt-7 sm:px-8 sm:pt-8">
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
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              Create your account
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-slate-400">
              Start storing and sharing your files securely.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pt-5 sm:px-8">
          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-up-name" className="text-slate-200">
                Full Name
              </Label>
              <Input
                id="sign-up-name"
                name="name"
                autoComplete="name"
                placeholder="Alex Morgan"
                aria-invalid={Boolean(errors.name)}
                className="h-10 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
              />
              {errors.name && (
                <p className="text-xs text-red-300">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sign-up-email" className="text-slate-200">
                Email Address
              </Label>
              <Input
                id="sign-up-email"
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
              id="sign-up-password"
              name="password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={errors.password}
            />
            <PasswordInput
              id="sign-up-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full bg-sky-300 font-semibold text-slate-950 hover:bg-sky-200"
            >
              {isSubmitting && (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-5 flex-col gap-4 border-white/10 bg-transparent px-6 pb-7 pt-0 sm:px-8 sm:pb-8">
          <Separator className="bg-white/10" />
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-sky-300 hover:text-sky-200 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
