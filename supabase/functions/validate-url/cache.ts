
// Cache-related functionality for URL validation
import { corsHeaders } from "./cors.ts";

// Check if URL exists in cache
export async function checkUrlCache(url: string, forceCheck: boolean = false, supabase: any) {
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
export async function storeUrlCache(url: string, isValid: boolean, metadata: any, supabase: any) {
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
