"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

export default function Charts({
  data,
}: {
  data: { mes: string; entradas: number; saidas: number; lucro: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Entradas × Saídas (12 meses)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={brl} width={80} />
            <Tooltip formatter={(v: number) => brl(v)} />
            <Legend />
            <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="#dc2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Lucro mensal (12 meses)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={brl} width={80} />
            <Tooltip formatter={(v: number) => brl(v)} />
            <Line
              type="monotone"
              dataKey="lucro"
              name="Lucro"
              stroke="#FF5A19"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
