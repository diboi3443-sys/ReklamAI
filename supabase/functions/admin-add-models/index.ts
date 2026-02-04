// Admin function to add models and manage credits (requires service role)
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    
    // Check for action in request body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // No body, continue with default action
    }
    
    // Handle add_credits action
    if (body.action === 'add_credits' && body.user_id) {
      const amount = body.amount || 10000;
      const { data, error } = await supabase
        .from('credit_accounts')
        .update({ balance: amount })
        .eq('owner_id', body.user_id)
        .select();
      
      if (error) {
        const { data: insertData, error: insertError } = await supabase
          .from('credit_accounts')
          .insert({ owner_id: body.user_id, balance: amount })
          .select();
        
        if (insertError) {
          return new Response(
            JSON.stringify({ error: insertError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: `Credits set to ${amount}`, data: insertData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: `Credits set to ${amount}`, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle update_model_family action
    if (body.action === 'update_model_family' && body.model_key && body.family) {
      const { data: existing } = await supabase
        .from('models')
        .select('id, capabilities')
        .eq('key', body.model_key)
        .single();
      
      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Model not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const newCaps = { 
        ...existing.capabilities, 
        family: body.family,
        requires_callback: body.requires_callback || false 
      };
      
      const { error } = await supabase
        .from('models')
        .update({ capabilities: newCaps })
        .eq('id', existing.id);
      
      return new Response(
        JSON.stringify({ 
          success: !error, 
          model_key: body.model_key,
          family: body.family,
          error: error?.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Flux-2 models that use Market API
    const flux2Models = [
      {
        key: 'flux-2/pro-text-to-image',
        title: 'Flux 2 Pro (Text to Image)',
        modality: 'image',
        provider: 'kie',
        capabilities: {
          family: 'market',
          model_identifier: 'flux-2/pro-text-to-image',
          docs_url: 'https://docs.kie.ai/market/flux2/pro-text-to-image'
        }
      },
      {
        key: 'flux-2/pro-image-to-image',
        title: 'Flux 2 Pro (Image to Image)',
        modality: 'edit',
        provider: 'kie',
        capabilities: {
          family: 'market',
          model_identifier: 'flux-2/pro-image-to-image',
          supports_image_input: true,
          docs_url: 'https://docs.kie.ai/market/flux2/pro-image-to-image'
        }
      },
      {
        key: 'flux-2/flex-text-to-image',
        title: 'Flux 2 Flex (Text to Image)',
        modality: 'image',
        provider: 'kie',
        capabilities: {
          family: 'market',
          model_identifier: 'flux-2/flex-text-to-image',
          docs_url: 'https://docs.kie.ai/market/flux2/flex-text-to-image'
        }
      }
    ];

    const results = [];
    
    for (const model of flux2Models) {
      const { data, error } = await supabase
        .from('models')
        .upsert(model, { onConflict: 'key' })
        .select();
      
      if (error) {
        results.push({ key: model.key, status: 'error', error: error.message });
      } else {
        results.push({ key: model.key, status: 'success' });
      }
    }
    
    // Fix Flux Kontext capabilities (restore original + add requires_callback)
    await supabase
      .from('models')
      .update({ 
        capabilities: {
          family: 'flux-kontext',
          docs_url: 'https://docs.kie.ai/flux-kontext-api/quickstart',
          model_identifier: 'flux-kontext-pro',
          requires_callback: true
        }
      })
      .eq('key', 'flux-kontext-pro');
    
    await supabase
      .from('models')
      .update({ 
        capabilities: {
          family: 'flux-kontext',
          docs_url: 'https://docs.kie.ai/flux-kontext-api/quickstart',
          model_identifier: 'flux-kontext-max',
          requires_callback: true
        }
      })
      .eq('key', 'flux-kontext-max');
    
    // Add audio preset
    const { data: audioData, error: audioError } = await supabase
      .from('presets')
      .upsert({
        key: 'audio-gen',
        type: 'audio',
        title_en: 'Audio Generation',
        title_ru: 'Генерация аудио',
        description_en: 'Generate sound effects and audio',
        description_ru: 'Генерация звуковых эффектов и аудио',
      }, { onConflict: 'key' })
      .select();
    
    console.log('Audio preset result:', audioData, audioError?.message);

    // Get all Flux models
    const { data: fluxModels } = await supabase
      .from('models')
      .select('key, title, modality, capabilities')
      .ilike('key', '%flux%');
    
    // Get all presets
    const { data: allPresets } = await supabase
      .from('presets')
      .select('key, type');

    return new Response(
      JSON.stringify({ 
        message: 'Models added',
        results,
        fluxModels,
        presets: allPresets
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
