# FreshEye — Admin Wireframe Spec

*Prompt-ready spec for Claude Code to scaffold a mock admin site for iteration.*
*Circus Group / Full AI · Do&Co pilot · Internal*

---

## Purpose

A clickable, mock-data-driven admin site that lets us iterate on the FreshEye tenant admin and super admin UI before we build anything real. Not production code — just enough of a prototype to click through flows, critique layouts, and refine decisions.

**Stack:**

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** components
- **Mock data** only — no backend, no real Supabase, no real auth. Everything hardcoded in `/mock/*.ts` files.
- **recharts** for trend charts
- **lucide-react** for icons

No authentication logic needed — assume we're always "logged in" as tenant admin; a toggle in the top bar (or `/super-admin`) flips into super admin mode.

---

## Visual Design

**Feeling:** sharp, futuristic, robotic. Precise, data-dense, technical — not playful. High-signal operations dashboard (Linear, Vercel, Supabase Studio) with a harder edge.

### Palette

| Token | Value | Use |
|-------|-------|-----|
| `background` | `#FFFFFF` | Page background |
| `foreground` | `#0A0A0A` | Primary text, main UI elements |
| `accent` | `#6666F6` | Interactive elements, active states, key numbers, chart lines, brand moments |
| `accent-fg` | `#FFFFFF` | Text on accent backgrounds |
| `muted-fg` | `#71717A` | Secondary text (muted slugs, timestamps) |
| `subtle-fg` | `#A1A1AA` | Tertiary text (hints, captions) |
| `border` | `#E4E4E7` | Hairline dividers, card borders, table rules |
| `subtle-bg` | `#FAFAFA` | Table zebra rows, subtle surface elevation |

Use the accent **surgically** — not decoratively. Primary CTAs, selected tab/button states, active comparison window, single-line trend charts, key metric values. Everything else is black / white / gray.

### Semantic status colors

| State | Color | Hex |
|-------|-------|-----|
| Accept / Active / Healthy | Green | `#10B981` |
| Low-confidence / Warning | Amber | `#F59E0B` |
| Reject / Critical / Offline | Red | `#EF4444` |
| Unassisted / Inactive / Neutral | Gray | `#A1A1AA` |

### Typography

- **Body / UI:** `Inter` (or `Geist Sans`). Tight tracking, `-0.01em` on larger headings.
- **Data / numbers / code / IDs / model versions / timestamps / slugs:** `Geist Mono` or `JetBrains Mono`. Monospace, always.
- **Weights:** 400 body, 500 emphasis, 600 headings. No 700+.
- **Numeric cells in tables:** `tabular-nums` + monospace. Numbers align vertically.

### Shape and elevation

- **Border radius:** 4px on cards + buttons, 2px on inputs + pills. **No rounded-full pill shapes.** Pills are rectangles with 2px radius.
- **Borders over shadows.** Cards use a 1px `border` color — no drop shadows. For elevation, a slightly darker border (`#D4D4D8`) instead of a shadow.
- **Spacing:** 4px base grid. Use 4 / 8 / 12 / 16 / 24 / 32 / 48 only. No 7px, no 15px.
- **Dividers:** 1px `border`, full-width within parent. Never dashed.

### Motion

Snappy. All transitions 100–150ms, `ease-out`. No spring physics, no overshoot, no bounce. Feel: mechanical precision.

### Charts (recharts)

- **Primary line:** `accent`. Secondary series: `foreground` at 40% opacity, or `muted-fg`.
- **Axes:** `muted-fg`, 1px.
- **Grid lines:** `border` at 50% opacity, dashed 1px.
- **Tooltip:** white background, `border` stroke, monospace numbers.
- **No gradients, no area fills** by default.

### Iconography

- `lucide-react` only. Single 1.5px stroke.
- Icon sizes: 14–16px inline/table, 20px in buttons, 24px in nav.
- Monochrome (`foreground` or `muted-fg`), unless communicating a semantic status.

---

## Role Model

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Super Admin** (Circus Group) | Cross-tenant | All tenants + service health + costs + cross-tenant ops |
| **Tenant Admin** (Do&Co side) | Single tenant | Everything in their tenant + **invite/remove members** |
| **Tenant User** (operators, QA, etc.) | Single tenant | Everything in their tenant except member management |

For the mock: simple `role` state flipped via a dev-only top-bar toggle.

---

## Navigation — Tenant Admin

Persistent left sidebar, monospace item labels:

