import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAccountRequest {
  email: string;
  memberId: string;
  memberNom: string;
  memberPrenom: string;
  memberTelephone: string;
  tempPassword?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔵 [create-user-account] Starting account creation');
    
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the caller is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !caller) {
      console.error('❌ Unauthorized caller:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('✅ Caller authenticated:', caller.email);

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, memberId, memberNom, memberPrenom, memberTelephone, tempPassword }: CreateAccountRequest = await req.json();

    if (!email || !memberId) {
      return new Response(
        JSON.stringify({ error: 'Email and memberId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate password if not provided
    const password = tempPassword || Math.random().toString(36).slice(-8) + 'A1!';

    console.log('🔵 Creating user account for:', email);

    // Create user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nom: memberNom,
        prenom: memberPrenom,
        telephone: memberTelephone,
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      throw createError;
    }

    console.log('✅ User created:', newUser.user?.id);

    // Link member to user
    const { error: linkError } = await supabaseAdmin
      .from('membres')
      .update({ user_id: newUser.user?.id })
      .eq('id', memberId);

    if (linkError) {
      console.error('❌ Error linking member:', linkError);
      // Don't throw, the account was created successfully
    } else {
      console.log('✅ Member linked to user');
    }

    // Récupérer l'ID du rôle "membre" et l'assigner automatiquement
    const { data: roleMembre } = await supabaseAdmin
      .from('roles')
      .select('id')
      .ilike('name', 'membre')
      .single();

    if (roleMembre) {
      const { error: roleError } = await supabaseAdmin
        .from('membres_roles')
        .insert({
          membre_id: memberId,
          role_id: roleMembre.id
        });
      
      if (roleError) {
        console.error('⚠️ Error assigning member role:', roleError);
      } else {
        console.log('✅ Role "membre" assigned to member');
      }
    } else {
      console.log('⚠️ Role "membre" not found, skipping role assignment');
    }

    // Mettre à jour le profil pour forcer le changement de mot de passe à la première connexion
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', newUser.user?.id);

    if (profileError) {
      console.error('⚠️ Error setting must_change_password:', profileError);
    } else {
      console.log('✅ Profile updated: must_change_password = true');
    }

    // Send welcome email with credentials
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      console.log('🔵 Sending welcome email');
      
      // Fetch app_url from configurations table
      const { data: appUrlConfig } = await supabaseAdmin
        .from('configurations')
        .select('valeur')
        .eq('cle', 'app_url')
        .single();
      
      const APP_URL = appUrlConfig?.valeur || Deno.env.get('APP_URL') || 'https://e2d-connect.lovable.app';
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur E2D Connect</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B6B7C;">Bienvenue sur E2D Connect !</h1>
          </div>
          
          <p>Bonjour <strong>${memberPrenom} ${memberNom}</strong>,</p>
          
          <p>Votre compte E2D Connect a été créé avec succès. Voici vos identifiants de connexion :</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${password}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/change-password" style="background-color: #0B6B7C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Changer mon mot de passe
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            Association E2D - Ensemble pour le Développement Durable
          </p>
        </body>
        </html>
      `;

      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'E2D <onboarding@resend.dev>',
            to: [email],
            subject: 'Bienvenue sur E2D Connect - Vos identifiants',
            html: emailHtml,
          }),
        });

        if (emailRes.ok) {
          console.log('✅ Welcome email sent');
        } else {
          const emailError = await emailRes.text();
          console.error('⚠️ Email sending failed:', emailError);
        }
      } catch (emailError) {
        console.error('⚠️ Email error:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user?.id,
        message: 'Account created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in create-user-account:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
