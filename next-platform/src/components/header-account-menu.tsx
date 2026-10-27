"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, CircleUserRound } from "lucide-react";
import {
  roleLabel,
  workspaceLinks,
  workspaceLinkActive,
} from "@/lib/permissions";
import { SignOut } from "./auth-form";

export function HeaderAccountMenu({
  role,
  learning,
  onNavigate,
}: {
  role: string;
  learning: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const params = useSearchParams();
  const links = workspaceLinks(role, learning).filter(
    (link) => link.href !== "/ogretmen/yeni",
  );

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const layout = window.matchMedia("(min-width: 900px)");
    const resize = () => {
      if (root.current?.contains(document.activeElement)) {
        if (layout.matches) toggle.current?.focus();
        else document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
      setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    layout.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      layout.removeEventListener("change", resize);
    };
  }, [open]);

  return (
    <div
      className="header-account"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <button
        ref={toggle}
        type="button"
        className="button button-outline header-account-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <CircleUserRound size={18} aria-hidden="true" />
        {role === "admin" ? "Yönetim" : "Atölyem"}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      <div id={id} ref={panel} className="header-account-panel" hidden={!open}>
        <p className="header-account-role">{roleLabel(role)} hesabı</p>
        <div
          className="header-account-links"
          role="group"
          aria-label="Çalışma alanım"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.href === "/hesap" ? "header-account-settings" : undefined
              }
              aria-current={
                workspaceLinkActive(link, pathname, params.get("bolum"))
                  ? "page"
                  : undefined
              }
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
            >
              {link.href === "/hesap" ? "Hesabım" : link.label}
            </Link>
          ))}
        </div>
        <SignOut className="header-sign-out" />
      </div>
    </div>
  );
}
