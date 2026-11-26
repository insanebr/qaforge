import { createClient } from '@/lib/supabase/client';
import type { QaBranch, BranchStatus } from '@/types/database';

export async function getBranches(): Promise<QaBranch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('qa_branches')
    .select('*')
    .order('review_date', { ascending: false });

  if (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }

  return data || [];
}

export async function getBranchById(id: string): Promise<QaBranch | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('qa_branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching branch by id:', error);
    return null;
  }

  return data;
}

export async function createBranch(branch: {
  name: string;
  review_date?: string;
  rejection_count?: number;
  rejected_cards_count?: number;
  bugs_created_count?: number;
  status?: BranchStatus;
  reason?: string | null;
}): Promise<QaBranch> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('qa_branches')
    .insert([
      {
        name: branch.name.trim(),
        review_date: branch.review_date || new Date().toISOString().split('T')[0],
        rejection_count: branch.rejection_count ?? 0,
        rejected_cards_count: branch.rejected_cards_count ?? 0,
        bugs_created_count: branch.bugs_created_count ?? 0,
        status: branch.status || 'testing',
        reason: branch.reason?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating branch:', error);
    throw error;
  }

  return data;
}

export async function updateBranch(
  id: string,
  branch: {
    name?: string;
    review_date?: string;
    rejection_count?: number;
    rejected_cards_count?: number;
    bugs_created_count?: number;
    status?: BranchStatus;
    reason?: string | null;
  }
): Promise<QaBranch> {
  const supabase = createClient();

  const payload: any = {};
  if (branch.name !== undefined) payload.name = branch.name.trim();
  if (branch.review_date !== undefined) payload.review_date = branch.review_date;
  if (branch.rejection_count !== undefined) payload.rejection_count = branch.rejection_count;
  if (branch.rejected_cards_count !== undefined) payload.rejected_cards_count = branch.rejected_cards_count;
  if (branch.bugs_created_count !== undefined) payload.bugs_created_count = branch.bugs_created_count;
  if (branch.status !== undefined) payload.status = branch.status;
  if (branch.reason !== undefined) payload.reason = branch.reason?.trim() || null;

  const { data, error } = await supabase
    .from('qa_branches')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating branch:', error);
    throw error;
  }

  return data;
}

export async function deleteBranch(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('qa_branches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting branch:', error);
    throw error;
  }
}
