// Models loading — now via FastAPI instead of Supabase
import { modelsApi, type AIModelItem } from './api';

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
 * Load all enabled models from backend API.
 * Keeps the same export signatures for downstream compatibility.
 */
export async function loadModels(filter?: ModelFilter): Promise<DatabaseModel[]> {
  try {
    const apiModels = await modelsApi.list();

    // Map API response to DatabaseModel shape for backward compatibility
    const models: DatabaseModel[] = apiModels.map((m: AIModelItem) => ({
      id: m.id,
      provider: 'kie', // default — extend when backend exposes provider
      key: m.slug,
      modality: (m.category as any) || 'image',
      title: m.name,
      capabilities: {},
      price_multiplier: m.price_multiplier,
      is_enabled: m.is_active,
      display_order: undefined,
      created_at: '',
    }));

    // Apply client-side filters
    let filtered = models;
    if (filter?.modality) {
      filtered = filtered.filter((m) => m.modality === filter.modality);
    }
    if (filter?.provider) {
      filtered = filtered.filter((m) => m.provider === filter.provider);
    }
    if (filter?.is_enabled !== undefined) {
      filtered = filtered.filter((m) => m.is_enabled === filter.is_enabled);
    }

    return filtered;
  } catch (error) {
    console.error('[loadModels] Error:', error);
    return [];
  }
}

/**
 * Load models compatible with a specific modality
 */
export async function loadModelsByModality(modality: 'image' | 'video' | 'edit' | 'audio'): Promise<DatabaseModel[]> {
  return loadModels({ modality });
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
  const models = await loadModels();
  return models.find((m) => m.key === key) || null;
}
