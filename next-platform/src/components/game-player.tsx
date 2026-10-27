"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  TriangleAlert,
  Info,
  Expand,
  LoaderCircle,
  Minimize,
  Play,
  RectangleHorizontal,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useTrackingBridge,
  type LearningSession,
  type SaveNotice,
} from "./tracking-bridge";
import type { CatalogGame } from "@/lib/catalog-model";

const GameSessionContext = createContext<{
  started: boolean;
  ready: boolean;
  start: () => void;
  stage: RefObject<HTMLDivElement | null>;
} | null>(null);

function revealPlayer(stage: HTMLDivElement | null) {
  if (!stage || document.fullscreenElement) return;
  const bounds = stage.getBoundingClientRect();
  if (bounds.top < 16 || bounds.bottom > window.innerHeight - 16)
    window.scrollTo({
      top: window.scrollY + bounds.top - 16,
      // Keep the iframe still as soon as it can receive pointer input.
      behavior: "instant",
    });
}

export function GameSession({
  children,
  playHref,
}: {
  children: ReactNode;
  playHref?: string;
}) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => setReady(true), []);
  const start = useCallback(() => {
    if (playHref) {
      window.location.assign(playHref);
      return;
    }
    setStarted(true);
    revealPlayer(stage.current);
  }, [playHref]);
  return (
    <GameSessionContext.Provider value={{ started, ready, start, stage }}>
      {children}
    </GameSessionContext.Provider>
  );
}

function useGameSession() {
  const session = useContext(GameSessionContext);
  if (!session) throw new Error("Game controls require a GameSession.");
  return session;
}

export function GameActions({ children }: { children: ReactNode }) {
  const { ready } = useGameSession();
  return (
    <fieldset
      className="detail-action-buttons"
      aria-label="Oyun işlemleri"
      disabled={!ready}
    >
      {children}
    </fieldset>
  );
}

export function StartGameButton({ disabled }: { disabled: boolean }) {
  const { started, ready, start, stage } = useGameSession();
  if (!started) return null;
  return (
    <button
      type="button"
      className="button button-ghost detail-play"
      disabled={disabled || !ready}
      onClick={() => {
        start();
        stage.current?.focus({ preventScroll: true });
      }}
    >
      <Play size={16} fill="currentColor" aria-hidden="true" />
      Oyuna dön
    </button>
  );
}

export function GamePlayer(props: Parameters<typeof GamePlayerSurface>[0]) {
  const session = useContext(GameSessionContext);
  if (session) return <GamePlayerSurface {...props} />;
  return (
    <GameSession key={props.game.slug}>
      <GamePlayerSurface {...props} />
    </GameSession>
  );
}

