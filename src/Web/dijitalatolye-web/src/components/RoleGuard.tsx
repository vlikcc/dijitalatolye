import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/state/auth";

type RoleGuardProps = {
  roles: string[];
  children: React.ReactNode;
  fallbackTo?: string;
};

export default function RoleGuard({ roles, children, fallbackTo = "/" }: RoleGuardProps) {
  const userRoles = useAuthStore((s) => s.roles);
  const hasRole = roles.some((r) => userRoles.includes(r));
  if (!hasRole) {
    return <Navigate to={fallbackTo} replace />;
  }
  return <>{children}</>;
}