1. **Overview** — `/`
2. **SKUs** — `/skus` → list; `/skus/[slug]` → detail
3. **Review Queue** — `/review` (tabs: Unassisted / Low-confidence / Disagreements)
4. **Image Register** — `/images` → list; `/images/[pallet_id]` → detail
5. **Devices** — `/devices`
6. **Performance** — `/performance` *(stub for v1)*
7. **Operators** — `/operators` *(stub for v1)*
8. **Settings** — `/settings` *(stub for v1)*
9. **Alerts** — `/alerts` *(stub for v1)*

**Top bar:** FreshEye wordmark (left), tenant name (muted), 5-button comparison-window selector (center), role switcher + user menu (right).

---

## Shared Components

### Comparison-window selector

Segmented control in the top bar. Affects every "today vs. X" comparison across Dashboard and SKU pages. Persists in URL state.

- **Yesterday** (vs. 1 day ago)
- **Last week** (same day 7 days ago)
- **Last month** (same day 30 days ago)
- **7d avg** (rolling)
- **30d avg** (rolling) — *default selected*

Selected button: filled `accent` background, white text. Others: white background, `foreground` text, `border` outline.

### Status pill

Small 2px-radius rectangle with color + label. Monospace, uppercase, 11px, tight letter-spacing. Two styles:

- **Filled** — colored background, white text (for high-attention states like critical alerts)
- **Outlined** — white background, 1px colored border, colored text, 4px colored dot at start (for inline status indicators)

Default to outlined; use filled for attention-grabbing moments.

### Hero stats strip

Row of 3–4 tiles across the top of Dashboard and SKU Detail:

- Big number — monospace, 36–48px, `foreground`
- Label — 12px uppercase, `muted-fg`, letter-spacing wide
- Two-line comparison subtext, monospace, 11px:
  - `↑ 12% vs. yesterday` — arrows in semantic color (green up / red down / gray flat)
  - `↑ 8% vs. 7d avg`

Tiles separated by 1px vertical dividers rather than spacing.

### Filter bar

Used on Image Register. Horizontal row of filter chips + dropdowns:

- Date range (today / yesterday / 7d / 30d / custom)
- SKU (multi-select)
- Verdict (multi-select chips)
- Confidence range (slider)
- Operator (multi-select)
- Model version (per stage)
- Flag toggles (has-disagreement, count-mismatch, assisted-only, unassisted-only)
- Free-text tag search

Active filters show as removable chips below. "Clear all" button. All filter state in URL params.

---

## Page 1 — Dashboard (`/`)

```
┌────────────────────────────────────────────────────────────┐
│ Top bar                                                    │
├──────┬─────────────────────────────────────────────────────┤
│      │ OVERVIEW                                            │
│ Nav  │                                                     │
│      │ ┌── Hero stats ──────────────────────────────────┐  │
│      │ │ Boxes today │ Reject rate │ Operators active   │  │
│      │ └────────────────────────────────────────────────┘  │
│      │                                                     │
│      │ ┌── Service health ──────────────────────────────┐  │
│      │ │ ● Roboflow  ● Supabase  ● TTS  ● Devices       │  │
│      │ └────────────────────────────────────────────────┘  │
│      │                                                     │
└──────┴─────────────────────────────────────────────────────┘
```

### Data points

**1. Boxes inspected today**
- Count of pallets this tenant processed today (including unassisted)
- Big number + two-line comparison subtext
- Click → Image Register filtered to today
- Timezone: tenant's configured region

**2. Reject rate today**
- `pallets with final_verdict = reject / total pallets today`, all pallets including unassisted
- Percentage + delta vs. comparison selector
- Click → Image Register filtered to today + verdict = reject
- Operator's final verdict wins (voice override flips the permanent verdict)

**3. Operators active right now**
- Count of users with `role = user` sending frame heartbeats in the last 90s
- Big number + pulsing green dot when non-zero
- Live (WebSocket/short-poll; mock: plausible static number)
- Not affected by comparison selector

**4. Service health pills** (row of 4)
- Roboflow — green <1.5s p95, amber 1.5–3s, red >3s or erroring
- Supabase — green on SELECT 1 + auth ping
- TTS — green on recent successful response
- Device connectivity — green if ≥1 active session receiving frames; gray if zero
- Check frequency: 60s
- Initial/unknown state: gray pill with spinner for first 30s, then falls to amber

---

## Page 2 — SKUs List (`/skus`)

Card grid, 3–4 columns at typical viewport. Top: search bar + status filter + sort dropdown.

