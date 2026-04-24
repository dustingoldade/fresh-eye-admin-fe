import { PageHeader } from "./page-header";
import { Construction } from "lucide-react";

interface StubPageProps {
  title: string;
  blurb: string;
  bullets?: string[];
}

export function StubPage({ title, blurb, bullets }: StubPageProps) {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-[900px]">
      <PageHeader title={title} subtitle="Coming in v1.1 — stub page for wireframe navigation." />
      <div className="card p-8 flex flex-col items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center border border-border" style={{ borderRadius: 8 }}>
          <Construction className="w-5 h-5 text-muted-fg" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-medium tracking-tight">Not built yet</h2>
          <p className="mt-1 text-sm text-muted-fg">{blurb}</p>
        </div>
        {bullets && bullets.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mono text-muted-fg mt-0.5">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 mono text-2xs uppercase text-subtle-fg" style={{ letterSpacing: "0.08em" }}>
          wireframe placeholder · content pending client discussion
        </div>
      </div>
    </div>
  );
}
