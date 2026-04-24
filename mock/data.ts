import {
  Alert,
  Device,
  Frame,
  Inference,
  ModelChain,
  Pallet,
  ReferenceImage,
  SKU,
  Session,
  Tenant,
  TenantMember,
  User,
  Verdict,
  VoiceEvent,
  DEFECT_TYPES,
  DefectType,
} from "./types";

// Deterministic PRNG so every render agrees.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260424);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = (n: number): number => Math.floor(rng() * n);

// Anchor "now" at module load so all timestamps are derived from one instant.
export const NOW = new Date();
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const todayStart = startOfDay(NOW);
const daysAgo = (n: number) => new Date(todayStart.getTime() - n * 86_400_000);

// ──────────────── Tenants, users, members ────────────────

export const tenants: Tenant[] = [
  { id: "t_doco", name: "Do&Co", region: "eu", plan: "Pilot" },
  { id: "t_alpha", name: "Alpha Commissary", region: "us", plan: "Growth" },
  { id: "t_nord", name: "Nord Kitchens", region: "eu", plan: "Pilot" },
  { id: "t_pac", name: "Pacific Meals", region: "us", plan: "Trial" },
];

export const TENANT_ID = "t_doco";

export const users: User[] = [
  { id: "u_dustin", email: "dustin_ext@circuskitchens.com", displayName: "Dustin Goldade", isSuperAdmin: true },
  { id: "u_elena", email: "elena.k@doco.example", displayName: "Elena Kraus", isSuperAdmin: false },
  { id: "u_marcus", email: "marcus.b@doco.example", displayName: "Marcus Bauer", isSuperAdmin: false },
  { id: "u_isa", email: "isabela.r@doco.example", displayName: "Isabela Rojas", isSuperAdmin: false },
  { id: "u_theo", email: "theo.n@doco.example", displayName: "Theo Nakamura", isSuperAdmin: false },
];

export const tenantMembers: TenantMember[] = [
  { userId: "u_dustin", tenantId: "t_doco", role: "admin", invitedAt: daysAgo(30).toISOString(), acceptedAt: daysAgo(30).toISOString() },
  { userId: "u_elena", tenantId: "t_doco", role: "admin", invitedAt: daysAgo(60).toISOString(), acceptedAt: daysAgo(60).toISOString() },
  { userId: "u_marcus", tenantId: "t_doco", role: "user", invitedAt: daysAgo(45).toISOString(), acceptedAt: daysAgo(45).toISOString() },
  { userId: "u_isa", tenantId: "t_doco", role: "user", invitedAt: daysAgo(21).toISOString(), acceptedAt: daysAgo(21).toISOString() },
  { userId: "u_theo", tenantId: "t_doco", role: "user", invitedAt: daysAgo(14).toISOString(), acceptedAt: daysAgo(14).toISOString() },
];

// ──────────────── SKUs ────────────────

