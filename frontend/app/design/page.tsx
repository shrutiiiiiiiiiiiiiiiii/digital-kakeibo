"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { Modal } from "@/components/design-system/Modal";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useToast } from "@/lib/toast";

export default function DesignSandboxPage() {
  const { pushToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-8">
        <div className="space-y-3">
          <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
            Phase 2 — design system sandbox
          </p>
          <div className="flex flex-wrap items-center gap-4 font-display text-[15px] tracking-[0.16em] text-muted-foreground">
            <Link href="/">Home</Link>
            <span aria-hidden className="text-black/25 dark:text-washi/25">
              /
            </span>
            <Link href="/login">Log in</Link>
            <span aria-hidden className="text-black/25 dark:text-washi/25">
              /
            </span>
            <Link href="/signup">Sign up</Link>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Spacer size="xl" />

      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-2">
        <Card className="space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-3xl tracking-[0.08em] leading-tight">
              Typography
            </h1>
            <p className="font-sans text-[15px] leading-7 text-muted-foreground">
              Headings borrow a Japanese serif posture. Body copy stays clean. Money feels heavier in monospace.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-display text-xl tracking-[0.12em]">Shippori Mincho — heading cadence</p>
            <p className="font-sans text-[16px] leading-7">
              Inter — quiet, readable narration for rituals you repeat weekly.
            </p>
          </div>

          <div>
            <p className="font-sans text-sm text-muted-foreground">Numerals</p>
            <p className="mt-3 font-mono text-3xl tabular-nums tracking-tight">
              ¥12,840
            </p>
          </div>
        </Card>

        <Card className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-display text-3xl tracking-[0.08em] leading-tight">
              Components
            </h2>
            <p className="font-sans text-[15px] leading-7 text-muted-foreground">
              One calm visual language across controls — restrained, tactile, deliberate motion.
            </p>
          </div>

          <div className="space-y-6">
            <Input
              label="Note"
              hint="Soft limit around 50 characters for mindful entries."
              placeholder="Morning tea with a notebook…"
              value={note}
              maxLength={50}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Button type="button" onClick={() => pushToast({ message: "Recorded — gently.", tone: "success" })}>
                Toast: success
              </Button>
              <Button type="button" onClick={() => pushToast({ message: "Hold still — breathe.", tone: "danger" })}>
                Toast: warning
              </Button>
              <Button type="button" onClick={() => setIsModalOpen(true)}>
                Open modal
              </Button>
              <Button type="button" loading>
                Loading
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ink on rice paper"
        description="Modals interrupt — so keep them ceremonial, not cluttered."
        primaryAction={{ label: "Continue", onClick: () => setIsModalOpen(false) }}
      />
    </div>
  );
}
