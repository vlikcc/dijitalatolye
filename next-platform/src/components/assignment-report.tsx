"use client";
import { StatusBadge, ProgressValue } from "./status-badge";
import { useState } from "react";
import { learningDate } from "@/lib/learning-display";
import {
  reportRowStatus,
  type ReportAssignment,
} from "@/lib/assignment-export";
import { AssignmentExports } from "./assignment-exports";
import {
  reportState,
  reportCounts,
  reportRows,
  type ReportRow,
  type ReportState,
} from "@/lib/learning-workspace";

export function AssignmentReport({
  assignment: a,
  rows,
}: {
  assignment: ReportAssignment;
  rows: ReportRow[];
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<ReportState | "all">("all");
  const [sort, setSort] = useState<"name" | "activity">("name");
  const counts = reportCounts(rows, a.tracking);
  const shown = reportRows(rows, a.tracking, query, state, sort);
  const filters: {
    value: ReportState | "all";
    label: string;
    count: number;
  }[] = [
    { value: "all", label: "Atanan öğrenci", count: rows.length },
    {
      value: "not_started",
      label: a.tracking ? "Başlamadı" : "Açılmadı",
      count: counts.not_started,
    },
    ...(a.tracking
      ? [
          {
            value: "in_progress" as const,
            label: "Devam ediyor",
            count: counts.in_progress,
          },
          {
            value: "completed" as const,
            label: "Tamamlandı",
            count: counts.completed,
          },
        ]
      : [{ value: "opened" as const, label: "Açıldı", count: counts.opened }]),
  ];
  const status = (r: ReportRow) => {
    const state = reportState(r, a.tracking);
    return (
      <StatusBadge
        tone={
          a.closed || r.membership !== "active"
            ? "neutral"
            : state === "completed"
              ? "success"
              : state === "in_progress"
                ? "pending"
                : "neutral"
        }
      >
        {reportRowStatus(a, r)}
      </StatusBadge>
    );
  };
  const values = (r: ReportRow) =>
    [
      ["İlerleme", a.tracking ? <ProgressValue value={r.progress} /> : "—"],
      ["Son puan", a.tracking ? (r.score ?? "—") : "—"],
      ["En iyi puan", a.tracking ? (r.best_score ?? "—") : "—"],
      ["Deneme", r.attempts],
      [
        "Son etkinlik",
        r.last_activity ? learningDate(r.last_activity) : "Henüz yok",
      ],
    ] as const;
  return (
    <section className="assignment-report" aria-label="Öğrenci sonuçları">
      <div
        className="report-counts"
        role="group"
        aria-label="Öğrenci durumuna göre filtrele"
      >
        {filters.map((f) => (
          <button
            type="button"
            key={f.value}
            aria-pressed={state === f.value}
            onClick={() => setState(f.value)}
          >
            <strong>{f.count}</strong>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      <div className="workspace-toolbar">
        <label>
          Öğrenci ara
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ad veya kullanıcı adı"
            maxLength={120}
          />
        </label>
        <label>
          Sıralama
          <select
            aria-label="Sıralama"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="name">Ada göre</option>
            <option value="activity">Son etkinlik: yeniden eskiye</option>
          </select>
        </label>
        {(query || state !== "all") && (
          <button
            className="button button-outline"
            type="button"
            onClick={() => {
              setQuery("");
              setState("all");
            }}
          >
            Filtreleri temizle
          </button>
        )}
      </div>
      <p className="form-help" role="status">
        {shown.length} / {rows.length} öğrenci gösteriliyor
      </p>
      <AssignmentExports
        assignment={a}
        shown={shown}
        allRows={reportRows(rows, a.tracking, "", "all", sort)}
        filterDescription={`${state === "all" ? "Tüm durumlar" : filters.find((f) => f.value === state)?.label}${query.trim() ? ` · Arama: ${query.trim()}` : ""} · ${sort === "name" ? "Ada göre" : "Son etkinliğe göre"}`}
      />
      {!shown.length ? (
        <div className="empty">
          <h2>
            {rows.length
              ? "Bu filtreye uygun öğrenci yok."
              : "Henüz alıcı yok."}
          </h2>
          <p>
            {rows.length
              ? "Aramayı veya durum filtresini değiştirin."
              : "Ödeve öğrenci eklediğinizde sonuçları burada görünür."}
          </p>
        </div>
      ) : (
        <>
          <div
            className="table-wrap report-desktop"
            tabIndex={0}
            role="region"
            aria-label="Öğrenci sonuçları tablosu"
          >
            <table>
              <caption>Öğrenci bazında ödev sonuçları</caption>
              <thead>
                <tr>
                  {[
                    "Öğrenci",
                    "Durum",
                    "İlerleme",
                    "Son puan",
                    "En iyi puan",
                    "Deneme",
                    "Son etkinlik",
                  ].map((h) => (
                    <th
                      scope="col"
                      key={h}
                      className={
                        [
                          "İlerleme",
                          "Son puan",
                          "En iyi puan",
                          "Deneme",
                        ].includes(h)
                          ? "report-number"
                          : undefined
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      {r.name}
                      <span className="form-help">{r.username}</span>
                    </th>
                    <td>{status(r)}</td>
                    {values(r).map(([key, value]) => (
                      <td
                        key={key}
                        className={
                          key !== "Son etkinlik" ? "report-number" : undefined
                        }
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="report-mobile learning-list">
            {shown.map((r) => (
              <li key={r.id}>
                <div className="report-student">
                  <h3>{r.name}</h3>
                  <p className="form-help">{r.username}</p>
                  <p>{status(r)}</p>
                  {a.tracking && <p>Son puan: {r.score ?? "Henüz yok"}</p>}
                  <details>
                    <summary>{r.name} — sonuç ayrıntıları</summary>
                    <dl className="workspace-facts">
                      {values(r).map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
