# TestManager - Sistema de Gestão de Testes & Qualidade de Entregas

Ferramenta interna de gestão de testes de QA desenvolvida sob medida para times ágeis. O sistema substitui soluções caras de mercado por uma plataforma rápida, de alta densidade de dados e focada em execuções manuais, rastreabilidade de branches e levantamento de métricas quinzenais.

---

## 🚀 Stack Tecnológica

* **Frontend:** React 18 com Next.js 14 (App Router & TypeScript).
* **Biblioteca de UI:** [Ant Design 5](https://ant.design/) (AntD) com suporte nativo a Dark Mode e algoritmo de densidade compacta.
* **Visualização de Dados:** `@ant-design/charts` (Donut, Barras e Colunas integrados ao tema).
* **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL 15, Auth nativo e Row Level Security).
* **Deploy Recomendado:** [Vercel](https://vercel.com/) (Frontend) e Supabase Cloud (Backend).

---

## ✨ Principais Funcionalidades

1. **Repositório de Testes (Features & Casos de Teste):**
   * Agrupamento por Feature com links diretos para Notion, ClickUp ou Confluence.
   * Moldes de casos de teste com classificação por prioridade (`Crítica`, `Alta`, `Média`, `Baixa`).
   * Adição rápida inline via teclado (`Enter`).

2. **Ciclos de Teste (Test Runs) com Snapshot Imutável:**
   * Importador de testes com árvore de features e seleção ágil em lote.
   * **Garantia de Integridade:** Gera um snapshot imutável (`title_snapshot` e `priority_snapshot`) no momento do ciclo; alterações ou exclusões posteriores nos moldes não alteram o histórico.
   * Tabela de alta densidade com **edição inline** de status (`A Testar`, `Testando`, `Falhou`, `Passou`).
   * Associação automática do QA executor e campo para colar URLs de bugs do ClickUp.

3. **Controle de Qualidade de Branches:**
   * Rastreamento de branches testadas com histórico de aprovações/reprovações.
   * Drawer lateral ágil com incrementadores numéricos (`InputNumber`) para reprovações, cards reprovados e bugs gerados.
   * Ordenação numérica (`sorter`) por qualquer métrica.

4. **Dashboard com Métricas Quinzenais:**
   * Filtro de intervalo de datas (`RangePicker`) com atalhos de 15 dias e mês atual.
   * Modal de personalização para ligar/desligar qualquer um dos 5 cards com persistência no navegador:
     1. *Status Geral* (Donut de Sucesso vs Falha).
     2. *Produtividade da Equipe* (Testes por membro de QA).
     3. *Saúde das Features* (Top 3 funcionalidades com mais falhas).
     4. *Qualidade de Entregas* (Branches aprovadas vs reprovadas).
     5. *Gargalos de Desenvolvimento* (Top 3 branches com mais retornos).

5. **Perfis de Usuário (Roles):**
   * **Admin:** Acesso total e gerenciamento de perfis.
   * **QA:** Criação e edição de features, casos de teste, ciclos e branches.
   * **Viewer:** Acesso apenas leitura a dashboards e resultados de testes.

---

## 🛠️ Como Executar Localmente

### 1. Clonar o repositório e instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto (ou copie de `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://vmoceqizuoplduhrzvzg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_DUk2UOyhKtPdwZLnCRSDLA_l_GNYPv9
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse **`http://localhost:3000`** no seu navegador.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Os scripts SQL estão organizados na pasta `supabase/`:

* [supabase/schema.sql](file:///d:/Projetos/TestManager/supabase/schema.sql): Estrutura DDL inicial de tabelas, enums, índices e triggers de auto-onboarding.
* [supabase/rls_and_audit.sql](file:///d:/Projetos/TestManager/supabase/rls_and_audit.sql): Políticas de Row Level Security (RLS) e triggers de auditoria em `audit_logs`.
* [supabase/seed.sql](file:///d:/Projetos/TestManager/supabase/seed.sql): Dados de demonstração realistas para popular o sistema com features, branches e runs de exemplo.

> Para aplicar qualquer script, acesse o **SQL Editor** no painel do Supabase, cole o conteúdo e clique em **Run**.

---

## 🚢 Deploy na Vercel

1. Suba o código para um repositório no GitHub/GitLab.
2. Acesse [vercel.com](https://vercel.com/) e importe o repositório.
3. Nas configurações de **Environment Variables**, adicione:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**. A plataforma compilará e disponibilizará o sistema com HTTPS automático.