### Per-card content

- **Representative good image** — admin-picked primary, fills top 2/3 of card
- **SKU name** — human label ("Roma Tomato"); nested hierarchy breadcrumb ("Tomato > Roma"); slug (`tomato/roma`) small + muted + monospace
- **Status pill** — Active / Unassisted-only / Inactive (outlined style)
- **Today's reject rate** — percentage with delta vs. comparison selector; color thresholds:
  - Neutral < 10%
  - Amber ≥ 10%
  - Red ≥ 20%
  - "—" if zero pallets today

### Hover actions

- **View detail** — navigates to `/skus/[slug]`
- **Toggle active / inactive** — only enabled if a model chain exists

### Search / filter / sort

- Search: filter by name
- Status: All / Active / Unassisted-only / Inactive
- Sort: Name / Reject rate / Last activity / Volume

### SKU data rules

- Slug is **tenant-scoped** (Do&Co's `tomato/roma` independent from other clients')
- **Nested hierarchy**: parent (`tomato`) + variety (`roma`)
- Status transitions are **manual only**
- Minimum reference images to activate: **1**

---

## Page 3 — SKU Detail (`/skus/[slug]`)

5 sections, stacked.

### Section 1 — Header

- Breadcrumb: "SKUs / Tomato / Roma"
- Large representative image (scaled up)
- Full SKU name + slug (muted, monospace)
- Status pill + inline active/inactive toggle
- **Hero stats strip** — "X pallets today · Y% reject rate · Z disagreements" — respects comparison selector

### Section 2 — Reference images

**Good examples** (left):
- Grid of thumbnails, 4 columns
- Primary image: subtle `accent` outline + star badge
- Per-thumbnail hover: set as primary / delete / view full / add caption
- Drag-and-drop upload area at top
- Unlimited storage, display latest ~20 with "show all" link
- Optional caption per image
- JPG / PNG only; soft warning if <640×640

**Bad examples** (right):
- Same layout but **grouped by defect type** with section headers + counts ("Mold (8)", "Soft spot (5)")
- Defect type tag **required** on upload
- **Multi-label allowed**: one image can appear in multiple groups
- Categories: mold / soft spot / crack / bruise / pest damage / foreign object / off-color

### Section 3 — Inspection Rules

**Expected count:**
- Inline input: `Expected items per pallet: [30] ± [2]`
- Tolerance is **absolute count**
- Runtime: if `|actual - expected| > tolerance` → audio cue to operator, operator decides

**Defect rubric:**
- Freeform description (top) — plain-English, Tenant Admin edits
- Structured defect list (below) — rows per defect type; Super Admin edits only (show lock icon on tenant view)
- *Open item: rubric edit permissions + global vs per-SKU taxonomy — placeholder state, no workflow*

### Section 4 — Performance summary

Hourly-granularity line charts. All respect comparison selector.

**Chart 1 — Reject rate trend**
- Single line, accent color
- Threshold bands: amber >10%, red >20% (subtle horizontal shading)
- Reference line: baseline (7d avg) dashed
- Toggle: combined / split (assisted vs unassisted), default combined
- Drill-in: click point → Image Register filtered to that hour + SKU + verdict = reject

**Chart 2 — Disagreement rate trend**
- **Two separate lines** in different colors:
  - "Model said reject → operator accepted" — `foreground` 40% opacity
  - "Model said accept → operator rejected" — accent color (the dangerous direction — highlighted)
- Drill-in: click → Image Register filtered to has_disagreement + this SKU

**Chart 3 — Low-confidence rate trend**
- Single accent line
- **Secondary stat strip under chart:** "Of N low-conf pallets today, M rejected / K accepted by operator"
- Drill-in: click → Image Register filtered to verdict = low_confidence + this SKU

*Not on this page: unassisted trend (lives in Review Queue), count mismatch trend (out of scope).*

### Section 5 — Recent activity

Compact table, latest first:
- **Last 20 pallets** for this SKU
- **Live-updating** — new rows slide in at top with subtle highlight
- Per row: thumbnail · relative timestamp (mono) · verdict pill · confidence % (mono) · operator · flag icons
- "See all →" link at bottom

---

## Page 4 — Review Queue (`/review`)

Consolidated human-review workflow. Three tabs with badge counts:

### Tabs
- **Unassisted (N)** — pallets the classifier couldn't identify; need manual SKU tagging
- **Low-confidence (N)** — SKU known but defect call uncertain
- **Disagreements (N)** — operator voice-overrides, for QA spot-check

