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
  Record<"name" | "email" | "password" | "confirmPassword" | "general", string>
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
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const nextErrors: SignUpErrors = {};

    if (!name) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!email) {
      nextErrors.email = "Please enter your email address.";
    }

    if (!password) {
      nextErrors.password = "Please enter a password.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
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
        setErrors({
          general: data.error || "Unable to create your account.",
        });
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Signup failed:", error);

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
              Create your account
            </CardTitle>

            <CardDescription className="leading-relaxed">
              Start storing and sharing your files securely.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sign-up-name">Full name</Label>

              <Input
                id="sign-up-name"
                name="name"
                autoComplete="name"
                placeholder="Alex Morgan"
                aria-invalid={Boolean(errors.name)}
                className="h-10 bg-background"
              />

              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sign-up-email">Email address</Label>

              <Input
                id="sign-up-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                className="h-10 bg-background"
              />

              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
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
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />

            {errors.general && (
              <p role="alert" className="text-sm text-destructive">
                {errors.general}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-10 w-full"
            >
              {isSubmitting && (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
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
