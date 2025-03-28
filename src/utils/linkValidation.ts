
import { validateUrl } from './urlUtils';

/**
 * Validates a set of links for a topic and returns only the valid ones
 * 
 * @param topic The topic object containing links to validate
 * @param domainsToAvoid List of domains to exclude
 * @returns Promise resolving to an array of validated links
 */
export const validateTopicLinks = async (
  topic: any,
  domainsToAvoid: string[] = []
): Promise<any[]> => {
  if (!topic || !topic.links || !Array.isArray(topic.links)) {
    console.warn('Invalid topic object for validation:', topic);
    return [];
  }

  const validatedLinks = [];
  
  // Process each link
  for (const link of topic.links) {
    if (!link || !link.url) {
      console.warn('Invalid link object, skipping:', link);
      continue;
    }
    
    try {
      // Check if this is a Google search fallback URL
      const isGoogleSearch = link.url.startsWith('https://www.google.com/search?q=');
      
      // Skip links from domains to avoid (unless it's a Google search fallback)
      if (!isGoogleSearch) {
        const linkDomain = new URL(link.url).hostname.replace('www.', '');
        const shouldSkip = domainsToAvoid.some(domain => 
          linkDomain === domain || linkDomain.endsWith('.' + domain)
        );
        
        if (shouldSkip) {
          console.warn(`Skipping link from domain to avoid: ${linkDomain}`);
          continue;
        }
      }
      
      // Allow Google search URLs to pass through without validation
      // They're our fallback when no valid links are found
      if (isGoogleSearch) {
        validatedLinks.push(link);
        continue;
      }
      
      // Validate the URL
      const isValid = await validateUrl(link.url);
      
      if (isValid) {
        validatedLinks.push(link);
      } else {
        console.warn(`Link validation failed for ${link.url}, excluding from results`);
      }
    } catch (urlError) {
      console.warn(`Invalid URL format: ${link.url}`);
    }
  }
  
  // If no valid links were found, add a Google search fallback
  if (validatedLinks.length === 0 && topic.topic) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(topic.topic)}`;
    validatedLinks.push({
      url: googleSearchUrl,
      title: `Search for ${topic.topic}`,
      description: `No valid links found. Search for information about ${topic.topic}.`
    });
  }
  
  return validatedLinks;
};
