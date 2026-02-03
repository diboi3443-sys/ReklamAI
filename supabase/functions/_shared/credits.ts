// Credit management helpers using RPC functions
import { createServiceClient } from './supabase.ts';

export async function reserveCredits(
  ownerId: string,
  generationId: string,
  amount: number,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  
  // Add timeout for RPC call (3 seconds max - reduced from 5)
  const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) => {
    setTimeout(() => reject(new Error('RPC timeout: credit reservation took too long')), 3000);
  });
  
  const rpcPromise = (async () => {
    const t0 = Date.now();
    console.log(`[CREDITS] Starting rpc_credit_reserve at ${t0}ms`);
    const { data, error } = await supabase.rpc('rpc_credit_reserve', {
      p_owner_id: ownerId,
      p_generation_id: generationId,
      p_amount: amount,
      p_meta: meta,
    });
    const duration = Date.now() - t0;
    console.log(`[CREDITS] rpc_credit_reserve completed in ${duration}ms`);

    if (error) {
      console.error('Error reserving credits:', error);
      return { success: false, error: error.message };
    }

    if (data === false) {
      return { success: false, error: 'Insufficient credits' };
    }

    return { success: true };
  })();
  
  try {
    return await Promise.race([rpcPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('[CREDITS] Reserve credits error:', error);
    return { success: false, error: error.message || 'Credit reservation failed' };
  }
}

export async function finalizeCredits(
  ownerId: string,
  generationId: string,
  finalAmount: number,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('rpc_credit_finalize', {
    p_owner_id: ownerId,
    p_generation_id: generationId,
    p_final_amount: finalAmount,
    p_meta: meta,
  });

  if (error) {
    console.error('Error finalizing credits:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function refundCredits(
  ownerId: string,
  generationId: string,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('rpc_credit_refund', {
    p_owner_id: ownerId,
    p_generation_id: generationId,
    p_meta: meta,
  });

  if (error) {
    console.error('Error refunding credits:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getCreditBalance(ownerId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('credit_accounts')
    .select('balance')
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) {
    return 0;
  }

  return Number(data.balance) || 0;
}

export async function estimateCredits(
  presetDefaults: any,
  modelPriceMultiplier: number,
  markupPercent: number
): Promise<number> {
  const baseCredits = presetDefaults?.credits || 1;
  const withMultiplier = baseCredits * modelPriceMultiplier;
  const withMarkup = withMultiplier * (1 + markupPercent / 100);
  return Math.ceil(withMarkup * 100) / 100; // Round to 2 decimal places
}
