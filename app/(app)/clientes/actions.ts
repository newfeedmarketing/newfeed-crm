"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabase } from "@/lib/supabase/server";

function clientFromForm(formData: FormData) {
  return {
    company_name: String(formData.get("company_name") || ""),
    client_type: String(formData.get("client_type") || "mensal"),
    monthly_value: formData.get("monthly_value")
      ? Number(formData.get("monthly_value"))
      : null,
    contact_name: String(formData.get("contact_name") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    document: String(formData.get("document") || "") || null,
    address: String(formData.get("address") || "") || null,
    status: String(formData.get("status") || "ativo"),
    start_date: String(formData.get("start_date") || "") || null,
    contract_end_date: String(formData.get("contract_end_date") || "") || null,
    drive_url: String(formData.get("drive_url") || "") || null,
    results_url: String(formData.get("results_url") || "") || null,
    payment_due_day: formData.get("payment_due_day")
      ? Number(formData.get("payment_due_day"))
      : null,
    notes: String(formData.get("notes") || "") || null,
  };
}

export async function addClient(formData: FormData) {
  const supabase = createSupabase();
  const { error } = await supabase.from("clients").insert(clientFromForm(formData));
  if (error) throw new Error("Erro ao criar cliente: " + error.message);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

export async function updateClient(formData: FormData) {
  const supabase = createSupabase();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("clients")
    .update({ ...clientFromForm(formData), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Erro ao atualizar cliente: " + error.message);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}

function monthRange() {
  const today = new Date().toISOString().slice(0, 10);
  const start = today.slice(0, 7) + "-01";
  const [y, m] = start.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { today, start, next };
}

/** Marca a mensalidade do mês como paga (cria a receita se não existir). */
export async function markMonthPaid(formData: FormData) {
  const supabase = createSupabase();
  const clientId = String(formData.get("id"));
  const { today, start, next } = monthRange();

  const { data: existing } = await supabase
    .from("revenues")
    .select("id, status")
    .eq("client_id", clientId)
    .eq("type", "recorrente")
    .gte("due_date", start)
    .lt("due_date", next)
    .neq("status", "cancelado")
    .limit(1);

  if (existing && existing.length > 0) {
    if (existing[0].status !== "recebido") {
      const { error } = await supabase
        .from("revenues")
        .update({ status: "recebido", paid_date: today })
        .eq("id", existing[0].id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { data: client } = await supabase
      .from("clients")
      .select("monthly_value")
      .eq("id", clientId)
      .single();
    const amount = Number(client?.monthly_value || 0);
    if (amount <= 0)
      throw new Error("Defina o valor mensal do cliente antes de marcar como pago.");
    const { error } = await supabase.from("revenues").insert({
      client_id: clientId,
      description: "Mensalidade",
      type: "recorrente",
      category: "mensalidade",
      amount,
      due_date: today,
      paid_date: today,
      status: "recebido",
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/clientes");
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

/** Desfaz o pagamento da mensalidade do mês (volta para pendente). */
export async function undoMonthPaid(formData: FormData) {
  const supabase = createSupabase();
  const clientId = String(formData.get("id"));
  const { start, next } = monthRange();
  const { error } = await supabase
    .from("revenues")
    .update({ status: "pendente", paid_date: null })
    .eq("client_id", clientId)
    .eq("type", "recorrente")
    .eq("status", "recebido")
    .gte("due_date", start)
    .lt("due_date", next);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

/** Anexa (ou substitui) o contrato do cliente no Storage. */
export async function uploadContract(formData: FormData) {
  const supabase = createSupabase();
  const clientId = String(formData.get("id"));
  const file = formData.get("contract_file") as File | null;

  if (!file || file.size === 0) throw new Error("Selecione um arquivo.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Arquivo muito grande (máximo 10 MB).");

  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `contratos/${clientId}/contrato.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("anexos")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) throw new Error("Erro no upload: " + error.message);

  await supabase
    .from("clients")
    .update({ contract_file_path: path, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

function dueDateFor(monthISO: string, day: number): string {
  const [y, m] = monthISO.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${monthISO}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

/**
 * Gera as cobranças mensais de TODO o período do contrato
 * (do mês de início até o mês atual ou o fim do contrato),
 * pulando meses que já têm cobrança recorrente.
 */
export async function generateContractCharges(formData: FormData) {
  const supabase = createSupabase();
  const clientId = String(formData.get("id"));

  const { data: client } = await supabase
    .from("clients")
    .select("start_date, payment_due_day, monthly_value, contract_end_date")
    .eq("id", clientId)
    .single();

  if (!client?.start_date) throw new Error("Defina 'Cliente desde' primeiro.");
  const amount = Number(client.monthly_value || 0);
  if (amount <= 0) throw new Error("Defina o valor mensal primeiro.");

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const startMonth = client.start_date.slice(0, 7);
  const endMonth = client.contract_end_date
    ? client.contract_end_date.slice(0, 7) < currentMonth
      ? client.contract_end_date.slice(0, 7)
      : currentMonth
    : currentMonth;
  const day = Number(client.payment_due_day || client.start_date.slice(8, 10));

  const { data: existing } = await supabase
    .from("revenues")
    .select("due_date")
    .eq("client_id", clientId)
    .eq("type", "recorrente")
    .neq("status", "cancelado");
  const existingMonths = new Set(
    (existing ?? []).map((r: any) => (r.due_date || "").slice(0, 7))
  );

  const rows = [];
  let [y, m] = startMonth.split("-").map(Number);
  while (`${y}-${String(m).padStart(2, "0")}` <= endMonth) {
    const monthISO = `${y}-${String(m).padStart(2, "0")}`;
    if (!existingMonths.has(monthISO)) {
      rows.push({
        client_id: clientId,
        description: "Mensalidade",
        type: "recorrente",
        category: "mensalidade",
        amount,
        due_date: dueDateFor(monthISO, day),
        status: "pendente",
      });
    }
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("revenues").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/clientes");
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

export async function deleteClient(formData: FormData) {
  const supabase = createSupabase();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error)
    throw new Error(
      "Não foi possível excluir (o cliente tem receitas vinculadas — cancele ou exclua as receitas antes)."
    );
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
}
