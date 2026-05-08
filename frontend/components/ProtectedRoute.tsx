"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <p className="px-6 py-16 font-sans text-sm text-muted-foreground">
        Checking your session...
      </p>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
