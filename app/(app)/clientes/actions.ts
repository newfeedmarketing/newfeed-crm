"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabase } from "@/lib/supabase/server";

function clientFromForm(formData: FormData) {
  return {
    company_name: String(formData.get("company_name") || ""),
    contact_name: String(formData.get("contact_name") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    document: String(formData.get("document") || "") || null,
    address: String(formData.get("address") || "") || null,
    status: String(formData.get("status") || "ativo"),
    start_date: String(formData.get("start_date") || "") || null,
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
