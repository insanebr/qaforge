-- ==============================================================================
-- DADOS DE DEMONSTRAÇÃO (SEED) - SISTEMA DE GESTÃO DE TESTES
-- ==============================================================================

do $$
declare
    feat_pix uuid;
    feat_auth uuid;
    feat_frete uuid;
    feat_nfe uuid;

    tc_pix_1 uuid;
    tc_pix_2 uuid;
    tc_pix_3 uuid;
    tc_pix_4 uuid;
    tc_pix_5 uuid;

    tc_auth_1 uuid;
    tc_auth_2 uuid;
    tc_auth_3 uuid;

    tc_frete_1 uuid;
    tc_frete_2 uuid;

    branch_pix uuid;
    branch_cart uuid;
    branch_correios uuid;

    run_smoke uuid;
    run_regressao uuid;
begin
    -- 1. Inserir Features de exemplo
    insert into public.features (title, description, doc_url)
    values (
        'Checkout Transparente Pix',
        'Geração de QR Code estático e dinâmico via API do gateway e processamento de webhook de confirmação.',
        'https://app.clickup.com/t/checkout-pix-spec'
    ) returning id into feat_pix;

    insert into public.features (title, description, doc_url)
    values (
        'Autenticação e Recuperação de Senha',
        'Fluxo de login corporativo, Magic Link e redefinição de senha com expiração em 30 minutos.',
        'https://notion.so/auth-spec-doc'
    ) returning id into feat_auth;

    insert into public.features (title, description, doc_url)
    values (
        'Cálculo de Frete e Prazos dos Correios',
        'Integração com API de cálculo de frete SEDEX e PAC considerando CEP de origem e dimensões do pacote.',
        'https://notion.so/correios-frete-rules'
    ) returning id into feat_frete;

    insert into public.features (title, description, doc_url)
    values (
        'Emissão de Nota Fiscal Eletrônica (NFe)',
        'Geração de XML, assinatura digital e envio em lote para o ambiente de contingência da SEFAZ.',
        'https://app.clickup.com/t/nfe-sefaz-docs'
    ) returning id into feat_nfe;

    -- 2. Inserir Casos de Teste (Moldes)
    insert into public.test_cases (feature_id, title, priority)
    values (feat_pix, 'Validar geração de QR Code dinâmico com valor exato do carrinho', 'critical') returning id into tc_pix_1;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_pix, 'Validar expiração do QR Code Pix após 15 minutos de inatividade', 'high') returning id into tc_pix_2;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_pix, 'Confirmar pedido após recebimento do Webhook de liquidação instantânea', 'critical') returning id into tc_pix_3;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_pix, 'Validar mensagem de erro amigável quando a chave Pix estiver indisponível no PSP', 'medium') returning id into tc_pix_4;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_pix, 'Garantir que pagamento duplicado do mesmo Pix gere aviso no painel de conciliação', 'low') returning id into tc_pix_5;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_auth, 'Validar login com sucesso usando e-mail corporativo válido', 'critical') returning id into tc_auth_1;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_auth, 'Bloquear tentativa após 5 falhas consecutivas de senha', 'high') returning id into tc_auth_2;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_auth, 'Validar token de recuperação de senha após o prazo de expiração', 'medium') returning id into tc_auth_3;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_frete, 'Cálculo de frete gratuito para compras acima de R$ 299 na região Sudeste', 'high') returning id into tc_frete_1;

    insert into public.test_cases (feature_id, title, priority)
    values (feat_frete, 'Tratamento de timeout quando o webservice dos Correios não responder em 3s', 'medium') returning id into tc_frete_2;

    -- 3. Inserir Branches de Teste
    insert into public.qa_branches (name, review_date, rejection_count, rejected_cards_count, bugs_created_count, status, reason)
    values (
        'feature/checkout-pix-webhook',
        current_date - interval '2 days',
        1,
        1,
        1,
        'approved',
        'Aprovada após correção do delay no processamento de webhook do PSP.'
    ) returning id into branch_pix;

    insert into public.qa_branches (name, review_date, rejection_count, rejected_cards_count, bugs_created_count, status, reason)
    values (
        'bugfix/cart-discount-rules',
        current_date - interval '5 days',
        3,
        4,
        3,
        'rejected',
        'Reprovada por falha na aplicação de cupom cumulativo na finalização da compra.'
    ) returning id into branch_cart;

    insert into public.qa_branches (name, review_date, rejection_count, rejected_cards_count, bugs_created_count, status, reason)
    values (
        'feature/correios-api-v2',
        current_date - interval '8 days',
        0,
        0,
        0,
        'approved',
        'Aprovada de primeira sem impedimentos nos testes de integração.'
    ) returning id into branch_correios;

    -- 4. Inserir Ciclo Concluído (Smoke Test)
    insert into public.test_runs (title, status, qa_branch_id, created_at)
    values ('Smoke Test - Release v2.3', 'closed', branch_pix, now() - interval '4 days')
    returning id into run_smoke;

    insert into public.test_run_items (test_run_id, test_case_id, title_snapshot, priority_snapshot, status, comment, updated_at)
    values
        (run_smoke, tc_pix_1, 'Validar geração de QR Code dinâmico com valor exato do carrinho', 'critical', 'done', 'Testado no sandbox do PSP com sucesso.', now() - interval '4 days'),
        (run_smoke, tc_pix_2, 'Validar expiração do QR Code Pix após 15 minutos de inatividade', 'high', 'done', null, now() - interval '4 days'),
        (run_smoke, tc_pix_3, 'Confirmar pedido após recebimento do Webhook de liquidação instantânea', 'critical', 'done', null, now() - interval '4 days'),
        (run_smoke, tc_auth_1, 'Validar login com sucesso usando e-mail corporativo válido', 'critical', 'done', null, now() - interval '4 days'),
        (run_smoke, tc_frete_1, 'Cálculo de frete gratuito para compras acima de R$ 299 na região Sudeste', 'high', 'failed', 'https://app.clickup.com/t/86a12b3c4 - Frete cobrado indevidamente para SP', now() - interval '4 days');

    -- 5. Inserir Ciclo em Aberto (Sprint 24)
    insert into public.test_runs (title, status, qa_branch_id, created_at)
    values ('Regressão Sprint 24 - Checkout & Auth', 'open', branch_cart, now() - interval '1 day')
    returning id into run_regressao;

    insert into public.test_run_items (test_run_id, test_case_id, title_snapshot, priority_snapshot, status, comment, updated_at)
    values
        (run_regressao, tc_pix_1, 'Validar geração de QR Code dinâmico com valor exato do carrinho', 'critical', 'done', null, now() - interval '6 hours'),
        (run_regressao, tc_pix_2, 'Validar expiração do QR Code Pix após 15 minutos de inatividade', 'high', 'testing', 'Aguardando cron job de expiração rodar.', now() - interval '2 hours'),
        (run_regressao, tc_pix_4, 'Validar mensagem de erro amigável quando a chave Pix estiver indisponível no PSP', 'medium', 'to_test', null, now() - interval '1 day'),
        (run_regressao, tc_auth_2, 'Bloquear tentativa após 5 falhas consecutivas de senha', 'high', 'done', null, now() - interval '5 hours'),
        (run_regressao, tc_auth_3, 'Validar token de recuperação de senha após o prazo de expiração', 'medium', 'failed', 'https://app.clickup.com/t/86a99z7x1 - Token continua ativo após 40 minutos', now() - interval '1 hour'),
        (run_regressao, tc_frete_2, 'Tratamento de timeout quando o webservice dos Correios não responder em 3s', 'medium', 'to_test', null, now() - interval '1 day');

end $$;
