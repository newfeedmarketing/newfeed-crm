import { createClient } from "@/lib/supabase/server";
import { computeFinancials } from "@/lib/finance/calculations";
import { formatBRL } from "@/lib/format";
import { MoneyCard, StatCard, AlertBanner, Card } from "@/components/ui";
import Charts from "./charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [revRes, expRes, cliRes, setRes] = await Promise.all([
    supabase
      .from("revenues")
      .select("amount, due_date, paid_date, status, client_id"),
    supabase.from("expenses").select("amount, due_date, paid_date, status, category"),
    supabase.from("clients").select("id, status"),
    supabase.from("financial_settings").select("*").limit(1).single(),
  ]);

  const clients = cliRes.data ?? [];
  const f = computeFinancials(revRes.data ?? [], expRes.data ?? [], setRes.data);

  const clientesAtivos = clients.filter((c: any) => c.status === "ativo").length;
  const inadimplentes = new Set([
    ...clients.filter((c: any) => c.status === "inadimplente").map((c: any) => c.id),
    ...Array.from(f.clientesInadimplentes),
  ]).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard financeiro</h1>
        <p className="text-sm text-slate-500">
          Visão geral da saúde financeira da agência
        </p>
      </div>

      {f.alertas.length > 0 && (
        <div className="space-y-2">
          {f.alertas.map((a, i) => (
            <AlertBanner key={i} level={a.level} message={a.message} />
          ))}
        </div>
      )}

      {/* Dinheiro agora */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoneyCard label="Caixa disponível real" value={f.caixaDisponivel} toneBySign
          hint="Saldo + confirmadas − compromissos (30d)" />
        <MoneyCard label="Comprometido (30 dias)" value={f.comprometido30} tone="amber" />
        <MoneyCard label="Valor seguro para investir" value={f.valorSeguro}
          tone={f.valorSeguro > 0 ? "green" : "red"}
          hint={`Reserva mínima: ${formatBRL(f.reservaMinima)}`} />
      </div>

      {/* Mês corrente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MoneyCard label="Entradas do mês" value={f.entradasMes} tone="green" />
        <MoneyCard label="Saídas do mês" value={f.saidasMes} tone="red" />
        <MoneyCard label="Lucro bruto (mês)" value={f.lucroBruto} toneBySign />
        <MoneyCard label="Lucro líquido (mês)" value={f.lucroLiquido} toneBySign />
      </div>

      {/* Pendências e clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MoneyCard label="Contas a receber" value={f.contasReceber}
          hint={`${f.contasReceberQtd} lançamento(s) · ${formatBRL(f.atrasadoReceber)} em atraso`}
          tone="blue" />
        <MoneyCard label="Contas a pagar" value={f.contasPagar}
          hint={`${f.contasPagarQtd} lançamento(s) · ${formatBRL(f.atrasadoPagar)} em atraso`}
          tone="amber" />
        <StatCard label="Clientes ativos" value={String(clientesAtivos)} />
        <StatCard label="Inadimplentes" value={String(inadimplentes)}
          tone={inadimplentes > 0 ? "red" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MoneyCard label="Faturamento no ano" value={f.faturamentoAno} />
        <MoneyCard label="Saldo atual" value={f.saldoAtual} toneBySign
          hint="Saldo inicial + recebidos − pagos" />
      </div>

      <Card>
        <Charts data={f.serieMensal} />
      </Card>
    </div>
  );
}
