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

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const KycSubmitSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  docType: z.enum(["student_id", "aadhaar", "college_admission", "pan"]),
  docNumber: z.string().min(4, "Document number must be at least 4 characters").max(30),
  institution: z.string().min(2, "Institution name required").max(150),
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

    // 1. Verify user identity from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let fullName = "";
    let docType = "";
    let docNumber = "";
    let institution = "";
    let docFilePath = "";

    // 2. Parse Multipart Form (with File) or JSON
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      fullName = (formData.get("fullName") as string) || "";
      docType = (formData.get("docType") as string) || "";
      docNumber = (formData.get("docNumber") as string) || "";
      institution = (formData.get("institution") as string) || "";

      // Validate metadata using Zod
      KycSubmitSchema.parse({ fullName, docType, docNumber, institution });

      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: "Document file is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate File Type and Size
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: `Invalid file format: ${file.type}. Allowed formats: JPG, PNG, PDF.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return new Response(
          JSON.stringify({ error: `File size exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sanitize filename & create safe storage path inside user's folder
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      docFilePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabaseClient.storage
        .from("kyc-docs")
        .upload(docFilePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload document to secure storage" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // JSON body mode (if document was already pre-uploaded to storage)
      const body = await req.json();
      KycSubmitSchema.parse(body);

      fullName = body.fullName;
      docType = body.docType;
      docNumber = body.docNumber;
      institution = body.institution;
      docFilePath = body.docFilePath || "";
    }

    // 3. Extract strictly the last 4 digits (never store unmasked number)
    const cleanDocDigits = docNumber.replace(/\s+/g, "");
    const docNumberLast4 = cleanDocDigits.slice(-4);

    // 4. Upsert row into kyc_verifications table
    const { error: dbError } = await supabaseClient
      .from("kyc_verifications")
      .upsert({
        user_id: user.id,
        status: "pending",
        doc_type: docType,
        doc_number_last4: docNumberLast4,
        doc_file_path: docFilePath || null,
        full_name: fullName,
        institution: institution,
        submitted_at: new Date().toISOString(),
        verified_at: null,
        rejection_reason: null,
        retention_delete_at: null,
      }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Database upsert error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "KYC submitted successfully and is pending evaluator review.",
        status: "pending",
        docNumberLast4,
        submittedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: err.errors.map(e => e.message) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("Internal KYC submit error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred during KYC submission" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
