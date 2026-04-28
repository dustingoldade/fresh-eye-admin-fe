"use client";
import { HeroStatsStrip, HeroStat } from "@/components/ui/hero-stats";
import { dashboardStats, hourlySeries, palletsInRange, todayRange } from "@/mock/queries";
import { pallets, NOW } from "@/mock/data";
import { PageHeader } from "@/components/ui/page-header";
import { FreshLineChart } from "@/components/charts/line-chart";
import { FreshPieChart, PieSlice } from "@/components/charts/pie-chart";
import { Boxes, Users } from "lucide-react";

export default function DashboardPage() {
  const stats = dashboardStats();

  const heroStats: HeroStat[] = [
    {
      label: "Pallets inspected",
      value: String(pallets.length),
      icon: Boxes,
      href: "/images/pallets?range=all",
      comparisons: [{ arrow: "→", color: "gray", text: "lifetime total" }],
    },
    {
      label: "Live operators",
      value: String(stats.operatorsActive),
      icon: Users,
      live: stats.operatorsActive > 0,
      comparisons: [{ arrow: "→", color: "gray", text: "heartbeats last 90s" }],
    },
  ];

  // Today's pallets — drives both pie charts
  const today = todayRange();
  const todays = palletsInRange(today);

  const verdictPie: PieSlice[] = [
    {
      key: "accept",
      label: "Accepted",
      value: todays.filter((p) => p.finalVerdict === "accept").length,
      color: "#10B981",
    },
    {
      key: "reject",
      label: "Rejected",
      value: todays.filter((p) => p.finalVerdict === "reject").length,
      color: "#EF4444",
    },
  ];

  const handled = todays.filter(
    (p) => !!p.skuId && !p.requiredMitigation && p.finalVerdict !== "low_confidence",
  ).length;
  const unassisted = todays.filter((p) => !p.skuId).length;
  const mitigation = todays.filter(
    (p) => p.requiredMitigation || p.finalVerdict === "low_confidence",
  ).length;

  const pipelinePie: PieSlice[] = [
    { key: "handled", label: "FreshEye Success Rate", value: handled, color: "#6666F6" },
    { key: "unassisted", label: "Unassisted", value: unassisted, color: "#A1A1AA" },
    { key: "mitigation", label: "Required mitigation", value: mitigation, color: "#F59E0B" },
  ];

  // Hourly chart data for today across all SKUs
  const series = hourlySeries(today.from, today.to);
  const chartData = series.map((b) => ({
    hour: b.hour,
    pallets: b.total,
    rejects: b.rejects,
  }));

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Overview"
        subtitle={`Inspection operations · ${NOW.toDateString()}`}
      />

      <HeroStatsStrip stats={heroStats} />

      {/* Pie row */}
      <div className="grid grid-cols-2 gap-6">
        <section className="card overflow-hidden">
          <div className="px-5 h-11 flex items-center justify-between border-b border-border">
            <div>
              <h2 className="text-sm font-medium">Pipeline outcome</h2>
              <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>
                FreshEye Success Rate · unassisted · required mitigation
              </p>
            </div>
          </div>
          <div className="p-5">
            <FreshPieChart
              data={pipelinePie}
              centerLabel="today"
              emptyLabel="No pallets inspected yet today"
            />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="px-5 h-11 flex items-center justify-between border-b border-border">
            <div>
              <h2 className="text-sm font-medium">Today&apos;s verdicts</h2>
              <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>
                accepted vs rejected pallets
              </p>
            </div>
          </div>
          <div className="p-5">
            <FreshPieChart
              data={verdictPie}
              centerLabel="terminal"
              emptyLabel="No accept/reject pallets yet today"
            />
          </div>
        </section>
      </div>

      {/* Today's volume — full width */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 h-11 border-b border-border">
          <div>
            <h2 className="text-sm font-medium">Today&apos;s volume</h2>
            <p className="mono text-2xs text-muted-fg uppercase mt-0.5" style={{ letterSpacing: "0.04em" }}>
              hourly pallet throughput · accent = total · gray = rejects
            </p>
          </div>
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
    </div>
  );
}
