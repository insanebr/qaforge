import { createClient } from '@/lib/supabase/client';
import type { Feature } from '@/types/database';

export interface FeatureWithCount extends Feature {
  test_cases_count?: number;
}

export async function getFeaturesWithCounts(): Promise<FeatureWithCount[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('features')
    .select(`
      *,
      test_cases(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching features:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    test_cases_count: item.test_cases?.[0]?.count || 0,
  }));
}

export async function getFeatureById(id: string): Promise<Feature | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching feature by id:', error);
    return null;
  }

  return data;
}

export async function createFeature(feature: {
  title: string;
  description?: string | null;
  doc_url?: string | null;
}): Promise<Feature> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('features')
    .insert([
      {
        title: feature.title.trim(),
        description: feature.description?.trim() || null,
        doc_url: feature.doc_url?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating feature:', error);
    throw error;
  }

  return data;
}

export async function updateFeature(
  id: string,
  feature: {
    title: string;
    description?: string | null;
    doc_url?: string | null;
  }
): Promise<Feature> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('features')
    .update({
      title: feature.title.trim(),
      description: feature.description?.trim() || null,
      doc_url: feature.doc_url?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating feature:', error);
    throw error;
  }

  return data;
}

export async function deleteFeature(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('features')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting feature:', error);
    throw error;
  }
}
