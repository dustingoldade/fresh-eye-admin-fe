"use client";
import { ComparisonWindowSelector } from "./comparison-window";
import { RoleSwitcher } from "./role-switcher";
import { User2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { tenants } from "@/mock/data";
import { useRole } from "./role-context";

export function TopBar() {
  const { role } = useRole();
  const tenant = tenants[0];

  return (
    <header className="h-14 border-b border-border flex items-center px-5 gap-4 shrink-0 bg-background">
      <Link href={role === "super_admin" ? "/super-admin" : "/"} className="flex items-center gap-2.5 group">
        <Image
          src="/logo-min.png"
          alt="FreshEye"
          width={28}
          height={28}
          priority
          className="object-contain"
        />
        <span className="text-md font-semibold tracking-tight">
          Fresh<span className="text-accent">Eye</span>
        </span>
        <span className="mono text-2xs text-subtle-fg uppercase ml-0.5 hidden sm:inline" style={{ letterSpacing: "0.08em" }}>admin</span>
      </Link>
      <span className="text-border hidden md:inline">/</span>
      <div className="hidden md:flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {role === "super_admin" ? "All tenants" : tenant.name}
        </span>
        {role === "tenant_admin" && (
          <span className="mono text-2xs text-subtle-fg uppercase" style={{ letterSpacing: "0.08em" }}>
            {tenant.region} · {tenant.plan.toLowerCase()}
          </span>
        )}
      </div>

      <div className="mx-auto">
        {role === "tenant_admin" && <ComparisonWindowSelector />}
      </div>

      <div className="flex items-center gap-2">
        <RoleSwitcher />
        <button
          className="flex items-center gap-2 h-8 px-2.5 border border-border bg-background hover:bg-subtle transition rounded-md shadow-xs"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-accent-fg mono text-2xs font-semibold">D</span>
          <span className="text-xs text-foreground hidden sm:inline">Dustin</span>
        </button>
      </div>
    </header>
  );
}
