"use client";
import { notFound, useParams, useRouter } from "next/navigation";
import { pallets, userById, skuById, deviceById, inferences, currentModelChain } from "@/mock/data";
import { framesForPallet, voiceEventsForPallet } from "@/mock/queries";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatAbsolute, formatPct, formatRelative } from "@/lib/utils";
import { DEFECT_LABELS, DefectType } from "@/mock/types";
import { ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";

export default function PalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bboxOn, setBboxOn] = useState(true);

  const id = params.pallet_id as string;
  const pallet = pallets.find((p) => p.id === id);
  if (!pallet) return notFound();

  const sku = pallet.skuId ? skuById(pallet.skuId) : null;
  const op = userById(pallet.operatorId);
  const device = deviceById(pallet.deviceId);
  const frames = framesForPallet(pallet.id);
  const voices = voiceEventsForPallet(pallet.id);
  const inf = inferences.filter((i) => i.palletId === pallet.id);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1200px]">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 mono text-xs text-muted-fg hover:text-foreground uppercase transition"
        style={{ letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3 h-3" strokeWidth={1.5} /> Back to Image Register
      </button>

      <PageHeader
        title={`Pallet ${pallet.id}`}
        subtitle={`${sku?.label ?? "unassisted"} · ${op?.displayName ?? "—"} · ${device?.nickname ?? "—"} · captured ${formatAbsolute(pallet.startedAt)}`}
        actions={<StatusPill status={pallet.finalVerdict as any} variant="filled" />}
      />

      {/* Image viewer */}
      <div className="card">
        <div className="flex items-center justify-between px-4 h-10 border-b border-border">
          <span className="label">Representative frame</span>
          <button
            onClick={() => setBboxOn((v) => !v)}
            className="flex items-center gap-1.5 mono text-xs uppercase text-muted-fg hover:text-foreground transition"
            style={{ letterSpacing: "0.04em" }}
          >
            {bboxOn ? <ToggleRight className="w-4 h-4 text-accent" strokeWidth={1.5} /> : <ToggleLeft className="w-4 h-4" strokeWidth={1.5} />}
            bounding boxes {bboxOn ? "on" : "off"}
          </button>
        </div>
        <div className="p-4 bg-subtle">
          <div className="relative mx-auto max-w-3xl aspect-[3/2] border border-border overflow-hidden bg-background" style={{ borderRadius: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/${pallet._imageSeed}-f0/1200/800`}
              alt=""
              className="w-full h-full object-cover"
            />
            {bboxOn && frames[0]?.bboxAreaRatio && (
              <>
                <div
                  className="absolute pointer-events-none border-2"
                  style={{
                    left: "12%", top: "18%", width: "70%", height: "64%",
                    borderColor: pallet.finalVerdict === "reject" ? "#EF4444" : "#6666F6",
                    borderRadius: 6,
                  }}
                >
                  <span
                    className="absolute -top-5 left-0 px-1 py-0.5 mono text-2xs uppercase"
                    style={{
                      background: pallet.finalVerdict === "reject" ? "#EF4444" : "#6666F6",
                      color: "#FFFFFF",
                      borderRadius: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    pallet · {pallet.confidence ? formatPct(pallet.confidence, 0) : "—"}
                  </span>
                </div>
                {pallet.defectBreakdown &&
                  Object.keys(pallet.defectBreakdown).map((d, i) => (
                    <div
                      key={d}
                      className="absolute pointer-events-none border-2"
                      style={{
                        left: `${20 + i * 18}%`,
                        top: `${30 + i * 12}%`,
                        width: "14%",
                        height: "14%",
                        borderColor: "#F59E0B",
                        borderRadius: 6,
                      }}
                    >
                      <span
                        className="absolute -top-5 left-0 px-1 py-0.5 mono text-2xs uppercase"
                        style={{ background: "#F59E0B", color: "#FFFFFF", borderRadius: 6, letterSpacing: "0.04em" }}
                      >
                        {DEFECT_LABELS[d as DefectType]}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between mono text-2xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
            <span>{frames.length} frames captured</span>
            <span>frame sequence viewer — out of scope v1</span>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <section className="card">
        <SectionHeader title="Verdict" />
        <div className="p-4 grid grid-cols-3 gap-6">
          <VerdictRow label="Model said" pill={pallet.modelVerdict as any} detail={pallet.confidence ? `${formatPct(pallet.confidence, 0)} confidence` : "—"} />
          <VerdictRow label="Operator action" pill={pallet.finalVerdict as any} detail={pallet.finalVerdict === pallet.modelVerdict ? "confirmed" : "override"} />
          <VerdictRow
            label="Disagreement"
            pill={pallet.hasDisagreement ? "warning" : "active"}
            detail={pallet.hasDisagreement ? "model vs operator" : "no"}
          />
        </div>
      </section>

      {/* Model chain */}
      <section className="card">
        <SectionHeader title="Model chain output" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Stage", "Version", "Output", "Confidence", "Latency"].map((h) => (
                <th key={h} className="label text-left px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inf.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-fg">No inference data (unassisted pallet).</td></tr>
            ) : (
              inf.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2 mono text-sm uppercase" style={{ letterSpacing: "0.04em" }}>{i.stage.replace("_", " ")}</td>
                  <td className="px-4 py-2 mono tabular text-sm">{i.modelVersion}</td>
                  <td className="px-4 py-2 mono text-xs text-muted-fg">{formatOutput(i.stage, i.output)}</td>
                  <td className="px-4 py-2 mono tabular text-sm">{i.confidence ? formatPct(i.confidence, 0) : "—"}</td>
                  <td className="px-4 py-2 mono tabular text-sm">{i.latencyMs}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Voice events */}
      <section className="card">
        <SectionHeader title="Voice events" />
        {voices.length === 0 ? (
          <div className="p-4 text-sm text-muted-fg">(none logged)</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Time", "Utterance", "Confidence"].map((h) => (
                  <th key={h} className="label text-left px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {voices.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2 mono tabular text-sm text-muted-fg">{formatRelative(v.timestamp)}</td>
                  <td className="px-4 py-2 mono text-sm">&quot;{v.utterance}&quot;</td>
                  <td className="px-4 py-2 mono tabular text-sm">{formatPct(v.confidence, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function VerdictRow({ label, pill, detail }: { label: string; pill: any; detail: string }) {
  return (
    <div>
      <div className="label mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <StatusPill status={pill} variant="filled" />
        <span className="mono text-sm text-muted-fg">{detail}</span>
      </div>
    </div>
  );
}

function formatOutput(stage: string, output: any) {
  if (!output) return "—";
  if (stage === "sku_classifier") return `"${output.slug}"`;
  if (stage === "item_counter") return `${output.count} items detected`;
  if (stage === "defect_detector") {
    const entries = Object.entries(output.defects ?? {});
    if (entries.length === 0) return "no defects";
    return entries.map(([k, n]) => `${k} (${n})`).join(", ");
  }
  return JSON.stringify(output);
}
