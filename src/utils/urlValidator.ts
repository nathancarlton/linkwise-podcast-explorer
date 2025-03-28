
/**
 * Utility function to validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    // Attempt to create a URL object
    const urlObj = new URL(url);
    
    // Check for valid protocols (only http and https are allowed)
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check domain validity
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return false;
    }
    
    // Check for common patterns in fake or placeholder URLs
    const invalidPatterns = [
      'example.com', 'test.com', 'domain.com', 'mysite.com',
      'localhost', 'website.com', 'placeholder', '127.0.0.1',
      'fictional', 'made-up', 'notreal', 'fakedomain', 'imaginary',
      'yourwebsite', 'yoursite', 'thiswebsite', 'somewebsite', 'hypothetical'
    ];
    
    // Reject if hostname contains invalid patterns
    if (invalidPatterns.some(pattern => 
      urlObj.hostname.includes(pattern) || url.includes(pattern))) {
      console.warn(`URL rejected due to invalid pattern: ${url}`);
      return false;
    }
    
    // Make sure the URL doesn't have special characters that shouldn't be in a URL
    if (url.includes(' ') || url.includes('<') || url.includes('>') || 
        url.includes('"') || url.includes("'")) {
      console.warn(`URL rejected due to invalid characters: ${url}`);
      return false;
    }
    
    // Check for URLs with unrealistic or common hallucinated TLDs
    const suspiciousTLDs = ['.example', '.test', '.invalid', '.local', '.internal'];
    if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
      console.warn(`URL rejected due to suspicious TLD: ${url}`);
      return false;
    }
    
    // Check for unrealistically long domains (which are often hallucinated)
    if (urlObj.hostname.length > 50) {
      console.warn(`URL rejected due to unrealistic length: ${url}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn(`URL validation error for ${url}:`, error);
    return false;
  }
};
