"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { pallets, skus, userById, skuById } from "@/mock/data";
import { reviewQueueCounts } from "@/mock/queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatPct, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type Tab = "unknownSku" | "low" | "mitigation";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "unknownSku", label: "Unknown SKU", hint: "Pallets the classifier couldn't identify. Assign a SKU or exclude." },
  { id: "low", label: "Low-confidence", hint: "SKU known, defect call uncertain. Confirm or reject." },
  { id: "mitigation", label: "Required mitigation", hint: "Operator voice-overrode the model. Confirm override or flag regression." },
];

export default function ReviewPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab: Tab = (sp.get("tab") as Tab) ?? "unknownSku";
  const counts = reviewQueueCounts();

  const items = useMemo(() => {
    if (tab === "unknownSku") return pallets.filter((p) => !p.skuId);
    if (tab === "low") return pallets.filter((p) => p.finalVerdict === "low_confidence");
    return pallets.filter((p) => p.requiredMitigation);
  }, [tab]);

  const setTab = (id: Tab) => {
    const params = new URLSearchParams(sp);
    params.set("tab", id);
    router.replace(`/review?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px]">
      <PageHeader title="Review queue" subtitle="Human-in-the-loop workflow — assignments feed the training pool." />

      {/* Tabs */}
      <div className="flex items-stretch border-b border-border">
        {TABS.map((t) => {
          const n = t.id === "unknownSku" ? counts.unknownSku : t.id === "low" ? counts.lowConf : counts.requiredMitigation;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 h-10 mono uppercase text-xs flex items-center gap-2 transition border-b-2 -mb-px",
                active ? "border-accent text-foreground" : "border-transparent text-muted-fg hover:text-foreground"
              )}
              style={{ letterSpacing: "0.04em" }}
            >
              {t.label}
              <span className={cn("mono tabular text-xs px-1.5 py-0.5 border", active ? "border-accent text-accent" : "border-border text-muted-fg")} style={{ borderRadius: 6 }}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-sm text-muted-fg">
        {TABS.find((t) => t.id === tab)?.hint}
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted-fg">Nothing to review. 👀 clear queue.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.slice(0, 10).map((p) => (
            <ReviewCard key={p.id} pallet={p} tab={tab} />
          ))}
        </div>
      )}

      {items.length > 10 && (
        <div className="mono text-xs text-muted-fg">+ {items.length - 10} more in queue.</div>
      )}

      <div className="card p-3 bg-subtle mono text-2xs uppercase text-muted-fg flex items-center gap-4" style={{ letterSpacing: "0.04em" }}>
        <span>keyboard shortcuts:</span>
        {tab === "unknownSku" && (
          <>
            <Kbd>A</Kbd> assign
            <Kbd>N</Kbd> new SKU
            <Kbd>X</Kbd> exclude
          </>
        )}
        {tab === "low" && (
          <>
            <Kbd>A</Kbd> accept
            <Kbd>R</Kbd> reject
            <Kbd>U</Kbd> uncertain
            <Kbd>X</Kbd> exclude
          </>
        )}
        {tab === "mitigation" && (
          <>
            <Kbd>C</Kbd> confirm override
            <Kbd>F</Kbd> flag regression
            <Kbd>X</Kbd> exclude
          </>
        )}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mono text-2xs uppercase px-1 py-px border border-border bg-background text-foreground mx-1" style={{ borderRadius: 6, letterSpacing: "0.04em" }}>
      {children}
    </kbd>
  );
}

function ReviewCard({ pallet, tab }: { pallet: typeof pallets[number]; tab: Tab }) {
  const sku = pallet.skuId ? skuById(pallet.skuId) : null;
  const op = userById(pallet.operatorId);

  return (
    <div className="card flex overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://picsum.photos/seed/${pallet._imageSeed}-f0/320/320`}
        alt=""
        className="w-40 h-40 object-cover shrink-0 border-r border-border"
      />
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mono text-2xs text-muted-fg uppercase truncate" style={{ letterSpacing: "0.04em" }}>{pallet.id}</div>
            {tab === "unknownSku" ? (
              <div className="text-sm text-muted-fg">Model guess: <span className="text-foreground mono">—</span></div>
            ) : (
              <div className="text-sm">
                {sku?.label ?? "—"} <span className="mono text-xs text-muted-fg">{sku?.slug}</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="mono tabular text-md" style={{ fontWeight: 500 }}>{pallet.confidence ? formatPct(pallet.confidence, 0) : "—"}</div>
            <div className="mono text-2xs text-muted-fg uppercase">confidence</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {tab === "mitigation" && (
            <>
              <span className="text-muted-fg">model</span>
              <StatusPill status={pallet.modelVerdict as any} />
              <span className="text-muted-fg">→ operator</span>
              <StatusPill status={pallet.finalVerdict as any} />
            </>
          )}
          {tab === "low" && <StatusPill status="low_confidence" />}
          {tab === "unknownSku" && <StatusPill status="unknownSku" />}
        </div>

        <div className="mono text-2xs text-muted-fg uppercase flex items-center gap-2 mt-auto" style={{ letterSpacing: "0.04em" }}>
          <span>{formatRelative(pallet.startedAt)}</span>
          <span>·</span>
          <span>{op?.displayName ?? "—"}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {tab === "unknownSku" && (
            <>
              <Select className="flex-1" defaultValue="">
                <option value="" disabled>Assign to SKU…</option>
                {skus.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
              <Button variant="outline" size="sm">+ New</Button>
              <Button variant="ghost" size="sm">Exclude</Button>
            </>
          )}
          {tab === "low" && (
            <>
              <Button variant="accent" size="sm">Accept <Kbd>A</Kbd></Button>
              <Button variant="danger" size="sm">Reject <Kbd>R</Kbd></Button>
              <Button variant="outline" size="sm">Uncertain</Button>
              <Button variant="ghost" size="sm">Exclude</Button>
            </>
          )}
          {tab === "mitigation" && (
            <>
              <Button variant="accent" size="sm">Confirm override</Button>
              <Button variant="outline" size="sm">Flag regression</Button>
              <Button variant="ghost" size="sm">Exclude</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
