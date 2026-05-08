"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signup(email, password);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-xl items-start justify-between gap-6">
        <Link href="/" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
          Home
        </Link>
        <ThemeToggle />
      </div>

      <Spacer size="xl" />

      <div className="mx-auto flex w-full justify-center px-2">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-8">
          <Card className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display text-3xl tracking-[0.08em]">Create account</h1>
              <p className="font-sans text-sm leading-7 text-muted-foreground">
                Start quietly — passwords must be eight characters or more with at least one number.
              </p>
            </div>

            <div className="space-y-6">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Eight characters plus a number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error ? (
                <p className="font-sans text-sm leading-7 text-enji">{error}</p>
              ) : null}

              <Button type="submit" loading={isSubmitting}>
                Sign up
              </Button>
            </div>
          </Card>

          <p className="text-center font-sans text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium underline decoration-black/20 underline-offset-8 hover:decoration-sumi dark:decoration-washi/30" href="/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
