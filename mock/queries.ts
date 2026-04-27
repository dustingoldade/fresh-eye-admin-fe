import {
  NOW,
  pallets,
  skus,
  devices,
  frames,
  voiceEvents,
  serviceHealth,
  skuById,
  modelNameFor,
  singleThumb,
} from "./data";
import { ComparisonWindow, ItemModelRun, Pallet, PalletItem, Verdict } from "./types";

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
    if (p.requiredMitigation) {
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
  const unknownSku = pallets.filter((p) => !p.skuId).length;
  const lowConf = pallets.filter((p) => p.finalVerdict === "low_confidence").length;
  const requiredMitigation = pallets.filter((p) => p.requiredMitigation).length;
  return { unknownSku, lowConf, requiredMitigation };
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
  requiredMitigation?: boolean;
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
  if (f.requiredMitigation) list = list.filter((p) => p.requiredMitigation);
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

// Deterministic 0..1 hash of an arbitrary key. Used for per-item RNG.
function hash01(key: string): number {
  let h = 2166136261 | 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

// Per-pallet, per-item inspection results. Each item runs every defect model
// from the SKU's structured rubric. Confidence is "probability defect is
// present"; a low value means the model is confident the item is clean. If
// the pallet's defectBreakdown reports N items with a given defect, exactly
// N items are flagged positive for that defect (deterministic by pallet id).
export function itemsForPallet(palletId: string): PalletItem[] {
  const pallet = pallets.find((p) => p.id === palletId);
  if (!pallet || !pallet.skuId) return [];
  const sku = skuById(pallet.skuId);
  if (!sku) return [];

  const count = pallet.itemsDetected ?? sku.expectedCount;
  if (count <= 0) return [];

  const rubric = sku.defectRubricStructured;
  const slug = sku.parentSlug ?? sku.slug;

  // Pick which item indices are positive for each defect, drawn from the
  // pallet's defectBreakdown so totals match what the rest of the UI shows.
  const positivesByDefect = new Map<string, Set<number>>();
  if (pallet.defectBreakdown) {
    for (const [defect, n] of Object.entries(pallet.defectBreakdown)) {
      const set = new Set<number>();
      let attempts = 0;
      while (set.size < (n ?? 0) && attempts < count * 4) {
        const idx = Math.floor(hash01(`${pallet.id}:${defect}:${attempts}`) * count);
        set.add(idx);
        attempts++;
      }
      positivesByDefect.set(defect, set);
    }
  }

  const items: PalletItem[] = [];
  for (let i = 0; i < count; i++) {
    const modelRuns: ItemModelRun[] = rubric.map((rule) => {
      const positives = positivesByDefect.get(rule.type);
      const isPositive = positives?.has(i) ?? false;
      const noise = hash01(`${pallet.id}:${i}:${rule.type}`) * 0.1;
      const confidence = isPositive ? 0.86 + noise : 0.03 + noise;
      return {
        modelName: modelNameFor(rule.type, slug),
        defectType: rule.type,
        confidence,
        detected: confidence >= 0.5,
      };
    });
    items.push({
      id: `${pallet.id}_item_${String(i + 1).padStart(2, "0")}`,
      palletId: pallet.id,
      index: i + 1,
      cropUrl: singleThumb(pallet.skuId, `${pallet.id}-${i}`),
      modelRuns,
    });
  }
  return items;
}
