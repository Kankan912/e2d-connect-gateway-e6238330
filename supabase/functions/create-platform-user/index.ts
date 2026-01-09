import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  password: string;
  sendEmail: boolean;
  roleIds: string[];
  membreId?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin using is_admin() function
    const { data: isAdminResult, error: adminCheckError } = await supabaseClient.rpc("is_admin");
    if (adminCheckError || !isAdminResult) {
      console.log("Admin check failed:", adminCheckError, isAdminResult);
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateUserRequest = await req.json();
    const { email, nom, prenom, telephone, password, sendEmail, roleIds, membreId } = body;

    if (!email || !nom || !prenom || !password) {
      return new Response(JSON.stringify({ error: "Email, nom, prénom et mot de passe requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create the user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom, prenom, telephone },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Update profile with additional info (trigger should have created it)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        nom,
        prenom,
        email,
        telephone: telephone || null,
        must_change_password: true,
        password_changed: false,
        status: "actif",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Assign roles to user_roles table
    if (roleIds && roleIds.length > 0) {
      const roleInserts = roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
      }));

      const { error: rolesError } = await supabaseAdmin.from("user_roles").insert(roleInserts);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
      }
    }

    // Link to membre if specified
    if (membreId) {
      const { error: linkError } = await supabaseAdmin
        .from("membres")
        .update({ user_id: userId })
        .eq("id", membreId);

      if (linkError) {
        console.error("Error linking membre:", linkError);
      }
    }

    // Send welcome email if requested
    if (sendEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const appUrl = Deno.env.get("APP_URL") || "https://piyvinbuxpnquwzyugdj.lovableproject.com";

      if (resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "E2D Association <noreply@resend.dev>",
              to: [email],
              subject: "Votre compte E2D a été créé",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #333;">Bienvenue sur la plateforme E2D</h1>
                  <p>Bonjour ${prenom} ${nom},</p>
                  <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Email :</strong> ${email}</p>
                    <p><strong>Mot de passe temporaire :</strong> ${password}</p>
                  </div>
                  <p style="color: #e74c3c;"><strong>Important :</strong> Vous devrez changer votre mot de passe lors de votre première connexion.</p>
                  <p>
                    <a href="${appUrl}/auth" 
                       style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                      Se connecter
                    </a>
                  </p>
                  <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                  </p>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            console.error("Email sending failed:", await emailResponse.text());
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: "Compte créé avec succès",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in create-platform-user:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
