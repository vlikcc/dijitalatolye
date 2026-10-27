"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  roleLabel,
  workspaceLinks,
  workspaceLinkActive,
} from "@/lib/permissions";
export function WorkspaceNav({
  role,
  learning,
  mobile = false,
  onNavigate,
}: {
  role: string;
  learning: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname(),
    params = useSearchParams();
  return (
    <div className={mobile ? "mobile-workspace-links" : "sidebar"}>
      <p className="workspace-role">{roleLabel(role)}</p>
      {workspaceLinks(role, learning).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={
            workspaceLinkActive(link, pathname, params.get("bolum"))
              ? "page"
              : undefined
          }
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
