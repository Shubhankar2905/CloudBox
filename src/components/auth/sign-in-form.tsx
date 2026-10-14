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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          general: data.error || "Invalid email or password.",
        });
        return;
      }

      window.location.href = "/dashboard";
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
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-6 pb-4">
          <Brand />

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>

            <CardDescription className="leading-relaxed">
              Sign in to continue to your CloudBox workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-in-email">Email address</Label>

              <Input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "sign-in-email-error" : undefined
                }
                className="h-10 bg-background"
              />

              {errors.email && (
                <p
                  id="sign-in-email-error"
                  className="text-sm text-destructive"
                >
                  {errors.email}
                </p>
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
              <p role="alert" className="text-sm text-destructive">
                {errors.general}
              </p>
            )}

            <div className="flex justify-end">
              <Link
                href="#"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full"
            >
              {isSubmitting && (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold tracking-tight">CloudBox</p>
        <p className="text-xs text-muted-foreground">Secure file storage</p>
      </div>
    </div>
  );
}
