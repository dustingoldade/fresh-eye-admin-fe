"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { filterPallets, ImageFilters } from "@/mock/queries";
import { skus, users, userById, skuById, currentModelChain } from "@/mock/data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatAbsolute, formatPct, formatRelative } from "@/lib/utils";
import { Verdict } from "@/mock/types";
import Link from "next/link";
import { X, AlertTriangle, MessageSquareDiff, Hash, Eye, EyeOff } from "lucide-react";

const VERDICTS: Verdict[] = ["accept", "reject", "low_confidence", "unassisted"];

function toArr(s: string | null): string[] {
  return s ? s.split(",").filter(Boolean) : [];
}

export default function ImageRegisterPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const filters: ImageFilters = {
    dateRange: (sp.get("range") as any) ?? "today",
    skuIds: toArr(sp.get("sku")),
    verdicts: toArr(sp.get("verdict")) as Verdict[],
    operatorIds: toArr(sp.get("op")),
    confMin: sp.get("conf_min") ? Number(sp.get("conf_min")) : undefined,
    confMax: sp.get("conf_max") ? Number(sp.get("conf_max")) : undefined,
    hasDisagreement: sp.get("disagreement") === "1" || undefined,
    countMismatch: sp.get("count_mismatch") === "1" || undefined,
    assisted: (sp.get("assisted") as any) ?? "all",
    tagSearch: sp.get("q") ?? undefined,
  };
  const page = Number(sp.get("page") ?? 1);
  const pageSize = Number(sp.get("size") ?? 50);
  const sort = sp.get("sort") ?? "newest";

  const result = useMemo(() => {
    let list = filterPallets(filters);
    if (sort === "oldest") list = list.reverse();
    if (sort === "conf_desc") list = [...list].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    if (sort === "conf_asc") list = [...list].sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0));
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const total = result.length;
  const rows = result.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setParam = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(sp);
    if (value === null || value === undefined || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.replace(`/images?${params.toString()}`, { scroll: false });
  };

  const toggleInCsv = (key: string, value: string) => {
    const current = toArr(sp.get(key));
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setParam(key, next.join(","));
  };

  const clearAll = () => router.replace("/images?range=today", { scroll: false });

  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (filters.dateRange && filters.dateRange !== "today") activeChips.push({ key: "range", label: `Date: ${filters.dateRange}`, onRemove: () => setParam("range", "today") });
  (filters.skuIds ?? []).forEach((id) => activeChips.push({ key: `sku:${id}`, label: `SKU: ${skuById(id)?.label ?? id}`, onRemove: () => toggleInCsv("sku", id) }));
  (filters.verdicts ?? []).forEach((v) => activeChips.push({ key: `verdict:${v}`, label: `Verdict: ${v}`, onRemove: () => toggleInCsv("verdict", v) }));
  (filters.operatorIds ?? []).forEach((id) => activeChips.push({ key: `op:${id}`, label: `Operator: ${userById(id)?.displayName ?? id}`, onRemove: () => toggleInCsv("op", id) }));
  if (filters.hasDisagreement) activeChips.push({ key: "disagreement", label: "Has disagreement", onRemove: () => setParam("disagreement", null) });
  if (filters.countMismatch) activeChips.push({ key: "count_mismatch", label: "Count mismatch", onRemove: () => setParam("count_mismatch", null) });
  if (filters.assisted && filters.assisted !== "all") activeChips.push({ key: "assisted", label: filters.assisted, onRemove: () => setParam("assisted", "all") });
  if (filters.tagSearch) activeChips.push({ key: "q", label: `"${filters.tagSearch}"`, onRemove: () => setParam("q", null) });

  return (
    <div className="p-6 flex flex-col gap-4 max-w-[1600px]">
      <PageHeader
        title="Image register"
        subtitle={`All pallet captures across the tenant · model chain ${currentModelChain.sku} / ${currentModelChain.count} / ${currentModelChain.defect}`}
      />

      {/* Filter bar */}
      <div className="card p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search pallet ID, operator, SKU..."
            defaultValue={filters.tagSearch ?? ""}
            onKeyDown={(e) => e.key === "Enter" && setParam("q", (e.target as HTMLInputElement).value)}
            className="w-56"
          />
          <Select value={filters.dateRange} onChange={(e) => setParam("range", e.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </Select>

          <FilterMultiSelect
            label="SKU"
            options={skus.map((s) => ({ value: s.id, label: s.label }))}
            active={filters.skuIds ?? []}
            onToggle={(v) => toggleInCsv("sku", v)}
          />

          <FilterMultiSelect
            label="Verdict"
            options={VERDICTS.map((v) => ({ value: v, label: v.replace("_", " ") }))}
            active={filters.verdicts ?? []}
            onToggle={(v) => toggleInCsv("verdict", v)}
          />

          <FilterMultiSelect
            label="Operator"
            options={users.filter((u) => !u.isSuperAdmin || u.id === "u_dustin").map((u) => ({ value: u.id, label: u.displayName }))}
            active={filters.operatorIds ?? []}
            onToggle={(v) => toggleInCsv("op", v)}
          />

          <Select value={filters.assisted ?? "all"} onChange={(e) => setParam("assisted", e.target.value === "all" ? null : e.target.value)}>
            <option value="all">Assisted: all</option>
            <option value="assisted">Assisted only</option>
            <option value="unassisted">Unassisted only</option>
          </Select>

          <ToggleChip active={!!filters.hasDisagreement} onClick={() => setParam("disagreement", filters.hasDisagreement ? null : "1")}>
            Has disagreement
          </ToggleChip>
          <ToggleChip active={!!filters.countMismatch} onClick={() => setParam("count_mismatch", filters.countMismatch ? null : "1")}>
            Count mismatch
          </ToggleChip>

          <div className="ml-auto flex items-center gap-2">
            <Select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="conf_desc">Highest confidence</option>
              <option value="conf_asc">Lowest confidence</option>
            </Select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
            <span className="mono text-2xs uppercase text-muted-fg" style={{ letterSpacing: "0.04em" }}>active filters:</span>
            {activeChips.map((c) => (
              <button
                key={c.key}
                onClick={c.onRemove}
                className="inline-flex items-center gap-1 px-2 py-0.5 border border-accent text-accent text-xs hover:bg-accent hover:text-accent-fg transition"
                style={{ borderRadius: 6 }}
              >
                {c.label} <X className="w-2.5 h-2.5" strokeWidth={1.75} />
              </button>
            ))}
            <button onClick={clearAll} className="mono text-2xs uppercase text-muted-fg hover:text-foreground">clear all</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 h-10 border-b border-border">
          <span className="mono text-xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
            {total} pallet{total === 1 ? "" : "s"} · page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onChange={(e) => setParam("size", e.target.value)}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              {["", "Time", "SKU", "Verdict", "Conf.", "Model chain", "Operator", "Flags"].map((h) => (
                <th key={h} className="label text-left px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const sku = p.skuId ? skuById(p.skuId) : null;
              const op = userById(p.operatorId);
              return (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-subtle transition cursor-pointer" onClick={() => router.push(`/images/${p.id}`)}>
                  <td className="px-3 py-2 w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://picsum.photos/seed/${p._imageSeed}-f0/96/96`} alt="" className="w-12 h-12 object-cover border border-border" style={{ borderRadius: 6 }} />
                  </td>
                  <td className="px-3 py-2 mono tabular text-sm text-muted-fg" title={formatAbsolute(p.startedAt)}>
                    {formatRelative(p.startedAt)}
                  </td>
                  <td className="px-3 py-2">
                    {sku ? (
                      <Link href={`/skus/${sku.slug}`} className="group" onClick={(e) => e.stopPropagation()}>
                        <div className="text-sm text-foreground group-hover:text-accent">{sku.label}</div>
                        <div className="mono text-2xs text-muted-fg">{sku.slug}</div>
                      </Link>
                    ) : (
                      <span className="mono text-xs text-muted-fg uppercase">unassisted</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={p.finalVerdict as any} />
                  </td>
                  <td className="px-3 py-2 mono tabular text-sm">{p.confidence ? formatPct(p.confidence, 0) : "—"}</td>
                  <td className="px-3 py-2 mono tabular text-xs text-muted-fg">
                    {p.assisted ? `${currentModelChain.sku} / ${currentModelChain.count} / ${currentModelChain.defect}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleInCsv("op", p.operatorId); }}
                      className="hover:text-accent transition"
                    >
                      {op?.displayName ?? "—"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 text-muted-fg">
                      {p.hasDisagreement && <MessageSquareDiff className="w-3.5 h-3.5 text-status-amber" strokeWidth={1.5} />}
                      {p.countMismatch && <Hash className="w-3.5 h-3.5 text-status-amber" strokeWidth={1.5} />}
                      {p.assisted ? <Eye className="w-3.5 h-3.5" strokeWidth={1.5} /> : <EyeOff className="w-3.5 h-3.5 text-status-gray" strokeWidth={1.5} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-fg">No pallets match those filters.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="mono text-xs text-muted-fg">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>← Prev</Button>
            <div className="mono text-xs px-3 tabular">{page} / {totalPages}</div>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setParam("page", String(page + 1))}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-2 text-xs border transition",
        active ? "bg-accent text-accent-fg border-accent" : "bg-background text-foreground border-border hover:border-border-strong"
      )}
      style={{ borderRadius: 6 }}
    >
      {children}
    </button>
  );
}

function FilterMultiSelect({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <details className="relative">
      <summary
        className="list-none h-8 px-2 text-xs bg-background border border-border hover:border-border-strong flex items-center gap-1 cursor-pointer select-none"
        style={{ borderRadius: 6 }}
      >
        <span className="text-foreground">{label}</span>
        {active.length > 0 && (
          <span className="mono text-2xs bg-accent text-accent-fg px-1" style={{ borderRadius: 6 }}>
            {active.length}
          </span>
        )}
      </summary>
      <div
        className="absolute top-full left-0 mt-1 z-20 bg-background border border-border py-1 min-w-[180px] max-h-60 overflow-auto"
        style={{ borderRadius: 8 }}
      >
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-2 py-1 hover:bg-subtle cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={active.includes(o.value)}
              onChange={() => onToggle(o.value)}
              className="accent-accent"
            />
            <span className="capitalize">{o.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
