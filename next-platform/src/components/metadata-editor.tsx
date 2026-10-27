"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FormOutline } from "./form-outline";
import { metadataSchema } from "@/lib/metadata-schema";
import { CoverEditor } from "./cover-editor";
import { ActionFeedback } from "./action-feedback";
import { StatusBadge } from "./status-badge";
import { Button } from "./ui/button";
import type { Metadata } from "@/server/schema";
import type {
  ExtractionReport,
  CurriculumOutcome,
} from "@/modules/curriculum-types";
type Candidate = {
  id: string;
  catalogId: string;
  data: CurriculumOutcome;
  reason: string;
  locallyVerified: boolean;
  evidence: { text: string; file: string; location: string } | null;
};
type Program = {
  id: string;
  subjectId: string;
  data: {
    officialName: string;
    schoolTypes: string[] | null;
    curriculumFamily: string;
    versionLabel: string | null;
  };
  applicability: {
    status: string;
    academicYear: string;
    grades: number[] | null;
    schoolTypes: string[] | null;
  }[];
};
const verificationLabel = (o: Candidate) =>
  o.locallyVerified
    ? "Kaynak yönetici tarafından doğrulandı"
    : o.data.verificationStatus === "verified"
      ? "Pakette doğrulanmış; yerel kaynak kontrolü bekliyor"
      : "Kaynak incelemesi gerekli";