export const skus: SKU[] = [
  {
    id: "sku_roma",
    tenantId: TENANT_ID,
    slug: "tomato/roma",
    parentSlug: "tomato",
    parentLabel: "Tomato",
    label: "Roma Tomato",
    status: "active",
    representativeImageId: "ref_roma_primary",
    expectedCount: 30,
    countTolerance: 2,
    defectRubricFreeform:
      "Reject any pallet where mold is visible on any surface, or where > 3 fruits show deep soft spots. Crown crack is acceptable if shallow. Off-color (pale / yellow-green) is warning only.",
    defectRubricStructured: [
      { type: "mold", severity: "reject_on_any" },
      { type: "soft_spot", severity: "warning", thresholdMm: 8 },
      { type: "crack", severity: "warning" },
      { type: "off_color", severity: "warning" },
      { type: "foreign_object", severity: "reject_on_any" },
    ],
  },
  {
    id: "sku_spinach",
    tenantId: TENANT_ID,
    slug: "leafy/baby-spinach",
    parentSlug: "leafy",
    parentLabel: "Leafy greens",
    label: "Baby Spinach",
    status: "active",
    representativeImageId: "ref_spinach_primary",
    expectedCount: 120,
    countTolerance: 8,
    defectRubricFreeform:
      "Reject pallets with wilted or slimy leaves above ~10% of surface. Yellowing tips are warning. Any foreign matter (stems, grass, insects) triggers reject.",
    defectRubricStructured: [
      { type: "mold", severity: "reject_on_any" },
      { type: "off_color", severity: "warning" },
      { type: "pest_damage", severity: "reject_on_any" },
      { type: "foreign_object", severity: "reject_on_any" },
    ],
  },
  {
    id: "sku_avocado",
    tenantId: TENANT_ID,
    slug: "stone-fruit/hass-avocado",
    parentSlug: "stone-fruit",
    parentLabel: "Stone fruit",
    label: "Hass Avocado",
    status: "active",
    representativeImageId: "ref_avocado_primary",
    expectedCount: 24,
    countTolerance: 1,
    defectRubricFreeform:
      "Bruising is the primary defect. Reject if more than 2 fruits show deep bruising or any fruit has broken skin with visible flesh.",
    defectRubricStructured: [
      { type: "bruise", severity: "reject_on_any", thresholdMm: 15 },
      { type: "soft_spot", severity: "warning" },
      { type: "crack", severity: "reject_on_any" },
    ],
  },
];

// ──────────────── Reference images ────────────────

const refImgSeeds = {
  sku_roma: {
    good: ["roma-a", "roma-b", "roma-c", "roma-d", "roma-e", "roma-f"],
    bad: [
      { seed: "roma-mold-1", defects: ["mold"] as DefectType[] },
      { seed: "roma-mold-2", defects: ["mold"] as DefectType[] },
      { seed: "roma-mold-3", defects: ["mold", "soft_spot"] as DefectType[] },
      { seed: "roma-soft-1", defects: ["soft_spot"] as DefectType[] },
      { seed: "roma-soft-2", defects: ["soft_spot"] as DefectType[] },
      { seed: "roma-crack-1", defects: ["crack"] as DefectType[] },
      { seed: "roma-crack-2", defects: ["crack"] as DefectType[] },
      { seed: "roma-off-1", defects: ["off_color"] as DefectType[] },
    ],
  },
  sku_spinach: {
    good: ["spinach-a", "spinach-b", "spinach-c", "spinach-d"],
    bad: [
      { seed: "spinach-wilt-1", defects: ["off_color"] as DefectType[] },
      { seed: "spinach-wilt-2", defects: ["off_color"] as DefectType[] },
      { seed: "spinach-pest-1", defects: ["pest_damage"] as DefectType[] },
      { seed: "spinach-foreign-1", defects: ["foreign_object"] as DefectType[] },
      { seed: "spinach-mold-1", defects: ["mold"] as DefectType[] },
    ],
  },
  sku_avocado: {
    good: ["avo-a", "avo-b", "avo-c", "avo-d", "avo-e"],
    bad: [
      { seed: "avo-bruise-1", defects: ["bruise"] as DefectType[] },
      { seed: "avo-bruise-2", defects: ["bruise"] as DefectType[] },
      { seed: "avo-bruise-3", defects: ["bruise", "soft_spot"] as DefectType[] },
      { seed: "avo-crack-1", defects: ["crack"] as DefectType[] },
    ],
  },
};

const refCaptions: Record<string, string> = {
  "roma-a": "Ideal crate — even color, firm fruit.",
  "roma-b": "Top-layer reference — packed tight.",
  "roma-mold-1": "Stem-end mold — immediate reject.",
  "spinach-wilt-1": "Early wilt — warning, not reject.",
  "avo-bruise-1": "Deep pressure bruising from transit.",
};

