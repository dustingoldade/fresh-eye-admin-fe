"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { COMPARISON_WINDOWS, ComparisonWindow } from "@/mock/types";
import { cn } from "@/lib/utils";

export const DEFAULT_WINDOW: ComparisonWindow = "30d_avg";

export function useComparisonWindow(): ComparisonWindow {
  const sp = useSearchParams();
  const raw = sp.get("cmp") as ComparisonWindow | null;
  if (raw && COMPARISON_WINDOWS.find((c) => c.id === raw)) return raw;
  return DEFAULT_WINDOW;
}

export function ComparisonWindowSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = useComparisonWindow();

  const set = (id: ComparisonWindow) => {
    const params = new URLSearchParams(sp);
    params.set("cmp", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="inline-flex items-stretch p-0.5 bg-subtle border border-border rounded-lg shadow-xs" style={{ height: 32 }}>
      {COMPARISON_WINDOWS.map((w) => {
        const active = w.id === current;
        return (
          <button
            key={w.id}
            onClick={() => set(w.id)}
            className={cn(
              "px-3 text-xs rounded-md transition",
              active
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-fg hover:text-foreground"
            )}
            style={{ fontWeight: active ? 500 : 400 }}
          >
            {w.label}
          </button>
        );
      })}
    </div>
  );
}

export function comparisonLabel(w: ComparisonWindow): string {
  return COMPARISON_WINDOWS.find((c) => c.id === w)?.label.toLowerCase() ?? w;
}
