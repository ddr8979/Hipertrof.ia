"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VolumePoint = { week: string; kg: number };
export type RmPoint = { date: string; rm: number };

const tooltipContentStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 13,
};

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          width={36}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={{ color: "var(--text-2)", fontWeight: 600 }}
          formatter={(v) => [`${Number(v).toLocaleString("es-UY")} kg`, "Volumen"]}
        />
        <Area
          type="monotone"
          dataKey="kg"
          stroke="var(--accent)"
          strokeWidth={2.5}
          fill="url(#volGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RmChart({ data }: { data: RmPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={{ color: "var(--text-2)", fontWeight: 600 }}
          formatter={(v) => [`${v} kg`, "1RM estimado"]}
        />
        <Area
          type="monotone"
          dataKey="rm"
          stroke="var(--accent)"
          strokeWidth={2.5}
          fill="url(#prGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}