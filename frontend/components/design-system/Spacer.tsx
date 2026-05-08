export function Spacer({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const heights = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  } as const;

  return (
    <div
      aria-hidden="true"
      className={[heights[size], className ?? ""].filter(Boolean).join(" ")}
    />
  );
}
