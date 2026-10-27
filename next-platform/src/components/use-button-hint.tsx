"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** A supplementary hint; the button keeps its own accessible name. */
export function useButtonHint(label: string, enabled = true) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, ready: false });
  const visible = open && enabled;
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
  }
  function close() {
    cancel();
    setOpen(false);
  }
  function leave() {
    cancel();
    timer.current = setTimeout(() => setOpen(false), 120);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!visible) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [visible]);
  useLayoutEffect(() => {
    if (!visible) return;
    function place() {
      if (!ref.current || !bubble.current) return;
      const trigger = ref.current.getBoundingClientRect();
      const hint = bubble.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const x = viewport?.offsetLeft ?? 0;
      const y = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? innerWidth;
      const height = viewport?.height ?? innerHeight;
      setPosition({
        left: Math.max(
          x + 12,
          Math.min(trigger.right - hint.width, x + width - hint.width - 12),
        ),
        top: Math.max(
          y + 12,
          Math.min(
            trigger.top - hint.height - 8 >= y + 12
              ? trigger.top - hint.height - 8
              : trigger.bottom + 8,
            y + height - hint.height - 12,
          ),
        ),
        ready: true,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [visible, label]);
  return {
    ref,
    props: {
      "aria-describedby": visible ? id : undefined,
      onFocus: () => {
        cancel();
        setOpen(true);
      },
      onBlur: close,
      onPointerDown: close,
      onPointerEnter: (event: React.PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        cancel();
        timer.current = setTimeout(() => setOpen(true), 300);
      },
      onPointerLeave: leave,
    },
    hint:
      visible && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={bubble}
              id={id}
              role="tooltip"
              className="button-hint"
              style={{
                left: position.left,
                top: position.top,
                visibility: position.ready ? "visible" : "hidden",
              }}
              onPointerEnter={cancel}
              onPointerLeave={leave}
            >
              {label}
            </span>,
            document.body,
          )
        : null,
  };
}
