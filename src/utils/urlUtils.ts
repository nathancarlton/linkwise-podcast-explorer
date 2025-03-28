
import { isValidUrl } from './urlValidator';

export const validateUrl = async (url: string): Promise<boolean> => {
  try {
    // First check basic format
    if (!isValidUrl(url)) {
      console.warn(`URL failed basic validation: ${url}`);
      return false;
    }
    
    // Check for patterns that suggest hallucinated URLs
    const suspiciousPatterns = [
      '/article/', '/blog/', '/post/', '/news/', '/research/'
    ];
    
    // Count how many suspicious patterns appear in the URL
    const patternMatches = suspiciousPatterns.filter(pattern => 
      url.includes(pattern)
    ).length;
    
    // If URL has multiple suspicious patterns, it might be hallucinated
    if (patternMatches >= 3) {
      console.warn(`URL appears to be hallucinated (too many generic patterns): ${url}`);
      return false;
    }
    
    // Consider all URLs valid for now
    return true;
  } catch (error) {
    console.error(`Error validating URL ${url}:`, error);
    return false;
  }
};
