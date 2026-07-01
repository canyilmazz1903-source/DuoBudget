// =============================================================================
// DuoBudget - PDF Processing Edge Function
// =============================================================================
// Accepts a PDF as base64, extracts text using pdf-parse, returns JSON.
//
// Request:
//   POST /process-pdf
//   Headers: Authorization: Bearer <supabase-access-token>
//   Body: { "pdf_base64": "<base64-encoded-pdf>" }
//
// Response:
//   { "success": true, "text": "...", "pages": 3, "totalLength": 1234 }
// =============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import pdf from "npm:pdf-parse/lib/pdf-parse.js";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // ---------------------------------------------------------------------------
    // 1. Validate auth token
    // ---------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the token with Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------------------------------------------------------------------------
    // 2. Parse request body
    // ---------------------------------------------------------------------------
    const body = await req.json();
    const { pdf_base64 } = body;

    if (!pdf_base64 || typeof pdf_base64 !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid 'pdf_base64' field in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate base64 size (max ~10MB encoded → ~7.5MB raw)
    const maxBase64Length = 10 * 1024 * 1024;
    if (pdf_base64.length > maxBase64Length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PDF too large. Maximum size is approximately 7.5MB.",
        }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------------------------------------------------------------------------
    // 3. Decode base64 to Uint8Array
    // ---------------------------------------------------------------------------
    let pdfBuffer: Uint8Array;
    try {
      const binaryString = atob(pdf_base64);
      pdfBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pdfBuffer[i] = binaryString.charCodeAt(i);
      }
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid base64 encoding",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ---------------------------------------------------------------------------
    // 4. Extract text from PDF using pdf-parse
    // ---------------------------------------------------------------------------
    const parsedData = await pdf(pdfBuffer);
    const extractedText = parsedData.text;

    // ---------------------------------------------------------------------------
    // 5. Return result
    // ---------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        pages: parsedData.numpages || 1,
        totalLength: extractedText.length,
        userId: userData.user.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PDF processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: `PDF processing failed: ${errorMessage}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
