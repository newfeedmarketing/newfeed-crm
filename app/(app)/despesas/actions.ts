"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, todayISO } from "@/lib/format";

export async function createExpense(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = {
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "outros"),
    amount: Number(formData.get("amount") || 0),
    notes: String(formData.get("notes") || "") || null,
    created_by: user?.id ?? null,
  };
  const dueDate = String(formData.get("due_date") || todayISO());
  const recurrence = String(formData.get("recurrence") || "unica");
  const months = Math.min(Math.max(Number(formData.get("months") || 12), 1), 24);

  let rows;
  if (recurrence === "mensal") {
    rows = Array.from({ length: months }, (_, i) => ({
      ...base,
      recurrence: "mensal",
      due_date: addMonthsISO(dueDate, i),
    }));
  } else if (recurrence === "anual") {
    rows = [0, 1].map((i) => ({
      ...base,
      recurrence: "anual",
      due_date: addMonthsISO(dueDate, i * 12),
    }));
  } else {
    rows = [{ ...base, recurrence: "unica", due_date: dueDate }];
  }

  const { error } = await supabase.from("expenses").insert(rows);
  if (error) throw new Error("Erro ao criar despesa: " + error.message);
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
}

export async function markPaid(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("expenses")
    .update({
      status: "pago",
      paid_date: todayISO(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/caixa");
}

export async function undoPaid(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("expenses")
    .update({ status: "pendente", paid_date: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
}

export async function deleteExpense(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/despesas");
  revalidatePath("/dashboard");
}
