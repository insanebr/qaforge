import { createClient } from '@/lib/supabase/client';
import type { TestRun, TestRunItem, RunStatus, ItemStatus } from '@/types/database';

export interface TestRunSummary extends TestRun {
  total_items: number;
  done_count: number;
  failed_count: number;
  testing_count: number;
  to_test_count: number;
  branch_name?: string | null;
}

export async function getTestRuns(): Promise<TestRunSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('test_runs')
    .select(`
      *,
      qa_branches (
        name
      ),
      test_run_items (
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching test runs:', error);
    throw error;
  }

  return (data || []).map((run: any) => {
    const items = run.test_run_items || [];
    const done_count = items.filter((i: any) => i.status === 'done').length;
    const failed_count = items.filter((i: any) => i.status === 'failed').length;
    const testing_count = items.filter((i: any) => i.status === 'testing').length;
    const to_test_count = items.filter((i: any) => i.status === 'to_test').length;

    return {
      id: run.id,
      title: run.title,
      status: run.status,
      qa_branch_id: run.qa_branch_id,
      created_at: run.created_at,
      branch_name: run.qa_branches?.name || null,
      total_items: items.length,
      done_count,
      failed_count,
      testing_count,
      to_test_count,
    };
  });
}

export async function getTestRunById(id: string): Promise<{
  run: TestRunSummary | null;
  items: (TestRunItem & { qa_email?: string | null })[];
}> {
  const supabase = createClient();

  const { data: runData, error: runError } = await supabase
    .from('test_runs')
    .select(`
      *,
      qa_branches (
        name
      )
    `)
    .eq('id', id)
    .single();

  if (runError || !runData) {
    console.error('Error fetching test run details:', runError);
    return { run: null, items: [] };
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('test_run_items')
    .select(`
      *,
      users:qa_id (
        email
      )
    `)
    .eq('test_run_id', id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('Error fetching test run items:', itemsError);
  }

  const items = (itemsData || []).map((item: any) => ({
    ...item,
    qa_email: item.users?.email || null,
  }));

  const done_count = items.filter((i) => i.status === 'done').length;
  const failed_count = items.filter((i) => i.status === 'failed').length;
  const testing_count = items.filter((i) => i.status === 'testing').length;
  const to_test_count = items.filter((i) => i.status === 'to_test').length;

  const run: TestRunSummary = {
    ...runData,
    branch_name: runData.qa_branches?.name || null,
    total_items: items.length,
    done_count,
    failed_count,
    testing_count,
    to_test_count,
  };

  return { run, items };
}

export async function createTestRun(data: {
  title: string;
  qa_branch_id?: string | null;
  selectedTestCaseIds: string[];
}): Promise<TestRun> {
  const supabase = createClient();

  // 1. Criar o registro do ciclo de teste
  const { data: newRun, error: runError } = await supabase
    .from('test_runs')
    .insert([
      {
        title: data.title.trim(),
        qa_branch_id: data.qa_branch_id || null,
        status: 'open',
      },
    ])
    .select()
    .single();

  if (runError || !newRun) {
    console.error('Error creating test run:', runError);
    throw runError;
  }

  // 2. Se houver casos selecionados, buscar os moldes para gerar os snapshots
  if (data.selectedTestCaseIds.length > 0) {
    const { data: cases, error: casesError } = await supabase
      .from('test_cases')
      .select('id, title, priority')
      .in('id', data.selectedTestCaseIds);

    if (casesError) {
      console.error('Error fetching test cases for snapshot:', casesError);
      throw casesError;
    }

    if (cases && cases.length > 0) {
      const runItems = cases.map((c) => ({
        test_run_id: newRun.id,
        test_case_id: c.id,
        title_snapshot: c.title,
        priority_snapshot: c.priority,
        status: 'to_test',
      }));

      const { error: itemsInsertError } = await supabase
        .from('test_run_items')
        .insert(runItems);

      if (itemsInsertError) {
        console.error('Error creating test run items snapshot:', itemsInsertError);
        throw itemsInsertError;
      }
    }
  }

  return newRun;
}

export async function updateTestRunStatus(id: string, status: RunStatus): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('test_runs')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating test run status:', error);
    throw error;
  }
}

export async function deleteTestRun(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('test_runs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting test run:', error);
    throw error;
  }
}

export async function updateTestRunItem(
  itemId: string,
  payload: {
    status?: ItemStatus;
    comment?: string | null;
    qa_id?: string | null;
  }
): Promise<void> {
  const supabase = createClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.comment !== undefined) updateData.comment = payload.comment?.trim() || null;
  if (payload.qa_id !== undefined) updateData.qa_id = payload.qa_id;

  const { error } = await supabase
    .from('test_run_items')
    .update(updateData)
    .eq('id', itemId);

  if (error) {
    console.error('Error updating test run item:', error);
    throw error;
  }
}
