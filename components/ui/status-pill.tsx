import { cn } from "@/lib/utils";

export type PillStatus = "accept" | "reject" | "low_confidence" | "unassisted" | "healthy" | "warning" | "critical" | "neutral" | "active" | "offline" | "degraded";

const PALETTE: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  accept: { bg: "#10B981", fg: "#FFFFFF", dot: "#10B981", label: "Accept" },
  reject: { bg: "#EF4444", fg: "#FFFFFF", dot: "#EF4444", label: "Reject" },
  low_confidence: { bg: "#F59E0B", fg: "#FFFFFF", dot: "#F59E0B", label: "Low-conf" },
  unassisted: { bg: "#A1A1AA", fg: "#FFFFFF", dot: "#A1A1AA", label: "Unassisted" },
  healthy: { bg: "#10B981", fg: "#FFFFFF", dot: "#10B981", label: "Healthy" },
  warning: { bg: "#F59E0B", fg: "#FFFFFF", dot: "#F59E0B", label: "Warning" },
  critical: { bg: "#EF4444", fg: "#FFFFFF", dot: "#EF4444", label: "Critical" },
  neutral: { bg: "#A1A1AA", fg: "#FFFFFF", dot: "#A1A1AA", label: "Neutral" },
  active: { bg: "#10B981", fg: "#FFFFFF", dot: "#10B981", label: "Active" },
  offline: { bg: "#A1A1AA", fg: "#FFFFFF", dot: "#A1A1AA", label: "Offline" },
  degraded: { bg: "#F59E0B", fg: "#FFFFFF", dot: "#F59E0B", label: "Degraded" },
};

interface StatusPillProps {
  status: PillStatus;
  variant?: "filled" | "outlined";
  label?: string;
  className?: string;
}

export function StatusPill({ status, variant = "outlined", label, className }: StatusPillProps) {
  const p = PALETTE[status];
  const text = label ?? p.label;
  if (variant === "filled") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 px-2 py-0.5 mono uppercase", className)}
        style={{ background: p.bg, color: p.fg, borderRadius: 6, fontSize: 10, letterSpacing: "0.04em", lineHeight: "14px", fontWeight: 600 }}
      >
        {text}
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2 py-0.5 mono uppercase", className)}
      style={{
        background: `${p.dot}14`,
        color: p.dot,
        border: `1px solid ${p.dot}40`,
        borderRadius: 6,
        fontSize: 10,
        letterSpacing: "0.04em",
        lineHeight: "14px",
        fontWeight: 600,
      }}
    >
      <span style={{ width: 5, height: 5, background: p.dot, borderRadius: 999 }} aria-hidden />
      {text}
    </span>
  );
}
