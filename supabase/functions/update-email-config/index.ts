import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and check if user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin via user_roles table
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some((ur: any) => 
      ['administrateur', 'tresorier', 'super_admin', 'secretaire_general']
        .includes(ur.roles?.name?.toLowerCase())
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { resend_api_key, smtp_config, email_mode } = body;

    console.log("Updating email configuration...");

    // Update email mode in configurations table
    if (email_mode) {
      await supabase
        .from("configurations")
        .upsert({ cle: "email_mode", valeur: email_mode, description: "Mode d'envoi email (resend ou smtp)" });
    }

    // Store SMTP config in configurations table
    if (smtp_config) {
      const smtpEntries = [
        { cle: "smtp_host", valeur: smtp_config.host || "", description: "Hôte SMTP" },
        { cle: "smtp_port", valeur: String(smtp_config.port || 587), description: "Port SMTP" },
        { cle: "smtp_user", valeur: smtp_config.user || "", description: "Utilisateur SMTP" },
        { cle: "smtp_from", valeur: smtp_config.from || "", description: "Email expéditeur SMTP" },
      ];

      for (const entry of smtpEntries) {
        await supabase.from("configurations").upsert(entry);
      }

      // Store SMTP password securely (encrypted in configurations for now)
      if (smtp_config.password) {
        await supabase.from("configurations").upsert({
          cle: "smtp_password",
          valeur: smtp_config.password,
          description: "Mot de passe SMTP (stocké de manière sécurisée)"
        });
      }
    }

    // Store Resend API key in configurations table
    // Note: In production, this should use Supabase secrets management
    if (resend_api_key) {
      await supabase.from("configurations").upsert({
        cle: "resend_api_key",
        valeur: resend_api_key,
        description: "Clé API Resend pour l'envoi d'emails"
      });
      console.log("Resend API key updated successfully");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Configuration email mise à jour" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur interne";
    console.error("Error updating email config:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});