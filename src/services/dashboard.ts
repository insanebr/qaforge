import { createClient } from '@/lib/supabase/client';

export interface DashboardMetrics {
  summary: {
    totalExecuted: number;
    successRate: number;
    totalFailures: number;
    totalBranchesReviewed: number;
  };
  generalStatusData: { type: string; value: number }[];
  qaProductivityData: { qa: string; count: number }[];
  topFailedFeatures: { featureTitle: string; failCount: number }[];
  branchQualityData: { status: string; value: number }[];
  topDevBottlenecks: {
    name: string;
    rejectionCount: number;
    rejectedCards: number;
    bugsCount: number;
    reason?: string | null;
  }[];
}

export async function getDashboardMetrics(
  startDate: string,
  endDate: string
): Promise<DashboardMetrics> {
  const supabase = createClient();

  // 1. Buscar itens de execução no período (com informações de testes, features e QA)
  const { data: runItems, error: itemsError } = await supabase
    .from('test_run_items')
    .select(`
      id,
      status,
      qa_id,
      updated_at,
      users:qa_id (
        email
      ),
      test_cases (
        feature_id,
        features (
          title
        )
      )
    `)
    .gte('updated_at', `${startDate}T00:00:00Z`)
    .lte('updated_at', `${endDate}T23:59:59Z`);

  if (itemsError) {
    console.error('Error fetching test run items for metrics:', itemsError);
  }

  const items = runItems || [];

  // Calcular métricas de execução
  const doneItems = items.filter((i) => i.status === 'done');
  const failedItems = items.filter((i) => i.status === 'failed');
  const totalExecuted = doneItems.length + failedItems.length;
  const successRate = totalExecuted > 0 ? Math.round((doneItems.length / totalExecuted) * 100) : 0;

  // Card 1: Status Geral (Donut)
  const generalStatusData = [
    { type: 'Sucesso (Passou)', value: doneItems.length },
    { type: 'Falha (Reprovou)', value: failedItems.length },
  ];

  // Card 2: Produtividade por QA
  const qaMap: Record<string, number> = {};
  items.forEach((item: any) => {
    if (item.status === 'done' || item.status === 'failed') {
      const email = item.users?.email ? item.users.email.split('@')[0] : 'Não atribuído';
      qaMap[email] = (qaMap[email] || 0) + 1;
    }
  });

  const qaProductivityData = Object.entries(qaMap).map(([qa, count]) => ({
    qa,
    count,
  }));

  // Card 3: Saúde das Features (Top 3 com mais falhas)
  const featureFailMap: Record<string, number> = {};
  failedItems.forEach((item: any) => {
    const featTitle = item.test_cases?.features?.title || 'Feature não identificada';
    featureFailMap[featTitle] = (featureFailMap[featTitle] || 0) + 1;
  });

  const topFailedFeatures = Object.entries(featureFailMap)
    .map(([featureTitle, failCount]) => ({ featureTitle, failCount }))
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 3);

  // 2. Buscar branches revisadas no período
  const { data: branchesData, error: branchError } = await supabase
    .from('qa_branches')
    .select('*')
    .gte('review_date', startDate)
    .lte('review_date', endDate)
    .order('rejection_count', { ascending: false });

  if (branchError) {
    console.error('Error fetching branches for metrics:', branchError);
  }

  const branches = branchesData || [];

  // Card 4: Qualidade de Entregas (Branches Aprovadas vs Reprovadas)
  const approvedBranches = branches.filter((b) => b.status === 'approved').length;
  const rejectedBranches = branches.filter((b) => b.status === 'rejected').length;
  const testingBranches = branches.filter((b) => b.status === 'testing').length;

  const branchQualityData = [
    { status: 'Aprovadas', value: approvedBranches },
    { status: 'Reprovadas', value: rejectedBranches },
    { status: 'Em Teste', value: testingBranches },
  ];

  // Card 5: Gargalos de Desenvolvimento (Top 3 branches com mais retornos)
  const topDevBottlenecks = branches
    .filter((b) => b.rejection_count > 0 || b.rejected_cards_count > 0 || b.bugs_created_count > 0)
    .slice(0, 3)
    .map((b) => ({
      name: b.name,
      rejectionCount: b.rejection_count,
      rejectedCards: b.rejected_cards_count,
      bugsCount: b.bugs_created_count,
      reason: b.reason,
    }));

  return {
    summary: {
      totalExecuted,
      successRate,
      totalFailures: failedItems.length,
      totalBranchesReviewed: branches.length,
    },
    generalStatusData,
    qaProductivityData,
    topFailedFeatures,
    branchQualityData,
    topDevBottlenecks,
  };
}
