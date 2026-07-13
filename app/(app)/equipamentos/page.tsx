import { Card } from "@/components/ui";

export default function EquipamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipamentos</h1>
        <p className="text-sm text-slate-500">Patrimônio da agência</p>
      </div>
      <Card>
        <p className="text-sm text-slate-500">
          📦 Este módulo chega na <strong>Entrega 5</strong> do plano de
          desenvolvimento. O banco de dados já está pronto para recebê-lo —
          nenhuma migração extra será necessária.
        </p>
      </Card>
    </div>
  );
}
