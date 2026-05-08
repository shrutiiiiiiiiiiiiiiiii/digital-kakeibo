"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type InputProps = {
  label: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  hint,
  id,
  className,
  ...rest
}: InputProps) {
  const reactId = useId();
  const inputId = id ?? `field-${reactId.replaceAll(":", "")}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block font-display text-[15px] font-medium tracking-[0.08em] text-sumi dark:text-washi"
      >
        {label}
      </label>

      <input
        {...rest}
        id={inputId}
        className={[
          "w-full rounded-xl border border-black/15 bg-white/75 px-5 py-[18px] text-[17px] text-sumi dark:border-white/15 dark:bg-black/20 dark:text-washi",
          "placeholder:text-black/35 dark:placeholder:text-washi/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm",
          "outline-none ring-2 ring-transparent transition-[border-color,box-shadow,transform]",
          "focus:border-enji focus:shadow-[0_16px_32px_-22px_rgba(0,0,0,0.45)] focus:-translate-y-0.5 focus-visible:ring-enji/65 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {hint ? (
        <p className="font-sans text-sm leading-6 text-black/55 dark:text-washi/55">{hint}</p>
      ) : null}
    </div>
  );
}
