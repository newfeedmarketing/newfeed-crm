"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, todayISO } from "@/lib/format";

export async function createRevenue(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = {
    client_id: String(formData.get("client_id") || ""),
    description: String(formData.get("description") || ""),
    category: String(formData.get("category") || "mensalidade"),
    amount: Number(formData.get("amount") || 0),
    notes: String(formData.get("notes") || "") || null,
    created_by: user?.id ?? null,
  };
  const dueDate = String(formData.get("due_date") || todayISO());
  const recurring = formData.get("recurring") === "on";
  const months = Math.min(Math.max(Number(formData.get("months") || 12), 1), 24);

  const rows = recurring
    ? Array.from({ length: months }, (_, i) => ({
        ...base,
        type: "recorrente",
        due_date: addMonthsISO(dueDate, i),
      }))
    : [{ ...base, type: "avulsa", due_date: dueDate }];

  const { error } = await supabase.from("revenues").insert(rows);
  if (error) throw new Error("Erro ao criar receita: " + error.message);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

export async function markReceived(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("revenues")
    .update({
      status: "recebido",
      paid_date: todayISO(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
  revalidatePath("/caixa");
}

export async function undoReceived(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("revenues")
    .update({ status: "pendente", paid_date: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

export async function deleteRevenue(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("revenues").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}
