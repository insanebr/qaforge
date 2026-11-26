# Plano de Execução por Etapas (Roadmap MVP) - Sistema de Gestão de Testes

Este documento estabelece o passo a passo técnico e sequencial para a construção do MVP, garantindo entregas contínuas, testáveis e sem retrabalho.

---

## Visão Geral das Fases

```
[Fase 1: Infraestrutura & Setup] 
       │
       ▼
[Fase 2: Auth, Permissões & Layout Base]
       │
       ▼
[Fase 3: Repositório de Testes (Features & Casos)]
       │
       ▼
[Fase 4: Módulo de Controle de Branches]
       │
       ▼
[Fase 5: Ciclos de Execução (Test Runs & Inline Editing)]
       │
       ▼
[Fase 6: Dashboard & Métricas Quinzenais (@ant-design/charts)]
       │
       ▼
[Fase 7: Auditoria, RLS & Deploy em Produção]
```

---

## Detalhamento das Etapas

### Fase 1: Infraestrutura, Banco de Dados & Setup Inicial
*Objetivo: Estabelecer as bases do projeto, ambiente de desenvolvimento e banco de dados configurado.*

1. **Configuração do Supabase:**
   * Criação do projeto no Supabase Cloud (ou ambiente local).
   * Execução do script DDL inicial:
     * Enums (`user_role`, `test_priority`, `branch_status`, `run_status`, `item_status`).
     * Tabelas (`users`, `features`, `test_cases`, `qa_branches`, `test_runs`, `test_run_items`, `audit_logs`).
     * Índices de performance para busca por feature, run e data.
   * Criação de Trigger no Postgres para auto-sincronizar usuários de `auth.users` para `public.users` no primeiro login (com role default `'qa'`).
2. **Setup do Projeto Frontend (Next.js):**
   * Inicialização com Next.js (App Router, TypeScript).
   * Configuração do Ant Design 5:
     * Setup do `@ant-design/cssinjs` (StyleProvider/AntdRegistry) para compatibilidade perfeita com Server-Side Rendering (SSR) do Next.js.
     * Configuração do tema (ConfigProvider) com suporte nativo a Dark Mode e densidade compacta para alta densidade de dados.
3. **Configuração de Variáveis de Ambiente & SDK Supabase:**
   * Configuração de `@supabase/ssr` para comunicação segura client-side e server-side.
   * Criação dos clientes utilitários do Supabase (`client.ts`, `server.ts`).

---

### Fase 2: Autenticação, Proteção de Rotas & Shell da Aplicação
*Objetivo: Criar a navegação da plataforma e garantir acesso autenticado.*

1. **Fluxo de Autenticação (US01):**
   * Tela de Login corporativo (e-mail corporativo / Magic Link ou Senha).
   * Middleware de autenticação no Next.js protegendo as rotas privadas.
   * Hook/Contexto global de sessão (`useUser`, trazendo os dados e role do usuário logado).
2. **Layout Base da Aplicação (Shell):**
   * Componente `Layout` do AntD com menu lateral retrátil (`Sider`):
     * Dashboard
     * Features & Casos de Teste
     * Execuções (Test Runs)
     * Qualidade de Branches
     * Configurações / Usuários (visível apenas para `admin`)
   * Cabeçalho (`Header`):
     * Exibição do usuário atual e sua `Tag` de Role (Admin / QA / Viewer).
     * Alternador rápido de Tema (Claro / Escuro).
     * Ação de Logout.
   * Tratamento de permissão de visualização (esconder botões de edição para perfil `viewer`).

---

### Fase 3: Módulo de Features & Casos de Teste (US02, US03)
*Objetivo: Permitir o cadastro do repositório de moldes de testes.*

1. **Gestão de Features (US02):**
   * Tela de listagem de Features (Cards ou Tabela compacta) com busca por título.
   * Modal/Drawer de criação e edição (Título, Descrição, URL Notion/Clickup).
   * Exclusão com confirmação (`Popconfirm`).
2. **Gestão de Casos de Teste (US03):**
   * Visualização dos testes pertencentes a uma Feature (Visão Mestre-Detalhe ou Accordion).
   * Adição ágil de Caso de Teste com campo de **Título** e **Prioridade** (`Low`, `Medium`, `High`, `Critical`).
   * Edição e exclusão direta.
   * Contador de casos de teste por feature.

