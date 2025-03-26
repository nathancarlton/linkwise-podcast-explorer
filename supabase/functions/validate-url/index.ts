
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

// Detect common 404/error page patterns in HTML content
function detectErrorPage(html: string, url: string): boolean {
  // Convert to lowercase for case-insensitive matching
  const lowercaseHtml = html.toLowerCase();
  
  // Common error page indicators
  const errorPatterns = [
    'page not found',
    'cannot be found',
    'could not be found',
    'doesn\'t exist',
    'does not exist',
    'no longer available',
    'no longer exists',
    'been removed',
    'error 404',
    '404 error',
    'not found error',
    'page doesn\'t exist',
    'page does not exist',
    'content not found',
    'not available',
    'page unavailable',
    'sorry, we couldn\'t find',
    'page has moved',
    'page may have been moved',
    'moved permanently',
    'page has been deleted',
    'nicht gefunden', // German
    'no encontrada', // Spanish
    'introuvable', // French
    'non trovata', // Italian
    '見つかりません', // Japanese
    '找不到', // Chinese
    'не найдена', // Russian
    'content has moved',
    'page missing',
    'invalid url',
    'broken link',
    'page has expired',
    'requested url was not found',
    'wrong address',
    'went wrong',
    'oops',
    'something went wrong',
    'cannot access',
    'unable to access',
    'url changed',
    'has been deleted',
    'has been removed',
    'nothing found',
    'search did not return',
    'empty search results',
    'no results found',
    'no items found'
  ];
  
  // HBR-specific patterns
  if (url.includes('hbr.org')) {
    const hbrPatterns = [
      'sign in to continue reading',
      'you\'ve reached your monthly limit',
      'subscribe to continue reading',
      'register to continue reading',
      'this article is about',
      'access to this page has been denied',
      'access denied',
      'article not found'
    ];
    
    for (const pattern of hbrPatterns) {
      if (lowercaseHtml.includes(pattern)) {
        console.log(`HBR-specific error pattern found for ${url}: ${pattern}`);
        return true;
      }
    }
  }
  
  // McKinsey-specific patterns
  if (url.includes('mckinsey.com')) {
    const mckinseyPatterns = [
      'page you are looking for is unavailable',
      'page you requested cannot be found',
      'we can\'t find the page',
      'moved to a new location',
      'this content has moved',
      'has been transferred',
      'this article is no longer available'
    ];
    
    for (const pattern of mckinseyPatterns) {
      if (lowercaseHtml.includes(pattern)) {
        console.log(`McKinsey-specific error pattern found for ${url}: ${pattern}`);
        return true;
      }
    }
  }
  
  // Nature-specific patterns
  if (url.includes('nature.com')) {
    const naturePatterns = [
      'page not found',
      'cited incorrect doi',
      'might have been removed',
      'content unavailable',
      'article has been withdrawn'
    ];
    
    for (const pattern of naturePatterns) {
      if (lowercaseHtml.includes(pattern)) {
        console.log(`Nature-specific error pattern found for ${url}: ${pattern}`);
        return true;
      }
    }
  }
  
  // Forbes-specific patterns
  if (url.includes('forbes.com')) {
    const forbesPatterns = [
      'page no longer exists',
      'page has been removed',
      'page has moved',
      'incorrect url',
      'article not found',
      'oops, the page you were looking for'
    ];
    
    for (const pattern of forbesPatterns) {
      if (lowercaseHtml.includes(pattern)) {
        console.log(`Forbes-specific error pattern found for ${url}: ${pattern}`);
        return true;
      }
    }
  }
  
  // Check for meta title/description error indicators
  if (/<title[^>]*>.*?(?:404|not found|error|unavailable|missing|oops).*?<\/title>/i.test(html)) {
    console.log(`Error indication found in title tag for ${url}`);
    return true;
  }
  
  // Check for standard error patterns
  for (const pattern of errorPatterns) {
    if (lowercaseHtml.includes(pattern)) {
      console.log(`Standard error pattern found for ${url}: ${pattern}`);
      return true;
    }
  }
  
  // If none of the error patterns were found, it's likely a valid page
  return false;
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
    console.warn(`All SearXNG instances failed for ${url}, falling back to deep validation`);
    return deepValidateUrl(url);
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message } };
  }
}

