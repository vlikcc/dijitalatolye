"use client";
import { Download, Printer } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { learningDate } from "@/lib/learning-display";
import {
  assignmentCsv,
  resultCells,
  resultHeaders,
  trackingDescription,
  type ReportAssignment,
} from "@/lib/assignment-export";
import type { ReportRow } from "@/lib/learning-workspace";

export function AssignmentExports({
  assignment,
  shown,
  allRows,
  filterDescription,
}: {
  assignment: ReportAssignment;
  shown: ReportRow[];
  allRows: ReportRow[];
  filterDescription: string;
}) {
  const [downloaded, setDownloaded] = useState(false);
  const [scope, setScope] = useState("filtered");
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [printedAt, setPrintedAt] = useState<Date | null>(null);
  const helpId = useId();
  const rows = scope === "all" ? allRows : shown;
  const scopeLabel =
    scope === "all"
      ? "Tüm öğrenciler"
      : `Filtrelenmiş öğrenciler · ${filterDescription}`;
  useEffect(() => {
    setContainer(document.body);
    const beforePrint = () => flushSync(() => setPrintedAt(new Date()));
    window.addEventListener("beforeprint", beforePrint);
    return () => window.removeEventListener("beforeprint", beforePrint);
  }, []);
  function download() {
    if (!rows.length) return;
    const url = URL.createObjectURL(
      new Blob([assignmentCsv(assignment, rows)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `odev-raporu-${assignment.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setDownloaded(true);
    // Leave the blob alive until the browser has begun saving (Safari too).
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="report-exports" role="group" aria-label="Rapor çıktıları">
        <div className="workspace-toolbar">
          <label>
            Çıktı kapsamı
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="filtered">
                Filtrelenmiş öğrenciler ({shown.length})
              </option>
              <option value="all">Tüm öğrenciler ({allRows.length})</option>
            </select>
          </label>
          <button
            type="button"
            className="button button-outline"
            onClick={download}
            disabled={!rows.length}
            aria-describedby={helpId}
          >
            <Download size={16} aria-hidden="true" />
            CSV indir
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={!rows.length || !container}
            aria-describedby={helpId}
            onClick={() => {
              flushSync(() => setPrintedAt(new Date()));
              window.print();
            }}
          >
            <Printer size={16} aria-hidden="true" />
            Yazdır / PDF
          </button>
        </div>
        {downloaded && (
          <p className="form-help" role="status">
            CSV indirme başlatıldı.
          </p>
        )}
        <p id={helpId} className="form-help" role="status">
          {rows.length
            ? `${rows.length} öğrenci çıktıya alınacak. CSV Excel’de açılabilir. Yazdırma penceresinde A4 ve Yatay seçin; PDF için kaydetme seçeneğini kullanın.`
            : "Seçilen kapsamda öğrenci yok. Filtreleri değiştirin veya tüm öğrencileri seçin."}
        </p>
      </div>
      {container &&
        createPortal(
          <section
            className="assignment-print"
            aria-label="Yazdırılabilir ödev raporu"
          >
            <header>
              <p>Dijital Oyun Atölyesi · Ödev raporu</p>
              <h1>{assignment.title}</h1>
              <p>
                {assignment.class_name} · {assignment.game_title}
              </p>
              <p>
                {assignment.closed ? "Kapalı" : "Açık"} · Son tarih:{" "}
                {assignment.due_at
                  ? `${learningDate(assignment.due_at)} (İstanbul)`
                  : "Yok"}
              </p>
              <p>
                {scopeLabel} · {rows.length} / {allRows.length} öğrenci
              </p>
              <p>
                Çıktı zamanı: {printedAt ? learningDate(printedAt) : "—"}{" "}
                (İstanbul)
              </p>
              <p>{trackingDescription(assignment.tracking)}</p>
            </header>
            <table>
              <caption>Öğrenci bazında ödev sonuçları</caption>
              <thead>
                <tr>
                  {resultHeaders.map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    {resultCells(assignment, r).map((cell, i) =>
                      i === 0 ? (
                        <th scope="row" key={i}>
                          {cell}
                        </th>
                      ) : (
                        <td key={i}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p>Seçilen kapsamda öğrenci yok.</p>}
          </section>,
          container,
        )}
    </>
  );
}