export const referenceImages: ReferenceImage[] = (() => {
  const out: ReferenceImage[] = [];
  for (const skuId of Object.keys(refImgSeeds) as Array<keyof typeof refImgSeeds>) {
    const { good, bad } = refImgSeeds[skuId];
    good.forEach((seed, i) => {
      const id = i === 0 ? `ref_${skuId.replace("sku_", "")}_primary` : `ref_${seed}`;
      out.push({
        id,
        skuId,
        type: "good",
        url: `https://picsum.photos/seed/${seed}/600/600`,
        isPrimary: i === 0,
        uploadedAt: daysAgo(30 - i).toISOString(),
        caption: refCaptions[seed],
      });
    });
    bad.forEach((entry, i) => {
      out.push({
        id: `ref_${entry.seed}`,
        skuId,
        type: "bad",
        defectTypes: entry.defects,
        url: `https://picsum.photos/seed/${entry.seed}/600/600`,
        isPrimary: false,
        uploadedAt: daysAgo(25 - i).toISOString(),
        caption: refCaptions[entry.seed],
      });
    });
  }
  return out;
})();

// ──────────────── Devices ────────────────

export const devices: Device[] = [
  {
    id: "dev_rb1",
    tenantId: TENANT_ID,
    type: "rayban",
    nickname: "Station 3 glasses",
    lastHeartbeatAt: new Date(NOW.getTime() - 8_000).toISOString(),
  },
  {
    id: "dev_ip1",
    tenantId: TENANT_ID,
    type: "iphone",
    nickname: "Line lead iPhone",
    lastHeartbeatAt: new Date(NOW.getTime() - 22_000).toISOString(),
  },
  {
    id: "dev_rb2",
    tenantId: TENANT_ID,
    type: "rayban",
    nickname: "Station 1 glasses",
    lastHeartbeatAt: daysAgo(1).toISOString(), // offline
  },
];

// ──────────────── Sessions ────────────────

export const sessions: Session[] = (() => {
  const out: Session[] = [];
  for (let d = 0; d < 8; d++) {
    const day = daysAgo(d);
    // morning + afternoon shift per active device
    [
      { userId: "u_elena", deviceId: "dev_rb1", start: 7, end: 11 },
      { userId: "u_marcus", deviceId: "dev_ip1", start: 9, end: 13 },
      { userId: "u_isa", deviceId: "dev_rb1", start: 13, end: 17 },
    ].forEach((shift, i) => {
      const startedAt = new Date(day.getTime() + shift.start * 3_600_000);
      const endedAt = new Date(day.getTime() + shift.end * 3_600_000);
      if (d === 0 && shift.end > NOW.getHours()) {
        // ongoing session today
        out.push({
          id: `sess_${d}_${i}`,
          userId: shift.userId,
          tenantId: TENANT_ID,
          deviceId: shift.deviceId,
          startedAt: startedAt.toISOString(),
        });
      } else {
        out.push({
          id: `sess_${d}_${i}`,
          userId: shift.userId,
          tenantId: TENANT_ID,
          deviceId: shift.deviceId,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });
      }
    });
  }
  return out;
})();

// ──────────────── Pallets ────────────────

// Distribution target: 50 pallets across today/yesterday/last-week
// today: ~15, yesterday: ~12, last week (days 2-7): ~23
// Per-SKU weighted: Roma 50%, Spinach 30%, Avocado 20%
// Verdict distribution: 62% accept, 18% reject, 12% low_confidence, 8% unassisted

const MODEL_VERSIONS = {
  sku: ["v2.1", "v2.0", "v1.9"],
  count: ["v1.3", "v1.2"],
  defect: ["v3.4", "v3.3", "v3.2"],
};

interface PalletSeed {
  daysAgoN: number;
  hour: number;
  minute: number;
  skuId: string | null;
  operatorId: string;
  deviceId: string;
  finalVerdict: Verdict;
  modelVerdict?: Verdict;
  confidence?: number;
  itemsDetected?: number;
  assisted: boolean;
  hasDisagreement: boolean;
  countMismatch: boolean;
  imageSeed: string;
  defectBreakdown?: Partial<Record<DefectType, number>>;
}

// Hand-tuned pallet seeds so numbers are stable and aesthetically varied
const palletSeeds: PalletSeed[] = [];

