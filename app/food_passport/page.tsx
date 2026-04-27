"use client";
import { useMemo, useState } from "react";
import { skus, pallets, referenceImages } from "@/mock/data";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPct, formatRelative } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Search, Plus } from "lucide-react";

type StatusFilter = "all" | "active" | "unassisted_only" | "inactive";
type SortKey = "name" | "scanned" | "success_rate" | "last_activity";

const SUCCESS_CONF_THRESHOLD = 0.98;

export default function FoodPassportListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");

  const decorated = useMemo(() => {
    return skus.map((s) => {
      const skuPallets = pallets.filter((p) => p.skuId === s.id);
      const totalScanned = skuPallets.length;

      // FreshEye Success Rate: model handled the pallet without operator help, at high confidence.
      // = assisted (CV ran) + no operator override + confidence >= 98%
      const successes = skuPallets.filter(
        (p) => p.assisted && !p.requiredMitigation && (p.confidence ?? 0) >= SUCCESS_CONF_THRESHOLD,
      ).length;
      const successRate = totalScanned === 0 ? null : successes / totalScanned;

      const last = [...skuPallets].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0];
      const primaryImg = referenceImages.find((r) => r.skuId === s.id && r.isPrimary);

      return { sku: s, totalScanned, successRate, last, primaryImg };
    });
  }, []);

  const filtered = useMemo(() => {
    let list = decorated;
    if (q) list = list.filter((d) => d.sku.label.toLowerCase().includes(q.toLowerCase()) || d.sku.slug.includes(q.toLowerCase()));
    if (status !== "all") list = list.filter((d) => d.sku.status === status);

    if (sort === "name") list = [...list].sort((a, b) => a.sku.label.localeCompare(b.sku.label));
    if (sort === "scanned") list = [...list].sort((a, b) => b.totalScanned - a.totalScanned);
    if (sort === "success_rate") list = [...list].sort((a, b) => (b.successRate ?? -1) - (a.successRate ?? -1));
    if (sort === "last_activity") list = [...list].sort((a, b) => +new Date(b.last?.startedAt ?? 0) - +new Date(a.last?.startedAt ?? 0));

    return list;
  }, [decorated, q, status, sort]);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Food passports"
        subtitle={`${skus.length} registered · tenant-scoped · per-passport scan + edit`}
        actions={
          <Button variant="default" size="sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} /> New passport
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[220px]">
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
          <option value="scanned">Sort: Total scanned</option>
          <option value="success_rate">Sort: Success rate</option>
          <option value="last_activity">Sort: Last activity</option>
        </Select>
        <div className="ml-auto mono text-xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
          {filtered.length} / {skus.length} shown
        </div>
      </div>

      {/* Column header */}
      <div className="flex items-center gap-4 px-4 h-8 label">
        <div style={{ width: 64 }}>{/* image col */}</div>
        <div className="flex-1 min-w-0">Passport</div>
        <div className="w-28 text-right">Total scanned</div>
        <div className="w-40 text-right">FreshEye success</div>
        <div className="w-24">Status</div>
        <div className="w-24 text-right">Last scan</div>
        <div className="w-6" />
      </div>

      {/* One-per-row list */}
      <div className="card overflow-hidden divide-y divide-border">
        {filtered.map((d) => (
          <Link
            key={d.sku.id}
            href={`/food_passport/${d.sku.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-subtle transition group"
          >
            <div className="shrink-0" style={{ width: 64, height: 64 }}>
              {d.primaryImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.primaryImg.url}
                  alt={d.sku.label}
                  className="w-16 h-16 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-md border border-dashed border-border bg-subtle" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-md font-medium text-foreground group-hover:text-accent truncate">
                  {d.sku.label}
                </span>
                <span className="mono text-xs text-muted-fg truncate">{d.sku.slug}</span>
              </div>
              <div className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>
                {d.sku.parentLabel ?? "—"}
              </div>
            </div>

            <div className="w-28 text-right">
              <div className="mono tabular text-md text-foreground" style={{ fontWeight: 600 }}>
                {d.totalScanned}
              </div>
              <div className="mono text-2xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
                lifetime
              </div>
            </div>

            <div className="w-40 text-right">
              {d.successRate === null ? (
                <span className="mono text-md text-muted-fg tabular">—</span>
              ) : (
                <>
                  <div
                    className="mono tabular text-md"
                    style={{
                      fontWeight: 600,
                      color:
                        d.successRate >= 0.9
                          ? "#10B981"
                          : d.successRate >= 0.7
                          ? "#F59E0B"
                          : "#EF4444",
                    }}
                  >
                    {formatPct(d.successRate, 1)}
                  </div>
                  <div className="mono text-2xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
                    FreshEye Success Rate
                  </div>
                </>
              )}
            </div>

            <div className="w-24">
              <StatusPill
                status={
                  d.sku.status === "active"
                    ? "active"
                    : d.sku.status === "inactive"
                    ? "offline"
                    : "neutral"
                }
                label={d.sku.status.replace("_", " ")}
              />
            </div>

            <div className="w-24 text-right">
              <span className="mono tabular text-xs text-muted-fg">
                {d.last ? formatRelative(d.last.startedAt) : "—"}
              </span>
            </div>

            <div className="w-6 text-muted-fg group-hover:text-accent transition">
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-fg text-sm">
            No food passports match those filters.
          </div>
        )}
      </div>
    </div>
  );
}
