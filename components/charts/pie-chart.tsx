"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface PieSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface FreshPieChartProps {
  data: PieSlice[];
  height?: number;
  centerLabel?: string;
  emptyLabel?: string;
}

export function FreshPieChart({
  data,
  height = 220,
  centerLabel,
  emptyLabel = "No data",
}: FreshPieChartProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-fg" style={{ height }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6" style={{ height }}>
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              stroke="#FFFFFF"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E4E4E7",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "6px 8px",
              }}
              formatter={(v: number, name: string) => [
                `${v} · ${((v / total) * 100).toFixed(1)}%`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div
            className="mono tabular text-foreground"
            style={{ fontSize: 28, lineHeight: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            {total}
          </div>
          {centerLabel && (
            <div className="label mt-1" style={{ fontSize: 10 }}>
              {centerLabel}
            </div>
          )}
        </div>
      </div>

      <ul className="flex-1 flex flex-col gap-2.5 min-w-0">
        {data.map((s) => {
          const pct = total === 0 ? 0 : (s.value / total) * 100;
          return (
            <li key={s.key} className="flex items-center gap-2.5">
              <span
                className="shrink-0 rounded-sm"
                style={{ width: 10, height: 10, background: s.color }}
                aria-hidden
              />
              <span className="text-xs text-foreground truncate flex-1">{s.label}</span>
              <span className="mono tabular text-xs text-foreground" style={{ fontWeight: 500 }}>
                {s.value}
              </span>
              <span className="mono tabular text-xs text-muted-fg w-12 text-right">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
