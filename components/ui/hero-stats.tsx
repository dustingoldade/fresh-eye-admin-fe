import { cn } from "@/lib/utils";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export interface HeroStat {
  label: string;
  value: string;
  href?: string;
  comparisons?: Array<{
    arrow: "↑" | "↓" | "→";
    color: "green" | "red" | "gray";
    text: string;
  }>;
  accent?: boolean;
  live?: boolean;
  icon?: LucideIcon;
}

const ARROW_COLOR: Record<string, string> = {
  green: "#10B981",
  red: "#EF4444",
  gray: "#A1A1AA",
};

export function HeroStatsStrip({ stats }: { stats: HeroStat[] }) {
  return (
    <div className={cn("grid gap-4", stats.length === 4 ? "grid-cols-4" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {stats.map((s, i) => {
        const Icon = s.icon;
        const inner = (
          <div
            className={cn(
              "card p-5 flex flex-col gap-2 h-full",
              s.href && "hover:border-border-strong hover:shadow-sm transition cursor-pointer"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="label">{s.label}</span>
              <div className="flex items-center gap-2">
                {s.live && (
                  <span className="flex items-center gap-1 mono text-2xs uppercase" style={{ letterSpacing: "0.08em", color: "#10B981" }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "#10B981" }} />
                    live
                  </span>
                )}
                {Icon && <Icon className="w-4 h-4 text-muted-fg" strokeWidth={1.75} />}
              </div>
            </div>
            <div
              className={cn("mono tabular", s.accent ? "text-accent" : "text-foreground")}
              style={{ fontSize: 32, lineHeight: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              {s.value}
            </div>
            {s.comparisons && (
              <div className="flex flex-col gap-0 mono tabular" style={{ fontSize: 11, lineHeight: "16px" }}>
                {s.comparisons.map((c, j) => (
                  <span key={j} className="text-muted-fg">
                    <span style={{ color: ARROW_COLOR[c.color], fontWeight: 500 }}>
                      {c.arrow} {c.text.split(" ")[0]}
                    </span>
                    <span className="text-muted-fg"> {c.text.split(" ").slice(1).join(" ")}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
        return (
          <div key={i}>
            {s.href ? <Link href={s.href}>{inner}</Link> : inner}
          </div>
        );
      })}
    </div>
  );
}
