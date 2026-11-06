import { FolderKanban } from "lucide-react";
import type { ReactNode } from "react";
export function Avatar({
  name = "",
  color,
  size = "",
}: {
  name?: string;
  color?: string;
  size?: string;
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={color ? { background: color } : undefined}
    >
      {(name.length <= 2
        ? name
        : name
            .split(/\s+/)
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
      ).toUpperCase()}
    </span>
  );
}
export function Badge({
  children,
  status,
}: {
  children: ReactNode;
  status?: string;
}) {
  return (
    <span className={`badge ${status || ""}`}>
      <i />
      {children}
    </span>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <FolderKanban size={28} />
      <p>{children}</p>
    </div>
  );
}
