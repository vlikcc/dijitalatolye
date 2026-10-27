import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { can } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { VersionDetail } from "@/components/version-detail";
import { db } from "@/server/db";
import { versions } from "@/server/schema";
import { eq } from "drizzle-orm";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await pageUser(["editor", "admin"]);
  const v = await db.query.versions.findFirst({
    where: eq(versions.id, (await params).id),
  });
  if (!v) notFound();
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <Link
          className="back-link"
          href={u.role === "admin" ? "/yonetim?bolum=yayinlar" : "/editor"}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {u.role === "admin" ? "Yayınlara dön" : "İnceleme kuyruğuna dön"}
        </Link>
        <h1>{v.metadata.title}</h1>
        <p>{v.metadata.description}</p>
      </div>
      <VersionDetail version={v} review={can(u.role, "review")} />
    </Panel>
  );
}
