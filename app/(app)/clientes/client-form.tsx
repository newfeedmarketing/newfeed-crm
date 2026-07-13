import { inputClass, btnPrimary } from "@/components/ui";

export default function ClientForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: any;
  submitLabel: string;
}) {
  const d = defaults ?? {};
  return (
    <form
      action={action}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <input name="company_name" required placeholder="Nome da empresa *"
        defaultValue={d.company_name ?? ""} className={inputClass} />
      <input name="contact_name" placeholder="Nome do responsável"
        defaultValue={d.contact_name ?? ""} className={inputClass} />
      <input name="phone" placeholder="Telefone / WhatsApp"
        defaultValue={d.phone ?? ""} className={inputClass} />
      <input name="email" type="email" placeholder="E-mail"
        defaultValue={d.email ?? ""} className={inputClass} />
      <input name="document" placeholder="CNPJ ou CPF"
        defaultValue={d.document ?? ""} className={inputClass} />
      <input name="address" placeholder="Endereço"
        defaultValue={d.address ?? ""} className={inputClass} />
      <div>
        <label className="text-xs text-slate-500">Tipo de cliente</label>
        <select name="client_type" defaultValue={d.client_type ?? "mensal"} className={inputClass}>
          <option value="mensal">Mensal (recorrente)</option>
          <option value="freela">Freela (serviços pontuais)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500">Valor mensal (R$) — só p/ mensais</label>
        <input name="monthly_value" type="number" step="0.01" min="0"
          defaultValue={d.monthly_value ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="text-xs text-slate-500">Status</label>
        <select name="status" defaultValue={d.status ?? "ativo"} className={inputClass}>
          <option value="ativo">Ativo</option>
          <option value="pausado">Pausado</option>
          <option value="cancelado">Cancelado</option>
          <option value="inadimplente">Inadimplente</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500">Cliente desde</label>
        <input name="start_date" type="date" defaultValue={d.start_date ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="text-xs text-slate-500">Dia de vencimento (1–31)</label>
        <input name="payment_due_day" type="number" min="1" max="31"
          defaultValue={d.payment_due_day ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="text-xs text-slate-500">Fim do contrato (opcional)</label>
        <input name="contract_end_date" type="date"
          defaultValue={d.contract_end_date ?? ""} className={inputClass} />
      </div>
      <textarea name="notes" placeholder="Observações" rows={2}
        defaultValue={d.notes ?? ""} className={`${inputClass} lg:col-span-2`} />
      <div className="flex items-end">
        <button className={btnPrimary}>{submitLabel}</button>
      </div>
    </form>
  );
}
