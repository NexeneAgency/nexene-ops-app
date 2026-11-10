"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { User } from "../../lib/types";
import { useWorkspace } from "../workspace-context";
export function UserActions({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const { data, t } = useWorkspace();
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false),
    [position, setPosition] = useState({ top: 0, left: 0 });
  const reason =
    user.id === data.user.id
      ? t("cannotDeleteSelf")
      : user.role === "admin" &&
          data.users.filter((u) => u.role === "admin").length <= 1
        ? t("keepLastAdmin")
        : "";
  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    const outside = (e: PointerEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);
  const choose = (action: (user: User) => void) => {
    setOpen(false);
    trigger.current?.focus();
    action(user);
  };
  return (
    <>
      <button
        ref={trigger}
        className="icon-button"
        aria-label={`${t("actionsFor")} ${user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `user-menu-${user.id}` : undefined}
        onClick={() => {
          const rect = trigger.current!.getBoundingClientRect();
          setPosition({
            top: Math.max(
              8,
              Math.min(rect.bottom + 6, window.innerHeight - 160),
            ),
            left: Math.max(
              8,
              Math.min(rect.right - 240, window.innerWidth - 248),
            ),
          });
          setOpen(!open);
        }}
      >
        <MoreHorizontal size={20} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={`user-menu-${user.id}`}
            className="user-actions-menu"
            role="menu"
            aria-label={`${t("actionsFor")} ${user.email}`}
            style={position}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                trigger.current?.focus();
                return;
              }
              if (e.key === "Tab") {
                setOpen(false);
                trigger.current?.focus();
                return;
              }
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const items = [
                ...menu.current!.querySelectorAll<HTMLButtonElement>(
                  '[role="menuitem"]:not(:disabled)',
                ),
              ];
              const index = items.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? items.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        items.length) %
                      items.length;
              items[next]?.focus();
            }}
          >
            <button
              role="menuitem"
              tabIndex={-1}
              onClick={() => choose(onEdit)}
            >
              <Pencil size={16} />
              <span>{t("edit")}</span>
            </button>
            <button
              role="menuitem"
              tabIndex={-1}
              className="danger"
              disabled={!!reason}
              title={reason || undefined}
              onClick={() => choose(onDelete)}
            >
              <Trash2 size={16} />
              <span>
                {t("delete")}
                {reason && <small>{reason}</small>}
              </span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
