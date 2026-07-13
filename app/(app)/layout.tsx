import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/caixa", label: "Caixa", icon: "💰" },
  { href: "/receitas", label: "Receitas", icon: "📈" },
  { href: "/despesas", label: "Despesas", icon: "📉" },
  { href: "/clientes", label: "Clientes", icon: "🏢" },
  { href: "/servicos", label: "Serviços", icon: "🛠️" },
  { href: "/equipamentos", label: "Equipamentos", icon: "💻" },
  { href: "/relatorios", label: "Relatórios", icon: "📄" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) / topo rolável (celular) */}
      <aside className="md:w-56 md:min-h-screen bg-slate-900 text-slate-100 md:flex md:flex-col shrink-0">
        <div className="px-4 py-4 font-bold text-lg hidden md:block">
          New Feed CRM
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-2 md:px-3 py-2 gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-slate-700/60"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="md:mt-auto px-4 py-3 border-t border-slate-700/50 hidden md:block">
          <p className="text-xs text-slate-400 truncate">
            {profile?.full_name ?? user?.email}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            {profile?.role ?? ""}
          </p>
          <form action={signOut}>
            <button className="mt-2 text-xs text-slate-300 hover:text-white underline">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
