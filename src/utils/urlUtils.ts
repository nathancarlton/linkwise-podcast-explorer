
import axios from 'axios';
import { isValidUrl } from './urlValidator';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// URL validation function that focuses on format and trusted domains
export const validateUrl = async (url: string): Promise<boolean> => {
  try {
    if (!isValidUrl(url)) {
      console.warn(`URL failed format validation: ${url}`);
      return false;
    }
    
    // For non-HTTPS URLs, reject by default for security
    if (!url.startsWith('https://')) {
      console.warn(`Non-HTTPS URL rejected: ${url}`);
      return false;
    }
    
    try {
      // First try a rapid HEAD request with a short timeout
      const response = await axios.head(url, { 
        timeout: 3000,
        validateStatus: status => status < 500 // Accept anything that's not a server error
      });
      
      // For 2xx responses, treat as likely valid
      if (response.status >= 200 && response.status < 300) {
        console.log(`URL ${url} validated with status ${response.status}`);
        return true;
      }
      
      // For 3xx, 4xx responses, use edge function for deeper validation
      console.log(`HEAD request returned status ${response.status} for ${url}, trying edge function`);
    } catch (error) {
      // If direct request fails, use the edge function
      console.log(`Direct HEAD request failed for ${url}, trying edge function validation`);
    }
    
    // Use Supabase edge function for deeper validation
    try {
      const { data, error } = await supabase.functions.invoke('validate-url', {
        body: { 
          url, 
          deepValidation: false, // Keep validation lightweight to improve performance
          forceCheck: false     // Use cached results when available
        }
      });
      
      if (error) {
        console.warn(`Edge function error validating URL: ${url}`, error);
        return false;
      }
      
      return data.isValid;
    } catch (edgeError) {
      console.warn(`Edge function request failed for ${url}`, edgeError);
      return false;
    }
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error?.message || error);
    return false;
  }
};

// Helper function to validate URL content quality - simplified version
const validateUrlContent = async (url: string): Promise<boolean> => {
  try {
    // Do a basic check
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Simple check for common error patterns
    if (typeof response.data === 'string') {
      const lowerHtml = response.data.toLowerCase();
      if (lowerHtml.includes('not found') || 
          lowerHtml.includes('error 404') || 
          lowerHtml.includes('page unavailable')) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.warn(`Content validation error for ${url}:`, error?.message || error);
    return false;
  }
};
