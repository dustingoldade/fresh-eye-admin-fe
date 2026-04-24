"use client";
import { devices } from "@/mock/data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Glasses, Smartphone } from "lucide-react";
import { formatRelative } from "@/lib/utils";

const NOW = Date.now();

export default function DevicesPage() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1400px]">
      <PageHeader title="Devices" subtitle={`${devices.length} registered · heartbeat cadence 0.5s`} />

      <div className="grid grid-cols-3 gap-4">
        {devices.map((d) => {
          const last = new Date(d.lastHeartbeatAt).getTime();
          const active = NOW - last < 60_000;
          const Icon = d.type === "rayban" ? Glasses : Smartphone;
          return (
            <div key={d.id} className="card p-4 flex items-start gap-4">
              <div className="w-10 h-10 flex items-center justify-center border border-border" style={{ borderRadius: 8 }}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-md font-medium truncate">{d.nickname}</div>
                    <div className="mono text-xs text-muted-fg uppercase" style={{ letterSpacing: "0.04em" }}>
                      {d.type === "rayban" ? "Ray-Ban Meta" : "iPhone"}
                    </div>
                  </div>
                  <StatusPill status={active ? "active" : "offline"} />
                </div>
                <div className="mt-3 pt-3 border-t border-border mono text-2xs text-muted-fg uppercase flex items-center justify-between" style={{ letterSpacing: "0.04em" }}>
                  <span>{d.id}</span>
                  <span>last hb · {formatRelative(d.lastHeartbeatAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
