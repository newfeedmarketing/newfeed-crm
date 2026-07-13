import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, todayISO } from "@/lib/format";
import { Card, StatusBadge, StatCard, btnSmall, thClass, tdClass } from "@/components/ui";
import { addClient, deleteClient } from "./actions";
import ClientForm from "./client-form";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = createClient();
  const [cliRes, revRes] = await Promise.all([
    supabase.from("clients").select("*").order("company_name"),
    supabase
      .from("revenues")
      .select("client_id, amount, status, paid_date, due_date"),
  ]);
  const clients = cliRes.data ?? [];
  const revenues = revRes.data ?? [];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);

  const stats = (id: string) => {
    const rows = revenues.filter((r: any) => r.client_id === id);
    return {
      recebidoMes: rows
        .filter((r: any) => r.status === "recebido" && (r.paid_date || "").slice(0, 7) === currentMonth)
        .reduce((a: number, r: any) => a + Number(r.amount), 0),
      emAberto: rows
        .filter((r: any) => r.status === "pendente")
        .reduce((a: number, r: any) => a + Number(r.amount), 0),
      atrasado: rows.some((r: any) => r.status === "pendente" && r.due_date < today),
    };
  };

  const ativos = clients.filter((c: any) => c.status === "ativo").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-slate-500">Empresas atendidas pela agência</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total de clientes" value={String(clients.length)} />
        <StatCard label="Ativos" value={String(ativos)} tone="green" />
        <StatCard
          label="Com pagamento atrasado"
          value={String(clients.filter((c: any) => stats(c.id).atrasado).length)}
          tone="red"
        />
      </div>

      <Card>
        <details>
          <summary className="cursor-pointer font-semibold text-sm">
            ➕ Novo cliente
          </summary>
          <div className="mt-4">
            <ClientForm action={addClient} submitLabel="Salvar cliente" />
          </div>
        </details>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Empresa</th>
              <th className={thClass}>Responsável</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Recebido no mês</th>
              <th className={thClass}>Em aberto</th>
              <th className={thClass}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 && (
              <tr>
                <td className={`${tdClass} text-slate-400`} colSpan={6}>
                  Nenhum cliente cadastrado ainda — comece pelo botão acima.
                </td>
              </tr>
            )}
            {clients.map((c: any) => {
              const s = stats(c.id);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className={`${tdClass} font-medium`}>
                    {c.company_name}
                    {s.atrasado && (
                      <span className="ml-2 text-xs text-red-600">● atraso</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    {c.contact_name ?? "—"}
                    {c.phone && (
                      <span className="block text-xs text-slate-400">{c.phone}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={tdClass}>{formatBRL(s.recebidoMes)}</td>
                  <td className={tdClass}>{formatBRL(s.emAberto)}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1.5">
                      <Link href={`/clientes/${c.id}`} className={btnSmall}>
                        Editar
                      </Link>
                      <form action={deleteClient}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={`${btnSmall} text-red-600`}>Excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
