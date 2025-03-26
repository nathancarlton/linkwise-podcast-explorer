
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
      
      // The problematic URLs all have "known" domain problems
      // Forbes URL rewrite check - Forbes often redirects to a different URL format
      if (domain === 'forbes.com' || domain.endsWith('.forbes.com')) {
        if (url.includes('/sites/') && !url.includes('#')) {
          console.warn(`Forbes URL likely redirects: ${url}`);
          try {
            // Try to validate with our edge function that can follow redirects
            const { data, error } = await supabase.functions.invoke('validate-url', {
              body: { url, deepValidation: true }
            });
            
            if (error) {
              console.warn(`Edge function error validating Forbes URL: ${url}`, error);
              // We'll be cautious with Forbes URLs
              return false;
            }
            
            return data.isValid;
          } catch (e) {
            console.warn(`Error calling validation service for Forbes URL ${url}:`, e);
            return false;
          }
        }
      }
      
      // HBR URL validation - HBR has many archive/inactive URLs
      if (domain === 'hbr.org' || domain.endsWith('.hbr.org')) {
        try {
          const { data, error } = await supabase.functions.invoke('validate-url', {
            body: { url, deepValidation: true }
          });
          
          if (error) {
            console.warn(`Edge function error validating HBR URL: ${url}`, error);
            return false;
          }
          
          return data.isValid;
        } catch (e) {
          console.warn(`Error calling validation service for HBR URL ${url}:`, e);
          return false;
        }
      }
      
      // McKinsey URL validation - They restructure URLs frequently
      if (domain === 'mckinsey.com' || domain.endsWith('.mckinsey.com')) {
        if (url.includes('/industries/') || url.includes('/our-insights/')) {
          try {
            const { data, error } = await supabase.functions.invoke('validate-url', {
              body: { url, deepValidation: true }
            });
            
            if (error) {
              console.warn(`Edge function error validating McKinsey URL: ${url}`, error);
              return false;
            }
            
            return data.isValid;
          } catch (e) {
            console.warn(`Error calling validation service for McKinsey URL ${url}:`, e);
            return false;
          }
        }
      }
      
      // Nature URL validation - They have strict URL formats
      if (domain === 'nature.com' || domain.endsWith('.nature.com')) {
        try {
          const { data, error } = await supabase.functions.invoke('validate-url', {
            body: { url, deepValidation: true }
          });
          
          if (error) {
            console.warn(`Edge function error validating Nature URL: ${url}`, error);
            return false;
          }
          
          return data.isValid;
        } catch (e) {
          console.warn(`Error calling validation service for Nature URL ${url}:`, e);
          return false;
        }
      }
      
      // Trust URLs from known high-quality domains
      if (trustedDomains.some(trusted => domain === trusted || domain.endsWith('.' + trusted))) {
        // For trusted domains, we still use our edge function for validation
        // since we've seen that trusted domains can still have invalid URLs
        try {
          const { data, error } = await supabase.functions.invoke('validate-url', {
            body: { url }
          });
          
          if (error) {
            console.warn(`Edge function error validating trusted URL: ${url}`, error);
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
      
      // If the domain isn't explicitly trusted but has a reasonable TLD, we'll trust it
      const validTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.co', '.ai', '.app', 
                         '.us', '.uk', '.ca', '.au', '.eu', '.de', '.fr', '.jp', '.cn', '.in'];
      
      if (validTLDs.some(tld => domain.endsWith(tld))) {
        // For domains with valid TLDs, use our improved validation endpoint
        try {
          // Using the Supabase Edge Function for validation
          const { data, error } = await supabase.functions.invoke('validate-url', {
            body: { url, deepValidation: true }
          });
          
          if (error) {
            console.warn(`Edge function error validating URL: ${url}`, error);
            // Be cautious if validation fails
            return false;
          }
          
          if (!data.isValid) {
            toast({
              title: "Invalid URL detected",
              description: `The URL ${url} appears to be invalid or unavailable.`,
              variant: "destructive"
            });
          }
          
          return data.isValid;
        } catch (e) {
          console.warn(`Error calling URL validation service for ${url}:`, e);
          // Be cautious if validation fails
          return false;
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
