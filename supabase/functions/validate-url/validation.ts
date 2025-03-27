
import { detectErrorPage } from "./error-detection.ts";

// Deep URL validation that checks content for error patterns
export async function deepValidateUrl(url: string) {
  try {
    // Try to parse the URL first
    new URL(url);
    
    // Check if URL is reachable and examine content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Make a GET request to check the content
      const getResponse = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      
      clearTimeout(timeoutId);
      
      // For server errors, reject
      if (getResponse.status >= 500) {
        console.warn(`GET request failed with server error for ${url}: ${getResponse.status} ${getResponse.statusText}`);
        return { 
          isValid: false, 
          metadata: {
            status: getResponse.status,
            statusText: getResponse.statusText,
            source: 'get_request' 
          } 
        };
      }
      
      // Check content type - we mainly care about HTML pages
      const contentType = getResponse.headers.get('content-type') || '';
      
      // Extract some basic metadata from headers
      const metadata: any = {
        contentType,
        server: getResponse.headers.get('server'),
        lastModified: getResponse.headers.get('last-modified'),
        source: 'deep_validation'
      };
      
      // For HTML content, check for 404 indicators in the content
      if (contentType.includes('text/html')) {
        return await processHtmlContent(getResponse, url, metadata);
      }
      
      // For non-HTML content, check if it's a PDF or other document which is likely valid
      if (contentType.includes('application/pdf') || 
          contentType.includes('application/doc') ||
          contentType.includes('application/msword')) {
        return { isValid: true, metadata };
      }
      
      // For other content types, be more cautious
      return { 
        isValid: false, 
        metadata: { 
          ...metadata, 
          reason: `Unsupported content type: ${contentType}` 
        } 
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`Fetch error for ${url}:`, fetchError);
      return { isValid: false, metadata: { error: fetchError.message, source: 'deep_validation' } };
    }
  } catch (error) {
    console.warn(`URL parsing error for ${url}:`, error);
    return { isValid: false, metadata: { error: error.message, source: 'deep_validation' } };
  }
}

// Process HTML content to detect error pages and extract metadata
async function processHtmlContent(response: Response, url: string, metadata: any) {
  try {
    const html = await response.text();
    
    // Check for error page indicators in the HTML
    if (detectErrorPage(html, url)) {
      console.warn(`Error page detected for ${url} despite status code ${response.status}`);
      return { 
        isValid: false, 
        metadata: {
          ...metadata,
          reason: 'Error page detected in content'
        } 
      };
    }
    
    // Try to extract title from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      metadata.title = titleMatch[1].trim();
      
      // Check for error indicators in title
      const errorTitlePatterns = [
        '404', 'error', 'not found', 'unavailable', 'missing',
        'oops', 'sorry'
      ];
      
      const lowerTitle = metadata.title.toLowerCase();
      if (errorTitlePatterns.some(pattern => lowerTitle.includes(pattern))) {
        console.warn(`Error indicator found in title for ${url}: "${metadata.title}"`);
        return { 
          isValid: false, 
          metadata: {
            ...metadata,
            reason: `Error indicator in title: "${metadata.title}"`
          } 
        };
      }
    }
    
    // Try to extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    if (descMatch && descMatch[1]) {
      metadata.description = descMatch[1].trim();
    }
    
    // URL is valid if we got here
    return { isValid: true, metadata };
  } catch (textError) {
    console.warn(`Error reading response text for ${url}:`, textError);
    return { isValid: false, metadata: { error: textError.message, source: 'text_parsing' } };
  }
}
