import { createClient } from "@/lib/supabase/server";
import { displayStatus, EXPENSE_CATEGORIES } from "@/lib/finance/calculations";
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
import { createExpense, markPaid, undoPaid, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

const categoryLabel = (key: string) =>
  (EXPENSE_CATEGORIES.find(([k]) => k === key) ?? [key, key])[1];

export default async function DespesasPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .order("due_date", { ascending: false })
    .limit(200);
  const expenses = data ?? [];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);

  const pendentes = expenses.filter((e: any) => e.status === "pendente");
  const atrasadas = pendentes.filter((e: any) => e.due_date < today);
  const pagasMes = expenses.filter(
    (e: any) => e.status === "pago" && (e.paid_date || "").slice(0, 7) === currentMonth
  );
  const soma = (rows: any[]) => rows.reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Despesas · Contas a pagar</h1>
        <p className="text-sm text-slate-500">
          Fixas, variáveis, assinaturas e impostos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoneyCard label="A pagar (pendente)" value={soma(pendentes)} tone="amber"
          hint={`${pendentes.length} lançamento(s)`} />
        <MoneyCard label="Em atraso" value={soma(atrasadas)} tone="red"
          hint={`${atrasadas.length} lançamento(s)`} />
        <MoneyCard label="Pago no mês" value={soma(pagasMes)} />
      </div>

      <Card>
        <details>
          <summary className="cursor-pointer font-semibold text-sm">
            ➕ Nova despesa
          </summary>
          <form
            action={createExpense}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4"
          >
            <input name="name" required placeholder="Nome (ex.: Aluguel do escritório)" className={inputClass} />
            <select name="category" required className={inputClass}>
              {EXPENSE_CATEGORIES.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <input name="amount" type="number" step="0.01" min="0" required placeholder="Valor (R$)" className={inputClass} />
            <div>
              <label className="text-xs text-slate-500">Vencimento</label>
              <input name="due_date" type="date" required defaultValue={today} className={inputClass} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <select name="recurrence" className={inputClass}>
                <option value="unica">Única</option>
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label>Se mensal, gerar</label>
              <input name="months" type="number" min="1" max="24" defaultValue={12}
                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm" />
              <span>meses</span>
            </div>
            <input name="notes" placeholder="Observações (opcional)" className={`${inputClass} lg:col-span-2`} />
            <button className={btnPrimary}>Salvar despesa</button>
          </form>
        </details>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Despesa</th>
              <th className={thClass}>Categoria</th>
              <th className={thClass}>Valor</th>
              <th className={thClass}>Vencimento</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 && (
              <tr>
                <td className={`${tdClass} text-slate-400`} colSpan={6}>
                  Nenhuma despesa cadastrada ainda.
                </td>
              </tr>
            )}
            {expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className={tdClass}>
                  {e.name}
                  {e.recurrence !== "unica" && (
                    <span className="ml-1.5 text-[10px] uppercase text-slate-400">
                      {e.recurrence}
                    </span>
                  )}
                </td>
                <td className={tdClass}>{categoryLabel(e.category)}</td>
                <td className={`${tdClass} font-medium`}>{formatBRL(Number(e.amount))}</td>
                <td className={tdClass}>
                  {formatDate(e.due_date)}
                  {e.paid_date && (
                    <span className="block text-xs text-slate-400">
                      pago {formatDate(e.paid_date)}
                    </span>
                  )}
                </td>
                <td className={tdClass}>
                  <StatusBadge status={displayStatus(e.status, e.due_date, today)} />
                </td>
                <td className={tdClass}>
                  <div className="flex gap-1.5">
                    {e.status === "pendente" && (
                      <form action={markPaid}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className={`${btnSmall} !bg-green-50 !border-green-300 text-green-700`}>
                          ✓ Pago
                        </button>
                      </form>
                    )}
                    {e.status === "pago" && (
                      <form action={undoPaid}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className={btnSmall}>Desfazer</button>
                      </form>
                    )}
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
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
