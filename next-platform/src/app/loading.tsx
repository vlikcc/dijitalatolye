"use client";
import { usePathname } from "next/navigation";
import { CatalogLoading } from "@/components/catalog-loading";

export default function Loading() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/kesfet") return <CatalogLoading />;
  return (
    <div className="loading" role="status">
      Atölye hazırlanıyor…
    </div>
  );
}
