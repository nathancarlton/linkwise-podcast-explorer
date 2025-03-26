
import axios from 'axios';
import { isValidUrl } from './urlValidator';

// Server-side URL validation function
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
      'coursera.org', 'udacity.com', 'mckinsey.com', 'hbr.org'
    ];
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Skip actual HTTP check for trusted domains to reduce API load
      if (trustedDomains.some(trusted => domain === trusted || domain.endsWith('.' + trusted))) {
        console.log(`URL is from trusted domain, skipping HTTP check: ${url}`);
        return true;
      }
    } catch (e) {
      // If URL parsing fails, continue to the HTTP check
    }
    
    // Use axios to check if the URL actually exists and returns a valid response
    const response = await axios.head(url, { 
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400 // Consider any status less than 400 as valid
    });
    
    console.log(`URL validation succeeded for ${url}, status: ${response.status}`);
    return true;
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error?.message || error);
    return false;
  }
};
