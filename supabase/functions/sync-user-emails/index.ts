import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec la clé service role pour accéder à auth.admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Fetching all users from auth.users...");
    
    // Récupérer tous les utilisateurs via l'API admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    const users = authData?.users || [];
    console.log(`Found ${users.length} users in auth.users`);

    let updated = 0;
    let errors = 0;

    // Mettre à jour l'email dans profiles pour chaque utilisateur
    for (const user of users) {
      if (user.email) {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ email: user.email })
          .eq("id", user.id);

        if (updateError) {
          console.error(`Error updating email for user ${user.id}:`, updateError);
          errors++;
        } else {
          console.log(`Updated email for user ${user.id}: ${user.email}`);
          updated++;
        }
      }
    }

    console.log(`Sync complete: ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synchronisation terminée: ${updated} emails mis à jour, ${errors} erreurs`,
        total: users.length,
        updated,
        errors
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-user-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
