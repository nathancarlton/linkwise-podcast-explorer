
import axios from 'axios';
import { isValidUrl } from './urlValidator';
import { supabase } from "@/integrations/supabase/client";

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
      
      // Trust URLs from known high-quality domains
      if (trustedDomains.some(trusted => domain === trusted || domain.endsWith('.' + trusted))) {
        console.log(`URL is from trusted domain, skipping HTTP check: ${url}`);
        return true;
      }
      
      // For non-trusted domains, we'll be more cautious by default
      if (!url.startsWith('https://')) {
        console.warn(`Non-HTTPS URL rejected: ${url}`);
        return false;
      }
      
      // If the domain isn't explicitly trusted but has a reasonable TLD, we'll trust it
      const validTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.co', '.ai', '.app', 
                         '.us', '.uk', '.ca', '.au', '.eu', '.de', '.fr', '.jp', '.cn', '.in'];
      
      if (validTLDs.some(tld => domain.endsWith(tld))) {
        // For domains with valid TLDs, use our caching validation endpoint
        try {
          // Using the Supabase Edge Function for validation
          const { data, error } = await supabase.functions.invoke('validate-url', {
            body: { url }
          });
          
          if (error) {
            console.warn(`Edge function error validating URL: ${url}`, error);
            // Fall back to trusting it if our validation service fails
            return true;
          }
          
          return data.isValid;
        } catch (e) {
          console.warn(`Error calling URL validation service for ${url}:`, e);
          // Fall back to trusting it if our validation service fails
          return true;
        }
      }
      
      console.warn(`URL fails domain validation: ${url}`);
      return false;
    } catch (e) {
      console.warn(`URL parsing failed: ${url}`, e);
      return false;
    }
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error?.message || error);
    return false;
  }
};
