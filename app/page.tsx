"use client";
import { HeroStatsStrip, HeroStat } from "@/components/ui/hero-stats";
import { StatusPill, PillStatus } from "@/components/ui/status-pill";
import { useComparisonWindow, comparisonLabel } from "@/components/shell/comparison-window";
import {
  dashboardStats,
  rejectRateForWindow,
  palletsCountForWindow,
  servicePills,
  reviewQueueCounts,
  hourlySeries,
  todayRange,
} from "@/mock/queries";
import { alerts, pallets, skus, userById, skuById } from "@/mock/data";
import { formatPct, formatDelta, formatDeltaRejectRate, formatRelative } from "@/lib/utils";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { FreshLineChart } from "@/components/charts/line-chart";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  XCircle,
  Users,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const cmp = useComparisonWindow();
  const stats = dashboardStats();
  const cmpLabel = comparisonLabel(cmp);

  // Deltas
  const compareCount = palletsCountForWindow(cmp);
  const countDelta = compareCount === 0 ? 0 : (stats.boxesToday - compareCount) / compareCount;
  const rrCompare = rejectRateForWindow(cmp);
  const rrDelta = stats.rejectRateToday - rrCompare;
  const accepted = pallets.filter((p) => isToday(p.startedAt) && p.finalVerdict === "accept").length;

  const heroStats: HeroStat[] = [
    {
      label: "Pallets inspected",
      value: String(stats.boxesToday),
      icon: Boxes,
      href: "/images?range=today",
      comparisons: [
        (() => {
          const d = formatDelta(countDelta);
          return { arrow: d.arrow, color: d.color, text: `${d.label} vs. ${cmpLabel}` };
        })(),
      ],
    },
    {
      label: "Accepted today",
      value: String(accepted),
      icon: CheckCircle2,
      href: "/images?range=today&verdict=accept",
      comparisons: [
        {
          arrow: "→",
          color: "gray",
          text: `${((accepted / Math.max(stats.boxesToday, 1)) * 100).toFixed(1)}% of total`,
        },
      ],
    },
    {
      label: "Reject rate",
      value: formatPct(stats.rejectRateToday, 1),
      icon: XCircle,
      accent: stats.rejectRateToday >= 0.1,
      href: "/images?range=today&verdict=reject",
      comparisons: [
        (() => {
          const d = formatDeltaRejectRate(rrDelta);
          return { arrow: d.arrow, color: d.color, text: `${d.label} vs. ${cmpLabel}` };
        })(),
      ],
    },
    {
      label: "Operators active",
      value: String(stats.operatorsActive),
      icon: Users,
      live: stats.operatorsActive > 0,
      comparisons: [{ arrow: "→", color: "gray", text: `heartbeats last 90s` }],
    },
  ];

  const pills = servicePills();
  const rq = reviewQueueCounts();

  const recentAlerts = [...alerts]
    .filter((a) => !a.acknowledgedAt)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3);

  // Hourly chart data for today across all SKUs
  const today = todayRange();
  const series = hourlySeries(today.from, today.to);
  const chartData = series.map((b) => ({
    hour: b.hour,
    pallets: b.total,
    rejects: b.rejects,
  }));

  // Latest 8 pallets for the side feed
  const latest = [...pallets].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)).slice(0, 8);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Overview"
        subtitle={`Inspection operations · ${new Date().toDateString()}`}
      />

      <HeroStatsStrip stats={heroStats} />

      {/* Service health row */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 h-11 border-b border-border">
          <h2 className="text-sm font-medium">Service health</h2>
          <span className="mono text-2xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>checked every 60s</span>
        </div>
        <div className="grid grid-cols-4">
          {(
            [
              ["Roboflow", pills.roboflow],
              ["Supabase", pills.supabase],
              ["TTS", pills.tts],
              ["Devices", pills.devices],
            ] as const
          ).map(([name, p], i) => (
            <div
              key={name}
              className={`px-5 py-4 flex flex-col gap-2 ${i > 0 ? "border-l border-border" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-fg font-medium">{name}</span>
                <StatusPill status={p.status as PillStatus} />
              </div>
              <span className="mono text-sm text-foreground tabular">{p.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Overview chart + latest activity (classic shadcn layout) */}
      <div className="grid grid-cols-3 gap-6">
        <section className="card col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 h-11 border-b border-border">
            <div>
              <h2 className="text-sm font-medium">Today&apos;s volume</h2>
              <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>hourly pallet throughput · red = rejects</p>
            </div>
            <Link
              href="/images?range=today"
              className="mono text-2xs uppercase text-muted-fg hover:text-accent flex items-center gap-1"
              style={{ letterSpacing: "0.04em" }}
            >
              view all <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="p-5">
            <FreshLineChart
              data={chartData}
              xKey="hour"
              series={[
                { key: "pallets", label: "Pallets", color: "accent" },
                { key: "rejects", label: "Rejects", color: "foreground", opacity: 0.35 },
              ]}
              xFormatter={(iso: string) => {
                const d = new Date(iso);
                return `${d.getHours()}:00`;
              }}
              yFormatter={(v: number) => String(Math.round(v))}
              height={240}
            />
          </div>
        </section>

        <section className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 h-11 border-b border-border">
            <div>
              <h2 className="text-sm font-medium">Latest activity</h2>
              <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>{latest.length} most recent</p>
            </div>
          </div>
          <div className="flex-1 divide-y divide-border">
            {latest.map((p) => {
              const sku = p.skuId ? skuById(p.skuId) : null;
              const op = userById(p.operatorId);
              return (
                <Link
                  key={p.id}
                  href={`/images/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-subtle transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${p._imageSeed}-f0/80/80`}
                    alt=""
                    className="w-9 h-9 rounded-md border border-border object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{sku?.label ?? "Unassisted"}</div>
                    <div className="mono text-2xs text-muted-fg uppercase truncate" style={{ letterSpacing: "0.04em" }}>
                      {op?.displayName ?? "—"} · {formatRelative(p.startedAt)}
                    </div>
                  </div>
                  <StatusPill status={p.finalVerdict as PillStatus} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Review queue + alerts */}
      <div className="grid grid-cols-3 gap-6">
        <section className="card col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 h-11 border-b border-border">
            <div>
              <h2 className="text-sm font-medium">Review queue</h2>
              <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>human-in-the-loop workflow</p>
            </div>
            <Link href="/review" className="mono text-2xs uppercase text-muted-fg hover:text-accent flex items-center gap-1" style={{ letterSpacing: "0.04em" }}>
              open <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-3">
            {[
              { label: "Unassisted", n: rq.unassisted, href: "/review?tab=unassisted", desc: "needs SKU tag" },
              { label: "Low-confidence", n: rq.lowConf, href: "/review?tab=low", desc: "verify defect call" },
              { label: "Disagreements", n: rq.disagreements, href: "/review?tab=disagree", desc: "QA spot-check" },
            ].map((it, i) => (
              <Link
                key={it.label}
                href={it.href}
                className={`p-5 hover:bg-subtle transition ${i > 0 ? "border-l border-border" : ""}`}
              >
                <div className="label mb-2">{it.label}</div>
                <div
                  className="mono tabular text-foreground"
                  style={{ fontSize: 28, fontWeight: 600, lineHeight: "32px", letterSpacing: "-0.02em" }}
                >
                  {it.n}
                </div>
                <div className="mt-2 text-xs text-muted-fg flex items-center gap-1">
                  {it.desc} <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 h-11 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-amber" strokeWidth={1.75} />
              <h2 className="text-sm font-medium">Alerts</h2>
            </div>
            <Link href="/alerts" className="mono text-2xs uppercase text-muted-fg hover:text-accent" style={{ letterSpacing: "0.04em" }}>view all</Link>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="p-5 text-sm text-muted-fg">No active alerts.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentAlerts.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                  <StatusPill
                    status={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "neutral"}
                    variant="filled"
                    label={a.severity.toUpperCase()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground leading-tight">{a.message}</div>
                    <div className="mono text-2xs text-muted-fg uppercase mt-1" style={{ letterSpacing: "0.04em" }}>
                      {a.category} · {formatRelative(a.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* SKU summary */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 h-11 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-fg" strokeWidth={1.75} />
            <h2 className="text-sm font-medium">SKU activity today</h2>
          </div>
          <Link href="/skus" className="mono text-2xs uppercase text-muted-fg hover:text-accent flex items-center gap-1" style={{ letterSpacing: "0.04em" }}>
            all SKUs <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle/60">
              {["SKU", "Status", "Pallets", "Reject rate", "Last activity"].map((h) => (
                <th key={h} className="label text-left px-5 py-2.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skus.map((s) => {
              const todays = pallets.filter((p) => p.skuId === s.id && isToday(p.startedAt));
              const rr = todays.length === 0 ? null : todays.filter((p) => p.finalVerdict === "reject").length / todays.length;
              const last = pallets
                .filter((p) => p.skuId === s.id)
                .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))[0];
              return (
                <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-subtle transition">
                  <td className="px-5 py-3">
                    <Link href={`/skus/${s.slug}`} className="group flex items-center gap-2">
                      <span className="text-sm text-foreground font-medium group-hover:text-accent">{s.label}</span>
                      <span className="mono text-2xs text-muted-fg">{s.slug}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill
                      status={s.status === "active" ? "active" : s.status === "inactive" ? "offline" : "neutral"}
                      label={s.status.replace("_", " ")}
                    />
                  </td>
                  <td className="px-5 py-3 mono tabular text-sm">{todays.length}</td>
                  <td className="px-5 py-3 mono tabular text-sm">
                    {rr === null ? (
                      <span className="text-muted-fg">—</span>
                    ) : (
                      <span style={{ color: rr >= 0.2 ? "#EF4444" : rr >= 0.1 ? "#F59E0B" : undefined, fontWeight: 500 }}>
                        {formatPct(rr)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 mono tabular text-sm text-muted-fg">
                    {last ? formatRelative(last.startedAt) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
