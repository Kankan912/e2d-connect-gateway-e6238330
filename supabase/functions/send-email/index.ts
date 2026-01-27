import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getFullEmailConfig, sendEmail, validateFullEmailConfig } from "../_shared/email-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  forceService?: "resend" | "smtp"; // Optionnel: forcer un service spécifique
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const { to, subject, html, text, forceService }: EmailRequest = await req.json();

    // Charger la configuration email complète
    const emailConfig = await getFullEmailConfig();
    
    // Permettre de forcer un service pour les tests
    if (forceService) {
      emailConfig.service = forceService;
    }

    // Valider la configuration
    const validation = validateFullEmailConfig(emailConfig);
    if (!validation.valid) {
      console.error("Configuration email invalide:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Envoyer l'email via le service configuré
    const result = await sendEmail(emailConfig, { to, subject, html, text });

    if (!result.success) {
      console.error("Échec envoi email:", result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Email envoyé via ${emailConfig.service} à ${to}`);

    return new Response(
      JSON.stringify({ success: true, data: result.data, service: emailConfig.service }),
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