---

### Fase 4: Módulo de Controle de Branches (US06)
*Objetivo: Acompanhar o histórico de validações e métricas de branches de desenvolvimento.*

1. **Tabela de Branches:**
   * Listagem com `Table` do AntD contendo ordenação (`sorter`) por data de revisão, reprovações, cards e bugs.
   * Filtros por status (`Testing`, `Approved`, `Rejected`).
2. **Drawer de Cadastro/Edição Ágil:**
   * Formulário lateral com campos:
     * Nome da Branch e Data da Revisão.
     * Contadores usando `InputNumber` (+ e -) para: Reprovações, Cards Reprovados e Bugs Abertos.
     * Status da Branch e Campo de texto para Justificativa / Motivo.

---

### Fase 5: Ciclos de Teste & Execução (US04, US05)
*Objetivo: Orquestrar e executar os testes com isolamento de histórico.*

1. **Criação do Test Run (US04):**
   * Modal de novo ciclo:
     * Título (ex: *"Smoke Test - Semana 42"*).
     * Vínculo opcional com Branch (`qa_branches`).
     * Seletor de Features/Casos de Teste a incluir (com opção de "Selecionar Todos" ou checklist por Feature).
   * **Geração do Snapshot:** Ao criar o Run, copiar os testes selecionados para `test_run_items` preenchendo `title_snapshot` e `priority_snapshot`.
2. **Tela de Execução (US05 - Inline Editing):**
   * Tabela de alta densidade listando os itens do ciclo.
   * **Edição Inline de Status:** Dropdown com tags coloridas:
     * `To Test` (Azul/Padrão)
     * `Testing` (Laranja)
     * `Failed` (Vermelho)
     * `Done` (Verde)
   * **Atribuição automática:** Ao alterar o status, gravar automaticamente o `qa_id` do usuário logado.
   * **Campo de Comentário/Bug:** Input de texto rápido para link do Clickup.
   * Barra de progresso superior do ciclo (% concluído, % falho, % pendente).
   * Ação de Fechar Ciclo (`status: closed`).

---

### Fase 6: Dashboard & Métricas Quinzenais (US07)
*Objetivo: Visualizar a saúde da qualidade do produto e produtividade da equipe.*

1. **Setup de Gráficos:**
   * Integração de `@ant-design/charts` com carregamento dinâmico (`dynamic` import com `ssr: false`).
2. **Filtro de Período Global:**
   * Componente `DatePicker.RangePicker` com atalhos rápidos (Últimos 15 dias, Este mês, Mês passado).
3. **Painel de Configuração de Cards:**
   * Menu para o usuário ligar/desligar a visibilidade de cada card.
4. **Construção dos 5 Cards de Métricas:**
   * **Card 1: Status Geral** (Gráfico Donut/Rosca: Pass vs Fail no período).
   * **Card 2: Produtividade** (Gráfico de Barras: volume de testes executados por QA).
   * **Card 3: Saúde das Features** (Lista/Ranking das Top 3 features com mais falhas).
   * **Card 4: Qualidade de Entregas** (Gráfico de Colunas: branches aprovadas vs reprovadas).
   * **Card 5: Gargalos de Desenvolvimento** (Top 3 branches com maior número de reprovações).

---

### Fase 7: Políticas de Segurança (RLS), Auditoria & Deploy
*Objetivo: Blindar o acesso aos dados e publicar em produção.*

1. **Políticas de RLS (Row Level Security):**
   * `viewer`: Apenas leitura (`SELECT`) em todas as tabelas.
   * `qa`: Leitura e escrita (`INSERT`, `UPDATE`) em Features, Testes, Runs e Branches.
   * `admin`: Acesso total, incluindo gerenciamento da tabela `users`.
2. **Triggers de Auditoria (`audit_logs`):**
   * Registro automático de exclusões e atualizações críticas.
3. **Homologação & Teste de Carga Inicial:**
   * Inserção de massa de testes para simular os ~900 cenários esperados e checagem de fluidez da interface.
4. **Deploy:**
   * Publicação do frontend na Vercel com conexão ao Supabase em produção.
