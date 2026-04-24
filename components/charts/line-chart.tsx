"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

export interface Series {
  key: string;
  label: string;
  color: "accent" | "muted" | "foreground";
  opacity?: number;
  dashed?: boolean;
}

const COLOR: Record<Series["color"], string> = {
  accent: "#6666F6",
  muted: "#A1A1AA",
  foreground: "#0A0A0A",
};

export interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  series: Series[];
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: any) => string;
  refLines?: Array<{ y: number; label: string; color?: string; dashed?: boolean }>;
  refAreas?: Array<{ y1: number; y2: number; color: string; opacity?: number }>;
  yDomain?: [number | "auto", number | "auto"];
}

export function FreshLineChart({
  data,
  xKey,
  series,
  height = 240,
  yFormatter,
  xFormatter,
  refLines,
  refAreas,
  yDomain,
}: LineChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#E4E4E7" strokeDasharray="2 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={xFormatter}
            tick={{ fontSize: 10, fill: "#71717A", fontFamily: "var(--font-mono)" }}
            stroke="#E4E4E7"
            tickLine={false}
            axisLine={{ stroke: "#E4E4E7" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#71717A", fontFamily: "var(--font-mono)" }}
            stroke="#E4E4E7"
            tickLine={false}
            axisLine={false}
            tickFormatter={yFormatter}
            domain={yDomain}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: "6px 8px",
            }}
            labelFormatter={xFormatter}
            formatter={(value: any, name: any) => [yFormatter ? yFormatter(value) : value, name]}
          />
          {refAreas?.map((a, i) => (
            <ReferenceArea key={`ra${i}`} y1={a.y1} y2={a.y2} fill={a.color} fillOpacity={a.opacity ?? 0.05} stroke="none" />
          ))}
          {refLines?.map((r, i) => (
            <ReferenceLine
              key={`rl${i}`}
              y={r.y}
              stroke={r.color ?? "#A1A1AA"}
              strokeDasharray={r.dashed ? "3 3" : undefined}
              label={{ value: r.label, position: "insideTopRight", fontSize: 10, fontFamily: "var(--font-mono)", fill: "#71717A" }}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={COLOR[s.color]}
              strokeOpacity={s.opacity ?? 1}
              strokeDasharray={s.dashed ? "3 3" : undefined}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1, fill: COLOR[s.color] }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