async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const body = await r.json();
  if (!r.ok)
    throw Error(
      body.error + (body.traceId ? ` (İzleme: ${body.traceId})` : ""),
    );
  return body;
}
export function MetadataEditor({
  versionId,
  sha256,
  revision: initialRevision,
  draft,
  report,
  subjects,
  grades,
  selected = [],
}: {
  versionId: string;
  sha256: string;
  revision: number;
  draft: Partial<Metadata>;
  report: ExtractionReport | null;
  subjects: { id: string; label: string }[];
  grades: number[];
  selected: Candidate[];
}) {
  const router = useRouter();
  const [revision, setRevision] = useState(initialRevision);
  const searchGeneration = useRef(0);
  const [title, setTitle] = useState(
    draft.title ?? String(report?.fields.title?.value ?? ""),
  );
  const [description, setDescription] = useState(
    draft.description ?? String(report?.fields.description?.value ?? ""),
  );
  const [grade, setGrade] = useState(
    String(draft.grade ?? report?.fields.grade?.value ?? ""),
  );
  const [subject, setSubject] = useState(
    draft.subjectId ??
      subjects.find(
        (s) =>
          s.label.toLocaleLowerCase("tr") ===
          String(report?.fields.subject?.value ?? "").toLocaleLowerCase("tr"),
      )?.id ??
      "",
  );
  const [catalogId, setCatalogId] = useState(
    draft.catalogId ?? report?.catalogId ?? "",
  );
  const [programId, setProgramId] = useState(draft.programId ?? "");
  const [schoolType, setSchoolType] = useState(draft.schoolType ?? "");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [chosen, setChosen] = useState<Candidate[]>(selected);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedPayload, setSavedPayload] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  useEffect(() => {
    if (!grade || !subject) {
      setPrograms([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const q = new URLSearchParams({
      grade,
      subjectId: subject,
      ...(catalogId ? { catalogId } : {}),
    });
    json(`/api/curriculum/programs?${q}`, { signal: controller.signal })
      .then((r) => {
        setPrograms(r.programs);
        if (r.catalog?.id) setCatalogId(r.catalog.id);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [grade, subject, catalogId]);
  const program = programs.find((p) => p.id === programId);
  const resetContext = () => {
    searchGeneration.current++;
    setProgramId("");
    setSchoolType("");
    setChosen([]);
    setCandidates([]);
    setSearched(false);
    setHasMore(false);
  };
  async function search(auto: boolean, nextPage = 0) {
    const generation = ++searchGeneration.current;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params = new URLSearchParams({
        catalogId,
        programId,
        subjectId: subject,
        grade,
        ...(auto ? { versionId } : { q: query, page: String(nextPage) }),
      });
      const r = await json(`/api/curriculum/outcomes?${params}`);
      if (generation !== searchGeneration.current) return;
      setCandidates(r.items);
      setHasMore(!auto && r.hasMore);
      setPage(nextPage);
    } catch (e) {
      if (generation === searchGeneration.current)
        setError(e instanceof Error ? e.message : "Arama başarısız.");
    } finally {
      if (generation === searchGeneration.current) setLoading(false);
    }
  }
  function metadata(): Partial<Metadata> {
    return {
      title,
      description,
      ...(grade ? { grade: Number(grade) } : {}),
      ...(subject ? { subjectId: subject } : {}),
      outcomeIds: [],
      outcomeRefs: chosen.map((o) => ({
        catalogId: o.catalogId,
        outcomeId: o.id,
      })),
      academicYear: "2026–2027",
      ...(programId
        ? { catalogId, programId, ...(schoolType ? { schoolType } : {}) }
        : {}),
    };
  }
  async function save(submit: boolean) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = metadata();
      const r = await json(`/api/versions/${versionId}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha256, revision, metadata: payload }),
      });
      setRevision(r.revision);
      setSavedPayload(JSON.stringify(payload));
      if (submit) {
        setMessage(
          "Güncel kapak hazırlanıyor; ardından incelemeye gönderilecek.",
        );
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          const result = await json(`/api/versions/${versionId}/cover`);
          if (result.cover?.status === "error")
            throw Error(result.cover.error || "Kapak hazırlanamadı.");
          if (result.cover?.status === "ready") {
            ready = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (!ready)
          throw Error(
            "Kapak henüz hazır değil. Taslağınız kaydedildi; kapak tamamlanınca yeniden gönderin.",
          );
        await json(`/api/versions/${versionId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sha256,
            revision: r.revision,
            metadata: payload,
          }),
        });
        router.refresh();
      } else
        setMessage(
          "Taslak kaydedildi. Daha sonra buradan devam edebilirsiniz.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilgiler kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }
  const payload = metadata();
  const validation = metadataSchema.safeParse(payload);
  const fieldTargets: Record<string, { id: string; label: string }> = {
    title: {
      id: "metadata-title",
      label: "Oyun başlığını kontrol edin (3–120 karakter)",
    },
    description: {
      id: "metadata-description",
      label: "Açıklamayı kontrol edin (20–3000 karakter)",
    },
    grade: { id: "metadata-grade", label: "Geçerli bir sınıf seçin" },
    subjectId: { id: "metadata-subject", label: "Ders seçin" },
  };
  const missing = [
    ...new Set(
      validation.success
        ? []
        : validation.error.issues.map((i) => String(i.path[0])),
    ),
  ].map(
    (field) =>
      fieldTargets[field] ?? {
        id: "metadata-program",
        label: "Program ve kazanım bilgilerini kontrol edin",
      },
  );
  if (program?.data.schoolTypes?.length && !schoolType)
    missing.push({ id: "metadata-school", label: "Okul türünü seçin" });
  const uniqueMissing = missing.filter(
    (item, index) =>
      missing.findIndex((other) => other.id === item.id) === index,
  );
  const source = (name: keyof ExtractionReport["fields"]) =>
    report?.fields[name]?.evidence;
  const application = program?.applicability.filter(
    (a) =>
      a.academicYear.replace("-", "–") === "2026–2027" &&
      a.grades?.includes(Number(grade)) &&
      (!schoolType || a.schoolTypes?.includes(schoolType)),
  );
  return (
    <section aria-labelledby="metadata-heading" className="metadata-editor">
      <h2 id="metadata-heading">Oyununuzu derse bağlayın.</h2>
      <p>
        Paketten okunan bilgileri kontrol edin. Eksik alanları siz tamamlayın;
        öneriler otomatik yayın kararı değildir.
      </p>
      {report?.warnings.length ? (
        <details className="notice warning">
          <summary>
            {report.warnings.length} çıkarım notu · elle devam edebilirsiniz
          </summary>
          <ul>
            {report.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <form
        className="form"
        onChange={() => setMessage("")}
        onSubmit={(e) => {
          e.preventDefault();
          void save(true);
        }}
      >
        <FormOutline
          title="Bölümler ve eksikler"
          sections={[
            { id: "metadata-title", label: "Genel bilgiler" },
            { id: "metadata-program", label: "Program ve kazanımlar" },
            { id: "metadata-cover", label: "Kapak" },
          ]}
          missing={uniqueMissing}
        >
          <p className="form-help">
            {chosen.length} kazanım seçildi ·{" "}
            <StatusBadge
              tone={
                busy
                  ? "pending"
                  : savedPayload === JSON.stringify(payload)
                    ? "success"
                    : "neutral"
              }
            >
              {busy
                ? "Kaydediliyor…"
                : savedPayload === JSON.stringify(payload)
                  ? "Bilgiler kaydedildi"
                  : savedPayload
                    ? "Kaydedilmemiş değişiklikler var"
                    : "Bu oturumda henüz kaydedilmedi"}
            </StatusBadge>
          </p>
        </FormOutline>
        <label>
          <span id="metadata-title-label">Oyun başlığı</span>
          <input
            id="metadata-title"
            aria-labelledby="metadata-title-label"
            aria-describedby={
              source("title") ? "metadata-title-source" : undefined
            }
            disabled={busy || coverBusy}
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {source("title") && (
            <span className="form-help" id="metadata-title-source">
              Önerinin kaynağı: {source("title")!.file} ·{" "}
              {source("title")!.location}
            </span>
          )}
        </label>
        <label>
          <span id="metadata-description-label">Öğretmen açıklaması</span>
          <textarea
            id="metadata-description"
            aria-labelledby="metadata-description-label"
            aria-describedby={
              source("description") ? "metadata-description-source" : undefined
            }
            disabled={busy || coverBusy}
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Oyunun nasıl oynandığını ve derste nasıl kullanılacağını açıklayın."
          />
          {source("description") && (
            <span className="form-help" id="metadata-description-source">
              Önerinin kaynağı: {source("description")!.file} ·{" "}
              {source("description")!.location}
            </span>
          )}
        </label>
        <div className="form-row">
          <label>
            Sınıf
            <select
              id="metadata-grade"
              disabled={busy || coverBusy}
              aria-describedby={
                source("grade") ? "metadata-grade-source" : undefined
              }
              required
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                resetContext();
              }}
            >
              <option value="">Sınıf seçin</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}. sınıf
                </option>
              ))}
            </select>
          </label>
          <label>
            Ders
            <select
              id="metadata-subject"
              disabled={busy || coverBusy}
              aria-describedby={
                source("subject") ? "metadata-subject-source" : undefined
              }
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                resetContext();
              }}
            >
              <option value="">Ders seçin</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {report?.fields.grade && (
          <p className="form-help" id="metadata-grade-source">
            Paketin bildirdiği sınıf: {report.fields.grade.value}. sınıf. Bu
            bilgiyi sizin doğrulamanız gerekir. Önerinin kaynağı:{" "}
            {source("grade")!.file} · {source("grade")!.location}
          </p>
        )}
        {report?.fields.subject && (
          <p className="form-help" id="metadata-subject-source">
            Paketin bildirdiği ders: {String(report.fields.subject.value)}.
            Önerinin kaynağı: {source("subject")!.file} ·{" "}
            {source("subject")!.location}
          </p>
        )}
        <fieldset
          id="metadata-program"
          tabIndex={-1}
          className="curriculum-picker"
          disabled={busy || coverBusy}
        >
          <legend>Öğrenme çıktıları / kazanımlar (isteğe bağlı)</legend>
          {report?.fields.programId && (
            <p className="form-help" id="metadata-program-source">
              Paketin bildirdiği program:{" "}
              {String(report.fields.programId.value)}. Aşağıdaki programla
              karşılaştırın. Önerinin kaynağı: {source("programId")!.file} ·{" "}
              {source("programId")!.location}
            </p>
          )}
          <p className="form-help">
            Referans yıl: 2026–2027. Katalog kısmen doğrulanmıştır; TYMM ve
            önceki programlar ayrı listelenir.
          </p>
          {subject && grade ? (
            <>
              <label>
                Öğretim programı
                <select
                  aria-describedby={
                    source("programId") ? "metadata-program-source" : undefined
                  }
                  value={programId}
                  onChange={(e) => {
                    resetContext();
                    setProgramId(e.target.value);
                    setLoading(false);
                  }}
                >
                  <option value="">
                    Kazanım belirtmeden devam et / program seç
                  </option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.data.officialName}
                    </option>
                  ))}
                </select>
              </label>
              {!loading && !programs.length && (
                <p className="notice">
                  Bu ders ve sınıf için seçilebilir program bulunamadı. Kazanım
                  belirtmeden devam edebilirsiniz.
                </p>
              )}
            </>
          ) : (
            <p>Programları görmek için ders ve sınıfı seçin.</p>
          )}
          {program && (
            <>
              <label>
                Okul türü
                <select
                  id="metadata-school"
                  value={schoolType}
                  required={Boolean(program.data.schoolTypes?.length)}
                  onChange={(e) => setSchoolType(e.target.value)}
                >
                  <option value="">Okul türünü seçin</option>
                  {program.data.schoolTypes?.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <p className="form-help">
                {application?.length === 1 &&
                application[0].status === "in_force"
                  ? "Kaynak katalogda bu kapsam için yürürlükte olarak kayıtlı."
                  : application?.length === 1 &&
                      application[0].status === "published_not_yet_in_force"
                    ? "Yayımlanmış program; bu kapsamda henüz yürürlükte değil."
                    : "Bu kapsam için uygulama durumu doğrulanmadı. Yönetici program seçimini inceleyecek."}
              </p>
              <div className="actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || !report}
                  onClick={() => void search(true)}
                >
                  Paketten kazanım öner
                </Button>
              </div>
              <label>
                Kazanım ara
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kod veya kavram: kesir, dijital vatandaşlık…"
                />
              </label>
              <div className="actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void search(false)}
                >
                  Katalogda ara
                </Button>
              </div>
            </>
          )}
          {loading && <p role="status">Müfredat kayıtları getiriliyor…</p>}
          {searched && !loading && !candidates.length && (
            <p className="notice">
              Bu kapsamda yeterli eşleşme bulunamadı. Farklı bir kavramla arayın
              veya kazanım belirtmeden devam edin.
            </p>
          )}
          <div className="outcome-list">
            {candidates.map((o) => (
              <article className="outcome-item" key={o.id}>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={chosen.some((c) => c.id === o.id)}
                    disabled={
                      chosen.length >= 20 && !chosen.some((c) => c.id === o.id)
                    }
                    onChange={(e) =>
                      setChosen((old) =>
                        e.target.checked
                          ? [...old, o]
                          : old.filter((c) => c.id !== o.id),
                      )
                    }
                  />
                  <span>
                    <strong>{o.data.officialCode}</strong> {o.data.text}
                  </span>
                </label>
                <p className="form-help">
                  {o.reason} · {verificationLabel(o)}
                </p>
                {o.evidence && (
                  <blockquote>
                    <p>{o.evidence.text}</p>
                    <cite>
                      {o.evidence.file} · {o.evidence.location}
                    </cite>
                  </blockquote>
                )}
                <details>
                  <summary>Süreç bileşenlerini gör</summary>
                  <ul>
                    {o.data.processComponents?.map((p, i) => (
                      <li key={i}>
                        {p.label} {p.text}
                      </li>
                    ))}
                  </ul>
                  {o.data.unitVariants?.map((v, i) => (
                    <div key={i}>
                      <p>{v.text}</p>
                      <ul>
                        {v.processComponents?.map((p, j) => (
                          <li key={j}>{p.text}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </details>
              </article>
            ))}
          </div>
          {(hasMore || page > 0) && (
            <div className="actions">
              <Button
                type="button"
                variant="outline"
                disabled={loading || page === 0}
                onClick={() => void search(false, page - 1)}
              >
                Önceki
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !hasMore}
                onClick={() => void search(false, page + 1)}
              >
                Sonraki
              </Button>
            </div>
          )}
          {chosen.length > 0 && (
            <div className="chosen-outcomes">
              <h3>Seçilen kazanımlar ({chosen.length})</h3>
              {chosen.map((o) => (
                <div key={o.id}>
                  <span>
                    {o.data.officialCode} · {o.data.text}
                    <span className="form-help selected-verification">
                      {verificationLabel(o)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setChosen((old) => old.filter((c) => c.id !== o.id))
                    }
                    aria-label={`${o.data.officialCode} seçimini kaldır`}
                  >
                    Kaldır
                  </Button>
                </div>
              ))}
            </div>
          )}
        </fieldset>
        <div id="metadata-cover" tabIndex={-1}>
          <CoverEditor
            versionId={versionId}
            sha256={sha256}
            revision={revision}
            disabled={busy || coverBusy}
            onBusy={setCoverBusy}
          />
        </div>
        <p className="notice">
          İncelemeye gönderdiğinizde bu sürümün bilgileri sabitlenir. Daha
          sonraki kapak değişiklikleri yeni inceleme sürümüyle yapılır.
        </p>
        {error && <ActionFeedback error>{error}</ActionFeedback>}
        {message && <ActionFeedback>{message}</ActionFeedback>}
        <div className="actions">
          <Button
            type="button"
            variant="outline"
            disabled={busy || coverBusy}
            onClick={() => void save(false)}
          >
            Taslağı kaydet
          </Button>
          <Button disabled={busy || coverBusy}>
            {busy ? "Kaydediliyor…" : "Bilgileri onayla ve incelemeye gönder"}
          </Button>
        </div>
      </form>
    </section>
  );
}
