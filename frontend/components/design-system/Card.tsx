import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "group/card relative overflow-hidden rounded-3xl border border-black/10 bg-washi/90 p-10",
        "shadow-[0_22px_80px_-36px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ease-out",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.65),transparent_48%)]",
        "hover:-translate-y-0.5 hover:shadow-[0_28px_92px_-40px_rgba(0,0,0,0.55)]",
        "dark:border-white/10 dark:bg-sumi/45 dark:before:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]",
        "dark:shadow-[0_22px_80px_-36px_rgba(0,0,0,0.85)] dark:hover:shadow-[0_28px_96px_-42px_rgba(0,0,0,0.9)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