// Deep URL validation that checks content for error patterns
async function deepValidateUrl(url: string) {
  try {
    // Try to parse the URL first
    new URL(url);
    
    // Check if URL is reachable and examine content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // First try with a normal HEAD request
      const headResponse = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      
      // If we got a non-200 status code, the URL is likely invalid
      if (!headResponse.ok) {
        clearTimeout(timeoutId);
        console.warn(`HEAD request failed for ${url}: ${headResponse.status} ${headResponse.statusText}`);
        return { 
          isValid: false, 
          metadata: { 
            status: headResponse.status,
            statusText: headResponse.statusText,
            source: 'head_request' 
          } 
        };
      }
      
      // Now make a GET request to check the content
      const getResponse = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      
      clearTimeout(timeoutId);
      
      // Consider 2xx status codes as potentially valid
      if (!getResponse.ok) {
        console.warn(`GET request failed for ${url}: ${getResponse.status} ${getResponse.statusText}`);
        return { 
          isValid: false, 
          metadata: {
            status: getResponse.status,
            statusText: getResponse.statusText,
            source: 'get_request' 
          } 
        };
      }
      
      // Check content type - we mainly care about HTML pages
      const contentType = getResponse.headers.get('content-type') || '';
      
      // Extract some basic metadata from headers
      const metadata: any = {
        contentType,
        server: getResponse.headers.get('server'),
        lastModified: getResponse.headers.get('last-modified'),
        source: 'deep_validation'
      };
      
      // For HTML content, check for 404 indicators in the content
      if (contentType.includes('text/html')) {
        const html = await getResponse.text();
        
        // Check for error page indicators in the HTML
        if (detectErrorPage(html, url)) {
          console.warn(`Error page detected for ${url} despite 200 status code`);
          return { 
            isValid: false, 
            metadata: {
              ...metadata,
              reason: 'Error page detected in content'
            } 
          };
        }
        
        // Try to extract title from HTML
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          metadata.title = titleMatch[1].trim();
          
          // Check for error indicators in title
          const errorTitlePatterns = [
            '404', 'error', 'not found', 'unavailable', 'missing',
            'oops', 'sorry'
          ];
          
          const lowerTitle = metadata.title.toLowerCase();
          if (errorTitlePatterns.some(pattern => lowerTitle.includes(pattern))) {
            console.warn(`Error indicator found in title for ${url}: "${metadata.title}"`);
            return { 
              isValid: false, 
              metadata: {
                ...metadata,
                reason: `Error indicator in title: "${metadata.title}"`
              } 
            };
          }
        }
        
        // Try to extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
        if (descMatch && descMatch[1]) {
          metadata.description = descMatch[1].trim();
        }
        
        // URL is valid if we got here
        return { isValid: true, metadata };
      }
      
      // For non-HTML content, we'll trust the 200 status code
      return { isValid: true, metadata };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`Fetch error for ${url}:`, fetchError);
      return { isValid: false, metadata: { error: fetchError.message, source: 'deep_validation' } };
    }
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message, source: 'deep_validation' } };
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
    const body = await req.json();
    const { url, deepValidation = false } = body;
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check cache first, but skip if deep validation is requested
    if (!deepValidation) {
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
    }
    
    console.log(`Cache miss or deep validation for URL: ${url}, validating...`);
    
    let validationResult;
    
    // Choose validation method based on request
    if (deepValidation) {
      validationResult = await deepValidateUrl(url);
    } else {
      // Use SearXNG first with fallback to deep validation
      validationResult = await validateUrlWithPublicSearXNG(url);
    }
    
    // Store result in cache (even from deep validation)
    await storeUrlCache(url, validationResult.isValid, validationResult.metadata);
    
    return new Response(
      JSON.stringify({ 
        isValid: validationResult.isValid, 
        metadata: validationResult.metadata, 
        fromCache: false,
        deepValidation: deepValidation 
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