// Helper to add batches deterministically via rng
function batchAdd(spec: {
  count: number;
  daysAgoN: number;
  skuWeights: Array<[string | null, number]>; // sku slug id → weight, null = unassisted
  verdictWeights: Array<[Verdict, number]>;
  hourRange: [number, number];
}) {
  for (let i = 0; i < spec.count; i++) {
    const hour = spec.hourRange[0] + pickN(spec.hourRange[1] - spec.hourRange[0]);
    const minute = pickN(60);
    const skuId = weightedPick(spec.skuWeights);
    const finalVerdict = skuId === null ? "unassisted" : weightedPick(spec.verdictWeights);
    const operatorId = pick(["u_elena", "u_marcus", "u_isa"]);
    const deviceId = operatorId === "u_marcus" ? "dev_ip1" : "dev_rb1";

    let modelVerdict: Verdict | undefined;
    let confidence: number | undefined;
    const assisted = skuId !== null;
    let hasDisagreement = false;

    if (assisted) {
      // Model verdict mostly agrees, sometimes disagrees
      const agreeProb = 0.82;
      if (rng() < agreeProb) {
        modelVerdict = finalVerdict === "unassisted" ? "accept" : finalVerdict;
      } else {
        // disagreement
        if (finalVerdict === "accept") modelVerdict = "reject";
        else if (finalVerdict === "reject") modelVerdict = "accept";
        else modelVerdict = "accept";
        hasDisagreement = finalVerdict === "accept" || finalVerdict === "reject";
      }
      confidence = finalVerdict === "low_confidence"
        ? 0.48 + rng() * 0.17
        : 0.72 + rng() * 0.27;
    }

    const sku = skus.find((s) => s.id === skuId);
    const expected = sku?.expectedCount ?? 30;
    const tolerance = sku?.countTolerance ?? 2;
    const itemsDetected = sku ? expected + Math.round((rng() - 0.5) * tolerance * 4) : undefined;
    const countMismatch = itemsDetected !== undefined && Math.abs(itemsDetected - expected) > tolerance;

    const defectBreakdown =
      finalVerdict === "reject" && sku
        ? (() => {
            const n = 1 + pickN(2);
            const out: Partial<Record<DefectType, number>> = {};
            for (let k = 0; k < n; k++) {
              const dt = pick(sku.defectRubricStructured.map((r) => r.type));
              out[dt] = (out[dt] ?? 0) + 1 + pickN(3);
            }
            return out;
          })()
        : undefined;

    const slug = skuId ? skuId.replace("sku_", "") : "unassisted";
    const imageSeed = `${slug}-${spec.daysAgoN}-${i}`;

    palletSeeds.push({
      daysAgoN: spec.daysAgoN,
      hour,
      minute,
      skuId,
      operatorId,
      deviceId,
      finalVerdict,
      modelVerdict,
      confidence,
      itemsDetected,
      assisted,
      hasDisagreement,
      countMismatch,
      imageSeed,
      defectBreakdown,
    });
  }
}

function weightedPick<T>(weights: Array<[T, number]>): T {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of weights) {
    if (r < w) return v;
    r -= w;
  }
  return weights[weights.length - 1][0];
}

const SKU_WEIGHTS: Array<[string | null, number]> = [
  ["sku_roma", 0.45],
  ["sku_spinach", 0.3],
  ["sku_avocado", 0.18],
  [null, 0.07], // unassisted
];

const VERDICT_WEIGHTS: Array<[Verdict, number]> = [
  ["accept", 0.62],
  ["reject", 0.2],
  ["low_confidence", 0.13],
  ["unassisted", 0.05], // assisted pallet with too-low conf → still bucketed here
];

