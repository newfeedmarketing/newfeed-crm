/**
 * MÓDULO ÚNICO DE FÓRMULAS FINANCEIRAS
 * Toda regra de dinheiro do sistema vive aqui — nunca em telas.
 * Regime de caixa: só conta o que foi efetivamente recebido/pago.
 */
import { addDaysISO, todayISO } from "@/lib/format";

export interface RevenueRow {
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  client_id?: string | null;
}

export interface ExpenseRow {
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  category: string;
}

export interface FinancialSettings {
  minimum_reserve: number | null;
  safe_invest_pct: number;
  overdue_days_to_default: number;
  opening_balance: number;
  opening_balance_date: string;
}

/** Categorias tratadas como custo direto (para lucro bruto) */
export const DIRECT_COST_CATEGORIES = ["freelancers", "trafego_pago"];

export const EXPENSE_CATEGORIES = [
  ["salarios", "Salários"],
  ["freelancers", "Freelancers"],
  ["impostos", "Impostos"],
  ["trafego_pago", "Tráfego pago"],
  ["softwares", "Softwares/assinaturas"],
  ["equipamentos", "Equipamentos"],
  ["aluguel", "Aluguel"],
  ["internet", "Internet"],
  ["energia", "Energia"],
  ["outros", "Outros"],
] as const;

const sum = (rows: { amount: number }[]) =>
  rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);

const monthKey = (iso: string | null | undefined) => (iso || "").slice(0, 7);

function shiftMonth(base: Date, delta: number): string {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1));
  return d.toISOString().slice(0, 7);
}

export interface Alert {
  level: "critico" | "atencao";
  message: string;
}

