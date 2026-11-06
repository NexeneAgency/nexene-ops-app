"use client";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Native modal semantics: background inertness, tab containment and Escape. */
export function Dialog({
  children,
  className,
  labelledBy,
  onClose,
  busy = false,
}: {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const items = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"],[contenteditable="true"]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (!first) {
          event.preventDefault();
          event.currentTarget.focus();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) closeRef.current();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          closeRef.current();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
