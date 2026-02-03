// Models loading and management from Supabase database
import { supabase } from './supabase';

export interface DatabaseModel {
  id: string;
  provider: string;
  key: string;
  modality: 'image' | 'video' | 'edit' | 'audio';
  title: string;
  capabilities: Record<string, any>;
  price_multiplier: number;
  is_enabled?: boolean;
  display_order?: number;
  created_at: string;
}

export interface ModelFilter {
  modality?: 'image' | 'video' | 'edit' | 'audio';
  provider?: string;
  is_enabled?: boolean;
}

/**
 * Load all enabled models from database
 * Sorted by: modality -> provider -> display_order/name
 */
export async function loadModels(filter?: ModelFilter): Promise<DatabaseModel[]> {
  // Models table has RLS policy "Everyone can view models" (USING (true))
  // So we can load models even without authenticated user

  console.log('[loadModels] Starting load with filter:', filter);
  console.log('[loadModels] Supabase client initialized:', !!supabase);

  let query = supabase
    .from('models')
    .select('*')
    .order('modality', { ascending: true })
    .order('provider', { ascending: true });

  console.log('[loadModels] Query builder created');

  // Apply filters
  if (filter?.modality) {
    query = query.eq('modality', filter.modality);
  }
  if (filter?.provider) {
    query = query.eq('provider', filter.provider);
  }
  // Only load enabled models if is_enabled column exists
  // For now, load all models (is_enabled might not exist in schema)
  if (filter?.is_enabled !== undefined) {
    // Try to filter by is_enabled if column exists
    // If column doesn't exist, this will be ignored
    query = query.eq('is_enabled', filter.is_enabled);
  }

  console.log('[loadModels] Executing query...');
  const { data, error } = await query;
  console.log('[loadModels] Query executed, error:', !!error, 'data count:', data?.length || 0);

  if (error) {
    console.error('[loadModels] Error loading models:', error);
    console.error('[loadModels] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    // If is_enabled column doesn't exist, try without it
    if (error.message.includes('column') && error.message.includes('is_enabled')) {
      console.warn('[loadModels] is_enabled column not found, loading all models');
      const { data: allData, error: allError } = await supabase
        .from('models')
        .select('*')
        .order('modality', { ascending: true })
        .order('provider', { ascending: true });

      if (allError) {
        console.error('[loadModels] Error loading all models:', allError);
        return [];
      }

      console.log('[loadModels] Loaded models (without is_enabled):', allData?.length || 0);
      return (allData || []) as DatabaseModel[];
    }
    return [];
  }

  console.log('[loadModels] Successfully loaded models:', data?.length || 0, {
    filter,
  });

  // Sort: modality -> provider -> display_order (if exists) -> title
  const sorted = (data || []).sort((a, b) => {
    // First by modality
    if (a.modality !== b.modality) {
      return a.modality.localeCompare(b.modality);
    }
    // Then by provider
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    // Then by display_order if exists
    const aOrder = (a as any).display_order ?? 999;
    const bOrder = (b as any).display_order ?? 999;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    // Finally by title
    return a.title.localeCompare(b.title);
  });

  return sorted as DatabaseModel[];
}

/**
 * Load models compatible with a specific modality
 */
export async function loadModelsByModality(modality: 'image' | 'video' | 'edit' | 'audio'): Promise<DatabaseModel[]> {
  console.log('[loadModelsByModality] Called with modality:', modality);
  const result = await loadModels({ modality });
  console.log('[loadModelsByModality] Returning', result.length, 'models');
  return result;
}

/**
 * Load KIE.ai models only
 */
export async function loadKieModels(modality?: 'image' | 'video' | 'edit' | 'audio'): Promise<DatabaseModel[]> {
  return loadModels({ provider: 'kie', modality });
}

/**
 * Get model by key
 */
export async function getModelByKey(key: string): Promise<DatabaseModel | null> {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DatabaseModel;
}
