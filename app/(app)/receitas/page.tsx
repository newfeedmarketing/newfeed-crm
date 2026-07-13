import { createClient } from "@/lib/supabase/server";
import { displayStatus } from "@/lib/finance/calculations";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import {
  Card,
  MoneyCard,
  StatusBadge,
  inputClass,
  btnPrimary,
  btnSmall,
  thClass,
  tdClass,
} from "@/components/ui";
import {
  createRevenue,
  markReceived,
  undoReceived,
  deleteRevenue,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ReceitasPage() {
  const supabase = createClient();
  const [revRes, cliRes] = await Promise.all([
    supabase
      .from("revenues")
      .select("*, clients(company_name)")
      .order("due_date", { ascending: false })
      .limit(200),
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name"),
  ]);
  const revenues = revRes.data ?? [];
  const clients = cliRes.data ?? [];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);

  const pendentes = revenues.filter((r: any) => r.status === "pendente");
  const atrasadas = pendentes.filter((r: any) => r.due_date < today);
  const recebidasMes = revenues.filter(
    (r: any) => r.status === "recebido" && (r.paid_date || "").slice(0, 7) === currentMonth
  );
  const soma = (rows: any[]) => rows.reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receitas · Contas a receber</h1>
        <p className="text-sm text-slate-500">Entradas recorrentes e avulsas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoneyCard label="A receber (pendente)" value={soma(pendentes)} tone="blue"
          hint={`${pendentes.length} lançamento(s)`} />
        <MoneyCard label="Em atraso" value={soma(atrasadas)} tone="red"
          hint={`${atrasadas.length} lançamento(s)`} />
        <MoneyCard label="Recebido no mês" value={soma(recebidasMes)} tone="green" />
      </div>

      <Card>
        <details>
          <summary className="cursor-pointer font-semibold text-sm">
            ➕ Nova receita
          </summary>
          {clients.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3">
              Cadastre um cliente primeiro na aba <strong>Clientes</strong> —
              toda receita pertence a um cliente.
            </p>
          ) : (
            <form
              action={createRevenue}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"
            >
              <select name="client_id" required className={inputClass}>
                <option value="">Cliente…</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <input name="description" required placeholder="Descrição (ex.: Mensalidade social media)" className={inputClass} />
              <input name="amount" type="number" step="0.01" min="0" required placeholder="Valor (R$)" className={inputClass} />
              <div>
                <label className="text-xs text-slate-500">Vencimento</label>
                <input name="due_date" type="date" required defaultValue={today} className={inputClass} />
              </div>
              <select name="category" className={inputClass}>
                <option value="mensalidade">Mensalidade</option>
                <option value="projeto">Projeto</option>
                <option value="comissao">Comissão</option>
                <option value="outros">Outros</option>
              </select>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="recurring" id="recurring" defaultChecked />
                <label htmlFor="recurring">Recorrente por</label>
                <input name="months" type="number" min="1" max="24" defaultValue={12}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm" />
                <span>meses</span>
              </div>
              <input name="notes" placeholder="Observações (opcional)" className={`${inputClass} lg:col-span-2`} />
              <button className={btnPrimary}>Salvar receita</button>
            </form>
          )}
        </details>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Cliente</th>
              <th className={thClass}>Descrição</th>
              <th className={thClass}>Valor</th>
              <th className={thClass}>Vencimento</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {revenues.length === 0 && (
              <tr>
                <td className={`${tdClass} text-slate-400`} colSpan={6}>
                  Nenhuma receita cadastrada ainda.
                </td>
              </tr>
            )}
            {revenues.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className={tdClass}>{r.clients?.company_name ?? "—"}</td>
                <td className={tdClass}>{r.description}</td>
                <td className={`${tdClass} font-medium`}>{formatBRL(Number(r.amount))}</td>
                <td className={tdClass}>
                  {formatDate(r.due_date)}
                  {r.paid_date && (
                    <span className="block text-xs text-slate-400">
                      pago {formatDate(r.paid_date)}
                    </span>
                  )}
                </td>
                <td className={tdClass}>
                  <StatusBadge status={displayStatus(r.status, r.due_date, today)} />
                </td>
                <td className={tdClass}>
                  <div className="flex gap-1.5">
                    {r.status === "pendente" && (
                      <form action={markReceived}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className={`${btnSmall} !bg-green-50 !border-green-300 text-green-700`}>
                          ✓ Recebido
                        </button>
                      </form>
                    )}
                    {r.status === "recebido" && (
                      <form action={undoReceived}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className={btnSmall}>Desfazer</button>
                      </form>
                    )}
                    <form action={deleteRevenue}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className={`${btnSmall} text-red-600`}>Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
