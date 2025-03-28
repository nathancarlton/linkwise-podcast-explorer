
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
      // Skip links from domains to avoid
      const linkDomain = new URL(link.url).hostname.replace('www.', '');
      const shouldSkip = domainsToAvoid.some(domain => 
        linkDomain === domain || linkDomain.endsWith('.' + domain)
      );
      
      if (shouldSkip) {
        console.warn(`Skipping link from domain to avoid: ${link.url} (domain: ${linkDomain})`);
        continue;
      }
      
      // Validate the URL
      const isValid = await validateUrl(link.url);
      
      if (isValid) {
        console.log(`Link validated successfully: ${link.url}`);
        validatedLinks.push(link);
      } else {
        console.warn(`Link validation failed for ${link.url}, excluding from results`);
      }
    } catch (urlError) {
      console.warn(`Invalid URL format: ${link.url}, error:`, urlError);
    }
  }
  
  return validatedLinks;
};
