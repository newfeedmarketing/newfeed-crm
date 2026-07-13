import { Card } from "@/components/ui";

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-slate-500">
          Faturamento, lucro, inadimplência e fluxo de caixa
        </p>
      </div>
      <Card>
        <p className="text-sm text-slate-500">
          📊 Os 10 relatórios com filtros e exportação PDF/Excel chegam nas{" "}
          <strong>Entregas 5 e 6</strong>. Enquanto isso, o Dashboard e a tela
          de Caixa já mostram os números essenciais do mês.
        </p>
      </Card>
    </div>
  );
}