function GamePlayerSurface({
  game,
  autostart = false,
  learningSession,
  onRestart,
}: {
  game: CatalogGame;
  autostart?: boolean;
  learningSession?: LearningSession;
  onRestart?: () => void;
}) {
  const { started, ready, start, stage } = useGameSession();
  const [revision, setRevision] = useState(0),
    [loaded, setLoaded] = useState(false),
    [help, setHelp] = useState(false),
    [full, setFull] = useState(false),
    [theater, setTheater] = useState(false),
    [notice, setNotice] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const theaterControl = useRef<HTMLButtonElement>(null);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const reloadNeeded = useTrackingBridge(frame, learningSession, setSaveNotice);
  useEffect(() => {
    if (autostart) start();
  }, [autostart, start]);
  useEffect(() => {
    const fn = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);
  useEffect(() => {
    if (!started && !theater) return;
    let animation = requestAnimationFrame(() => revealPlayer(stage.current));
    const resize = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(() => revealPlayer(stage.current));
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, [started, theater, full, stage]);
  useEffect(() => {
    if (!theater) return;
    const exit = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement)
        setTheater(false);
    };
    // Demo documents have an opaque sandbox origin; verify their window instead.
    const receive = (event: MessageEvent) => {
      if (
        game.kind === "demo" &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "atlas:exit-theater" &&
        !document.fullscreenElement
      )
        setTheater(false);
    };
    window.addEventListener("keydown", exit);
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("keydown", exit);
      window.removeEventListener("message", receive);
    };
  }, [theater, game.kind]);
  useEffect(() => {
    if (!started || loaded) return;
    const timeout = setTimeout(() => setHelp(true), 12000);
    return () => clearTimeout(timeout);
  }, [started, loaded, revision]);
  function restart() {
    start();
    setLoaded(false);
    setHelp(false);
    setRevision((n) => n + 1);
  }
  async function fullscreen() {
    setNotice("");
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFull(false);
      } else if (stage.current?.requestFullscreen) {
        await stage.current.requestFullscreen();
        setFull(document.fullscreenElement === stage.current);
      } else
        setNotice(
          "Bu tarayıcı tam ekranı desteklemiyor. Oyunu mevcut alanda oynayabilirsin.",
        );
    } catch {
      setNotice(
        "Tam ekran açılamadı. Oyunu mevcut alanda oynamaya devam edebilirsin.",
      );
    }
  }
  const src = game.gameUrl
    ? `${game.gameUrl}${game.kind === "demo" ? "?autostart=1" : ""}`
    : undefined;
  return (
    <div
      className="player-wrap"
      data-theater={theater}
      data-started={started}
      ref={stage}
      tabIndex={-1}
      role="region"
      aria-label={`${game.title} oyun alanı`}
    >
      {theater &&
        !full &&
        createPortal(
          <button
            type="button"
            className="player-backdrop"
            aria-label="Sinema modunu kapat"
            tabIndex={-1}
            onClick={() => {
              setTheater(false);
              theaterControl.current?.focus({ preventScroll: true });
            }}
          />,
          document.body,
        )}
      <div className="player-toolbar">
        <span>
          <i />
          {started ? "Keşif başladı" : "Birlikte keşfetmeye hazır"}
        </span>
        <div>
          <button
            type="button"
            onClick={onRestart ?? restart}
            disabled={!ready || !src}
            aria-label="Oyunu yeniden başlat"
            title="Yeniden başlat"
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span className="player-tool-label">Yeniden başlat</span>
          </button>
          <button
            type="button"
            ref={theaterControl}
            className="player-theater-toggle"
            onClick={() => setTheater((value) => !value)}
            aria-label={theater ? "Sinema modundan çıkış" : "Sinema modu"}
            aria-pressed={theater}
            title={theater ? "Sinema modundan çıkış (Esc)" : "Sinema modu"}
            disabled={!ready || full}
          >
            {theater ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <RectangleHorizontal size={20} aria-hidden="true" />
            )}
            <span className="player-tool-label">
              {theater ? "Çıkış" : "Sinema"}
            </span>
          </button>
          <button
            type="button"
            onClick={fullscreen}
            disabled={!ready}
            aria-label={full ? "Tam ekrandan çık" : "Tam ekran"}
            title={full ? "Tam ekrandan çık" : "Tam ekran"}
          >
            {full ? (
              <Minimize size={18} aria-hidden="true" />
            ) : (
              <Expand size={18} aria-hidden="true" />
            )}
            <span className="player-tool-label">
              {full ? "Küçült" : "Tam ekran"}
            </span>
          </button>
        </div>
      </div>
      <div className={`player-stage ${started ? "is-playing" : ""}`}>
        {started && src ? (
          <>
            <iframe
              ref={frame}
              key={revision}
              src={src}
              title={game.title}
              className="game-frame"
              sandbox={
                game.kind === "demo"
                  ? "allow-scripts"
                  : "allow-scripts allow-same-origin"
              }
              referrerPolicy="no-referrer"
              allow="fullscreen"
              onLoad={() => {
                setLoaded(true);
                setHelp(false);
                revealPlayer(stage.current);
              }}
              onError={() => {
                setLoaded(true);
                setHelp(true);
              }}
            />
            {!loaded && (
              <div className="player-loading" role="status">
                <LoaderCircle size={24} className="spinner" />
                Oyun hazırlanıyor…
              </div>
            )}
          </>
        ) : (
          <div className="player-preview">
            {game.cover && (
              <img
                src={game.cover}
                alt={`${game.title} etkinliğinden görünüm`}
                width={720}
                height={440}
              />
            )}
            <div className="player-start">
              <h2>{game.title}</h2>
              <p>
                {game.minutes
                  ? `${game.minutes} dakikalık bir keşif`
                  : "Kendi hızında keşfet"}
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={start}
                disabled={!ready || !src}
              >
                <Play size={19} fill="currentColor" />
                {src ? "Oyuna başla" : "Oyun şu an açılamıyor"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="player-bottom">
        <span>
          {game.kind === "demo" ? "Demo etkinlik" : "Öğretmen paylaşımı"}
        </span>
        <span>Kendi hızında oyna. Yeniden denemek serbest.</span>
      </div>
      {learningSession && (
        <p
          role="status"
          className="player-save-status"
          data-state={
            learningSession.tracking
              ? (saveNotice?.kind ??
                (learningSession.completed ? "saved" : "pending"))
              : "ready"
          }
        >
          {learningSession.tracking && saveNotice?.kind === "error" ? (
            <TriangleAlert size={16} aria-hidden="true" />
          ) : learningSession.tracking &&
            (saveNotice?.kind === "pending" ||
              (!saveNotice && !learningSession.completed)) ? (
            <LoaderCircle size={16} className="spinner" aria-hidden="true" />
          ) : learningSession.tracking &&
            (saveNotice?.kind === "saved" ||
              (!saveNotice && learningSession.completed)) ? (
            <CheckCircle2 size={16} aria-hidden="true" />
          ) : (
            <Info size={16} aria-hidden="true" />
          )}
          <span>
            {learningSession.tracking
              ? saveNotice?.message ||
                (learningSession.completed
                  ? "Bu deneme tamamlandı. Yeniden oynamak için baştan başla."
                  : "Oyun kayıt bağlantısı kuruluyor…")
              : "Bu oyun kayıt ve sonuç takibini desteklemiyor. Yalnızca açılma bilgisi kaydedildi."}
          </span>
        </p>
      )}
      {reloadNeeded && (
        <button
          type="button"
          className="button button-outline player-reload-save"
          onClick={() => window.location.reload()}
        >
          Güncel kaydı yükle
        </button>
      )}
      {help && (
        <details className="player-help">
          <summary>Oyun açılmadı mı?</summary>
          <p>Bağlantını kontrol edip yeniden deneyebilirsin.</p>
          <button className="button button-outline" onClick={restart}>
            Yeniden yükle
          </button>
        </details>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
