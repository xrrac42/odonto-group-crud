import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateUserRequest {
  cpf: string;
  nome: string;
  password: string;
  role: "admin" | "operator";
  adminUserId: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateUserRequest = await req.json();
    const { cpf, nome, password, role, adminUserId } = body;

    if (!adminUserId) {
      return new Response(JSON.stringify({ error: "Missing adminUserId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar se o adminUserId é realmente admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", adminUserId)
      .single();

    if (profileError || adminProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ 
          error: "Forbidden", 
          details: "Only admins can create users"
        }), 
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("cpf", cpf)
      .single();

    if (existingProfile?.id) {
      return new Response(
        JSON.stringify({ error: "CPF já cadastrado" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = `${cpf}@sistema.local`;

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { cpf, nome },
        app_metadata: { provider: 'email', providers: ['email'] },
      });

    if (createError || !createdUser?.user) {
      return new Response(
        JSON.stringify({ 
          error: createError?.message || "Failed to create user",
          details: createError 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: insertError } = await supabaseAdmin.from("profiles").insert({
      id: createdUser.user.id,
      cpf,
      nome,
      role,
    });

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
      return new Response(
        JSON.stringify({ error: insertError.message || "Failed to create profile" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retornar sucesso imediatamente sem verificação adicional
    return new Response(JSON.stringify({ 
      userId: createdUser.user.id, 
      profile: { id: createdUser.user.id, cpf, nome, role }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
