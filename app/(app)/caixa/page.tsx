import { createClient } from "@/lib/supabase/server";
import { computeFinancials } from "@/lib/finance/calculations";
import { formatBRL } from "@/lib/format";
import { Card, MoneyCard, inputClass, btnPrimary, thClass, tdClass } from "@/components/ui";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const supabase = createClient();
  const [revRes, expRes, setRes] = await Promise.all([
    supabase.from("revenues").select("amount, due_date, paid_date, status, client_id"),
    supabase.from("expenses").select("amount, due_date, paid_date, status, category"),
    supabase.from("financial_settings").select("*").limit(1).single(),
  ]);
  const settings = setRes.data;
  const f = computeFinancials(revRes.data ?? [], expRes.data ?? [], settings);

  const investTone =
    f.valorSeguro > 0 ? "green" : f.caixaDisponivel > 0 ? "amber" : "red";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Caixa & Investimento</h1>
        <p className="text-sm text-slate-500">
          Quanto você pode investir sem comprometer a operação
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoneyCard label="Saldo atual" value={f.saldoAtual} toneBySign />
        <MoneyCard label="Caixa disponível real" value={f.caixaDisponivel} toneBySign />
        <MoneyCard label="Valor seguro para investir" value={f.valorSeguro} tone={investTone as any} />
      </div>

      {/* Fórmula aberta — transparência do cálculo */}
      <Card>
        <h3 className="font-semibold text-sm mb-3">Como o valor é calculado</h3>
        <div className="text-sm space-y-1.5 font-mono">
          <p>
            <span className="text-slate-500">saldo atual</span>{" "}
            {formatBRL(f.saldoAtual)}
          </p>
          <p>
            <span className="text-green-600">+ receitas confirmadas (venc. ≤ 30d, sem atrasadas)</span>{" "}
            {formatBRL(f.receitasConfirmadas30)}
          </p>
          <p>
            <span className="text-red-600">− despesas em aberto (venc. ≤ 30d, inclui atrasadas)</span>{" "}
            {formatBRL(f.comprometido30)}
          </p>
          <p className="border-t border-slate-200 pt-1.5">
            <span className="text-slate-500">= caixa disponível real</span>{" "}
            <strong>{formatBRL(f.caixaDisponivel)}</strong>
          </p>
          <p>
            <span className="text-red-600">− reserva operacional mínima</span>{" "}
            {formatBRL(f.reservaMinima)}
            {f.reservaAutomatica && (
              <span className="text-xs text-slate-400 ml-1">
                (automática: 2× média das saídas dos últimos 3 meses)
              </span>
            )}
          </p>
          <p className="border-t border-slate-200 pt-1.5">
            <span className="text-slate-500">= valor seguro para investir</span>{" "}
            <strong>{formatBRL(f.valorSeguro)}</strong>
            <span className="text-xs text-slate-400 ml-1">
              ({settings?.safe_invest_pct ?? 100}% do livre)
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Cálculo deliberadamente conservador: receitas atrasadas ou além de 30
          dias não contam; despesas contam integralmente. Se o resultado for
          negativo, o valor exibido é R$ 0.
        </p>
      </Card>

      {/* Compromissos por janela */}
      <Card className="p-0 overflow-x-auto">
        <div className="px-5 pt-4 pb-2 font-semibold text-sm">
          Valor comprometido (despesas em aberto por janela)
        </div>
        <table className="w-full min-w-[480px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {f.janelas.map((j) => (
                <th key={j.dias} className={thClass}>
                  {j.dias} dias
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {f.janelas.map((j) => (
                <td key={j.dias} className={`${tdClass} font-medium`}>
                  {formatBRL(j.valor)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Configurações financeiras */}
      <Card>
        <h3 className="font-semibold text-sm mb-1">Configurações financeiras</h3>
        <p className="text-xs text-slate-400 mb-4">
          Defina o saldo inicial do caixa na data em que você começou a usar o
          sistema — todo recebimento/pagamento a partir dessa data entra no cálculo.
        </p>
        <form
          action={updateSettings}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div>
            <label className="text-xs text-slate-500">Saldo inicial (R$)</label>
            <input name="opening_balance" type="number" step="0.01"
              defaultValue={Number(settings?.opening_balance ?? 0)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Data do saldo inicial</label>
            <input name="opening_balance_date" type="date"
              defaultValue={settings?.opening_balance_date ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-slate-500">
              Reserva mínima (R$) — vazio = automática
            </label>
            <input name="minimum_reserve" type="number" step="0.01"
              defaultValue={settings?.minimum_reserve ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-slate-500">% do livre considerado seguro</label>
            <input name="safe_invest_pct" type="number" min="0" max="100"
              defaultValue={Number(settings?.safe_invest_pct ?? 100)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Dias de atraso p/ inadimplência</label>
            <input name="overdue_days_to_default" type="number" min="0"
              defaultValue={Number(settings?.overdue_days_to_default ?? 7)} className={inputClass} />
          </div>
          <div className="flex items-end">
            <button className={btnPrimary}>Salvar configurações</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
