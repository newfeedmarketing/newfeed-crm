import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayStatus } from "@/lib/finance/calculations";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import { Card, StatusBadge, thClass, tdClass } from "@/components/ui";
import { updateClient } from "../actions";
import ClientForm from "../client-form";

export const dynamic = "force-dynamic";

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: client }, { data: revenues }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", params.id).single(),
    supabase
      .from("revenues")
      .select("*")
      .eq("client_id", params.id)
      .order("due_date", { ascending: false }),
  ]);

  if (!client) notFound();
  const rows = revenues ?? [];
  const today = todayISO();
  const totalRecebido = rows
    .filter((r: any) => r.status === "recebido")
    .reduce((a: number, r: any) => a + Number(r.amount), 0);
  const emAberto = rows
    .filter((r: any) => r.status === "pendente")
    .reduce((a: number, r: any) => a + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/clientes" className="text-sm text-slate-500 hover:underline">
            ← Clientes
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {client.company_name} <StatusBadge status={client.status} />
          </h1>
          <p className="text-sm text-slate-500">
            Total recebido: <strong>{formatBRL(totalRecebido)}</strong> · Em
            aberto: <strong>{formatBRL(emAberto)}</strong>
          </p>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold text-sm mb-4">Dados do cliente</h3>
        <ClientForm action={updateClient} defaults={client} submitLabel="Salvar alterações" />
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="px-5 pt-4 pb-2 font-semibold text-sm">
          Histórico financeiro
        </div>
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Descrição</th>
              <th className={thClass}>Valor</th>
              <th className={thClass}>Vencimento</th>
              <th className={thClass}>Pagamento</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td className={`${tdClass} text-slate-400`} colSpan={5}>
                  Nenhuma receita para este cliente ainda.
                </td>
              </tr>
            )}
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className={tdClass}>{r.description}</td>
                <td className={`${tdClass} font-medium`}>{formatBRL(Number(r.amount))}</td>
                <td className={tdClass}>{formatDate(r.due_date)}</td>
                <td className={tdClass}>{formatDate(r.paid_date)}</td>
                <td className={tdClass}>
                  <StatusBadge status={displayStatus(r.status, r.due_date, today)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
