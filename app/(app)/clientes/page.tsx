import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, todayISO, addDaysISO } from "@/lib/format";
import {
  Card,
  StatusBadge,
  StatCard,
  MoneyCard,
  btnSmall,
  thClass,
  tdClass,
} from "@/components/ui";
import { addClient, deleteClient, markMonthPaid, undoMonthPaid } from "./actions";
import ClientForm from "./client-form";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = createClient();
  const [cliRes, revRes] = await Promise.all([
    supabase.from("clients").select("*").order("company_name"),
    supabase
      .from("revenues")
      .select("client_id, amount, status, paid_date, due_date, type"),
  ]);
  const clients = cliRes.data ?? [];
  const revenues = revRes.data ?? [];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);

  const stats = (c: any) => {
    const rows = revenues.filter((r: any) => r.client_id === c.id);
    const totalFaturado = rows
      .filter((r: any) => r.status === "recebido")
      .reduce((a: number, r: any) => a + Number(r.amount), 0);
    const monthRows = rows.filter(
      (r: any) =>
        r.type === "recorrente" &&
        r.status !== "cancelado" &&
        (r.due_date || "").slice(0, 7) === currentMonth
    );
    const pagoMes = monthRows.some((r: any) => r.status === "recebido");
    const pendenteMes = monthRows.some((r: any) => r.status === "pendente");
    const valorMensal =
      Number(c.monthly_value) ||
      monthRows.reduce((a: number, r: any) => a + Number(r.amount), 0);
    const atrasado = rows.some(
      (r: any) => r.status === "pendente" && r.due_date < today
    );
    return { totalFaturado, pagoMes, pendenteMes, valorMensal, atrasado };
  };

  const mensais = clients.filter((c: any) => (c.client_type ?? "mensal") === "mensal");
  const freelas = clients.filter((c: any) => c.client_type === "freela");
  const ativos = clients.filter((c: any) => c.status === "ativo").length;
  const receitaContratada = mensais
    .filter((c: any) => c.status === "ativo")
    .reduce((a: number, c: any) => a + Number(c.monthly_value || 0), 0);

  const renderRow = (c: any) => {
    const s = stats(c);
    const isMensal = (c.client_type ?? "mensal") === "mensal";
    return (
      <tr key={c.id} className="hover:bg-slate-50">
        <td className={`${tdClass} font-medium`}>
          {c.company_name}
          {s.atrasado && (
            <span className="ml-2 text-xs text-red-600">● atraso</span>
          )}
          {c.contact_name && (
            <span className="block text-xs text-slate-400">
              {c.contact_name}
              {c.phone ? ` · ${c.phone}` : ""}
            </span>
          )}
        </td>
        <td className={tdClass}>
          <StatusBadge status={isMensal ? "mensal" : "freela"} />
        </td>
        <td className={tdClass}>
          <StatusBadge status={c.status} />
        </td>
        <td className={`${tdClass} font-semibold text-navy`}>
          {isMensal ? formatBRL(s.valorMensal) : "—"}
        </td>
        <td className={tdClass}>
          {c.payment_due_day ? (
            <span>dia {c.payment_due_day}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
          {c.contract_end_date && (
            <span
              className={`block text-xs ${
                c.contract_end_date < today
                  ? "text-red-600 font-medium"
                  : c.contract_end_date <= addDaysISO(today, 30)
                  ? "text-amber-600 font-medium"
                  : "text-slate-400"
              }`}
            >
              {c.contract_end_date < today
                ? `encerrado ${formatDate(c.contract_end_date)}`
                : `até ${formatDate(c.contract_end_date)}`}
            </span>
          )}
        </td>
        <td className={tdClass}>
          {!isMensal ? (
            <span className="text-slate-400">—</span>
          ) : s.pagoMes ? (
            <div className="flex items-center gap-1.5">
              <StatusBadge status="pago" />
              <form action={undoMonthPaid}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-slate-400 underline">
                  desfazer
                </button>
              </form>
            </div>
          ) : s.valorMensal > 0 || s.pendenteMes ? (
            <form action={markMonthPaid}>
              <input type="hidden" name="id" value={c.id} />
              <button
                className={`${btnSmall} !bg-green-50 !border-green-300 text-green-700`}
              >
                ✓ Marcar pago
              </button>
            </form>
          ) : (
            <span
              className="text-xs text-slate-400"
              title="Defina o valor mensal em Editar"
            >
              defina o valor
            </span>
          )}
        </td>
        <td className={`${tdClass} font-medium`}>{formatBRL(s.totalFaturado)}</td>
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
  };

  const table = (rows: any[], emptyMsg: string) => (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[960px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className={thClass}>Empresa</th>
            <th className={thClass}>Tipo</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Valor mensal</th>
            <th className={thClass}>Vencimento / contrato</th>
            <th className={thClass}>Pago este mês</th>
            <th className={thClass}>Total faturado</th>
            <th className={thClass}>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td className={`${tdClass} text-slate-400`} colSpan={8}>
                {emptyMsg}
              </td>
            </tr>
          )}
          {rows.map(renderRow)}
        </tbody>
      </table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-slate-500">Empresas atendidas pela agência</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de clientes" value={String(clients.length)} />
        <StatCard label="Ativos" value={String(ativos)} tone="green" />
        <MoneyCard
          label="Receita mensal contratada"
          value={receitaContratada}
          tone="blue"
          hint="Soma dos valores mensais dos clientes ativos"
        />
        <StatCard
          label="Com pagamento atrasado"
          value={String(clients.filter((c: any) => stats(c).atrasado).length)}
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

      <div>
        <h2 className="font-semibold text-sm text-slate-600 mb-2">
          Clientes mensais ({mensais.length})
        </h2>
        {table(mensais, "Nenhum cliente mensal ainda.")}
      </div>

      <div>
        <h2 className="font-semibold text-sm text-slate-600 mb-2">
          Clientes freela · serviços pontuais ({freelas.length})
        </h2>
        {table(freelas, "Nenhum cliente freela ainda.")}
      </div>
    </div>
  );
}
