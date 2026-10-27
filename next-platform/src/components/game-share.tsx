"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Share2, X } from "lucide-react";

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const manualLink = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [nativeShare, setNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      if (!trigger.current || !panel.current) return;
      const bounds = trigger.current.getBoundingClientRect();
      const width = panel.current.offsetWidth;
      const height = panel.current.offsetHeight;
      panel.current.style.left = `${Math.max(16, Math.min(bounds.right - width, innerWidth - width - 16))}px`;
      panel.current.style.top = `${Math.max(16, Math.min(bounds.bottom + 8, innerHeight - height - 16))}px`;
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(panel.current!);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>(".share-option")?.focus();
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (fallback) manualLink.current?.focus();
  }, [fallback]);

  async function copy() {
    if (busy) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFallback(false);
      setNotice("Oyun bağlantısı panoya kopyalandı.");
    } catch {
      setFallback(true);
      setNotice(
        "Otomatik kopyalanamadı. Aşağıdaki bağlantıyı seçip kopyalayabilirsin.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function shareWithDevice() {
    if (busy) return;
    setBusy(true);
    try {
      await navigator.share({ title, text: title, url });
      close();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setNotice(
          "Cihazın paylaşım seçenekleri açılamadı. Diğer seçeneklerden birini kullanabilirsin.",
        );
    } finally {
      setBusy(false);
    }
  }

  const message = `${title} · Dijital Oyun Atölyesi\n${url}`;
  return (
    <div
      className="share-control"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="button button-outline"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (open) return setOpen(false);
          setUrl(
            `${window.location.origin}/icerik/${encodeURIComponent(slug)}`,
          );
          setNativeShare(
            window.isSecureContext && typeof navigator.share === "function",
          );
          setCopied(false);
          setFallback(false);
          setNotice("");
          setOpen(true);
        }}
      >
        <Share2 size={18} aria-hidden="true" />
        <span className="button-label">Paylaş</span>
      </button>
      {open && (
        <div
          ref={panel}
          id={id}
          className="share-panel"
          role="region"
          aria-label="Paylaşım seçenekleri"
        >
          <div className="share-panel-heading">
            <h2>Oyunu paylaş</h2>
            <button
              type="button"
              className="share-close"
              aria-label="Paylaşımı kapat"
              onClick={close}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="share-option"
            onClick={copy}
            aria-disabled={busy}
          >
            {copied ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            {copied ? "Bağlantı kopyalandı" : "Bağlantıyı kopyala"}
          </button>
          <a
            className="share-option"
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp’ta paylaş
          </a>
          <a
            className="share-option"
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
          >
            <Mail size={18} aria-hidden="true" />
            E-postayla paylaş
          </a>
          {nativeShare && (
            <button
              type="button"
              className="share-option"
              onClick={shareWithDevice}
              aria-disabled={busy}
            >
              <Share2 size={18} aria-hidden="true" />
              Diğer uygulamalar
            </button>
          )}
          <p className="share-notice" role="status">
            {notice}
          </p>
          {fallback && (
            <label className="share-fallback">
              Paylaşım bağlantısı
              <input
                ref={manualLink}
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
