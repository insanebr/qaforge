-- ==============================================================================
-- SCHEMA INICIAL - SISTEMA DE GESTÃO DE TESTES (MVP)
-- Banco de Dados: PostgreSQL (Supabase)
-- ==============================================================================

-- 1. TIPOS ENUMERADOS (ENUMS)
create type user_role as enum ('admin', 'qa', 'viewer');
create type test_priority as enum ('low', 'medium', 'high', 'critical');
create type branch_status as enum ('testing', 'approved', 'rejected');
create type run_status as enum ('open', 'closed');
create type item_status as enum ('to_test', 'testing', 'failed', 'done');

-- 2. TABELA: users (Perfis de Usuários)
-- Sincronizada automaticamente com auth.users através do trigger handle_new_user
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    role user_role not null default 'qa',
    created_at timestamptz not null default now()
);

-- 3. TABELA: features
create table if not exists public.features (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    doc_url text,
    created_at timestamptz not null default now()
);

-- 4. TABELA: test_cases (O Molde dos Casos de Teste)
create table if not exists public.test_cases (
    id uuid primary key default gen_random_uuid(),
    feature_id uuid not null references public.features(id) on delete cascade,
    title text not null,
    priority test_priority not null default 'medium',
    created_at timestamptz not null default now()
);

-- 5. TABELA: qa_branches (Controle de Qualidade de Branches)
create table if not exists public.qa_branches (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    review_date date not null default current_date,
    rejection_count int not null default 0,
    rejected_cards_count int not null default 0,
    bugs_created_count int not null default 0,
    status branch_status not null default 'testing',
    reason text,
    created_at timestamptz not null default now()
);

-- 6. TABELA: test_runs (Ciclos de Execução)
create table if not exists public.test_runs (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    status run_status not null default 'open',
    qa_branch_id uuid references public.qa_branches(id) on delete set null,
    created_at timestamptz not null default now()
);

-- 7. TABELA: test_run_items (Itens de Execução - Snapshot Imutável)
create table if not exists public.test_run_items (
    id uuid primary key default gen_random_uuid(),
    test_run_id uuid not null references public.test_runs(id) on delete cascade,
    test_case_id uuid references public.test_cases(id) on delete set null,
    title_snapshot text not null,
    priority_snapshot text not null default 'medium',
    status item_status not null default 'to_test',
    comment text,
    qa_id uuid references public.users(id) on delete set null,
    updated_at timestamptz not null default now()
);

-- 8. TABELA: audit_logs (Auditoria e Rastreabilidade)
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    table_name text not null,
    record_id uuid,
    created_at timestamptz not null default now()
);

-- 9. ÍNDICES DE PERFORMANCE
create index if not exists idx_test_cases_feature_id on public.test_cases(feature_id);
create index if not exists idx_test_runs_branch_id on public.test_runs(qa_branch_id);
create index if not exists idx_test_run_items_run_id on public.test_run_items(test_run_id);
create index if not exists idx_test_run_items_status on public.test_run_items(status);
create index if not exists idx_qa_branches_review_date on public.qa_branches(review_date);

-- 10. GATILHO: Sincronização automática de novos usuários (auth.users -> public.users)
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, role)
    values (new.id, new.email, 'qa')
    on conflict (id) do update set email = excluded.email;
    return new;
end;
$$ language plpgsql security definer;

-- Remove o gatilho se já existir antes de recriar
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.features enable row level security;
alter table public.test_cases enable row level security;
alter table public.qa_branches enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_run_items enable row level security;
alter table public.audit_logs enable row level security;

-- POLÍTICAS BÁSICAS (Acesso para usuários autenticados no MVP)
create policy "Usuários autenticados podem ver perfis" on public.users
    for select to authenticated using (true);

create policy "Usuários autenticados podem gerenciar features" on public.features
    for all to authenticated using (true);

create policy "Usuários autenticados podem gerenciar test_cases" on public.test_cases
    for all to authenticated using (true);

create policy "Usuários autenticados podem gerenciar qa_branches" on public.qa_branches
    for all to authenticated using (true);

create policy "Usuários autenticados podem gerenciar test_runs" on public.test_runs
    for all to authenticated using (true);

create policy "Usuários autenticados podem gerenciar test_run_items" on public.test_run_items
    for all to authenticated using (true);

create policy "Usuários autenticados podem ver e criar audit_logs" on public.audit_logs
    for all to authenticated using (true);
