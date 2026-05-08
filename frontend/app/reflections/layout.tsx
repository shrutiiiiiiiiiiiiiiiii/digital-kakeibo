import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ReflectionsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
