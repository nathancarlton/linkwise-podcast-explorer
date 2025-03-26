
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
    
    // Basic pattern for domain validation
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    
    // Use reasonable allowlist of known TLDs
    const validTLDs = [
      '.com', '.org', '.net', '.edu', '.gov', '.io', '.co',
      '.us', '.uk', '.ca', '.au', '.de', '.fr', '.jp',
      '.cn', '.ru', '.br', '.in', '.it', '.nl', '.es', '.app'
    ];
    
    const hasSomeTLD = validTLDs.some(tld => urlObj.hostname.endsWith(tld));
    if (!hasSomeTLD) {
      return false;
    }
    
    // Check for common patterns in fake or placeholder URLs
    const invalidPatterns = [
      'example.com', 'test.com', 'domain.com', 'mysite.com',
      'localhost', 'website.com', 'placeholder', '127.0.0.1'
    ];
    
    // Reject if hostname contains invalid patterns
    if (invalidPatterns.some(pattern => urlObj.hostname.includes(pattern))) {
      return false;
    }
    
    // Make sure the URL doesn't have special characters that shouldn't be in a URL
    if (url.includes(' ') || url.includes('<') || url.includes('>')) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
