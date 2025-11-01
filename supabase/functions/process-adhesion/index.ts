import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adhesion_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer l'adhésion
    const { data: adhesion, error: adhesionError } = await supabaseClient
      .from('adhesions')
      .select('*')
      .eq('id', adhesion_id)
      .single();

    if (adhesionError) throw adhesionError;

    // Vérifier si l'adhésion n'est pas déjà traitée
    if (adhesion.processed) {
      return new Response(
        JSON.stringify({ error: 'Adhésion déjà traitée' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Si le paiement est complété, créer le membre
    if (adhesion.payment_status === 'completed') {
      const { data: membre, error: membreError } = await supabaseClient
        .from('membres')
        .insert([
          {
            nom: adhesion.nom,
            prenom: adhesion.prenom,
            telephone: adhesion.telephone,
            email: adhesion.email,
            est_membre_e2d: adhesion.type_adhesion === 'e2d' || adhesion.type_adhesion === 'both',
            est_adherent_phoenix: adhesion.type_adhesion === 'phoenix' || adhesion.type_adhesion === 'both',
            statut: 'actif',
          },
        ])
        .select()
        .single();

      if (membreError) throw membreError;

      // Mettre à jour l'adhésion avec le membre_id
      const { error: updateError } = await supabaseClient
        .from('adhesions')
        .update({
          membre_id: membre.id,
          processed: true,
        })
        .eq('id', adhesion_id);

      if (updateError) throw updateError;

      // Envoyer email de bienvenue (TODO: implémenter le template)
      console.log('Email de bienvenue à envoyer à:', adhesion.email);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Adhésion traitée avec succès' }),
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