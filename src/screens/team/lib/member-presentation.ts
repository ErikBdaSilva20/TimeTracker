import type { MemberRow } from "@/lib/data";

export type MemberStatus = "online" | "offline" | "ausente";

export const MEMBER_STATUS_STYLE: Record<
  MemberStatus,
  { dot: string; label: string; tone: "primary" | "muted" | "secondary" }
> = {
  online: { dot: "bg-primary", label: "Online", tone: "primary" },
  ausente: { dot: "bg-amber-400", label: "Ausente", tone: "secondary" },
  offline: { dot: "bg-slate-500", label: "Offline", tone: "muted" },
};

function statusOf(member: MemberRow, todayMinutes: number): MemberStatus {
  if (!member.active) return "offline";
  if (todayMinutes > 0) return "online";
  return "ausente";
}

/** Status + its display style in one call — every card/row/panel needs both together. */
export function memberStatusStyle(member: MemberRow, todayMinutes: number) {
  const status = statusOf(member, todayMinutes);
  return { status, ...MEMBER_STATUS_STYLE[status] };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
