"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = createClient();

  const reserveRaw = String(formData.get("minimum_reserve") ?? "").trim();

  const { error } = await supabase
    .from("financial_settings")
    .update({
      opening_balance: Number(formData.get("opening_balance") || 0),
      opening_balance_date: String(formData.get("opening_balance_date")),
      minimum_reserve: reserveRaw === "" ? null : Number(reserveRaw),
      safe_invest_pct: Math.min(
        Math.max(Number(formData.get("safe_invest_pct") || 100), 0),
        100
      ),
      overdue_days_to_default: Math.max(
        Number(formData.get("overdue_days_to_default") || 7),
        0
      ),
    })
    .eq("id", true);

  if (error) throw new Error("Erro ao salvar configurações: " + error.message);
  revalidatePath("/caixa");
  revalidatePath("/dashboard");
}
