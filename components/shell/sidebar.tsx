"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  Boxes,
  ScanLine,
  BookOpen,
  Building2,
  Heart,
  DollarSign,
  Wrench,
  Cpu,
  FileClock,
  type LucideIcon,
} from "lucide-react";
import { useRole } from "./role-context";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  stub?: boolean;
}

const TENANT_NAV: NavItem[] = [
  { href: "/", label: "overview", icon: Activity },
  { href: "/food_passport", label: "food passports", icon: Boxes },
  { href: "/images/pallets", label: "scanned pallets", icon: ScanLine },
  { href: "/glossary", label: "glossary", icon: BookOpen },
];

const SUPER_NAV: NavItem[] = [
  { href: "/super-admin", label: "tenant roster", icon: Building2 },
  { href: "/super-admin/service-health", label: "service health", icon: Heart, stub: true },
  { href: "/super-admin/cost", label: "cost / usage", icon: DollarSign, stub: true },
  { href: "/super-admin/ops", label: "ops actions", icon: Wrench, stub: true },
  { href: "/super-admin/models", label: "model management", icon: Cpu, stub: true },
  { href: "/super-admin/audit", label: "audit", icon: FileClock, stub: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const nav = role === "super_admin" ? SUPER_NAV : TENANT_NAV;

  return (
    <nav className="h-full w-56 border-r border-border flex flex-col py-3 shrink-0 bg-background">
      <div className="label px-5 py-2">
        {role === "super_admin" ? "super admin" : "tenant admin"}
      </div>
      <ul className="flex flex-col gap-0.5 px-2">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition group",
                  active
                    ? "text-foreground bg-subtle font-medium"
                    : "text-muted-fg hover:text-foreground hover:bg-subtle"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active && "text-accent")} strokeWidth={1.75} />
                <span className="capitalize">{item.label}</span>
                {item.stub && (
                  <span className="ml-auto mono text-2xs text-subtle-fg uppercase" style={{ letterSpacing: "0.04em" }}>soon</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto px-5 py-3 border-t border-border">
        <div className="label mb-1">version</div>
        <div className="mono text-xs text-muted-fg">FreshEye@0.1.0</div>
      </div>
    </nav>
  );
}