### Tab content — card-based, same pattern across all three

Card:
- Big thumbnail (left side)
- Model's guess + confidence (mono)
- Timestamp + operator
- Quick action buttons with keyboard shortcuts visible (`A`, `R`, `U`, etc.)

### Unassisted tab actions
- **Assign to SKU** — dropdown of existing SKUs; tags pallet + adds frames to training pool
- **Create new SKU** — opens SKU creation flow
- **Exclude** — noise / not-a-pallet / ignore

### Low-confidence tab actions
- **Accept** / **Reject** / **Uncertain** / **Exclude from training**

### Disagreements tab actions
- **Confirm override** (operator was right, training signal accepted)
- **Flag model regression** (model was right, operator might need review)
- **Exclude**

---

## Page 5 — Image Register (`/images`)

Heavy filterable table. Top: filter bar. Main: paginated table.

### Defaults
- Date range pre-filtered to **today**
- Sort: Newest first
- Page size: 50
- URL state reflects all filters (bookmarkable)

### Per-row columns (power-user density)

1. Thumbnail — 48×48
2. Timestamp — relative, absolute on hover, monospace
3. SKU — human label + muted slug (mono), links to SKU detail
4. Verdict — colored pill (own column)
5. Confidence % — own column, monospace
6. Model chain — all three stages: `SKU v2.1 / Count v1.3 / Defect v3.4` (monospace)
7. Operator — name, clickable to filter
8. Flag icons — only icons that apply: disagreement, count-mismatch, assisted/unassisted
9. Click row → pallet detail view

### Sort options

Newest first (default) · Oldest first · Highest/lowest confidence · By verdict · By operator · By SKU

### Pagination

Classic (25 / 50 / 100 per page) with page navigator. Default 50.

### Bulk actions

**None for v1.** Read-only.

---

## Page 6 — Pallet Detail (`/images/[pallet_id]`)

Minimal v1 layout:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Image Register (preserves filters)               │
├─────────────────────────────────────────────────────────────┤
│  PALLET: [uuid / timestamp]                                 │
│  SKU: Roma Tomato · Operator: [name] · Device: [id]         │
│  Captured: 2026-04-23 14:32:15                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       ┌──────────────────────────────────────┐              │
│       │  Main image (representative frame,   │              │
│       │  with bounding box overlay)          │              │
│       │  [toggle bboxes on/off]              │              │
│       └──────────────────────────────────────┘              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  VERDICT                                                    │
│    Model said       Reject (87% confidence)                 │
│    Operator action  Reject (confirmed)                      │
│    Disagreement     no                                      │
├─────────────────────────────────────────────────────────────┤
│  MODEL CHAIN OUTPUT                                         │
│    SKU classifier (v2.1)   → "tomato/roma" (94%)            │
│    Item counter (v1.3)     → 29 items detected              │
│    Defect detector (v3.4)  → mold (3), soft_spot (1)        │
├─────────────────────────────────────────────────────────────┤
│  VOICE EVENTS                                               │
│    (none logged)                                            │
└─────────────────────────────────────────────────────────────┘
```

Bounding box overlay defaults ON with a toggle to hide.

**Out of scope for v1:** frame-sequence viewer (filmstrip), raw inference JSON log.

---

## Page 7 — Devices (`/devices`)

Simple card grid, 3–4 columns.

### Per-card content (truly minimal)

- **Device type icon + label** — "Ray-Ban Meta" or "iPhone"
- **Status pill** — Active (green) or Offline (gray)
- **Nickname / ID** — "Station 3 glasses" (name bold, ID monospace + muted)

### Status rules

- Heartbeat from device every 0.5s when in use
- Green (Active) if last heartbeat <60s ago
- Gray (Offline) otherwise

Nothing else. No hover popup, no detail page.

---

## Pages 8–11 — Stubs only

Placeholder pages with "Coming in v1.1" message:

- `/performance` — cross-SKU aggregate
- `/operators` — roster + per-operator stats
- `/settings` — tenant config (audio mode, thresholds, retention, TTS voice)
- `/alerts` — alert list + ack workflow

---

## Super Admin Area (`/super-admin`)

Separate section, same sidebar shell, different nav items:

1. **Tenant Roster** — list of tenants with per-row summary; impersonation click-through
2. **Service Health** — systems-level uptime, error rates, circuit breaker history, latency per tenant
3. **Cost / Usage** — infra spend, per-vendor per-tenant metering, unit economics
4. **Ops Actions** — create / suspend / migrate tenants; cross-tenant model promotion
5. **Model Management** — per-tenant model chain config (3 slots); model registry; upload; version history
6. **Audit** — global login audit, super admin access log

**Build as stubs for v1.** Only the Tenant Roster page needs enough content to demo the tenant-switcher flow.

---

## Mock Data Shape

Create in `/mock/` — TypeScript interfaces mirroring the eventual Supabase schema.

```typescript
// /mock/types.ts

