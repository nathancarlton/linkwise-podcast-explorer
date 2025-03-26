
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a cache table if it doesn't exist yet
async function ensureCacheTableExists() {
  const { error } = await supabase.rpc('ensure_url_cache_exists');
  if (error) {
    console.error('Error ensuring cache table exists:', error);
  }
}

// Check if URL exists in cache
async function checkUrlCache(url: string) {
  const { data, error } = await supabase
    .from('url_cache')
    .select('*')
    .eq('url', url)
    .maybeSingle();

  if (error) {
    console.error('Error checking URL cache:', error);
    return null;
  }

  // If we have a cache hit and it's not expired (30 days)
  if (data) {
    const cacheDate = new Date(data.cached_at);
    const now = new Date();
    const cacheAgeInDays = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (cacheAgeInDays < 30) {
      return data;
    }
  }

  return null;
}

// Store URL in cache
async function storeUrlCache(url: string, isValid: boolean, metadata: any) {
  const { error } = await supabase
    .from('url_cache')
    .upsert({
      url,
      is_valid: isValid,
      metadata,
      cached_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error storing URL in cache:', error);
  }
}

// Basic URL validation without external API
async function basicValidateUrl(url: string) {
  try {
    // Try to parse the URL first
    new URL(url);
    
    // Check if URL is reachable (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)',
        }
      });
      
      clearTimeout(timeoutId);
      
      // Consider 2xx and 3xx status codes as valid
      const isValid = response.status >= 200 && response.status < 400;
      
      // Extract some basic metadata from headers
      const metadata = {
        contentType: response.headers.get('content-type'),
        server: response.headers.get('server'),
        lastModified: response.headers.get('last-modified'),
      };
      
      return { isValid, metadata };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`Fetch error for ${url}:`, fetchError);
      return { isValid: false, metadata: { error: fetchError.message } };
    }
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message } };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Ensure our cache table exists
    await ensureCacheTableExists();
    
    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check cache first
    const cachedResult = await checkUrlCache(url);
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
    
    console.log(`Cache miss for URL: ${url}, validating...`);
    
    // Validate URL using basic method (will be replaced with SearXNG later)
    const { isValid, metadata } = await basicValidateUrl(url);
    
    // Store result in cache
    await storeUrlCache(url, isValid, metadata);
    
    return new Response(
      JSON.stringify({ isValid, metadata, fromCache: false }),
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
