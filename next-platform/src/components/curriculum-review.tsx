"use client";
import { StatusBadge } from "./status-badge";
import { FormOutline } from "./form-outline";
import { assessmentSummary } from "@/lib/assessment-summary";
import { warningRules, type Assessment } from "@/modules/review-types";
import { AssessmentFields, assessmentFromForm } from "./assessment-form";
import type { TechnicalReport } from "@/modules/review-types";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { post } from "./action-form";
import type {
  CurriculumOutcome,
  CurriculumSource,
  SourceRef,
} from "@/modules/curriculum-types";
type Item = {
  id: string;
  catalogId: string;
  fingerprint: string;
  data: CurriculumOutcome;
  locallyVerified: boolean;
};
export function CurriculumReview({
  items,
  versionId,
  sha256,
  revision,
  technicalReport,
  coverId,
}: {
  items: Item[];
  versionId: string;
  sha256: string;
  revision: number;
  technicalReport: TechnicalReport;
  coverId: string;
}) {
  const router = useRouter();
  const [excluded, setExcluded] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const readAssessment = () => {
    if (formRef.current)
      setAssessment(
        assessmentFromForm(
          new FormData(formRef.current),
          technicalReport,
          items,
          excluded,
        ),
      );
  };
  useEffect(() => {
    readAssessment();
  }, [excluded, items, technicalReport]);
  const summary = assessment
    ? assessmentSummary(
        assessment,
        technicalReport,
        items.map((o) => ({ catalogId: o.catalogId, outcomeId: o.id })),
        excluded,
      )
    : null;

  return (
    <section className="curriculum-review">
      <h2>Kazanım ilişkileri ve yayın kararı</h2>
      {!items.length && (
        <p className="notice">
          Öğretmen resmî kazanım seçmedi. Oyunu eğitimsel açıdan uygun
          bulursanız kazanım ilişkisi olmadan yayımlayabilirsiniz.
        </p>
      )}
      {items.map((o) => (
        <article className="outcome-item" key={o.id}>
          <h3>{o.data.officialCode}</h3>
          <p>{o.data.text}</p>
          <p className="form-help">
            {o.locallyVerified
              ? "Kaynak yönetici tarafından doğrulandı. Oyunla uyumunu ayrıca inceleyin."
              : "Kaynak incelemesi gerekli. Paketin doğrulama etiketi yerel yönetici onayı değildir."}
          </p>
          {!o.locallyVerified && <SourceReview item={o} disabled={busy} />}
          <label className="check-label">
            <input
              type="checkbox"
              disabled={busy}
              checked={excluded.includes(o.id)}
              onChange={(e) =>
                setExcluded((old) =>
                  e.target.checked
                    ? [...old, o.id]
                    : old.filter((id) => id !== o.id),
                )
              }
            />
            <span>Bu kazanımı yayın ilişkisinden çıkar</span>
          </label>
        </article>
      ))}
      <form
        ref={formRef}
        className="form"
        onChange={readAssessment}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            await post(`/api/versions/${versionId}/decision`, {
              sha256,
              revision,
              decision: form.get("decision"),
              note: form.get("note"),
              excludedOutcomeIds: excluded,
              review: {
                technicalReportId: technicalReport.id,
                coverId,
                assessment: assessmentFromForm(
                  form,
                  technicalReport,
                  items,
                  excluded,
                ),
              },
            });
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Karar kaydedilemedi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {summary && (
          <FormOutline
            title="İnceleme bölümleri"
            sections={[
              { id: "assessment-science", label: "Eğitimsel değerlendirme" },
              ...(warningRules(technicalReport).length
                ? [
                    {
                      id: `warning-${warningRules(technicalReport)[0]}`,
                      label: "Teknik uyarılar",
                    },
                  ]
                : []),
              ...(items.length
                ? [
                    {
                      id: `assessment-outcome-${items[0].id}`,
                      label: "Kazanım kararları",
                    },
                  ]
                : []),
              { id: "review-decision", label: "Yayın kararı" },
            ]}
            missing={summary.missing}
          >
            <p className="form-help">
              <StatusBadge
                tone={summary.decisions === 5 ? "success" : "pending"}
              >
                5 başlıktan {summary.decisions} tanesinde karar var
              </StatusBadge>{" "}
              · Teknik uyarılar: {summary.warnings}/
              {warningRules(technicalReport).length} · Kazanımlar:{" "}
              {summary.outcomes}/{items.length}
            </p>
            <p className="form-help">
              {summary.approvalIssue
                ? `Yayın onayı için: ${summary.approvalIssue}`
                : "Değerlendirme alanları yayın onayına uygun. Kaynak doğrulaması ve diğer yayın koşulları ayrıca kontrol edilir."}
            </p>
          </FormOutline>
        )}
        <AssessmentFields report={technicalReport} disabled={busy} />
        {items.map((o) => (
          <fieldset
            id={`assessment-outcome-${o.id}`}
            tabIndex={-1}
            key={o.id}
            className="assessment-outcome"
            disabled={busy}
          >
            <legend>{o.data.officialCode} — oyunla uyumu</legend>
            {excluded.includes(o.id) && <p>İlişki yayından çıkarılacak.</p>}
            <label hidden={excluded.includes(o.id)}>
              Oyunla uyumu — {o.data.officialCode}
              <select name={`outcome.${o.id}`} defaultValue="unassessed">
                <option value="unassessed">Değerlendirilemedi</option>
                <option value="suitable">Oyunla uyumlu</option>
              </select>
            </label>
            <label>
              Kanıt / çıkarma gerekçesi — {o.data.officialCode}
              <textarea
                name={`outcome-note.${o.id}`}
                disabled={busy}
                maxLength={1500}
                rows={2}
                placeholder="Oyundaki hangi görev bu kazanımı destekliyor? İlişkiyi çıkardıysanız nedenini yazın."
              />
            </label>
          </fieldset>
        ))}
        <label>
          Karar
          <select
            id="review-decision"
            name="decision"
            defaultValue="revise"
            disabled={busy}
          >
            <option value="revise">Düzeltme iste</option>
            <option value="approve">Onayla ve yayımla</option>
          </select>
        </label>
        <label>
          Gerekçe / öğretmene not
          <textarea
            disabled={busy}
            name="note"
            required
            minLength={5}
            maxLength={3000}
            placeholder="Eğitimsel uygunluğu ve çıkardığınız kazanımların gerekçesini açıklayın."
          />
        </label>
        <p className="form-help">
          Yayın onayı, oyunun içeriğini ve seçili kazanımlarla eğitimsel uyumunu
          incelediğiniz anlamına gelir.
        </p>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div>
          <Button disabled={busy}>
            {busy ? "Kaydediliyor…" : "Kararı kaydet"}
          </Button>
        </div>
      </form>
    </section>
  );
}
function SourceReview({ item, disabled }: { item: Item; disabled: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<{
    sources: CurriculumSource[];
    refs: SourceRef[];
    program: {
      officialName: string;
      grades: number[] | null;
      schoolTypes: string[] | null;
    };
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const endpoint = `/api/curriculum/${item.catalogId}/outcomes/${item.id}`;
  return (
    <div className="source-review">
      <Button
        type="button"
        variant="outline"
        disabled={busy || loading || disabled}
        onClick={async () => {
          setLoading(true);
          setError("");
          try {
            const r = await fetch(endpoint);
            const b = await r.json();
            if (!r.ok) throw Error(b.error);
            setData(b);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Kaynak açılamadı.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Kaynaklar getiriliyor…" : "Kaynak ve süreçleri incele"}
      </Button>
      {data && (
        <>
          <p>
            <strong>{data.program.officialName}</strong>
          </p>
          <p>
            Sınıf: {item.data.grades?.join(", ") || "Çözümlenmemiş"} ·{" "}
            {data.program.schoolTypes?.join(", ") || "Okul türü belirsiz"}
          </p>
          <ul>
            {item.data.processComponents?.map((p, i) => (
              <li key={i}>
                {p.label} {p.text}
              </li>
            ))}
          </ul>
          {item.data.unitVariants?.map((v, i) => (
            <details key={i}>
              <summary>Tema bağlamındaki süreçler ({i + 1})</summary>
              <p>{v.text}</p>
              <ul>
                {v.processComponents?.map((p, j) => (
                  <li key={j}>{p.text}</li>
                ))}
              </ul>
            </details>
          ))}
          {data.sources.map((s) => (
            <div className="source-link" key={s.id}>
              <p>{s.title}</p>
              <p className="form-help">
                PDF sayfaları:{" "}
                {[
                  ...new Set(
                    data.refs
                      .filter((r) => r.sourceId === s.id)
                      .map((r) => r.pdfPage)
                      .filter(Boolean),
                  ),
                ].join(", ") || "Program kapsam belgesi"}
              </p>
              <div className="actions">
                <a
                  href={`/api/curriculum/${item.catalogId}/sources/${s.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hash ile doğrulanmış PDF’yi indir
                </a>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  MEB’de aç
                </a>
              </div>
            </div>
          ))}
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                await post(endpoint + "/verify", {
                  fingerprint: item.fingerprint,
                  note: f.get("note"),
                  confirmed: f.get("confirmed") === "on",
                });
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Kaynak doğrulanamadı.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                name="confirmed"
                required
                disabled={busy || loading || disabled}
              />
              <span>
                Metni, sınıf/program ilişkisini ve süreç bileşenlerini resmî
                kaynakla karşılaştırdım.
              </span>
            </label>
            <label>
              Kaynak inceleme notu
              <textarea
                name="note"
                required
                minLength={10}
                maxLength={3000}
                disabled={busy || loading || disabled}
              />
            </label>
            <div>
              <Button disabled={busy || loading || disabled} variant="outline">
                {busy ? "Kaydediliyor…" : "Kaynak doğrulamasını kaydet"}
              </Button>
            </div>
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </div>
  );
}
