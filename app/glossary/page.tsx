import { PageHeader, SectionHeader } from "@/components/ui/page-header";

// ───────────────────────────────────────────────────────────────────────
// FreshEye glossary — must stay in sync with .claude/skills/terms/SKILL.md
//
// When you change anything here, also update SKILL.md (and vice versa).
// The terms skill's self-update protocol is responsible for keeping both
// files aligned.
// ───────────────────────────────────────────────────────────────────────

type GlossaryEntry = {
  term: string;
  body: string;
  bullets?: { name: string; description: string }[];
  seeAlso?: string[];
};

const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Disagreement Mitigation",
    body:
      "Operator-led override of the system's verdict. Triggered by the wake word plus a voice command (rotten · good · inspect). The operator's call always wins, permanently — the verdict is overwritten in the record and treated as ground truth for training. The act of overriding is also called a Required Mitigation when describing it from the pallet's perspective.",
    seeAlso: ["Required Mitigation", "Wake Word"],
  },
  {
    term: "Filter Model",
    body:
      "A small, fast, self-hosted computer-vision model that runs on every frame. Its only job is to detect whether a pallet is in view and large enough to inspect (a bounding-box-area ratio threshold). Cheap because it runs at high frequency on every frame; fast because it gates everything downstream — nothing else fires until the filter says \"yes, there's a pallet here.\"",
    seeAlso: ["Model Chain"],
  },
  {
    term: "Food Passport",
    body:
      "A written description plus reference images (good and bad examples) of what an SKU should look like at premium grade. Source of truth for human review and for model training. Owned by the QA team for each SKU.",
    seeAlso: ["SKU"],
  },
  {
    term: "FreshEye Success Rate",
    body:
      "The headline quality metric per SKU (and per Tenant): the share of Pallets the system handled end-to-end without help from the Operator, at high confidence. Definition: assisted (CV ran) AND no operator override (no Disagreement Mitigation) AND confidence ≥ 0.98. Use this exact name in UI copy, dashboards, and docs — do not call it \"autonomous rate,\" \"auto-handled %,\" or similar.",
  },
  {
    term: "Good",
    body:
      "A pallet that passes inspection: no defects detected, item count matches the expected value, image is clean. Triggers an Accept verdict — silent in production mode, audible chime in dev mode.",
    seeAlso: ["Verdict"],
  },
  {
    term: "Model Chain",
    body:
      "The sequence of CV models that processes each pallet, in order. Each stage feeds the next. Each can be swapped, retrained, or versioned independently.",
    bullets: [
      { name: "Filter Model", description: "is there a pallet in view?" },
      { name: "SKU classifier", description: "what produce is it?" },
      { name: "Item counter", description: "how many items, where are they?" },
      { name: "Defect detector", description: "is each item bad?" },
    ],
  },
  {
    term: "Operator",
    body:
      "The person wearing the Ray-Ban Meta glasses, performing inspections at the intake station. The only human-in-the-loop role for live inspection. Their physical action on a pallet (move to assembly line vs. move to reject pile) is the permanent ground-truth label.",
  },
  {
    term: "Operator Life Cycle",
    body: "The Operator's state during an active shift.",
    bullets: [
      { name: "Idle", description: "no pallet currently being inspected." },
      { name: "Active", description: "inspecting a pallet, system processing normally." },
      { name: "Unassisted", description: "system can't identify the SKU; operator decides solo." },
      { name: "Mitigation", description: "operator is currently overriding a verdict via voice." },
    ],
  },
  {
    term: "Pallet",
    body:
      "A box of produce. The unit of inspection. One Pallet = one Verdict. All metrics, logs, and decisions are scoped per Pallet.",
  },
  {
    term: "Required Mitigation",
    body:
      "Per-Pallet flag indicating that an Operator had to step in and override the system's verdict via Disagreement Mitigation. \"Required Mitigation = true\" means the model and the operator disagreed and the operator's call won. Used as the canonical wording in UI (filter chips, tab labels, column flags) and in code (pallet.requiredMitigation: boolean). Do NOT use synonyms like \"disagreement,\" \"had disagreement,\" \"override,\" or \"manual override\" in user-facing copy or new code — replace them when found.",
    seeAlso: ["Disagreement Mitigation"],
  },
  {
    term: "Rot",
    body:
      "Visible food deterioration: mold, soft spots, cracks, bruising, off-color, pest damage, foreign objects. Any Rot triggers a Reject verdict. For premium clients, the rejection threshold is hard — any defect is grounds to reject the Pallet.",
  },
  {
    term: "SKU",
    body:
      "Stock Keeping Unit — a specific food item (e.g., Roma tomato, Honeycrisp apple). Each SKU has its own Model Chain, Food Passport, expected count, and defect rubric. Slugs are tenant-scoped and follow a nested hierarchy (e.g., tomato/roma, tomato/beefsteak).",
  },
  {
    term: "Tenant",
    body:
      "A client organization using FreshEye. Do&Co is the first Tenant. Multi-tenant architecture is in place from day one even with a single Tenant — adding clients later doesn't require a rewrite.",
  },
  {
    term: "Unassisted Mode",
    body:
      "The Operator-side experience when the system can't help — they're inspecting solo. Triggered by an Unknown SKU Verdict. Audio plays \"unassisted, unknown item.\" Frames are logged with the unknown_sku tag for later human review and tagging — feeds the v2 active-learning pipeline. The Operator Life Cycle state during this is Unassisted.",
    seeAlso: ["Unknown SKU", "Operator Life Cycle"],
  },
  {
    term: "Unknown SKU",
    body:
      "The Verdict the system emits when the SKU classifier can't confidently identify what's in the Pallet — either because the Filter Model never registered a recognizable pallet, or because the classifier ran and failed. When this Verdict fires, the Pallet's skuId is null (we don't know what it is). The Operator falls into Unassisted Mode as a result. UI label: \"Unknown SKU\". Code value: unknownSku.",
    seeAlso: ["Unassisted Mode", "Verdict"],
  },
  {
    term: "Verdict",
    body: "The system's call on a Pallet. Four possible states.",
    bullets: [
      { name: "Accept", description: "Pallet passes inspection (silent in production)." },
      { name: "Reject", description: "Pallet has defects, operator should move to reject pile." },
      { name: "Low Confidence", description: "system isn't sure; audio plays \"please inspect\" and operator decides." },
      { name: "Unknown SKU", description: "system couldn't identify the SKU at all; Pallet has no skuId. Triggers Unassisted Mode for the Operator." },
    ],
  },
  {
    term: "Wake Word",
    body:
      "The phrase \"Hey FreshEye\" that activates voice listening for a Disagreement Mitigation command. Detected on-device by Porcupine (a tiny always-on wake-word model). Listening is gated behind the Wake Word so the system isn't actively recording every conversation in the warehouse — only the ~2-second window after the Wake Word is parsed.",
  },
];

