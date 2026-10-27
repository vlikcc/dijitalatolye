"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { can } from "@/lib/permissions";
import { HeaderAccountMenu } from "./header-account-menu";
import { Bookmark, Menu, Plus, X } from "lucide-react";

export function HeaderNavigation({
  signedIn,
  role,
  learning,
}: {
  signedIn: boolean;
  role?: string;
  learning?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const params = useSearchParams();
  const inCatalog = pathname === "/kesfet";
  const saved = inCatalog && params.get("saved") === "1";

  useEffect(() => setOpen(false), [pathname, params]);

  useEffect(() => {
    if (!open) return;
    navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 900px)");
    const resize = () => {
      if (desktop.matches) {
        if (document.activeElement === toggle.current)
          navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  return (
    <div
      className="header-navigation"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <button
        ref={toggle}
        className="menu-toggle"
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X size={19} aria-hidden="true" />
        ) : (
          <Menu size={19} aria-hidden="true" />
        )}
        <span>Menü</span>
      </button>
      <nav
        ref={navigation}
        id={id}
        className={`nav ${open ? "is-open" : ""}`}
        aria-label="Ana menü"
      >
        <div className="nav-discovery">
          <Link
            href="/kesfet"
            aria-current={inCatalog && !saved ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Oyunlar
          </Link>
          <Link
            href="/kesfet?saved=1"
            aria-current={saved ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <Bookmark size={17} aria-hidden="true" />
            Kaydettiklerim
          </Link>
        </div>
        <div className="header-actions">
          {!signedIn ? (
            <Link
              href="/nasil-kullanilir"
              aria-current={
                pathname === "/nasil-kullanilir" ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              Nasıl kullanılır?
            </Link>
          ) : (
            can(role, "create") && (
              <Link
                className="nav-upload"
                href="/ogretmen/yeni"
                aria-current={
                  pathname === "/ogretmen/yeni" ? "page" : undefined
                }
                onClick={() => setOpen(false)}
              >
                <Plus size={17} aria-hidden="true" />
                Oyun paylaş
              </Link>
            )
          )}
          <div className="header-account-separator">
            {signedIn && role ? (
              <HeaderAccountMenu
                key={`${pathname}?${params.toString()}`}
                role={role}
                learning={Boolean(learning)}
                onNavigate={() => setOpen(false)}
              />
            ) : (
              <Link
                className="button button-outline teacher-login"
                href="/giris"
                aria-current={pathname === "/giris" ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                Giriş yap
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
