import { rolesFor } from "@/lib/permissions";
import { pageUser } from "@/server/page-access";
import { Panel } from "@/components/panel";
import { UploadForm } from "@/components/upload-form";
import { db } from "@/server/db";
import { taxonomy, grades } from "@/server/schema";
import { eq } from "drizzle-orm";
import { owned } from "@/modules/content";
import { bundledDemoOnly } from "@/server/demo-deployment";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ content?: string }>;
}) {
  const u = await pageUser(rolesFor("create"), true, "/ogretmen/yeni");
  if (bundledDemoOnly())
    return (
      <Panel role={u.role}>
        <div className="page-heading">
          <h1>Oyun paylaşımı</h1>
          <p>
            Bu demo kurulumunda hazır oyunları keşfedebilir, öğrenci ve sınıf
            ekranlarını deneyebilirsiniz. Yeni oyun yükleme henüz açık değil.
          </p>
        </div>
      </Panel>
    );
  const { content } = await searchParams;
  if (content) await owned(content, u);
  const items = await db
    .select()
    .from(taxonomy)
    .where(eq(taxonomy.active, true));
  const activeGrades = await db
    .select()
    .from(grades)
    .where(eq(grades.active, true))
    .orderBy(grades.value);
  return (
    <Panel role={u.role}>
      <div className="page-heading">
        <h1>{content ? "Yeni sürüm paylaş" : "Bir oyun, yeni bir keşif."}</h1>
        <p>
          Paketinizi yükleyin; oyun bilgilerini bir sonraki adımda tamamlayalım.
        </p>
      </div>
      {(!items.some((t) => t.kind === "subject") || !activeGrades.length) && (
        <p className="notice warning">
          Yükleme için önce admin tarafından etkin sınıf ve ders tanımları
          hazırlanmalı.
        </p>
      )}
      <UploadForm key={content ?? "new"} contentId={content} />
    </Panel>
  );
}