export function computeFinancials(
  revenues: RevenueRow[],
  expenses: ExpenseRow[],
  settings: FinancialSettings | null,
  refDate?: string
) {
  const today = refDate || todayISO();
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);
  const now = new Date(today + "T00:00:00Z");

  const received = revenues.filter((r) => r.status === "recebido");
  const pendingRev = revenues.filter((r) => r.status === "pendente");
  const overdueRev = pendingRev.filter((r) => r.due_date < today);
  const paidExp = expenses.filter((e) => e.status === "pago");
  const pendingExp = expenses.filter((e) => e.status === "pendente");
  const overdueExp = pendingExp.filter((e) => e.due_date < today);

  // ---- Mês corrente -----------------------------------------
  const entradasMes = sum(received.filter((r) => monthKey(r.paid_date) === currentMonth));
  const saidasMes = sum(paidExp.filter((e) => monthKey(e.paid_date) === currentMonth));
  const custosDiretosMes = sum(
    paidExp.filter(
      (e) =>
        monthKey(e.paid_date) === currentMonth &&
        DIRECT_COST_CATEGORIES.includes(e.category)
    )
  );
  const lucroBruto = entradasMes - custosDiretosMes;
  const lucroLiquido = entradasMes - saidasMes;
  const faturamentoAno = sum(
    received.filter((r) => (r.paid_date || "").slice(0, 4) === currentYear)
  );

  // ---- Saldo atual ------------------------------------------
  const opening = Number(settings?.opening_balance ?? 0);
  const openingDate = settings?.opening_balance_date ?? "1900-01-01";
  const saldoAtual =
    opening +
    sum(received.filter((r) => (r.paid_date || "") >= openingDate)) -
    sum(paidExp.filter((e) => (e.paid_date || "") >= openingDate));

  // ---- Pendências -------------------------------------------
  const contasReceber = sum(pendingRev);
  const contasReceberQtd = pendingRev.length;
  const contasPagar = sum(pendingExp);
  const contasPagarQtd = pendingExp.length;
  const atrasadoReceber = sum(overdueRev);
  const atrasadoPagar = sum(overdueExp);

  // ---- Compromissos futuros (janelas) -----------------------
  const janelas = [7, 15, 30, 60, 90].map((dias) => ({
    dias,
    valor: sum(pendingExp.filter((e) => e.due_date <= addDaysISO(today, dias))),
  }));
  const comprometido30 = janelas.find((j) => j.dias === 30)!.valor;

  // ---- Caixa disponível real (fórmula do doc 05) ------------
  // Conservador: só receitas pendentes NÃO atrasadas com venc. <= 30 dias;
  // despesas em aberto (inclusive atrasadas) com venc. <= 30 dias.
  const receitasConfirmadas30 = sum(
    pendingRev.filter(
      (r) => r.due_date >= today && r.due_date <= addDaysISO(today, 30)
    )
  );
  const caixaDisponivel = saldoAtual + receitasConfirmadas30 - comprometido30;

  // ---- Reserva mínima ---------------------------------------
  let reservaMinima: number;
  let reservaAutomatica = false;
  if (settings?.minimum_reserve != null) {
    reservaMinima = Number(settings.minimum_reserve);
  } else {
    reservaAutomatica = true;
    const ultimos3 = [1, 2, 3].map((i) => shiftMonth(now, -i));
    const media =
      ultimos3.reduce(
        (acc, m) => acc + sum(paidExp.filter((e) => monthKey(e.paid_date) === m)),
        0
      ) / 3;
    reservaMinima = media * 2;
  }

  // ---- Valor seguro para investir ---------------------------
  const pct = Number(settings?.safe_invest_pct ?? 100);
  const valorSeguroBruto = caixaDisponivel - reservaMinima;
  const valorSeguro = Math.max(0, (valorSeguroBruto * pct) / 100);

  // ---- Série mensal (12 meses) ------------------------------
  const serieMensal = Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(now, i - 11);
    const entradas = sum(received.filter((r) => monthKey(r.paid_date) === m));
    const saidas = sum(paidExp.filter((e) => monthKey(e.paid_date) === m));
    const [y, mm] = m.split("-");
    return {
      mes: `${mm}/${y.slice(2)}`,
      entradas,
      saidas,
      lucro: entradas - saidas,
    };
  });

  // ---- Inadimplência ----------------------------------------
  const limiteDias = Number(settings?.overdue_days_to_default ?? 7);
  const clientesInadimplentes = new Set(
    pendingRev
      .filter((r) => r.due_date < addDaysISO(today, -limiteDias))
      .map((r) => r.client_id)
      .filter(Boolean)
  );

  // ---- Alertas ----------------------------------------------
  const alertas: Alert[] = [];
  if (saldoAtual < reservaMinima)
    alertas.push({
      level: "critico",
      message: "Caixa abaixo da reserva mínima recomendada.",
    });
  if (valorSeguro <= 0)
    alertas.push({
      level: "atencao",
      message: "Sem margem segura para investimentos no momento.",
    });
  const vencendo3d = pendingExp.filter(
    (e) => e.due_date >= today && e.due_date <= addDaysISO(today, 3)
  );
  if (vencendo3d.length > 0)
    alertas.push({
      level: "atencao",
      message: `${vencendo3d.length} conta(s) a pagar vence(m) nos próximos 3 dias.`,
    });
  if (overdueRev.length > 0)
    alertas.push({
      level: "atencao",
      message: `${overdueRev.length} recebimento(s) em atraso.`,
    });
  if (clientesInadimplentes.size > 0)
    alertas.push({
      level: "critico",
      message: `${clientesInadimplentes.size} cliente(s) inadimplente(s).`,
    });

  return {
    entradasMes,
    saidasMes,
    lucroBruto,
    lucroLiquido,
    faturamentoAno,
    saldoAtual,
    contasReceber,
    contasReceberQtd,
    contasPagar,
    contasPagarQtd,
    atrasadoReceber,
    atrasadoPagar,
    janelas,
    comprometido30,
    receitasConfirmadas30,
    caixaDisponivel,
    reservaMinima,
    reservaAutomatica,
    valorSeguro,
    valorSeguroBruto,
    serieMensal,
    clientesInadimplentes,
    alertas,
  };
}

/** Status exibido: pendente vencida vira "atrasado" na interface */
export function displayStatus(
  status: string,
  due_date: string,
  refDate?: string
): string {
  const today = refDate || todayISO();
  if (status === "pendente" && due_date < today) return "atrasado";
  return status;
}
