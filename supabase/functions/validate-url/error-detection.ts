
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
    'error 404',
    '404 error',
    'not found error',
    'page doesn\'t exist',
    'content not found',
    'page unavailable',
    'sorry, we couldn\'t find',
    'moved permanently',
    'page has been deleted',
    'invalid url',
    'broken link',
    'something went wrong',
    'unable to access',
    'no results found'
  ];
  
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
