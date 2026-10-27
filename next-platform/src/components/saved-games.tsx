"use client";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Bookmark, Check } from "lucide-react";
import {
  parseSavedGames,
  savedGamesSnapshot,
  subscribeSavedGames,
  updateSavedGame,
} from "@/lib/saved-games-store";
import { SavedGameFeedbackContext } from "./saved-game-feedback";
import { useButtonHint } from "./use-button-hint";
const subscribeReady = () => () => {};
export function useSavedGames() {
  const raw = useSyncExternalStore(
    subscribeSavedGames,
    savedGamesSnapshot,
    () => "[]",
  );
  const ready = useSyncExternalStore(
    subscribeReady,
    () => true,
    () => false,
  );
  const saved = useMemo(() => parseSavedGames(raw), [raw]);
  return { saved, ready };
}
export function SaveButton({
  slug,
  title,
  compact = false,
}: {
  slug: string;
  title: string;
  compact?: boolean;
}) {
  const { saved } = useSavedGames();
  const report = useContext(SavedGameFeedbackContext);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<{
    label: string;
    id: number;
  } | null>(null);
  const feedbackId = useRef(0);
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);
  const active = saved.has(slug);
  const hint = useButtonHint(
    active ? "Kaydı kaldır" : "Bu tarayıcıda kaydet",
    compact && !feedback && !error,
  );
  return (
    <span className={compact ? "save-wrap compact" : "save-wrap"}>
      <button
        ref={hint.ref}
        {...hint.props}
        type="button"
        data-save-slug={slug}
        className={compact ? "save-button" : "button button-outline"}
        aria-label={`${title}: ${active ? "kaydı kaldır" : "kaydet"}`}
        aria-pressed={active}
        onClick={(event) => {
          const result = updateSavedGame(slug, "toggle");
          setError(!result.ok);
          if (result.ok)
            report?.({ slug, title, saved: result.saved }, event.currentTarget);
          setFeedback(
            result.ok
              ? {
                  label: result.saved ? "Kaydedildi" : "Kayıt kaldırıldı",
                  id: ++feedbackId.current,
                }
              : null,
          );
        }}
      >
        <span
          key={feedback?.id ?? "idle"}
          className={`save-icon${feedback ? " save-icon-feedback" : ""}`}
          aria-hidden="true"
        >
          {active && !compact ? (
            <Check size={18} />
          ) : (
            <Bookmark
              size={compact ? 18 : 19}
              fill={active ? "currentColor" : "none"}
            />
          )}
        </span>
        {!compact && (
          <span className="button-label">
            {active ? "Kaydedildi" : "Kaydet"}
          </span>
        )}
      </button>
      {hint.hint}
      {compact && feedback && (
        <span key={feedback.id} className="save-feedback" aria-hidden="true">
          {feedback.label}
        </span>
      )}
      <span className="sr-only" role="status" aria-atomic="true">
        {feedback && !(report && feedback.label === "Kayıt kaldırıldı")
          ? `${title}: ${feedback.label}`
          : ""}
      </span>
      {error && (
        <span className="save-error" role="status">
          Tarayıcı kaydetmeye izin vermiyor.
        </span>
      )}
    </span>
  );
}
