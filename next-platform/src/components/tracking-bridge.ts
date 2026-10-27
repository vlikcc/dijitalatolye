"use client";
import { useEffect, useState, type RefObject } from "react";
export type LearningSession = {
  sessionId: string;
  gameUrl: string;
  title: string;
  tracking: boolean;
  state: unknown;
  revision: number;
  progress: number | null;
  score: number | null;
  completed: boolean;
};
export type SaveNotice = {
  kind: "pending" | "ready" | "saved" | "error";
  message: string;
};
const marker = "dijitalatolye:v1";
export function useTrackingBridge(
  frame: RefObject<HTMLIFrameElement | null>,
  session: LearningSession | undefined,
  status: (notice: SaveNotice) => void,
) {
  const [reloadNeeded, setReloadNeeded] = useState(false);
  useEffect(() => {
    setReloadNeeded(false);
    if (!session?.tracking) return;
    let live = true,
      nonce = "",
      revision = session.revision,
      state = session.state,
      completed = session.completed,
      progress = session.progress,
      score = session.score;
    const controller = new AbortController();
    const pending = new Set<string>();
    const handshakeTimer = setTimeout(() => {
      if (!nonce && live) {
        status({
          kind: "error",
          message:
            "Oyun kayıt sistemine bağlanamadı. İlerlemen kaydedilmiyor; yeniden yüklemeyi dene.",
        });
        setReloadNeeded(true);
      }
    }, 10000);
    const expected = new URL(session.gameUrl).origin;
    const reply = (data: Record<string, unknown>) => {
      if (live)
        frame.current?.contentWindow?.postMessage(
          { app: marker, nonce, sessionId: session.sessionId, ...data },
          expected,
        );
    };
    const receive = async (event: MessageEvent) => {
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== expected ||
        event.data?.app !== marker
      )
        return;
      const m = event.data;
      if (
        m.type === "ready" &&
        typeof m.nonce === "string" &&
        m.nonce.length <= 100
      ) {
        clearTimeout(handshakeTimer);
        if (!nonce)
          status({
            kind: "ready",
            message:
              "Kayıt bağlantısı hazır. Kaldığın yerden devam edebilirsin.",
          });
        nonce = m.nonce;
        reply({
          type: "init",
          state,
          revision,
          completed,
          progress,
          score,
          persistent: true,
        });
        return;
      }
      if (m.nonce !== nonce || m.sessionId !== session.sessionId || !nonce)
        return;
      if (typeof m.requestId !== "string" || m.requestId.length > 100) return;
      if (m.type === "pending") {
        pending.add(m.requestId);
        status({ kind: "pending", message: "Kaydediliyor…" });
        return;
      }
      if (m.type !== "save") return;
      pending.add(m.requestId);
      // Keep the request identity and revision unchanged through retries after a lost response.
      const body = JSON.stringify({
        requestId: m.requestId,
        revision: m.revision,
        state: m.state,
        progress: m.progress,
        score: m.score,
        complete: m.complete,
      });
      status({ kind: "pending", message: "Kaydediliyor…" });
      while (live) {
        try {
          const r = await fetch(`/api/learning/play/${session.sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal,
          });
          const result = await r.json();
          if (!r.ok) {
            if (r.status >= 500 || r.status === 429) throw Error(result.error);
            setReloadNeeded(true);
            status({
              kind: "error",
              message:
                result.error || "Kaydedilemedi. Güncel kaydı yeniden yükle.",
            });
            reply({
              type: "ack",
              requestId: m.requestId,
              error: result.error || "Kaydedilemedi.",
              status: r.status,
            });
            return;
          }
          revision = result.revision;
          state = m.state;
          completed = !!m.complete;
          progress = m.complete ? 100 : (m.progress ?? progress);
          score = m.score ?? score;
          pending.delete(m.requestId);
          status({
            kind: pending.size ? "pending" : "saved",
            message: pending.size
              ? "Kaydediliyor…"
              : m.complete
                ? "Tamamlandı ve kaydedildi."
                : "Kaydedildi.",
          });
          reply({ type: "ack", requestId: m.requestId, revision });
          return;
        } catch {
          if (!live) return;
          status({
            kind: "error",
            message:
              "Kaydedilemedi. Bağlantı geldiğinde yeniden denenecek; sayfayı açık tut.",
          });
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 2500);
            controller.signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timer);
                resolve();
              },
              { once: true },
            );
          });
        }
      }
    };
    window.addEventListener("message", receive);
    return () => {
      live = false;
      clearTimeout(handshakeTimer);
      controller.abort();
      window.removeEventListener("message", receive);
    };
  }, [frame, session, status]);
  return reloadNeeded;
}
