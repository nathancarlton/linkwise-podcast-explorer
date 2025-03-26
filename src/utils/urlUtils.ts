
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
    
    // Known high-quality domains we can trust without checking
    const trustedDomains = [
      'github.com', 'wikipedia.org', 'nature.com', 'nih.gov', 
      'pubmed.gov', 'ncbi.nlm.nih.gov', 'sciencedirect.com', 
      'springer.com', 'ieee.org', 'acm.org', 'arxiv.org',
      'harvard.edu', 'mit.edu', 'stanford.edu', 'edx.org',
      'coursera.org', 'udacity.com', 'mckinsey.com', 'hbr.org',
      'techcrunch.com', 'forbes.com', 'wsj.com', 'nytimes.com',
      'cnn.com', 'bbc.com', 'reuters.com', 'bloomberg.com',
      'apple.com', 'microsoft.com', 'google.com', 'ibm.com',
      'amazon.com', 'netflix.com', 'youtube.com', 'facebook.com',
      'twitter.com', 'linkedin.com', 'instagram.com', 'reddit.com',
      'medium.com', 'dev.to', 'healthit.gov', 'who.int', 'cdc.gov',
      'mayoclinic.org', 'webmd.com', 'hopkinsmedicine.org', 'clevelandclinic.org',
      'healthcare.gov', 'cancer.gov', 'cancer.org', 'heart.org',
      'diabetes.org', 'alz.org', 'medlineplus.gov', 'jamanetwork.com',
      'nejm.org', 'bmj.com', 'thelancet.com', 'cell.com', 'academic.oup.com',
      'frontiersin.org', 'pnas.org', 'plos.org'
    ];
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // For non-trusted domains, we'll be more cautious by default
      if (!url.startsWith('https://')) {
        console.warn(`Non-HTTPS URL rejected: ${url}`);
        return false;
      }
      
      // First try to resolve the URL directly with a basic check
      try {
        // Attempt a rapid HEAD request first with a short timeout
        const response = await axios.head(url, { 
          timeout: 3000,
          validateStatus: status => status < 500 // Accept anything that's not a server error
        });
        
        // If we get a 200-299 response, the URL likely exists but we'll do deeper validation
        if (response.status >= 200 && response.status < 300) {
          // Still do a GET request to check content quality for all domains
          return await validateUrlContent(url, domain, trustedDomains);
        }
        
        // For 3xx, 4xx responses, we'll do a deeper check with our edge function
      } catch (error) {
        // If the HEAD request fails, we'll try the edge function
        console.log(`Direct HEAD request failed for ${url}, trying edge function validation`);
      }
      
      // Always force check and bypass cache during validation for better results
      const { data, error } = await supabase.functions.invoke('validate-url', {
        body: { 
          url, 
          deepValidation: true, 
          forceCheck: true 
        }
      });
      
      if (error) {
        console.warn(`Edge function error validating URL: ${url}`, error);
        return false;
      }
      
      // Only return true if the URL was actually validated as containing quality content
      return data.isValid;
    } catch (e) {
      console.warn(`URL parsing failed: ${url}`, e);
      return false;
    }
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error?.message || error);
    return false;
  }
};

// Helper function to validate URL content quality
const validateUrlContent = async (url: string, domain: string, trustedDomains: string[]): Promise<boolean> => {
  try {
    // Check if the URL is from a trusted domain - we'll still validate but be less strict
    const isTrustedDomain = trustedDomains.some(trusted => 
      domain === trusted || domain.endsWith('.' + trusted)
    );
    
    // Attempt a GET request to check actual content
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    
    // Check for common error page indicators in the content
    const errorPatterns = [
      'page not found', 'cannot be found', 'does not exist', 
      'no longer available', 'error 404', '404 error',
      'page unavailable', 'sorry, we couldn\'t find',
      'page has moved', 'deleted', 'been removed',
      'missing', 'invalid url', 'broken link',
      'went wrong', 'oops', 'something went wrong',
      'page doesn\'t exist', 'access denied'
    ];
    
    const lowerHtml = typeof html === 'string' ? html.toLowerCase() : '';
    
    // Check for error indicators in the HTML content
    const containsErrorPattern = errorPatterns.some(pattern => 
      lowerHtml.includes(pattern)
    );
    
    // Check if title contains error indicators
    const titleMatch = typeof html === 'string' ? html.match(/<title[^>]*>(.*?)<\/title>/i) : null;
    const title = titleMatch && titleMatch[1] ? titleMatch[1].toLowerCase() : '';
    const titleContainsError = title.includes('not found') || 
                               title.includes('error') || 
                               title.includes('404') ||
                               title.includes('unavailable');
    
    if (containsErrorPattern || titleContainsError) {
      console.warn(`Error content detected for ${url}`);
      return false;
    }

    // For specific domains with known issues, do more specialized checking
    if (domain.includes('forbes.com')) {
      // Forbes specific check - look for article content
      if (!lowerHtml.includes('article-body') || lowerHtml.includes('page not found')) {
        console.warn(`Forbes article validation failed for ${url}`);
        return false;
      }
    }
    
    if (domain.includes('hbr.org')) {
      // HBR specific check - look for article content
      if (!lowerHtml.includes('article-body') || 
          lowerHtml.includes('sign in to continue reading') ||
          lowerHtml.includes('access to this page has been denied')) {
        console.warn(`HBR article validation failed for ${url}`);
        return false;
      }
    }
    
    if (domain.includes('mckinsey.com')) {
      // McKinsey specific check
      if (lowerHtml.includes('page you are looking for is unavailable') || 
          lowerHtml.includes('page you requested cannot be found')) {
        console.warn(`McKinsey article validation failed for ${url}`);
        return false;
      }
    }
    
    if (domain.includes('nature.com')) {
      // Nature specific check
      if (lowerHtml.includes('page not found') || 
          lowerHtml.includes('content unavailable')) {
        console.warn(`Nature article validation failed for ${url}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.warn(`Content validation error for ${url}:`, error?.message || error);
    return false;
  }
};
