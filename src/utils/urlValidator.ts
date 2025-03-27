
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
    
    // List of known valid domains to check against
    const knownValidDomains = [
      'github.com',
      'wikipedia.org',
      'medium.com',
      'techcrunch.com',
      'forbes.com',
      'hbr.org',
      'harvard.edu',
      'mit.edu',
      'stanford.edu',
      'mckinsey.com',
      'nature.com',
      'nytimes.com',
      'wsj.com',
      'acm.org',
      'ieee.org',
      'arxiv.org',
      'pubmed.gov',
      'sciencedirect.com',
      'springer.com',
      'amazon.com',
      'google.com',
      'youtube.com',
      'apple.com',
      'microsoft.com',
      'mozilla.org',
      'cnn.com',
      'bbc.com',
      'openai.com',
      'ai.google',
      'anthropic.com',
      'huggingface.co',
      'kaggle.com',
      'ted.com',
      'coursera.org',
      'edx.org',
      'udacity.com',
      'udemy.com',
      
      // Add more reliable domains for healthcare, business, and AI content
      'mayoclinic.org',
      'healthline.com',
      'webmd.com',
      'who.int',
      'cdc.gov',
      'nih.gov',
      'cancer.gov',
      'healthcare.gov',
      'medlineplus.gov',
      'health.harvard.edu',
      'jamanetwork.com',
      'nejm.org',
      'bmj.com',
      'thelancet.com',
      'hbswk.hbs.edu', // Harvard Business School Working Knowledge
      'gsb.stanford.edu',
      'sloanreview.mit.edu',
      'strategy-business.com',
      'fastcompany.com',
      'wired.com',
      'arstechnica.com',
      'zdnet.com'
    ];
    
    // Check if the domain or a subdomain of a known domain
    const isDomainValid = knownValidDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
    
    if (!isDomainValid) {
      // Basic pattern for domain validation if not a known domain
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
    }
    
    // Check for common patterns in fake or placeholder URLs
    const invalidPatterns = [
      'example.com', 'test.com', 'domain.com', 'mysite.com',
      'localhost', 'website.com', 'placeholder', '127.0.0.1'
    ];
    
    // Reject if hostname contains invalid patterns
    if (invalidPatterns.some(pattern => urlObj.hostname.includes(pattern) || url.includes(pattern))) {
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
