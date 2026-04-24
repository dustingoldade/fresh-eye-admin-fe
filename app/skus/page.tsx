"use client";
import { useState, useMemo } from "react";
import { skus, pallets, referenceImages } from "@/mock/data";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatPct, formatRelative, formatDeltaRejectRate } from "@/lib/utils";
import { useComparisonWindow, comparisonLabel } from "@/components/shell/comparison-window";
import { palletsInRange, rangeForWindow, rejectRate, todayRange } from "@/mock/queries";
import Link from "next/link";
import { Search, Star } from "lucide-react";

type StatusFilter = "all" | "active" | "unassisted_only" | "inactive";
type SortKey = "name" | "reject_rate" | "last_activity" | "volume";

export default function SkusListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const cmp = useComparisonWindow();

  const decorated = useMemo(() => {
    const today = todayRange();
    const range = rangeForWindow(cmp);

    return skus.map((s) => {
      const todays = palletsInRange(today, s.id);
      const rr = todays.length === 0 ? null : rejectRate(todays);
      const cmpItems = palletsInRange(range, s.id);
      const rrCmp = rejectRate(cmpItems);
      const rrDelta = rr === null ? 0 : rr - rrCmp;
      const last = pallets
        .filter((p) => p.skuId === s.id)
        .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0];
      const primaryImg = referenceImages.find((r) => r.skuId === s.id && r.isPrimary);
      return { sku: s, todays: todays.length, rr, rrDelta, last, primaryImg };
    });
  }, [cmp]);

  const filtered = useMemo(() => {
    let list = decorated;
    if (q) list = list.filter((d) => d.sku.label.toLowerCase().includes(q.toLowerCase()) || d.sku.slug.includes(q.toLowerCase()));
    if (status !== "all") list = list.filter((d) => d.sku.status === status);
    if (sort === "name") list = [...list].sort((a, b) => a.sku.label.localeCompare(b.sku.label));
    if (sort === "reject_rate") list = [...list].sort((a, b) => (b.rr ?? -1) - (a.rr ?? -1));
    if (sort === "volume") list = [...list].sort((a, b) => b.todays - a.todays);
    if (sort === "last_activity") list = [...list].sort((a, b) => +new Date(b.last?.startedAt ?? 0) - +new Date(a.last?.startedAt ?? 0));
    return list;
  }, [decorated, q, status, sort]);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px]">
      <PageHeader title="SKUs" subtitle={`${skus.length} registered · tenant-scoped slugs`} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-fg" strokeWidth={1.5} />
          <Input
            placeholder="Search by name or slug..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-7"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="unassisted_only">Unassisted-only</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="name">Sort: Name</option>
          <option value="reject_rate">Sort: Reject rate</option>
          <option value="last_activity">Sort: Last activity</option>
          <option value="volume">Sort: Volume today</option>
        </Select>
        <div className="ml-auto mono text-xs text-muted-fg uppercase">
          {filtered.length} / {skus.length} shown · vs. {comparisonLabel(cmp)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((d) => (
          <Link
            key={d.sku.id}
            href={`/skus/${d.sku.slug}`}
            className="card flex flex-col overflow-hidden hover:border-border-strong transition group"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-subtle border-b border-border">
              {d.primaryImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.primaryImg.url} alt={d.sku.label} className="w-full h-full object-cover group-hover:scale-[1.01] transition" />
              )}
              <div className="absolute top-2 left-2">
                <StatusPill
                  status={d.sku.status === "active" ? "active" : d.sku.status === "inactive" ? "offline" : "neutral"}
                  label={d.sku.status.replace("_", " ")}
                  variant="outlined"
                />
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 mono text-2xs uppercase bg-background/90 border border-border" style={{ borderRadius: 6, letterSpacing: "0.04em" }}>
                <Star className="w-3 h-3" strokeWidth={1.5} /> primary
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="mono text-2xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
                    {d.sku.parentLabel ?? "—"}
                  </div>
                  <div className="text-md font-medium tracking-tight text-foreground group-hover:text-accent">{d.sku.label}</div>
                  <div className="mono text-xs text-muted-fg mt-0.5">{d.sku.slug}</div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2 pt-3 border-t border-border">
                <div>
                  <div className="label text-2xs">Reject today</div>
                  <div className="mono tabular text-xl" style={{ fontWeight: 500, color: d.rr === null ? "#A1A1AA" : d.rr >= 0.2 ? "#EF4444" : d.rr >= 0.1 ? "#F59E0B" : undefined }}>
                    {d.rr === null ? "—" : formatPct(d.rr)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="label text-2xs">Pallets</div>
                  <div className="mono tabular text-xl" style={{ fontWeight: 500 }}>{d.todays}</div>
                </div>
                <div className="text-right">
                  <div className="label text-2xs">Δ vs. {comparisonLabel(cmp)}</div>
                  <div className="mono tabular text-xs">
                    {d.rr === null ? (
                      <span className="text-muted-fg">—</span>
                    ) : (() => {
                      const dlt = formatDeltaRejectRate(d.rrDelta);
                      const color = dlt.color === "green" ? "#10B981" : dlt.color === "red" ? "#EF4444" : "#A1A1AA";
                      return <span style={{ color }}>{dlt.arrow} {dlt.label}</span>;
                    })()}
                  </div>
                </div>
              </div>

              <div className="mono text-2xs text-muted-fg uppercase flex items-center justify-between" style={{ letterSpacing: "0.04em" }}>
                <span>Expected {d.sku.expectedCount} ± {d.sku.countTolerance}</span>
                <span>Last {d.last ? formatRelative(d.last.startedAt) : "—"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center text-muted-fg text-sm">
          No SKUs match those filters.
        </div>
      )}
    </div>
  );
}
