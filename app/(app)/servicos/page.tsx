import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { Card, thClass, tdClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("name");
  const services = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-slate-500">
          Catálogo da agência com margem estimada. Edição completa e contratos
          por cliente chegam na Entrega 2.
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={thClass}>Serviço</th>
              <th className={thClass}>Preço padrão</th>
              <th className={thClass}>Custo estimado</th>
              <th className={thClass}>Margem</th>
              <th className={thClass}>Entrega média</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium`}>
                  {s.name}
                  {s.description && (
                    <span className="block text-xs text-slate-400">
                      {s.description}
                    </span>
                  )}
                </td>
                <td className={tdClass}>{formatBRL(Number(s.default_price))}</td>
                <td className={tdClass}>{formatBRL(Number(s.estimated_cost))}</td>
                <td className={tdClass}>
                  <span
                    className={
                      Number(s.margin_pct) >= 60
                        ? "text-green-600 font-medium"
                        : Number(s.margin_pct) >= 40
                        ? "text-amber-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {s.margin_pct != null ? `${Number(s.margin_pct)}%` : "—"}
                  </span>
                </td>
                <td className={tdClass}>
                  {s.avg_delivery_days ? `${s.avg_delivery_days} dias` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
