import { formatBRL } from "@/lib/format";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "green" | "red" | "blue" | "amber";
}) {
  const tones: Record<string, string> = {
    neutral: "text-slate-900",
    green: "text-green-600",
    red: "text-red-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
  };
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Card>
  );
}

export function MoneyCard(props: {
  label: string;
  value: number;
  hint?: string;
  toneBySign?: boolean;
  tone?: "neutral" | "green" | "red" | "blue" | "amber";
}) {
  let tone = props.tone ?? "neutral";
  if (props.toneBySign) tone = props.value >= 0 ? "green" : "red";
  return (
    <StatCard
      label={props.label}
      value={formatBRL(props.value)}
      hint={props.hint}
      tone={tone}
    />
  );
}

const badgeStyles: Record<string, string> = {
  recebido: "bg-green-100 text-green-800",
  pago: "bg-green-100 text-green-800",
  pendente: "bg-amber-100 text-amber-800",
  atrasado: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-600",
  ativo: "bg-green-100 text-green-800",
  pausado: "bg-amber-100 text-amber-800",
  inadimplente: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const style = badgeStyles[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export function AlertBanner({
  level,
  message,
}: {
  level: "critico" | "atencao";
  message: string;
}) {
  const style =
    level === "critico"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-amber-50 border-amber-200 text-amber-800";
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-sm ${style}`}>
      {message}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white";
export const btnPrimary =
  "rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700";
export const btnSmall =
  "rounded-md bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-200";
export const thClass =
  "text-left text-xs uppercase tracking-wide text-slate-500 px-3 py-2";
export const tdClass = "px-3 py-2.5 text-sm";
