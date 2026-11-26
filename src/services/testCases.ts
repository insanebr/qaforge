import { createClient } from '@/lib/supabase/client';
import type { TestCase, TestPriority } from '@/types/database';

export async function getTestCasesByFeature(featureId: string): Promise<TestCase[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('feature_id', featureId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching test cases:', error);
    throw error;
  }

  return data || [];
}

export async function createTestCase(testCase: {
  feature_id: string;
  title: string;
  priority: TestPriority;
}): Promise<TestCase> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('test_cases')
    .insert([
      {
        feature_id: testCase.feature_id,
        title: testCase.title.trim(),
        priority: testCase.priority,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating test case:', error);
    throw error;
  }

  return data;
}

export async function createTestCasesBulk(
  featureId: string,
  cases: { title: string; priority: TestPriority }[]
): Promise<TestCase[]> {
  const supabase = createClient();

  const payload = cases.map((c) => ({
    feature_id: featureId,
    title: c.title.trim(),
    priority: c.priority,
  }));

  const { data, error } = await supabase
    .from('test_cases')
    .insert(payload)
    .select();

  if (error) {
    console.error('Error bulk creating test cases:', error);
    throw error;
  }

  return data || [];
}

export async function updateTestCase(
  id: string,
  testCase: {
    title?: string;
    priority?: TestPriority;
  }
): Promise<TestCase> {
  const supabase = createClient();

  const payload: any = {};
  if (testCase.title !== undefined) payload.title = testCase.title.trim();
  if (testCase.priority !== undefined) payload.priority = testCase.priority;

  const { data, error } = await supabase
    .from('test_cases')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating test case:', error);
    throw error;
  }

  return data;
}

export async function deleteTestCase(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('test_cases')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting test case:', error);
    throw error;
  }
}
