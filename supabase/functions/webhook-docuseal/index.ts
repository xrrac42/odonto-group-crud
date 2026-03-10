import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DocuSealWebhookPayload {
  event_type: string;
  data: {
    submission_id?: number;
    status?: string;
    submitters?: Array<{
      id: number;
      status: string;
      email: string;
    }>;
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req: Request) => {
  // CORS
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
    const payload: DocuSealWebhookPayload = await req.json();
    
    console.log("🔔 DocuSeal Webhook received:", payload.event_type);
    console.log("📦 Full Payload:", JSON.stringify(payload, null, 2));

    // Inicializar cliente Supabase
    const supabase = createClient(
      SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Processar diferentes tipos de eventos
    if (payload.event_type === "form.completed") {
      const submissionId = payload.data.submission_id;
      
      console.log("🔍 Looking for sale with submission_id:", submissionId);
      
      // Encontrar a venda pelo docuseal_submission_id
      const { data: sale, error: queryError } = await supabase
        .from("sales")
        .select("id, docuseal_submission_id, status")
        .eq("docuseal_submission_id", submissionId)
        .single();

      if (queryError) {
        console.error("❌ Query error:", queryError);
      }
      
      console.log("📄 Found sale:", sale);

      if (queryError || !sale) {
        console.error("❌ Sale not found for submission:", submissionId);
        return new Response(
          JSON.stringify({
            error: "Sale not found",
            details: queryError?.message,
            submissionId,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✏️ Updating sale", sale.id, "to status: signed");
      
      // Atualizar status da venda para "signed"
      const { error: updateError, data: updateData } = await supabase
        .from("sales")
        .update({
          status: "signed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sale.id)
        .select();

      if (updateError) {
        console.error("❌ Error updating sale:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update sale",
            details: updateError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Sale updated successfully:", sale.id, updateData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Sale status updated to signed",
          saleId: sale.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (payload.event_type === "form.declined") {
      const submissionId = payload.data.submission_id;

      console.log("🔍 Looking for sale (declined) with submission_id:", submissionId);

      // Encontrar a venda
      const { data: sale, error: queryError } = await supabase
        .from("sales")
        .select("id, docuseal_submission_id, status")
        .eq("docuseal_submission_id", submissionId)
        .single();

      if (queryError) {
        console.error("❌ Query error:", queryError);
      }
      
      console.log("📄 Found sale (declined):", sale);

      if (queryError || !sale) {
        console.error("❌ Sale not found for submission:", submissionId);
        return new Response(
          JSON.stringify({ error: "Sale not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✏️ Updating sale", sale.id, "to status: declined");

      // Atualizar status da venda para "declined"
      const { error: updateError, data: updateData } = await supabase
        .from("sales")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sale.id)
        .select();

      if (updateError) {
        console.error("❌ Error updating sale:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update sale" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ Sale declined successfully:", sale.id, updateData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Sale status updated to declined",
          saleId: sale.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Outros eventos são ignorados
    console.log("ℹ️ Event", payload.event_type, "ignored");
    return new Response(
      JSON.stringify({
        success: true,
        message: `Event ${payload.event_type} received and ignored`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
