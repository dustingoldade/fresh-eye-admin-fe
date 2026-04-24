"use client";
import { alerts } from "@/mock/data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatAbsolute, formatRelative } from "@/lib/utils";

export default function AlertsPage() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1100px]">
      <PageHeader title="Alerts" subtitle={`${alerts.filter((a) => !a.acknowledgedAt).length} unacknowledged · ack workflow stubbed for v1.1`} />

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              {["Severity", "Category", "Message", "Created", "State", ""].map((h) => (
                <th key={h} className="label text-left px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <StatusPill
                    status={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "neutral"}
                    variant="filled"
                    label={a.severity.toUpperCase()}
                  />
                </td>
                <td className="px-4 py-3 mono text-xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>{a.category}</td>
                <td className="px-4 py-3 text-sm">{a.message}</td>
                <td className="px-4 py-3 mono tabular text-sm text-muted-fg" title={formatAbsolute(a.createdAt)}>{formatRelative(a.createdAt)}</td>
                <td className="px-4 py-3">
                  {a.acknowledgedAt ? (
                    <StatusPill status="active" label="acked" />
                  ) : (
                    <StatusPill status="critical" label="open" />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!a.acknowledgedAt && <Button variant="outline" size="sm">Acknowledge</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mono text-2xs uppercase text-subtle-fg" style={{ letterSpacing: "0.08em" }}>
        alert threshold configuration — out of scope v1
      </div>
    </div>
  );
}
