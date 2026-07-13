import { signIn, signUp } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">New Feed CRM</h1>
          <p className="text-slate-500 mt-1">Gestão financeira da agência</p>
        </div>

        {searchParams.error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {searchParams.error}
          </div>
        )}
        {searchParams.message && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
            {searchParams.message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold mb-4">Entrar</h2>
          <form action={signIn} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="E-mail"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Senha"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-700">
              Entrar
            </button>
          </form>

          <details className="mt-6">
            <summary className="text-sm text-slate-500 cursor-pointer">
              Primeira vez? Criar conta
            </summary>
            <form action={signUp} className="space-y-3 mt-3">
              <input
                name="full_name"
                type="text"
                required
                placeholder="Nome completo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="E-mail"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Senha (mínimo 6 caracteres)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="w-full rounded-lg bg-slate-100 text-slate-900 py-2 text-sm font-medium hover:bg-slate-200 border border-slate-300">
                Criar conta
              </button>
              <p className="text-xs text-slate-400">
                O primeiro usuário cadastrado vira administrador.
              </p>
            </form>
          </details>
        </div>
      </div>
    </main>
  );
}
