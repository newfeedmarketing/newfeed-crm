-- Tipo de cliente (mensal ou freela) e valor mensal contratado
alter table clients add column if not exists client_type text not null default 'mensal'
  check (client_type in ('mensal','freela'));
alter table clients add column if not exists monthly_value numeric(12,2);
