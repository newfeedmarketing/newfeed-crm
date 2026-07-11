# New Feed CRM

CRM financeiro da New Feed Marketing. Next.js 14 + Supabase.

**Instalação:** siga o passo a passo em [`SETUP.md`](./SETUP.md) — não é preciso saber programar.

## O que já funciona (MVP · Entregas 1–4)

- Login e criação de conta (primeiro usuário vira admin)
- Dashboard financeiro: entradas, saídas, lucro bruto/líquido, caixa disponível, valor comprometido, **valor seguro para investir**, gráficos de 12 meses e alertas
- Receitas (contas a receber) com recorrência mensal automática
- Despesas (contas a pagar) com recorrência mensal/anual
- Caixa & Investimento com fórmula aberta e configurações (saldo inicial, reserva mínima)
- Clientes: cadastro completo, edição e histórico financeiro
- Serviços: catálogo com margem (leitura)

## Próximas entregas

- E2: contratos cliente×serviço, interações
- E5: equipamentos, relatórios, matriz fina de permissões
- E6: exportação PDF/Excel, notificações, comprovantes, auditoria

## Desenvolvimento local (opcional, para devs)

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev
```

As fórmulas financeiras vivem em `lib/finance/calculations.ts` — nunca duplique regras de dinheiro nas telas.
