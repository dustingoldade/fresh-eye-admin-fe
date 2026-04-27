"use client";
import { notFound, useParams } from "next/navigation";
import { skuById, referenceImages, currentModelChain, modelNameFor } from "@/mock/data";
import { DEFECT_LABELS, DefectType } from "@/mock/types";
import { PageHeader, SectionHeader, Breadcrumb } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { HeroStatsStrip, HeroStat } from "@/components/ui/hero-stats";
import { Button } from "@/components/ui/button";
import { useComparisonWindow, comparisonLabel } from "@/components/shell/comparison-window";
import { hourlySeries, palletsInRange, rangeForWindow, rejectRate, todayRange } from "@/mock/queries";
import { formatPct, formatDelta, formatDeltaRejectRate } from "@/lib/utils";
import { FreshLineChart } from "@/components/charts/line-chart";
import { Star, Upload, Lock, Info } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function FoodPassportDetailPage() {
  const params = useParams();
  const cmp = useComparisonWindow();

  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const sku = skuById(id);

  const goodRefs = sku ? referenceImages.filter((r) => r.skuId === sku.id && r.type === "good") : [];
  const badRefs = sku ? referenceImages.filter((r) => r.skuId === sku.id && r.type === "bad") : [];

  const badByDefect = useMemo(() => {
    const out = new Map<DefectType, typeof badRefs>();
    for (const r of badRefs) {
      for (const dt of r.defectTypes ?? []) {
        const existing = out.get(dt) ?? [];
        existing.push(r);
        out.set(dt, existing);
      }
    }
    return out;
  }, [badRefs]);

  if (!sku) return notFound();

  const today = todayRange();
  const todays = palletsInRange(today, sku.id);
  const cmpRange = rangeForWindow(cmp);
  const cmpPallets = palletsInRange(cmpRange, sku.id);

  const rrToday = rejectRate(todays);
  const rrCmp = rejectRate(cmpPallets);

  const SUCCESS_CONF_THRESHOLD = 0.98;
  const successesToday = todays.filter(
    (p) => p.assisted && !p.requiredMitigation && (p.confidence ?? 0) >= SUCCESS_CONF_THRESHOLD,
  ).length;
  const successRateToday = todays.length === 0 ? null : successesToday / todays.length;
  const totalItemsToday = todays.reduce((sum, p) => sum + (p.itemsDetected ?? 0), 0);

  const heroStats: HeroStat[] = [
    {
      label: "FreshEye Success Rate",
      value: successRateToday === null ? "—" : formatPct(successRateToday, 1),
      accent: successRateToday !== null && successRateToday >= 0.9,
    },
    {
      label: "Pallets scanned today",
      value: String(todays.length),
      comparisons: [
        (() => {
          const d = formatDelta(todays.length - cmpPallets.length);
          return { arrow: d.arrow, color: d.color, text: `${Math.abs(todays.length - cmpPallets.length)} vs. ${comparisonLabel(cmp)}` };
        })(),
      ],
    },
    {
      label: "Total item count",
      value: totalItemsToday.toLocaleString(),
    },
    {
      label: "Reject rate today",
      value: todays.length === 0 ? "—" : formatPct(rrToday),
      accent: rrToday >= 0.1,
      comparisons: todays.length === 0 ? undefined : [
        (() => {
          const d = formatDeltaRejectRate(rrToday - rrCmp);
          return { arrow: d.arrow, color: d.color, text: `${d.label} vs. ${comparisonLabel(cmp)}` };
        })(),
      ],
    },
  ];

  const primaryImg = goodRefs.find((r) => r.isPrimary) ?? goodRefs[0];

  return (
    <div className="p-6 flex flex-col gap-8 max-w-[1400px] mx-auto">
      {/* Section 1 — Header */}
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: "Food passports", href: "/food_passport" },
            ...(sku.parentLabel ? [{ label: sku.parentLabel }] : []),
            { label: sku.label },
          ]}
        />
        <div className="flex items-start gap-6">
          {primaryImg && (
            <div className="shrink-0 border border-border overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryImg.url} alt={sku.label} className="block" style={{ width: 192, height: 192, objectFit: "cover" }} />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <PageHeader
              title={sku.label}
              subtitle={`${sku.slug} · model chain ${currentModelChain.sku} / ${currentModelChain.count} / ${currentModelChain.defect}`}
              actions={
                <>
                  <StatusPill status={sku.status === "active" ? "active" : sku.status === "inactive" ? "offline" : "neutral"} label={sku.status.replace("_", " ")} />
                  <Button variant="outline" size="sm">
                    {sku.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </>
              }
            />
          </div>
        </div>
        <HeroStatsStrip stats={heroStats} />
      </div>

      {/* Section 2 — Reference images */}
      <section className="grid grid-cols-2 gap-6">
        <div className="card">
          <SectionHeader
            title={`Good examples · ${goodRefs.length}`}
            actions={<Button variant="ghost" size="sm"><Upload className="w-3 h-3" strokeWidth={1.5} /> Upload</Button>}
          />
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2">
              {goodRefs.slice(0, 12).map((r) => (
                <div key={r.id} className="relative aspect-square overflow-hidden border group rounded-md" style={{ borderColor: r.isPrimary ? "#6666F6" : "#E4E4E7" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.caption ?? ""} className="w-full h-full object-cover" />
                  {r.isPrimary && (
                    <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 mono text-2xs uppercase bg-accent text-accent-fg rounded-sm" style={{ letterSpacing: "0.04em" }}>
                      <Star className="w-2.5 h-2.5" strokeWidth={1.75} /> primary
                    </span>
                  )}
                  {r.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-foreground/80 text-background text-2xs px-1.5 py-1 opacity-0 group-hover:opacity-100 transition truncate">
                      {r.caption}
                    </div>
                  )}
                </div>
              ))}
              <button className="aspect-square border border-dashed border-border flex items-center justify-center text-muted-fg hover:text-foreground hover:border-foreground transition rounded-md">
                <Upload className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {goodRefs.length > 12 && (
              <Link href="#" className="mt-3 mono text-2xs uppercase text-muted-fg hover:text-accent">show all {goodRefs.length} →</Link>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader
            title={`Bad examples · ${badRefs.length} · ${badByDefect.size} defect types`}
            actions={<Button variant="ghost" size="sm"><Upload className="w-3 h-3" strokeWidth={1.5} /> Upload</Button>}
          />
          <div className="p-4 flex flex-col gap-4">
            {Array.from(badByDefect.entries()).map(([defect, imgs]) => (
              <div key={defect}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="label">{DEFECT_LABELS[defect]} · {imgs.length}</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {imgs.map((r) => (
                    <div key={r.id + defect} className="relative aspect-square overflow-hidden border border-border rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt="" className="w-full h-full object-cover" />
                      {(r.defectTypes?.length ?? 0) > 1 && (
                        <span className="absolute top-1 right-1 mono text-2xs uppercase bg-background/90 px-1 py-0.5 border border-border rounded-sm">
                          +{(r.defectTypes?.length ?? 1) - 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Inspection rules */}
      <section className="card">
        <SectionHeader title="Inspection rules" />
        <div className="p-4 grid grid-cols-2 gap-6">
          <div>
            <h3 className="label mb-3">Expected count</h3>
            <div className="flex items-center gap-3 mono">
              <span className="text-sm text-muted-fg">items per pallet:</span>
              <input
                type="number"
                defaultValue={sku.expectedCount}
                className="w-16 h-8 bg-background border border-border px-2 text-sm mono tabular text-center outline-none focus:border-foreground transition rounded-md"
              />
              <span className="text-sm text-muted-fg">± tolerance:</span>
              <input
                type="number"
                defaultValue={sku.countTolerance}
                className="w-16 h-8 bg-background border border-border px-2 text-sm mono tabular text-center outline-none focus:border-foreground transition rounded-md"
              />
            </div>
            <p className="mt-3 text-xs text-muted-fg">
              Count mismatch triggers an audio cue; operator decides whether to pass or reject.
            </p>
          </div>
          <div>
            <h3 className="label mb-3">Defect rubric (freeform)</h3>
            <textarea
              defaultValue={sku.defectRubricFreeform}
              className="w-full min-h-[80px] bg-background border border-border px-2 py-2 text-sm outline-none focus:border-foreground transition rounded-md"
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="label">Structured defect thresholds</h3>
            <span className="flex items-center gap-1 px-1.5 py-0.5 mono text-2xs uppercase text-muted-fg border border-border rounded-sm" style={{ letterSpacing: "0.04em" }}>
              <Lock className="w-2.5 h-2.5" strokeWidth={1.5} /> super admin only
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Defect type", "Model", "Threshold", ""].map((h) => (
                  <th key={h} className="label text-left px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sku.defectRubricStructured.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 text-sm">{DEFECT_LABELS[r.type]}</td>
                  <td className="px-3 py-2 mono text-xs text-foreground">{modelNameFor(r.type, sku.parentSlug ?? sku.slug)}</td>
                  <td className="px-3 py-2 mono tabular text-sm">{r.thresholdMm ? `≥ ${r.thresholdMm}mm` : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Lock className="inline w-3 h-3 text-muted-fg" strokeWidth={1.5} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-start gap-2 p-3 bg-subtle border border-border rounded-md">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-fg" strokeWidth={1.5} />
            <div className="flex-1 text-xs">
              <div className="font-medium text-foreground">Rubric editing coming soon</div>
              <div className="text-muted-fg mt-0.5 mono text-2xs uppercase" style={{ letterSpacing: "0.04em" }}>
                open item · requires client discussion · who edits structured rubric, whether taxonomy is global or per-passport
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Performance */}
      <PerformanceSection skuId={sku.id} cmp={cmp} />
    </div>
  );
}

function PerformanceSection({ skuId, cmp }: { skuId: string; cmp: ReturnType<typeof useComparisonWindow> }) {
  const today = todayRange();
  const series = hourlySeries(today.from, today.to, skuId);

  const rrData = series.map((b) => ({
    hour: b.hour,
    rate: b.total === 0 ? 0 : b.rejects / b.total,
    _total: b.total,
  }));

  const drData = series.map((b) => ({
    hour: b.hour,
    model_reject_op_accept: b.total === 0 ? 0 : b.disagreeMR / b.total,
    model_accept_op_reject: b.total === 0 ? 0 : b.disagreeRA / b.total,
  }));

  const lcData = series.map((b) => ({
    hour: b.hour,
    rate: b.total === 0 ? 0 : b.lowConf / b.total,
  }));
  const totalLow = series.reduce((s, b) => s + b.lowConf, 0);
  const lowByTerminal = (() => {
    const lows = palletsInRange(todayRange(), skuId).filter((p) => p.finalVerdict === "low_confidence" || p.modelVerdict === "low_confidence");
    const rejected = lows.filter((p) => p.finalVerdict === "reject").length;
    const accepted = lows.filter((p) => p.finalVerdict === "accept").length;
    return { total: lows.length || totalLow, rejected, accepted };
  })();

  const cmpRange = rangeForWindow("7d_avg");
  const baseline = rejectRate(palletsInRange(cmpRange, skuId));

  const xFmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:00`;
  };
  const pctFmt = (v: number) => `${(v * 100).toFixed(0)}%`;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="label px-1">Performance — today, hourly · {comparisonLabel(cmp)} baseline</h2>

      <div className="grid grid-cols-1 gap-4">
        <div className="card">
          <SectionHeader
            title="Reject rate"
            actions={
              <div className="flex items-center gap-3">
                <span className="mono text-2xs uppercase text-muted-fg">baseline 7d avg: {formatPct(baseline)}</span>
              </div>
            }
          />
          <div className="p-4">
            <FreshLineChart
              data={rrData}
              xKey="hour"
              series={[{ key: "rate", label: "Reject rate", color: "accent" }]}
              xFormatter={xFmt}
              yFormatter={pctFmt}
              yDomain={[0, "auto"]}
              refLines={[{ y: baseline, label: "7d avg", color: "#A1A1AA", dashed: true }]}
              refAreas={[
                { y1: 0.1, y2: 0.2, color: "#F59E0B", opacity: 0.06 },
                { y1: 0.2, y2: 1, color: "#EF4444", opacity: 0.06 },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <SectionHeader title="Required mitigation rate" />
            <div className="p-4">
              <FreshLineChart
                data={drData}
                xKey="hour"
                series={[
                  { key: "model_reject_op_accept", label: "Model reject → op accept", color: "foreground", opacity: 0.4 },
                  { key: "model_accept_op_reject", label: "Model accept → op reject", color: "accent" },
                ]}
                xFormatter={xFmt}
                yFormatter={pctFmt}
                yDomain={[0, "auto"]}
              />
              <div className="mt-3 flex items-center gap-4 mono text-2xs uppercase" style={{ letterSpacing: "0.04em" }}>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: "#0A0A0A", opacity: 0.4 }} /> model→reject / op→accept</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: "#6666F6" }} /> model→accept / op→reject <span className="text-status-red">(risk)</span></span>
              </div>
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Low-confidence rate" />
            <div className="p-4">
              <FreshLineChart
                data={lcData}
                xKey="hour"
                series={[{ key: "rate", label: "Low-conf rate", color: "accent" }]}
                xFormatter={xFmt}
                yFormatter={pctFmt}
                yDomain={[0, "auto"]}
              />
              <div className="mt-3 p-2 border border-border bg-subtle rounded-md">
                <div className="mono text-xs text-foreground tabular">
                  {lowByTerminal.total} low-conf pallets today · <span className="text-status-red">{lowByTerminal.rejected} rejected</span> · <span className="text-status-green">{lowByTerminal.accepted} accepted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

