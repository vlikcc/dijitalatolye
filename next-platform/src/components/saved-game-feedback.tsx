"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { updateSavedGame } from "@/lib/saved-games-store";

type RemovedGame = { slug: string; title: string };
export const SavedGameFeedbackContext = createContext<
  | ((
      game: RemovedGame & { saved: boolean },
      trigger: HTMLButtonElement,
    ) => void)
  | null
>(null);

export function SavedGameFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [removed, setRemoved] = useState<RemovedGame | null>(null);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const notice = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!removed) return;
    const viewport = window.visualViewport;
    function position() {
      setKeyboardOffset(
        viewport
          ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop)
          : 0,
      );
    }
    position();
    viewport?.addEventListener("resize", position);
    viewport?.addEventListener("scroll", position);
    return () => {
      viewport?.removeEventListener("resize", position);
      viewport?.removeEventListener("scroll", position);
    };
  }, [removed]);
  function dismiss() {
    const focused = notice.current?.contains(document.activeElement);
    setRemoved(null);
    if (focused) {
      const target = origin.current?.isConnected
        ? origin.current
        : document.querySelector<HTMLElement>(
            ".catalog-results h2, .game-detail h1",
          );
      if (target) {
        if (target.matches("h1, h2")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }
  }
  function report(
    game: RemovedGame & { saved: boolean },
    trigger: HTMLButtonElement,
  ) {
    if (game.saved) {
      if (removed?.slug === game.slug) {
        setRestored(true);
        setError(false);
      }
      return;
    }
    origin.current = trigger;
    setRemoved(game);
    setRestored(false);
    setError(false);
    const button = origin.current;
    requestAnimationFrame(() => {
      if (button && !button.isConnected)
        document
          .getElementById("saved-game-undo")
          ?.focus({ preventScroll: true });
    });
  }
  function undo() {
    if (!removed) return;
    const result = updateSavedGame(removed.slug, true);
    setError(!result.ok);
    if (!result.ok) return;
    setRestored(true);
    requestAnimationFrame(() => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>("[data-save-slug]"),
      ).find((item) => item.dataset.saveSlug === removed.slug);
      if (button) {
        origin.current = button;
        button.focus({ preventScroll: true });
      } else
        notice.current
          ?.querySelector<HTMLButtonElement>(".saved-notice-close")
          ?.focus({ preventScroll: true });
    });
  }
  return (
    <SavedGameFeedbackContext.Provider value={report}>
      {children}
      {removed && (
        <div
          ref={notice}
          className="saved-notice"
          style={{
            bottom: `calc(${keyboardOffset}px + max(16px, env(safe-area-inset-bottom)))`,
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              dismiss();
            }
          }}
        >
          {restored ? (
            <Check size={19} aria-hidden="true" />
          ) : (
            <RotateCcw size={19} aria-hidden="true" />
          )}
          <p role="status" aria-atomic="true">
            {error
              ? "Kayıt geri alınamadı. Tarayıcı kaydetmeye izin vermiyor."
              : `${removed.title}${restored ? " yeniden kaydedildi." : " kayıtlardan kaldırıldı."}`}
          </p>
          {!restored && (
            <button
              id="saved-game-undo"
              type="button"
              className="saved-notice-undo"
              onClick={undo}
            >
              Geri al
            </button>
          )}
          <button
            type="button"
            className="saved-notice-close"
            aria-label="Bildirimi kapat"
            onClick={dismiss}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </SavedGameFeedbackContext.Provider>
  );
}
