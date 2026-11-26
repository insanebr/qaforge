-- ==============================================================================
-- RLS POLICIES AVANÇADAS & AUDIT TRIGGERS - SISTEMA DE GESTÃO DE TESTES
-- ==============================================================================

-- 1. FUNÇÃO AUXILIAR: Obter o papel do usuário autenticado atual
create or replace function public.get_current_user_role()
returns user_role as $$
declare
    v_role user_role;
begin
    select role into v_role from public.users where id = auth.uid();
    return coalesce(v_role, 'viewer'::user_role);
end;
$$ language plpgsql security definer;

-- 2. FUNÇÃO E TRIGGER DE AUDITORIA: Registrar ações em audit_logs
create or replace function public.log_audit_action()
returns trigger as $$
begin
    insert into public.audit_logs (user_id, action, table_name, record_id)
    values (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        coalesce(NEW.id, OLD.id)
    );
    return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Triggers de auditoria para operações críticas (DELETE e UPDATE de status)
drop trigger if exists trg_audit_features on public.features;
create trigger trg_audit_features
    after delete on public.features
    for each row execute function public.log_audit_action();

drop trigger if exists trg_audit_test_runs on public.test_runs;
create trigger trg_audit_test_runs
    after delete or update on public.test_runs
    for each row execute function public.log_audit_action();

drop trigger if exists trg_audit_qa_branches on public.qa_branches;
create trigger trg_audit_qa_branches
    after delete or update on public.qa_branches
    for each row execute function public.log_audit_action();

-- 3. POLÍTICAS DE RLS REFINADAS (Viewer vs QA vs Admin)

-- Remover políticas permissivas temporárias
drop policy if exists "Usuários autenticados podem ver perfis" on public.users;
drop policy if exists "Usuários autenticados podem gerenciar features" on public.features;
drop policy if exists "Usuários autenticados podem gerenciar test_cases" on public.test_cases;
drop policy if exists "Usuários autenticados podem gerenciar qa_branches" on public.qa_branches;
drop policy if exists "Usuários autenticados podem gerenciar test_runs" on public.test_runs;
drop policy if exists "Usuários autenticados podem gerenciar test_run_items" on public.test_run_items;
drop policy if exists "Usuários autenticados podem ver e criar audit_logs" on public.audit_logs;

-- TABELA: users
create policy "users_select_policy" on public.users
    for select to authenticated using (true);

create policy "users_admin_policy" on public.users
    for all to authenticated
    using (public.get_current_user_role() = 'admin')
    with check (public.get_current_user_role() = 'admin');

-- TABELA: features
create policy "features_select_policy" on public.features
    for select to authenticated using (true);

create policy "features_write_policy" on public.features
    for all to authenticated
    using (public.get_current_user_role() in ('qa', 'admin'))
    with check (public.get_current_user_role() in ('qa', 'admin'));

-- TABELA: test_cases
create policy "test_cases_select_policy" on public.test_cases
    for select to authenticated using (true);

create policy "test_cases_write_policy" on public.test_cases
    for all to authenticated
    using (public.get_current_user_role() in ('qa', 'admin'))
    with check (public.get_current_user_role() in ('qa', 'admin'));

-- TABELA: qa_branches
create policy "qa_branches_select_policy" on public.qa_branches
    for select to authenticated using (true);

create policy "qa_branches_write_policy" on public.qa_branches
    for all to authenticated
    using (public.get_current_user_role() in ('qa', 'admin'))
    with check (public.get_current_user_role() in ('qa', 'admin'));

-- TABELA: test_runs
create policy "test_runs_select_policy" on public.test_runs
    for select to authenticated using (true);

create policy "test_runs_write_policy" on public.test_runs
    for all to authenticated
    using (public.get_current_user_role() in ('qa', 'admin'))
    with check (public.get_current_user_role() in ('qa', 'admin'));

-- TABELA: test_run_items
create policy "test_run_items_select_policy" on public.test_run_items
    for select to authenticated using (true);

create policy "test_run_items_write_policy" on public.test_run_items
    for all to authenticated
    using (public.get_current_user_role() in ('qa', 'admin'))
    with check (public.get_current_user_role() in ('qa', 'admin'));

-- TABELA: audit_logs
create policy "audit_logs_select_policy" on public.audit_logs
    for select to authenticated using (true);

create policy "audit_logs_insert_policy" on public.audit_logs
    for insert to authenticated with check (true);
