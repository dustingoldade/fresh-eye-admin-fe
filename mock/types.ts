export type Role = "super_admin" | "tenant_admin" | "tenant_user";

export type Verdict = "accept" | "reject" | "low_confidence" | "unknownSku";

export type DefectType =
  | "mold"
  | "soft_spot"
  | "crack"
  | "bruise"
  | "pest_damage"
  | "foreign_object"
  | "off_color";

export const DEFECT_TYPES: DefectType[] = [
  "mold",
  "soft_spot",
  "crack",
  "bruise",
  "pest_damage",
  "foreign_object",
  "off_color",
];

export const DEFECT_LABELS: Record<DefectType, string> = {
  mold: "Mold",
  soft_spot: "Soft spot",
  crack: "Crack",
  bruise: "Bruise",
  pest_damage: "Pest damage",
  foreign_object: "Foreign object",
  off_color: "Off-color",
};

export interface Tenant {
  id: string;
  name: string;
  region: "us" | "eu";
  plan: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
}

export interface TenantMember {
  userId: string;
  tenantId: string;
  role: "admin" | "user";
  invitedAt: string;
  acceptedAt?: string;
}

export interface SKU {
  id: string;
  tenantId: string;
  slug: string;
  parentSlug?: string;
  parentLabel?: string;
  label: string;
  status: "active" | "unassisted_only" | "inactive";
  representativeImageId?: string;
  expectedCount: number;
  countTolerance: number;
  defectRubricFreeform: string;
  defectRubricStructured: Array<{
    type: DefectType;
    severity: "warning" | "reject_on_any";
    thresholdMm?: number;
  }>;
}

export interface ReferenceImage {
  id: string;
  skuId: string;
  type: "good" | "bad";
  defectTypes?: DefectType[];
  url: string;
  caption?: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
}

export interface Pallet {
  id: string;
  sessionId: string;
  tenantId: string;
  skuId?: string;
  assisted: boolean;
  finalVerdict: Verdict;
  modelVerdict?: Verdict;
  confidence?: number;
  itemsDetected?: number;
  countMismatch: boolean;
  requiredMitigation: boolean;
  startedAt: string;
  closedAt?: string;
  representativeFrameId?: string;
  operatorId: string;
  deviceId: string;
  defectBreakdown?: Partial<Record<DefectType, number>>;
  // derived helpers
  _imageSeed: string;
}

export interface Frame {
  id: string;
  palletId: string;
  sessionId: string;
  timestamp: string;
  storageUrl: string;
  bboxAreaRatio?: number;
}

export interface Inference {
  id: string;
  palletId: string;
  frameId: string;
  stage: "sku_classifier" | "item_counter" | "defect_detector";
  modelVersion: string;
  output: unknown;
  confidence?: number;
  latencyMs: number;
}

export interface ItemModelRun {
  modelName: string;
  defectType: DefectType;
  // Probability the defect is present on this item (0..1).
  confidence: number;
  // True when confidence crosses the detection threshold (0.5).
  detected: boolean;
}

export interface PalletItem {
  id: string;
  palletId: string;
  index: number; // 1-based index within the pallet
  cropUrl: string;
  modelRuns: ItemModelRun[];
}

export interface VoiceEvent {
  id: string;
  palletId: string;
  utterance: "rotten" | "good" | "inspect";
  confidence: number;
  timestamp: string;
}

export interface Device {
  id: string;
  tenantId: string;
  type: "rayban" | "iphone";
  nickname: string;
  lastHeartbeatAt: string;
}

export interface Alert {
  id: string;
  tenantId: string;
  severity: "critical" | "warning" | "info";
  category: "device" | "model" | "service" | "data";
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface ModelChain {
  tenantId: string;
  sku: string;
  count: string;
  defect: string;
}

export type ComparisonWindow =
  | "yesterday"
  | "last_week"
  | "last_month"
  | "7d_avg"
  | "30d_avg";

export const COMPARISON_WINDOWS: { id: ComparisonWindow; label: string }[] = [
  { id: "yesterday", label: "Yesterday" },
  { id: "last_week", label: "Last week" },
  { id: "last_month", label: "Last month" },
  { id: "7d_avg", label: "7d avg" },
  { id: "30d_avg", label: "30d avg" },
];
