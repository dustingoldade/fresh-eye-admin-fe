import {
  NOW,
  pallets,
  skus,
  devices,
  frames,
  voiceEvents,
  serviceHealth,
  skuById,
} from "./data";
import { ComparisonWindow, Pallet, Verdict } from "./types";

const DAY = 86_400_000;

export function startOfDay(d: Date = NOW): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function hourBucket(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

export type Range = { from: Date; to: Date; label: string };

export function todayRange(): Range {
  return { from: startOfDay(), to: NOW, label: "Today" };
}

export function rangeForWindow(w: ComparisonWindow): Range {
  const todayStart = startOfDay();
  switch (w) {
    case "yesterday": {
      const from = new Date(todayStart.getTime() - DAY);
      const to = new Date(todayStart.getTime());
      return { from, to, label: "Yesterday" };
    }
    case "last_week": {
      const from = new Date(todayStart.getTime() - 7 * DAY);
      const to = new Date(from.getTime() + (NOW.getTime() - todayStart.getTime()));
      return { from, to, label: "Same hours 7d ago" };
    }
    case "last_month": {
      const from = new Date(todayStart.getTime() - 30 * DAY);
      const to = new Date(from.getTime() + (NOW.getTime() - todayStart.getTime()));
      return { from, to, label: "Same hours 30d ago" };
    }
    case "7d_avg": {
      const from = new Date(todayStart.getTime() - 7 * DAY);
      const to = todayStart;
      return { from, to, label: "7d rolling avg" };
    }
    case "30d_avg": {
      const from = new Date(todayStart.getTime() - 30 * DAY);
      const to = todayStart;
      return { from, to, label: "30d rolling avg" };
    }
  }
}

export function palletsInRange(range: Range, skuId?: string): Pallet[] {
  return pallets.filter((p) => {
    const t = new Date(p.startedAt).getTime();
    if (t < range.from.getTime() || t > range.to.getTime()) return false;
    if (skuId && p.skuId !== skuId) return false;
    return true;
  });
}

export function rejectRate(items: Pallet[]): number {
  if (items.length === 0) return 0;
  return items.filter((p) => p.finalVerdict === "reject").length / items.length;
}

// For 7d / 30d avg windows, normalize by days so the "comparable" unit is daily avg
export function rejectRateForWindow(w: ComparisonWindow, skuId?: string): number {
  const r = rangeForWindow(w);
  const items = palletsInRange(r, skuId);
  return rejectRate(items);
}

export function palletsCountForWindow(w: ComparisonWindow, skuId?: string): number {
  const r = rangeForWindow(w);
  const items = palletsInRange(r, skuId);
  // For averages, divide by days to get daily comparable
  if (w === "7d_avg") return Math.round(items.length / 7);
  if (w === "30d_avg") return Math.round(items.length / 30);
  return items.length;
}

// Hourly bucket time series between two times
export function hourlySeries(
  from: Date,
  to: Date,
  skuId?: string,
): Array<{ hour: string; total: number; rejects: number; accepts: number; lowConf: number; disagreeMR: number; disagreeRA: number; }> {
  const buckets = new Map<number, { total: number; rejects: number; accepts: number; lowConf: number; disagreeMR: number; disagreeRA: number; }>();
  const startH = new Date(from);
  startH.setMinutes(0, 0, 0);
  for (let t = startH.getTime(); t <= to.getTime(); t += 3_600_000) {
    buckets.set(t, { total: 0, rejects: 0, accepts: 0, lowConf: 0, disagreeMR: 0, disagreeRA: 0 });
  }
  for (const p of pallets) {
    if (skuId && p.skuId !== skuId) continue;
    const t = new Date(p.startedAt).getTime();
    if (t < startH.getTime() || t > to.getTime()) continue;
    const h = new Date(t);
    h.setMinutes(0, 0, 0);
    const b = buckets.get(h.getTime());
    if (!b) continue;
    b.total++;
    if (p.finalVerdict === "reject") b.rejects++;
    if (p.finalVerdict === "accept") b.accepts++;
    if (p.finalVerdict === "low_confidence") b.lowConf++;
    if (p.hasDisagreement) {
      // disagree types
      if (p.modelVerdict === "reject" && p.finalVerdict === "accept") b.disagreeMR++;
      if (p.modelVerdict === "accept" && p.finalVerdict === "reject") b.disagreeRA++;
    }
  }
  return Array.from(buckets.entries()).map(([t, v]) => ({
    hour: new Date(t).toISOString(),
    ...v,
  }));
}

// ──────────────── Review-queue counts ────────────────

export function reviewQueueCounts() {
  const unassisted = pallets.filter((p) => !p.skuId).length;
  const lowConf = pallets.filter((p) => p.finalVerdict === "low_confidence").length;
  const disagreements = pallets.filter((p) => p.hasDisagreement).length;
  return { unassisted, lowConf, disagreements };
}

// ──────────────── Dashboard live stats ────────────────

export function dashboardStats() {
  const today = todayRange();
  const todays = palletsInRange(today);
  return {
    boxesToday: todays.length,
    rejectRateToday: rejectRate(todays),
    operatorsActive: 3, // plausible static
  };
}

// ──────────────── Service pill derivation ────────────────

export function servicePills() {
  const roboflow = serviceHealth.roboflow.p95Ms < 1500 ? "healthy" : serviceHealth.roboflow.p95Ms < 3000 ? "warning" : "critical";
  const sb = serviceHealth.supabase.status;
  const tts = serviceHealth.tts.status;
  const activeDevices = devices.filter((d) => NOW.getTime() - new Date(d.lastHeartbeatAt).getTime() < 60_000).length;
  const dev = activeDevices >= 1 ? "healthy" : "neutral";
  return {
    roboflow: { status: roboflow, detail: `p95 ${serviceHealth.roboflow.p95Ms}ms` },
    supabase: { status: sb, detail: `${serviceHealth.supabase.latencyMs}ms` },
    tts: { status: tts, detail: `last ok 18s ago` },
    devices: { status: dev, detail: `${activeDevices} active` },
  };
}

// ──────────────── Image register filtered ────────────────

export interface ImageFilters {
  skuIds?: string[];
  verdicts?: Verdict[];
  operatorIds?: string[];
  dateRange?: "today" | "yesterday" | "7d" | "30d" | "all";
  confMin?: number;
  confMax?: number;
  hasDisagreement?: boolean;
  countMismatch?: boolean;
  assisted?: "assisted" | "unassisted" | "all";
  tagSearch?: string;
}

export function filterPallets(f: ImageFilters): Pallet[] {
  let list = [...pallets];
  if (f.dateRange && f.dateRange !== "all") {
    const now = NOW.getTime();
    const start = (() => {
      if (f.dateRange === "today") return startOfDay().getTime();
      if (f.dateRange === "yesterday") return startOfDay().getTime() - DAY;
      if (f.dateRange === "7d") return now - 7 * DAY;
      if (f.dateRange === "30d") return now - 30 * DAY;
      return 0;
    })();
    const end = f.dateRange === "yesterday" ? startOfDay().getTime() : now;
    list = list.filter((p) => {
      const t = new Date(p.startedAt).getTime();
      return t >= start && t <= end;
    });
  }
  if (f.skuIds && f.skuIds.length) list = list.filter((p) => p.skuId && f.skuIds!.includes(p.skuId));
  if (f.verdicts && f.verdicts.length) list = list.filter((p) => f.verdicts!.includes(p.finalVerdict));
  if (f.operatorIds && f.operatorIds.length) list = list.filter((p) => f.operatorIds!.includes(p.operatorId));
  if (f.confMin !== undefined) list = list.filter((p) => (p.confidence ?? 0) >= f.confMin!);
  if (f.confMax !== undefined) list = list.filter((p) => (p.confidence ?? 1) <= f.confMax!);
  if (f.hasDisagreement) list = list.filter((p) => p.hasDisagreement);
  if (f.countMismatch) list = list.filter((p) => p.countMismatch);
  if (f.assisted === "assisted") list = list.filter((p) => p.assisted);
  if (f.assisted === "unassisted") list = list.filter((p) => !p.assisted);
  if (f.tagSearch && f.tagSearch.trim()) {
    const q = f.tagSearch.trim().toLowerCase();
    list = list.filter((p) => {
      const sku = p.skuId ? skuById(p.skuId) : undefined;
      return (
        p.id.toLowerCase().includes(q) ||
        p.operatorId.toLowerCase().includes(q) ||
        (sku?.label.toLowerCase().includes(q) ?? false) ||
        (sku?.slug.toLowerCase().includes(q) ?? false)
      );
    });
  }
  return list.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
}

export function framesForPallet(palletId: string) {
  return frames.filter((f) => f.palletId === palletId);
}

export function voiceEventsForPallet(palletId: string) {
  return voiceEvents.filter((v) => v.palletId === palletId);
}