export type Role = 'super_admin' | 'tenant_admin' | 'tenant_user'

export type Verdict = 'accept' | 'reject' | 'low_confidence' | 'unassisted'

export type DefectType =
  | 'mold' | 'soft_spot' | 'crack' | 'bruise'
  | 'pest_damage' | 'foreign_object' | 'off_color'

export interface Tenant {
  id: string
  name: string
  region: 'us' | 'eu'
  plan: string
}

export interface User {
  id: string
  email: string
  isSuperAdmin: boolean
}

export interface TenantMember {
  userId: string
  tenantId: string
  role: 'admin' | 'user'
  invitedAt: string
  acceptedAt?: string
}

export interface SKU {
  id: string
  tenantId: string
  slug: string                  // 'tomato/roma'
  parentSlug?: string           // 'tomato'
  label: string                 // 'Roma Tomato'
  status: 'active' | 'unassisted_only' | 'inactive'
  representativeImageId?: string
  expectedCount: number
  countTolerance: number
  defectRubricFreeform: string
  defectRubricStructured: Array<{
    type: DefectType
    severity: 'warning' | 'reject_on_any'
    thresholdMm?: number
  }>
}

export interface ReferenceImage {
  id: string
  skuId: string
  type: 'good' | 'bad'
  defectTypes?: DefectType[]    // required if type === 'bad'
  url: string
  caption?: string
  isPrimary: boolean
  uploadedAt: string
}

export interface Session {
  id: string
  userId: string
  tenantId: string
  deviceId: string
  startedAt: string
  endedAt?: string
}

export interface Pallet {
  id: string
  sessionId: string
  skuId?: string                // null if unassisted
  assisted: boolean             // false if pipeline skipped heavy CV
  finalVerdict: Verdict         // operator's final call (permanent)
  modelVerdict?: Verdict
  confidence?: number           // 0–1
  itemsDetected?: number
  countMismatch: boolean
  hasDisagreement: boolean
  startedAt: string
  closedAt?: string
  representativeFrameId?: string
}

export interface Frame {
  id: string
  palletId: string
  sessionId: string
  timestamp: string
  storageUrl: string
  bboxAreaRatio?: number
}

export interface Inference {
  id: string
  palletId: string
  frameId: string
  stage: 'sku_classifier' | 'item_counter' | 'defect_detector'
  modelVersion: string
  output: any                   // stage-specific
  confidence?: number
  latencyMs: number
}

export interface VoiceEvent {
  id: string
  palletId: string
  utterance: string             // 'rotten' | 'good' | 'inspect'
  confidence: number
  timestamp: string
}

export interface Device {
  id: string
  tenantId: string
  type: 'rayban' | 'iphone'
  nickname: string
  lastHeartbeatAt: string
}

export interface Alert {
  id: string
  tenantId: string
  severity: 'critical' | 'warning' | 'info'
  category: 'device' | 'model' | 'service' | 'data'
  message: string
  createdAt: string
  acknowledgedAt?: string
}
```

Seed `/mock/data.ts` with ~3 SKUs, ~2 devices, ~50 pallets across today/yesterday/last week, ~200 frames, a few voice events, a couple of alerts.

---

## Explicitly Out of Scope (v1 mock)

- Bulk actions on Image Register
- Pallet detail frame-sequence viewer
- Raw inference JSON log
- Count mismatch trend chart
- Save filter sets feature
- Alert threshold configuration
- Super Admin deep functionality beyond Tenant Roster stub
- Authentication / real Supabase / real API calls
- Real-time WebSocket (static "live" data is fine)
- Operator flag-for-review action on SKU cards
- Export / report downloads
- Defect rubric editing workflow (punted to client discussion)

---

## Open Items Requiring Client Discussion

Flag visibly in UI (placeholder state) but don't invent workflows:

- Defect rubric edit permissions (Tenant vs. Super Admin)
- Defect taxonomy: global or per-SKU
- Thresholds for "elevated" reject rate (using fixed 10% / 20% for now)
- Data retention policy

---
