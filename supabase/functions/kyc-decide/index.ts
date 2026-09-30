// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs in Supabase Edge Functions (Deno runtime)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KycDecideSchema = z.object({
  userId: z.string().min(1, "Target userId required"),
  decision: z.enum(["verified", "rejected", "pending"]),
  rejection_reason: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate caller identity
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Server-side role authorization check (Strictly Admin / Execom)
    const { data: profile, error: profileErr } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile || !["Admin", "Execom"].includes(profile.role)) {
      console.warn(`[SECURITY ALERT] Unauthorized KYC decision attempt by user ${user.id} (Role: ${profile?.role})`);
      return new Response(
        JSON.stringify({ error: "Access Denied: Only Admins or Execom members can evaluate student KYC." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse and validate decision payload
    const body = await req.json();
    const validated = KycDecideSchema.parse(body);

    // 4. Execute atomic transaction via exec_kyc_decision RPC
    // Updates status, elevates role, inserts audit log, queues notification in ONE transaction
    const { data: rpcResult, error: rpcError } = await supabaseClient.rpc("exec_kyc_decision", {
      p_admin_id: user.id,
      p_user_id: validated.userId,
      p_decision: validated.decision,
      p_rejection_reason: validated.rejection_reason || null,
      p_remarks: validated.remarks || null,
    });

    if (rpcError) {
      console.error("RPC transaction error in exec_kyc_decision:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `KYC successfully marked as ${validated.decision.toUpperCase()}.`,
        result: rpcResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid payload parameters", details: err.errors.map(e => e.message) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("Internal error in kyc-decide:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred during KYC evaluation." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
