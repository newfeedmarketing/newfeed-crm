import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayStatus } from "@/lib/finance/calculations";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import { Card, StatusBadge, StatCard, MoneyCard, btnSmall, thClass, tdClass } from "@/components/ui";
import { updateClient, generateContractCharges, uploadContract } from "../actions";
import { markReceived } from "../../receitas/actions";
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

  // URL temporária (1h) para abrir o contrato anexado no bucket privado
  let contractUrl: string | null = null;
  if (client.contract_file_path) {
    const { data: signed } = await supabase.storage
      .from("anexos")
      .createSignedUrl(client.contract_file_path, 3600);
    contractUrl = signed?.signedUrl ?? null;
  }

  const rows = revenues ?? [];
  const today = todayISO();
  const totalRecebido = rows
    .filter((r: any) => r.status === "recebido")
    .reduce((a: number, r: any) => a + Number(r.amount), 0);
  const emAberto = rows
    .filter((r: any) => r.status === "pendente")
    .reduce((a: number, r: any) => a + Number(r.amount), 0);

  // ---- Tempo de contrato e faturamento previsto ----------------
  const isMensal = (client.client_type ?? "mensal") === "mensal";
  const valorMensal = Number(client.monthly_value || 0);
  let mesesContrato = 0;
  if (client.start_date) {
    const [y1, m1] = client.start_date.split("-").map(Number);
    const [y2, m2] = today.split("-").map(Number);
    mesesContrato = Math.max((y2 - y1) * 12 + (m2 - m1) + 1, 1); // conta o mês inicial
  }
  const previstoContrato = isMensal ? valorMensal * mesesContrato : 0;
  const diferenca = totalRecebido - previstoContrato;
  const tempoLabel =
    mesesContrato >= 12
      ? `${Math.floor(mesesContrato / 12)}a ${mesesContrato % 12}m`
      : `${mesesContrato} ${mesesContrato === 1 ? "mês" : "meses"}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/clientes" className="text-sm text-slate-500 hover:underline">
            ← Clientes
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {client.company_name} <StatusBadge status={client.status} />{" "}
            <StatusBadge status={isMensal ? "mensal" : "freela"} />
          </h1>
          <p className="text-sm text-slate-500">
            Em aberto: <strong>{formatBRL(emAberto)}</strong>
          </p>
        </div>
      </div>

      {/* Faturamento perante o tempo de contrato */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tempo de contrato"
          value={client.start_date ? tempoLabel : "—"}
          hint={[
            client.start_date
              ? `desde ${formatDate(client.start_date)}`
              : "defina 'Cliente desde' abaixo",
            client.contract_end_date
              ? client.contract_end_date < today
                ? `⚠️ encerrado em ${formatDate(client.contract_end_date)}`
                : `até ${formatDate(client.contract_end_date)}`
              : null,
            client.payment_due_day ? `vence dia ${client.payment_due_day}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <MoneyCard
          label="Total faturado"
          value={totalRecebido}
          tone="green"
          hint="tudo que já foi recebido deste cliente"
        />
        {isMensal ? (
          <>
            <MoneyCard
              label="Previsto pelo contrato"
              value={previstoContrato}
              tone="blue"
              hint={
                valorMensal > 0
                  ? `${formatBRL(valorMensal)} × ${tempoLabel}`
                  : "defina o valor mensal abaixo"
              }
            />
            <MoneyCard
              label={diferenca >= 0 ? "Acima do previsto" : "Faltando receber"}
              value={Math.abs(diferenca)}
              tone={diferenca >= 0 ? "green" : "amber"}
              hint="faturado − previsto no período"
            />
          </>
        ) : (
          <StatCard
            label="Tipo"
            value="Freela"
            hint="serviços pontuais — sem previsão mensal"
          />
        )}
      </div>

      {/* Contrato e links do cliente */}
      <Card>
        <h3 className="font-semibold text-sm mb-3">Contrato & links</h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {contractUrl ? (
            <a href={contractUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-lg bg-navy text-white px-3 py-1.5 text-sm font-medium hover:bg-navy-light">
              📄 Ver contrato anexado
            </a>
          ) : (
            <span className="text-sm text-slate-400">
              Nenhum contrato anexado ainda.
            </span>
          )}
          {client.drive_url && (
            <a href={client.drive_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              📁 Drive do cliente
            </a>
          )}
          {client.results_url && (
            <a href={client.results_url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              📊 Resultados mensais
            </a>
          )}
        </div>
        <form action={uploadContract} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={client.id} />
          <input
            type="file"
            name="contract_file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            required
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
          <button className="rounded-lg bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-dark">
            {contractUrl ? "Substituir contrato" : "Anexar contrato"}
          </button>
          <span className="text-xs text-slate-400">PDF, Word ou imagem · máx. 10 MB</span>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          Os links do Drive e de resultados são editados nos campos do formulário abaixo.
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm mb-4">Dados do cliente</h3>
        <ClientForm action={updateClient} defaults={client} submitLabel="Salvar alterações" />
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-sm">Histórico financeiro</span>
          {isMensal && valorMensal > 0 && client.start_date && (
            <form action={generateContractCharges}>
              <input type="hidden" name="id" value={client.id} />
              <button className={btnSmall} title="Cria as mensalidades de todos os meses do contrato que ainda não existem (passados e atual)">
                ⟳ Gerar cobranças do contrato
              </button>
            </form>
          )}
        </div>
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Descrição</th>
              <th className={thClass}>Valor</th>
              <th className={thClass}>Vencimento</th>
              <th className={thClass}>Pagamento</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td className={`${tdClass} text-slate-400`} colSpan={6}>
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
                <td className={tdClass}>
                  {r.status === "pendente" && (
                    <form action={markReceived}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className={`${btnSmall} !bg-green-50 !border-green-300 text-green-700`}>
                        ✓ Recebido
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
