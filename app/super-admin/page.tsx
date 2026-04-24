"use client";
import { tenants, tenantRollups } from "@/mock/data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPct } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowRight, Search, Building2 } from "lucide-react";
import { useRole } from "@/components/shell/role-context";

export default function TenantRosterPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tenants
      .map((t) => ({ tenant: t, rollup: tenantRollups.find((r) => r.tenantId === t.id)! }))
      .filter(({ tenant }) => !q || tenant.name.toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  const impersonate = (tenantId: string) => {
    // In a real app this would stash a tenant override. For wireframe: hop to tenant view.
    setRole("tenant_admin");
    router.push("/");
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px]">
      <PageHeader
        title="Tenant roster"
        subtitle={`${tenants.length} tenants · Circus Group admin scope`}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-fg" strokeWidth={1.5} />
          <Input
            placeholder="Search tenants..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-7"
          />
        </div>
        <div className="ml-auto mono text-xs text-muted-fg uppercase">
          {filtered.length} / {tenants.length} shown
        </div>
        <Button variant="default" size="sm">+ New tenant</Button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              {["Tenant", "Region", "Plan", "Pallets today", "Reject rate", "Operators active", "Service", "Monthly spend", ""].map((h) => (
                <th key={h} className="label text-left px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ tenant, rollup }) => (
              <tr key={tenant.id} className="border-b border-border last:border-b-0 hover:bg-subtle transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center border border-border" style={{ borderRadius: 6 }}>
                      <Building2 className="w-3 h-3" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tenant.name}</div>
                      <div className="mono text-2xs text-muted-fg">{tenant.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 mono text-xs uppercase">{tenant.region}</td>
                <td className="px-4 py-3 mono text-xs uppercase">{tenant.plan.toLowerCase()}</td>
                <td className="px-4 py-3 mono tabular text-sm">{rollup.palletsToday}</td>
                <td className="px-4 py-3 mono tabular text-sm">
                  <span style={{ color: rollup.rejectRate >= 0.2 ? "#EF4444" : rollup.rejectRate >= 0.1 ? "#F59E0B" : undefined }}>
                    {formatPct(rollup.rejectRate)}
                  </span>
                </td>
                <td className="px-4 py-3 mono tabular text-sm">{rollup.activeOperators}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    status={rollup.serviceStatus === "healthy" ? "healthy" : rollup.serviceStatus === "degraded" ? "degraded" : "offline"}
                  />
                </td>
                <td className="px-4 py-3 mono tabular text-sm">${rollup.monthlySpend.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => impersonate(tenant.id)}>
                    Impersonate <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mono text-2xs uppercase text-subtle-fg" style={{ letterSpacing: "0.08em" }}>
        cross-tenant ops (create / suspend / migrate) — stub · see /super-admin/ops
      </div>
    </div>
  );
}
