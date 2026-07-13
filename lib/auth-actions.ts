"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });
  if (error) {
    redirect("/login?error=" + encodeURIComponent("E-mail ou senha incorretos."));
  }
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    options: {
      data: { full_name: String(formData.get("full_name") || "") },
    },
  });
  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  redirect(
    "/login?message=" +
      encodeURIComponent(
        "Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada antes de entrar."
      )
  );
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
