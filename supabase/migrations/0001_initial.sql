-- ============================================================
-- New Feed CRM - Migração inicial
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- ============================================================

-- ENUMS -------------------------------------------------------
create type user_role as enum ('admin','financeiro','atendimento','gestor','visualizador');
create type client_status as enum ('ativo','pausado','cancelado','inadimplente');
create type revenue_status as enum ('recebido','pendente','atrasado','cancelado');
create type expense_status as enum ('pago','pendente','atrasado');
create type recurrence_type as enum ('unica','mensal','anual');
create type revenue_type as enum ('recorrente','avulsa');
create type equipment_condition as enum ('novo','usado','manutencao','descartado');
create type payment_method as enum ('pix','boleto','cartao_credito','cartao_debito','transferencia','dinheiro','outro');

-- USUÁRIOS ----------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'visualizador',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se cadastra.
-- O PRIMEIRO usuário vira admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when (select count(*) from public.profiles) = 0
      then 'admin'::user_role
      else 'visualizador'::user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- CLIENTES ----------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  document text,
  address text,
  status client_status not null default 'ativo',
  start_date date,
  payment_due_day smallint check (payment_due_day between 1 and 31),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SERVIÇOS ----------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  default_price numeric(12,2) not null default 0,
  estimated_cost numeric(12,2) not null default 0,
  avg_delivery_days integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  margin_pct numeric(5,2) generated always as (
    case when default_price > 0
      then round((default_price - estimated_cost) / default_price * 100, 2)
    end
  ) stored
);

-- CONTRATOS (cliente x serviço) -------------------------------
create table contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid not null references services(id),
  price numeric(12,2) not null,
  recurrence recurrence_type not null default 'mensal',
  start_date date not null,
  end_date date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- RECEITAS (contas a receber) ---------------------------------
create table revenues (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  contract_id uuid references contracts(id),
  description text not null,
  type revenue_type not null default 'recorrente',
  category text,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  paid_date date,
  status revenue_status not null default 'pendente',
  payment_method payment_method,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on revenues (status, due_date);
create index on revenues (client_id);

-- DESPESAS (contas a pagar) -----------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  paid_date date,
  status expense_status not null default 'pendente',
  recurrence recurrence_type not null default 'unica',
  recurrence_parent_id uuid references expenses(id),
  payment_method payment_method,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on expenses (status, due_date);
create index on expenses (category);

-- EQUIPAMENTOS ------------------------------------------------
create table equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_value numeric(12,2),
  condition equipment_condition not null default 'novo',
  responsible text,
  location text,
  warranty_until date,
  notes text,
  created_at timestamptz not null default now()
);

-- INTERAÇÕES COM CLIENTE --------------------------------------
create table interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid references profiles(id),
  type text not null,
  occurred_at timestamptz not null default now(),
  notes text not null
);

-- CONFIGURAÇÃO FINANCEIRA (linha única) -----------------------
create table financial_settings (
  id boolean primary key default true check (id),
  minimum_reserve numeric(12,2),
  safe_invest_pct numeric(5,2) not null default 100,
  overdue_days_to_default smallint not null default 7,
  opening_balance numeric(12,2) not null default 0,
  opening_balance_date date not null default current_date
);
insert into financial_settings (opening_balance) values (0);

-- AJUSTES MANUAIS DE CAIXA ------------------------------------
create table cash_adjustments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null,
  reason text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ANEXOS ------------------------------------------------------
create table attachments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('revenue','expense')),
  parent_id uuid not null,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- NOTIFICAÇÕES ------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- AUDITORIA ---------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert','update','delete')),
  changes jsonb,
  created_at timestamptz not null default now()
);

-- SEGURANÇA (RLS) ---------------------------------------------
-- MVP: qualquer usuário autenticado acessa; a matriz fina de
-- papéis entra na Entrega 5 sem mudar o schema.
alter table profiles enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table contracts enable row level security;
alter table revenues enable row level security;
alter table expenses enable row level security;
alter table equipment enable row level security;
alter table interactions enable row level security;
alter table financial_settings enable row level security;
alter table cash_adjustments enable row level security;
alter table attachments enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

create policy "auth_all" on profiles for all to authenticated using (true) with check (true);
create policy "auth_all" on clients for all to authenticated using (true) with check (true);
create policy "auth_all" on services for all to authenticated using (true) with check (true);
create policy "auth_all" on contracts for all to authenticated using (true) with check (true);
create policy "auth_all" on revenues for all to authenticated using (true) with check (true);
create policy "auth_all" on expenses for all to authenticated using (true) with check (true);
create policy "auth_all" on equipment for all to authenticated using (true) with check (true);
create policy "auth_all" on interactions for all to authenticated using (true) with check (true);
create policy "auth_all" on financial_settings for all to authenticated using (true) with check (true);
create policy "auth_all" on cash_adjustments for all to authenticated using (true) with check (true);
create policy "auth_all" on attachments for all to authenticated using (true) with check (true);
create policy "auth_all" on notifications for all to authenticated using (true) with check (true);
create policy "auth_all" on audit_log for all to authenticated using (true) with check (true);

-- CATÁLOGO INICIAL DE SERVIÇOS --------------------------------
insert into services (name, description, default_price, estimated_cost, avg_delivery_days) values
('Gestão de tráfego pago', 'Gestão de campanhas Meta/Google Ads', 1500.00, 300.00, 30),
('Social media', 'Gestão de redes sociais e conteúdo', 1200.00, 400.00, 30),
('Criação de site', 'Site institucional completo', 4500.00, 1200.00, 45),
('Landing page', 'Página de conversão', 1800.00, 500.00, 15),
('Design', 'Peças gráficas avulsas', 600.00, 150.00, 7),
('Branding', 'Identidade visual completa', 3500.00, 900.00, 30),
('Consultoria', 'Consultoria de marketing', 800.00, 100.00, 7),
('Edição de vídeo', 'Edição e motion para redes', 900.00, 300.00, 10),
('Automação', 'Automação de marketing e CRM', 2000.00, 500.00, 20);
