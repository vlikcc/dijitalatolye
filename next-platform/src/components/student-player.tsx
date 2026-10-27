"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeading } from "./page-heading";
import { GamePlayer, GameSession } from "./game-player";
import { type LearningSession } from "./tracking-bridge";
import { learningRequest } from "./learning-forms";
export function StudentPlayer({
  contentId,
  assignmentId,
}: {
  contentId: string;
  assignmentId?: string;
}) {
  const [session, setSession] = useState<LearningSession>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const initial = useRef<string | undefined>(undefined);
  const opening = useRef(false);
  const open = useCallback(
    async (restart = false) => {
      if (opening.current) return;
      if (
        restart &&
        !window.confirm(
          "Yeni bir deneme başlayacak. Önceki sonuçların korunacak. Baştan başlansın mı?",
        )
      )
        return;
      opening.current = true;
      setBusy(true);
      setError("");
      if (!initial.current || restart) initial.current = crypto.randomUUID();
      try {
        const result = await learningRequest("/api/learning/play", {
          contentId,
          assignmentId,
          restart,
          requestId: initial.current,
        });
        setSession(result);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        opening.current = false;
        setBusy(false);
      }
    },
    [contentId, assignmentId],
  );
  useEffect(() => {
    void open();
  }, [open]);
  return (
    <article className="game-detail student-game">
      <PageHeading
        game
        title={session?.title ?? "Oyun hazırlanıyor"}
        back={{
          href: assignmentId ? "/ogrenci" : "/ogrenci?bolum=oyunlar",
          label: assignmentId ? "Ödevlere dön" : "Oyunlarıma dön",
        }}
        description={
          assignmentId
            ? "Bu deneme ödevine kaydedilir."
            : "Serbest oyunun yalnızca senin hesabına kaydedilir."
        }
        badge={
          <span className="badge">
            {assignmentId ? "Ödev" : "Serbest oyun"}
          </span>
        }
      />
      {error && (
        <div role="alert" className="notice error">
          <p>{error}</p>
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() => {
              initial.current = undefined;
              void open();
            }}
          >
            Güncel kaydı yeniden yükle
          </button>
        </div>
      )}
      {session && (
        <GameSession key={session.sessionId}>
          <div className="detail-layout">
            <GamePlayer
              autostart
              learningSession={session}
              onRestart={() => void open(true)}
              game={{
                id: contentId,
                slug: contentId,
                title: session.title,
                description: "",
                subject: "",
                subjectKey: "other",
                grade: 0,
                kind: "published",
                author: "",
                objectives: [],
                teacherNotes: [],
                gameUrl: session.gameUrl,
              }}
            />
          </div>
        </GameSession>
      )}
      {busy && <p role="status">Oyun kaydı getiriliyor…</p>}
    </article>
  );
}
