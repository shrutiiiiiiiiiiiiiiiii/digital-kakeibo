import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MonthlyLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
