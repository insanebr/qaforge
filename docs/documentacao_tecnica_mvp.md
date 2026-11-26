# Documentação de Requisitos e Arquitetura (MVP) - Sistema de Gestão de Testes

## 1. Visão Geral do Produto
Ferramenta interna de gestão de testes desenvolvida para um time de QA (5 pessoas). O objetivo é substituir ferramentas caras do mercado por uma solução customizada, eficiente e de baixo custo, focada em testes manuais e levantamento de métricas quinzenais. 
* **Prazo (MVP):** 45 dias.
* **Volume Esperado:** ~900 cenários completos, ~300 no smoke test, média de 1x por semana.

## 2. Stack Tecnológica
* **Frontend:** React com framework Next.js (TypeScript).
* **Biblioteca de UI:** Ant Design (AntD) com suporte nativo a Dark Mode e alta densidade de dados.
* **Biblioteca de Gráficos:** `@ant-design/charts` (mantendo padrões visuais do AntD).
* **Backend e Banco de Dados:** Supabase (PostgreSQL + Auth + RLS).
* **Hospedagem:** Vercel (Frontend) e Supabase Cloud (Backend).

## 3. Perfis de Usuário (Roles)
* **Admin:** Acesso total (configurações, gerenciamento de perfis de usuários).
* **QA:** Cria e edita Features, Casos de Teste, Test Runs e Métricas de Branches.
* **Viewer (Desenvolvedor / Stakeholder):** Acesso apenas leitura para visualização de Dashboards e resultados dos testes.

## 4. Histórias de Usuário (User Stories)
* **US01 - Autenticação & Onboarding Ágil:** Como usuário corporativo, quero fazer login com meu e-mail da empresa (via Supabase Auth) e receber acesso imediato (perfil padrão inicial), sem depender de aprovação prévia manual.
* **US02 - Gestão de Features:** Como QA, quero criar "Features" contendo Título, Descrição e Link da Documentação (ex: Notion/Clickup), para agrupar meus casos de teste.
* **US03 - Repositório de Testes:** Como QA, quero adicionar Casos de Teste (Título e Prioridade) dentro de uma Feature, para manter uma base de moldes reutilizáveis.
* **US04 - Ciclos de Teste (Test Runs):** Como QA, quero criar um "Ciclo de Teste" (ex: "Smoke Test - Semana 42") e importar testes das Features, gerando um snapshot imutável para não sobrescrever execuções passadas nem perder histórico caso o molde seja alterado.
* **US05 - Execução (Test Run Items):** Como QA, quero alterar o status dos testes no meu Ciclo (`To Test`, `Testing`, `Failed`, `Done`) e adicionar comentários (inserindo o link/ID do bug no Clickup em caso de falha).
* **US06 - Controle de Qualidade de Branches:** Como QA, quero registrar as *branches* testadas, informando: nome, data, contagem de reprovações, cards reprovados, bugs abertos e o motivo da aprovação/reprovação.
* **US07 - Dashboard com Filtro por Período:** Como usuário, quero uma tela inicial com filtro de datas (`RangePicker`) e "Cards" configuráveis (exibir/ocultar) para visualizar métricas quinzenais (Status Geral, Produtividade, Saúde das Features, Qualidade de Branches).

## 5. Modelagem de Dados (PostgreSQL / Supabase)

### Tabela: `users` (Sincronizada via Trigger com Supabase Auth)
* `id` (uuid, PK -> auth.users.id)
* `email` (string)
* `role` (enum: 'admin', 'qa', 'viewer', default: 'qa')
* `created_at` (timestamp)

### Tabela: `features`
* `id` (uuid, PK)
* `title` (string)
* `description` (text)
* `doc_url` (string)
* `created_at` (timestamp)

### Tabela: `test_cases` (O Molde)
* `id` (uuid, PK)
* `feature_id` (uuid, FK -> features.id ON DELETE CASCADE)
* `title` (string)
* `priority` (enum: 'low', 'medium', 'high', 'critical', default: 'medium')
* `created_at` (timestamp)

### Tabela: `qa_branches` (Controle de Qualidade de Branches)
* `id` (uuid, PK)
* `name` (string)
* `review_date` (date)
* `rejection_count` (int, default: 0)
* `rejected_cards_count` (int, default: 0)
* `bugs_created_count` (int, default: 0)
* `status` (enum: 'testing', 'approved', 'rejected')
* `reason` (text)
* `created_at` (timestamp)

### Tabela: `test_runs` (O Agrupador de Execução)
* `id` (uuid, PK)
* `title` (string)
* `status` (enum: 'open', 'closed', default: 'open')
* `qa_branch_id` (uuid, FK -> qa_branches.id, opcional)
* `created_at` (timestamp)

### Tabela: `test_run_items` (A Execução em si - Snapshot Imutável)
* `id` (uuid, PK)
* `test_run_id` (uuid, FK -> test_runs.id ON DELETE CASCADE)
* `test_case_id` (uuid, FK -> test_cases.id, opcional / ON DELETE SET NULL)
* `title_snapshot` (string) *(Nome do teste no momento em que o run foi gerado)*
* `priority_snapshot` (string) *(Prioridade capturada no momento da importação)*
* `status` (enum: 'to_test', 'testing', 'failed', 'done', default: 'to_test')
* `comment` (text)
* `qa_id` (uuid, FK -> users.id, usuário que executou)
* `updated_at` (timestamp)

### Tabela: `audit_logs` (Rastreabilidade)
* `id` (uuid, PK)
* `user_id` (uuid, FK -> users.id)
* `action` (string, ex: 'delete', 'update_status')
* `table_name` (string)
* `record_id` (uuid)
* `created_at` (timestamp)

## 6. Diretrizes de UI/UX (Ant Design + @ant-design/charts)
* **Navegação Geral:** `Layout` padrão do AntD com menu lateral (`Sider`) contendo: Dashboard, Features/Base de Testes, Execuções (Test Runs), Controle de Branches e Configurações.
* **Dashboard:**
  * Topo com filtro de período (`DatePicker.RangePicker`) para análise customizada (quinzenal, mensal, etc.).
  * Construído com um `Grid` (Row/Col). Deve possuir menu de configuração para exibir/ocultar os seguintes cards/gráficos (via `@ant-design/charts`):
    1. Status Geral (Gráfico de Rosca / Donut: Sucesso vs Falha).
    2. Produtividade (Gráfico de Barras: testes executados por QA no período filtrado).
    3. Saúde das Features (Top 3 com mais falhas).
    4. Qualidade de Entregas (Branches aprovadas vs reprovadas).
    5. Gargalos de Desenvolvimento (Top 3 branches com mais retornos).
* **Test Runs (Execução):** Tabela editável (`Inline Editing`). Status usa dropdown com componentes `Tag` coloridas. Campo de comentário usa input simples otimizado para colar URLs do Clickup.
* **Controle de Branches:** Listagem em `Table` com ordenação de colunas numéricas (`sorter`). Formulário de criação e edição dentro de um componente `Drawer` utilizando `InputNumber` (+ e -) para métricas ágeis.