// TODAY: 15 pallets, ended by "now"
batchAdd({ count: 15, daysAgoN: 0, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, Math.max(8, Math.min(NOW.getHours() + 1, 18))] });
// YESTERDAY: 12 pallets
batchAdd({ count: 12, daysAgoN: 1, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, 17] });
// Day-2: 10
batchAdd({ count: 10, daysAgoN: 2, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, 17] });
// Day-3: 6
batchAdd({ count: 6, daysAgoN: 3, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, 17] });
// Day-5: 4
batchAdd({ count: 4, daysAgoN: 5, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, 17] });
// Day-7: 3
batchAdd({ count: 3, daysAgoN: 7, skuWeights: SKU_WEIGHTS, verdictWeights: VERDICT_WEIGHTS, hourRange: [7, 17] });

export const pallets: Pallet[] = palletSeeds.map((p, i) => {
  const started = new Date(daysAgo(p.daysAgoN).getTime() + p.hour * 3_600_000 + p.minute * 60_000);
  const closed = new Date(started.getTime() + 45_000 + Math.floor(rng() * 120_000));
  const ongoing = p.daysAgoN === 0 && closed.getTime() > NOW.getTime();
  const sessionId = sessions.find(
    (s) =>
      s.userId === p.operatorId &&
      new Date(s.startedAt).getTime() <= started.getTime() &&
      (!s.endedAt || new Date(s.endedAt).getTime() >= started.getTime()),
  )?.id ?? sessions[0].id;

  return {
    id: `p_${started.toISOString().slice(0, 10).replace(/-/g, "")}_${String(i).padStart(3, "0")}`,
    sessionId,
    tenantId: TENANT_ID,
    skuId: p.skuId ?? undefined,
    assisted: p.assisted,
    finalVerdict: p.finalVerdict,
    modelVerdict: p.modelVerdict,
    confidence: p.confidence,
    itemsDetected: p.itemsDetected,
    countMismatch: p.countMismatch,
    hasDisagreement: p.hasDisagreement,
    startedAt: started.toISOString(),
    closedAt: ongoing ? undefined : closed.toISOString(),
    operatorId: p.operatorId,
    deviceId: p.deviceId,
    defectBreakdown: p.defectBreakdown,
    _imageSeed: p.imageSeed,
  } satisfies Pallet;
});

// ──────────────── Frames (~200) ────────────────

export const frames: Frame[] = pallets.flatMap((p) => {
  const frameCount = 3 + pickN(3); // 3-5 frames per pallet
  const out: Frame[] = [];
  const palletStart = new Date(p.startedAt).getTime();
  for (let j = 0; j < frameCount; j++) {
    const ts = new Date(palletStart + j * 800 + pickN(400));
    out.push({
      id: `f_${p.id}_${j}`,
      palletId: p.id,
      sessionId: p.sessionId,
      timestamp: ts.toISOString(),
      storageUrl: `https://picsum.photos/seed/${p._imageSeed}-f${j}/1200/800`,
      bboxAreaRatio: 0.18 + rng() * 0.3,
    });
  }
  return out;
});

// ──────────────── Inferences ────────────────

export const inferences: Inference[] = pallets.flatMap((p) => {
  if (!p.assisted || !p.skuId) return [];
  const repFrame = frames.find((f) => f.palletId === p.id)!;
  const sku = skus.find((s) => s.id === p.skuId)!;
  return [
    {
      id: `i_${p.id}_sku`,
      palletId: p.id,
      frameId: repFrame.id,
      stage: "sku_classifier",
      modelVersion: MODEL_VERSIONS.sku[0],
      output: { slug: sku.slug },
      confidence: p.confidence,
      latencyMs: 120 + Math.floor(rng() * 180),
    },
    {
      id: `i_${p.id}_count`,
      palletId: p.id,
      frameId: repFrame.id,
      stage: "item_counter",
      modelVersion: MODEL_VERSIONS.count[0],
      output: { count: p.itemsDetected },
      latencyMs: 80 + Math.floor(rng() * 120),
    },
    {
      id: `i_${p.id}_def`,
      palletId: p.id,
      frameId: repFrame.id,
      stage: "defect_detector",
      modelVersion: MODEL_VERSIONS.defect[0],
      output: { defects: p.defectBreakdown ?? {} },
      confidence: p.confidence ? Math.min(0.99, p.confidence - 0.04) : undefined,
      latencyMs: 240 + Math.floor(rng() * 300),
    },
  ];
});

