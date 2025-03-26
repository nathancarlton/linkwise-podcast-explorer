
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

// Check if URL exists in cache
async function checkUrlCache(url: string, forceCheck: boolean = false) {
  // If we're forcing a fresh check, skip the cache
  if (forceCheck) {
    return null;
  }
  
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
    
    // Use a shorter cache expiry time (1 day) to allow new validation attempts more frequently
    if (cacheAgeInDays < 1) {
      return data;
    }
  }

  return null;
}

// Store URL in cache
async function storeUrlCache(url: string, isValid: boolean, metadata: any) {
  try {
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
  } catch (e) {
    console.error('Exception storing URL in cache:', e);
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
  
  // Domain-specific patterns for problematic sites
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

// Deep URL validation that checks content for error patterns
async function deepValidateUrl(url: string) {
  try {
    // Try to parse the URL first
    new URL(url);
    
    // Check if URL is reachable and examine content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Make a GET request to check the content
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
      
      // For server errors, reject
      if (getResponse.status >= 500) {
        console.warn(`GET request failed with server error for ${url}: ${getResponse.status} ${getResponse.statusText}`);
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
        try {
          const html = await getResponse.text();
          
          // Check for error page indicators in the HTML
          if (detectErrorPage(html, url)) {
            console.warn(`Error page detected for ${url} despite status code ${getResponse.status}`);
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
          
          // Check for article content markers
          if (url.includes('forbes.com') || url.includes('hbr.org')) {
            const hasArticleContent = html.toLowerCase().includes('article-body') || 
                                      html.toLowerCase().includes('article-content') ||
                                      html.toLowerCase().includes('article__body');
                                      
            if (!hasArticleContent) {
              console.warn(`No article content found for ${url}`);
              return { 
                isValid: false, 
                metadata: {
                  ...metadata,
                  reason: 'No article content found'
                } 
              };
            }
          }
          
          // URL is valid if we got here
          return { isValid: true, metadata };
        } catch (textError) {
          console.warn(`Error reading response text for ${url}:`, textError);
          return { isValid: false, metadata: { error: textError.message, source: 'text_parsing' } };
        }
      }
      
      // For non-HTML content, check if it's a PDF or other document which is likely valid
      if (contentType.includes('application/pdf') || 
          contentType.includes('application/doc') ||
          contentType.includes('application/msword')) {
        return { isValid: true, metadata };
      }
      
      // For other content types, be more cautious
      return { 
        isValid: false, 
        metadata: { 
          ...metadata, 
          reason: `Unsupported content type: ${contentType}` 
        } 
      };
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
      const cachedResult = await checkUrlCache(url, forceCheck);
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
      await storeUrlCache(url, validationResult.isValid, validationResult.metadata);
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
