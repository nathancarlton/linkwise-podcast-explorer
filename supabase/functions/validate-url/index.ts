
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

// Define a list of public SearXNG instances
// We'll try these in order until one works
const publicSearxngInstances = [
  'https://searx.be',
  'https://search.disroot.org',
  'https://searx.tiekoetter.com',
  'https://searx.ninja',
  'https://search.ononoki.org'
];

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

// Try to validate URL using public SearXNG instances
async function validateUrlWithPublicSearXNG(url: string) {
  try {
    // Try to parse the URL first
    new URL(url);
    
    // Try each SearXNG instance until one works
    for (const instanceUrl of publicSearxngInstances) {
      try {
        console.log(`Trying SearXNG instance: ${instanceUrl} for URL: ${url}`);
        
        // Construct the SearXNG search API URL
        const searchUrl = `${instanceUrl}/search`;
        
        // Make a request to SearXNG API
        const response = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'URLValidator/1.0'
          },
          body: new URLSearchParams({
            q: url,
            format: 'json',
            engines: 'google',
            time_range: '',
            language: 'en-US',
            safesearch: '0'
          })
        });
        
        if (!response.ok) {
          console.warn(`SearXNG instance ${instanceUrl} error for ${url}: ${response.status} ${response.statusText}`);
          continue; // Try next instance
        }
        
        const searchData = await response.json();
        
        // Check if the URL appears in the results
        const results = searchData.results || [];
        const foundInResults = results.some((result: any) => {
          const resultUrl = result.url || '';
          return resultUrl.includes(url) || url.includes(resultUrl);
        });
        
        // If the URL is in the results, it's valid
        if (foundInResults) {
          // Get the first result that matches as metadata
          const matchingResult = results.find((result: any) => {
            const resultUrl = result.url || '';
            return resultUrl.includes(url) || url.includes(resultUrl);
          });
          
          const metadata = matchingResult ? {
            title: matchingResult.title,
            description: matchingResult.content,
            source: 'searxng',
            instance: instanceUrl
          } : { 
            source: 'searxng',
            instance: instanceUrl,
            info: 'URL found in search results but no detailed metadata available'
          };
          
          return { isValid: true, metadata };
        }
        
        // If we have results but our URL isn't among them, it might be invalid
        if (results.length > 0) {
          return { 
            isValid: false, 
            metadata: { 
              source: 'searxng',
              instance: instanceUrl,
              info: 'URL not found in search results' 
            } 
          };
        }
        
        // If there are no results at all, try the next instance
        console.warn(`No results from SearXNG instance ${instanceUrl} for ${url}, trying next instance...`);
      } catch (searxError) {
        console.warn(`Error with SearXNG instance ${instanceUrl} for ${url}:`, searxError);
        // Continue to the next instance
      }
    }
    
    // If all SearXNG instances fail, fall back to basic validation
    console.warn(`All SearXNG instances failed for ${url}, falling back to basic validation`);
    return basicValidateUrl(url);
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message } };
  }
}

// Basic URL validation without external API (fallback method)
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
        source: 'basic_validation'
      };
      
      return { isValid, metadata };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`Fetch error for ${url}:`, fetchError);
      return { isValid: false, metadata: { error: fetchError.message, source: 'basic_validation' } };
    }
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message, source: 'basic_validation' } };
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
    
    // Validate URL using public SearXNG instances with fallback to basic validation
    const { isValid, metadata } = await validateUrlWithPublicSearXNG(url);
    
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