// ──────────────── Voice events ────────────────

export const voiceEvents: VoiceEvent[] = pallets
  .filter((p) => p.hasDisagreement)
  .slice(0, 8)
  .map((p) => ({
    id: `ve_${p.id}`,
    palletId: p.id,
    utterance: p.finalVerdict === "reject" ? "rotten" : "good",
    confidence: 0.82 + rng() * 0.15,
    timestamp: new Date(new Date(p.startedAt).getTime() + 30_000).toISOString(),
  }));

// ──────────────── Alerts ────────────────

export const alerts: Alert[] = [
  {
    id: "a1",
    tenantId: TENANT_ID,
    severity: "warning",
    category: "data",
    message: "Roma Tomato reject rate 18.2% — above 7d avg of 9.4%",
    createdAt: new Date(NOW.getTime() - 42 * 60_000).toISOString(),
  },
  {
    id: "a2",
    tenantId: TENANT_ID,
    severity: "info",
    category: "device",
    message: "Station 1 glasses offline since yesterday 16:12",
    createdAt: daysAgo(1).toISOString(),
    acknowledgedAt: new Date(NOW.getTime() - 2 * 3600_000).toISOString(),
  },
  {
    id: "a3",
    tenantId: TENANT_ID,
    severity: "critical",
    category: "model",
    message: "Defect detector v3.4 latency p95 = 3.1s (threshold 3.0s)",
    createdAt: new Date(NOW.getTime() - 12 * 60_000).toISOString(),
  },
];

// ──────────────── Model chains ────────────────

export const modelChains: ModelChain[] = skus.map((s) => ({
  tenantId: TENANT_ID,
  sku: MODEL_VERSIONS.sku[0],
  count: MODEL_VERSIONS.count[0],
  defect: MODEL_VERSIONS.defect[0],
}));

export const currentModelChain = {
  sku: MODEL_VERSIONS.sku[0],
  count: MODEL_VERSIONS.count[0],
  defect: MODEL_VERSIONS.defect[0],
};

// ──────────────── Service health (static but plausible) ────────────────

export const serviceHealth = {
  roboflow: { status: "healthy" as const, p95Ms: 1180 },
  supabase: { status: "healthy" as const, latencyMs: 42 },
  tts: { status: "healthy" as const, lastSuccessAt: new Date(NOW.getTime() - 18_000).toISOString() },
  devices: { status: "healthy" as const, activeCount: 2 },
};

// ──────────────── Super-admin per-tenant roll-up ────────────────

export const tenantRollups = [
  {
    tenantId: "t_doco",
    palletsToday: pallets.filter((p) => new Date(p.startedAt).toDateString() === NOW.toDateString()).length,
    rejectRate: 0.132,
    activeOperators: 3,
    serviceStatus: "healthy" as const,
    monthlySpend: 4820,
  },
  {
    tenantId: "t_alpha",
    palletsToday: 218,
    rejectRate: 0.082,
    activeOperators: 7,
    serviceStatus: "healthy" as const,
    monthlySpend: 12400,
  },
  {
    tenantId: "t_nord",
    palletsToday: 54,
    rejectRate: 0.11,
    activeOperators: 2,
    serviceStatus: "degraded" as const,
    monthlySpend: 2900,
  },
  {
    tenantId: "t_pac",
    palletsToday: 0,
    rejectRate: 0,
    activeOperators: 0,
    serviceStatus: "offline" as const,
    monthlySpend: 180,
  },
];

// Convenience lookup
export const userById = (id: string) => users.find((u) => u.id === id);
export const skuById = (id: string) => skus.find((s) => s.id === id);
export const skuBySlug = (slug: string) => skus.find((s) => s.slug === slug);
export const deviceById = (id: string) => devices.find((d) => d.id === id);
