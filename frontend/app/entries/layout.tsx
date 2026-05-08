import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function EntriesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
