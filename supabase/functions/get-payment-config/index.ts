import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfigData {
  publishable_key?: string;
  client_id?: string;
  organization_slug?: string;
  campaign_url?: string;
  bank_name?: string;
  iban?: string;
  bic?: string;
  account_holder?: string;
  instructions?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Récupérer les configurations actives (sans les clés secrètes)
    const { data, error } = await supabaseClient
      .from('payment_configs')
      .select('id, provider, is_active, config_data, created_at, updated_at')
      .eq('is_active', true);

    if (error) throw error;

    // Filtrer les données sensibles du config_data
    const publicConfigs = data?.map(config => {
      const publicData: any = {
        id: config.id,
        provider: config.provider,
        is_active: config.is_active,
        created_at: config.created_at,
        updated_at: config.updated_at,
        config_data: {},
      };

      const configData = (config.config_data ?? {}) as PaymentConfigData;

      // Ne retourner que les données publiques selon le provider
      if (config.provider === 'stripe' && configData.publishable_key) {
        publicData.config_data.publishable_key = configData.publishable_key;
      } else if (config.provider === 'paypal' && configData.client_id) {
        publicData.config_data.client_id = configData.client_id;
      } else if (config.provider === 'helloasso') {
        publicData.config_data.organization_slug = configData.organization_slug;
        publicData.config_data.campaign_url = configData.campaign_url;
      } else if (config.provider === 'bank_transfer') {
        publicData.config_data.bank_name = configData.bank_name;
        publicData.config_data.iban = configData.iban;
        publicData.config_data.bic = configData.bic;
        publicData.config_data.account_holder = configData.account_holder;
        publicData.config_data.instructions = configData.instructions;
      }

      return publicData;
    });

    return new Response(
      JSON.stringify({ configs: publicConfigs }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});