"use client";
import { useRole } from "./role-context";
import { ChevronDown, Shield, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);

  const options = [
    { id: "tenant_admin" as const, label: "Tenant Admin", icon: User },
    { id: "super_admin" as const, label: "Super Admin", icon: Shield },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-2.5 border border-border bg-background hover:bg-subtle transition rounded-md shadow-xs text-xs"
      >
        <span className="text-muted-fg mono uppercase" style={{ letterSpacing: "0.04em" }}>role</span>
        <span className="text-foreground font-medium">{role === "super_admin" ? "Super" : "Tenant"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-fg" strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1.5 z-50 bg-background border border-border py-1.5 w-48 rounded-lg shadow-sm"
          >
            <div className="px-2.5 py-1 label">Dev role switcher</div>
            {options.map((o) => {
              const Icon = o.icon;
              const active = role === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setRole(o.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-subtle transition text-left rounded-md mx-0.5",
                    active && "text-accent"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{o.label}</span>
                  {active && <span className="ml-auto mono text-2xs uppercase text-accent" style={{ letterSpacing: "0.04em" }}>active</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