const CODE_IDENTIFIERS: { name: string; description: string }[] = [
  {
    name: "Operator Life Cycle states",
    description: "Idle, Active, Unassisted, Mitigation",
  },
  {
    name: "Verdict values",
    description: "accept, reject, low_confidence, unknownSku (camelCase — NOT unassisted, unknown_sku, or unknown)",
  },
  {
    name: "Voice commands (post-wake-word)",
    description: "rotten, good, inspect",
  },
  {
    name: "SKU slug format",
    description: "<group>/<variety> lowercase, slash-separated, tenant-scoped (e.g., tomato/roma)",
  },
  {
    name: "Log tags",
    description: "unknown_sku (lowercase snake_case) for frames captured under an Unknown SKU verdict",
  },
  {
    name: "Pallet field for operator override",
    description: "requiredMitigation: boolean (NOT hasDisagreement, override, or mitigated)",
  },
  {
    name: "URL filter param for the same",
    description: "?mitigation=1",
  },
  {
    name: "Pallet skuId",
    description: "must be null/undefined whenever finalVerdict === \"unknownSku\" — the two are coupled.",
  },
];

export default function GlossaryPage() {
  return (
    <div className="p-6 flex flex-col gap-8 max-w-[1100px] mx-auto">
      <PageHeader
        title="Glossary"
        subtitle="Canonical vocabulary for FreshEye — used in code, UI copy, specs, and conversation."
      />

      <section className="card overflow-hidden">
        <SectionHeader title={`Terms · ${GLOSSARY.length}`} />
        <div className="divide-y divide-border">
          {GLOSSARY.map((entry) => (
            <article key={entry.term} className="px-5 py-4 flex flex-col gap-2">
              <h3 className="text-md font-medium text-foreground">{entry.term}</h3>
              <p className="text-sm text-muted-fg leading-relaxed">{entry.body}</p>
              {entry.bullets && (
                <ul className="mt-1 flex flex-col gap-1 pl-4">
                  {entry.bullets.map((b) => (
                    <li key={b.name} className="text-sm">
                      <span className="font-medium text-foreground">{b.name}</span>
                      <span className="text-muted-fg"> — {b.description}</span>
                    </li>
                  ))}
                </ul>
              )}
              {entry.seeAlso && entry.seeAlso.length > 0 && (
                <div
                  className="mono text-2xs uppercase text-muted-fg mt-1"
                  style={{ letterSpacing: "0.04em" }}
                >
                  see also: {entry.seeAlso.join(" · ")}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <SectionHeader title="Code identifiers" />
        <div className="p-5">
          <p className="text-sm text-muted-fg mb-4">
            Use these exact spellings in code (enums, state names, types, slugs).
          </p>
          <ul className="flex flex-col gap-3">
            {CODE_IDENTIFIERS.map((ci) => (
              <li key={ci.name} className="text-sm">
                <span className="font-medium text-foreground">{ci.name}:</span>{" "}
                <span className="mono text-foreground">{ci.description}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-fg italic">
            Note: The Operator Life Cycle state <span className="mono">Unassisted</span> and the Verdict{" "}
            <span className="mono">unknownSku</span> are paired but distinct: the Verdict is the system's
            call (we don't know the SKU), and the Operator Life Cycle state is the operator's experience
            (operating without model help). One causes the other; don't conflate them in code or copy.
          </p>
        </div>
      </section>

      <p
        className="mono text-2xs uppercase text-muted-fg text-center"
        style={{ letterSpacing: "0.04em" }}
      >
        synced with .claude/skills/terms/SKILL.md · update both files together
      </p>
    </div>
  );
}
