
// Error page detection logic
export function detectErrorPage(html: string, url: string): boolean {
  // Convert to lowercase for case-insensitive matching
  const lowercaseHtml = html.toLowerCase();
  
  // Common error page indicators
  const errorPatterns = [
    'page not found',
    'cannot be found',
    'could not be found',
    'doesn\'t exist',
    'does not exist',
    'no longer available',
    'no longer exists',
    'been removed',
    'error 404',
    '404 error',
    'not found error',
    'page doesn\'t exist',
    'page does not exist',
    'content not found',
    'not available',
    'page unavailable',
    'sorry, we couldn\'t find',
    'page has moved',
    'page may have been moved',
    'moved permanently',
    'page has been deleted',
    'content has moved',
    'page missing',
    'invalid url',
    'broken link',
    'page has expired',
    'requested url was not found',
    'wrong address',
    'went wrong',
    'oops',
    'something went wrong',
    'cannot access',
    'unable to access',
    'url changed',
    'has been deleted',
    'has been removed',
    'nothing found',
    'search did not return',
    'empty search results',
    'no results found',
    'no items found'
  ];
  
  // Domain-specific patterns
  if (url.includes('hbr.org')) {
    return checkDomainSpecificPatterns(lowercaseHtml, url, [
      'sign in to continue reading',
      'you\'ve reached your monthly limit',
      'subscribe to continue reading',
      'register to continue reading',
      'this article is about',
      'access to this page has been denied',
      'access denied',
      'article not found'
    ], 'HBR-specific');
  }
  
  if (url.includes('mckinsey.com')) {
    return checkDomainSpecificPatterns(lowercaseHtml, url, [
      'page you are looking for is unavailable',
      'page you requested cannot be found',
      'we can\'t find the page',
      'moved to a new location',
      'this content has moved',
      'has been transferred',
      'this article is no longer available'
    ], 'McKinsey-specific');
  }
  
  if (url.includes('nature.com')) {
    return checkDomainSpecificPatterns(lowercaseHtml, url, [
      'page not found',
      'cited incorrect doi',
      'might have been removed',
      'content unavailable',
      'article has been withdrawn'
    ], 'Nature-specific');
  }
  
  if (url.includes('forbes.com')) {
    return checkDomainSpecificPatterns(lowercaseHtml, url, [
      'page no longer exists',
      'page has been removed',
      'page has moved',
      'incorrect url',
      'article not found',
      'oops, the page you were looking for'
    ], 'Forbes-specific');
  }
  
  // Check for meta title/description error indicators
  if (/<title[^>]*>.*?(?:404|not found|error|unavailable|missing|oops).*?<\/title>/i.test(html)) {
    console.log(`Error indication found in title tag for ${url}`);
    return true;
  }
  
  // Check for standard error patterns
  for (const pattern of errorPatterns) {
    if (lowercaseHtml.includes(pattern)) {
      console.log(`Standard error pattern found for ${url}: ${pattern}`);
      return true;
    }
  }
  
  // If none of the error patterns were found, it's likely a valid page
  return false;
}

// Helper function to check domain-specific error patterns
function checkDomainSpecificPatterns(
  html: string, 
  url: string, 
  patterns: string[], 
  domainName: string
): boolean {
  for (const pattern of patterns) {
    if (html.includes(pattern)) {
      console.log(`${domainName} error pattern found for ${url}: ${pattern}`);
      return true;
    }
  }
  return false;
}
