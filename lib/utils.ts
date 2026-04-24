import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatRelative(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const s = Math.round(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDelta(delta: number): {
  arrow: "↑" | "↓" | "→";
  color: "green" | "red" | "gray";
  label: string;
} {
  if (Math.abs(delta) < 0.005) return { arrow: "→", color: "gray", label: "flat" };
  const abs = Math.abs(delta);
  if (delta > 0) return { arrow: "↑", color: "green", label: `${(abs * 100).toFixed(1)}%` };
  return { arrow: "↓", color: "red", label: `${(abs * 100).toFixed(1)}%` };
}

// For reject-rate deltas — UP is bad
export function formatDeltaRejectRate(delta: number): {
  arrow: "↑" | "↓" | "→";
  color: "green" | "red" | "gray";
  label: string;
} {
  if (Math.abs(delta) < 0.005) return { arrow: "→", color: "gray", label: "flat" };
  const abs = Math.abs(delta);
  if (delta > 0) return { arrow: "↑", color: "red", label: `${(abs * 100).toFixed(1)} pts` };
  return { arrow: "↓", color: "green", label: `${(abs * 100).toFixed(1)} pts` };
}
