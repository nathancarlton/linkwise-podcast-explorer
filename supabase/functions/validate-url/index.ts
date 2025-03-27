
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { checkUrlCache, storeUrlCache } from "./cache.ts";
import { deepValidateUrl } from "./validation.ts";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { url, deepValidation = false, forceCheck = false } = body;
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check cache first, but skip if deep validation or force check is requested
    if (!forceCheck) {
      const cachedResult = await checkUrlCache(url, forceCheck, supabase);
      if (cachedResult) {
        console.log(`Cache hit for URL: ${url}`);
        return new Response(
          JSON.stringify({ 
            isValid: cachedResult.is_valid, 
            metadata: cachedResult.metadata,
            fromCache: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log(`Cache miss or forced check for URL: ${url}, validating...`);
    
    // Perform deep content validation
    const validationResult = await deepValidateUrl(url);
    
    // Store result in cache unless cache busting is requested
    if (!forceCheck) {
      await storeUrlCache(url, validationResult.isValid, validationResult.metadata, supabase);
    }
    
    return new Response(
      JSON.stringify({ 
        isValid: validationResult.isValid, 
        metadata: validationResult.metadata, 
        fromCache: false,
        deepValidation: deepValidation,
        forceCheck: forceCheck
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in validate-url function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
