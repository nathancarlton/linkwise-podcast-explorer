
import { ProcessedTopic, SearchApiType } from '../types';

/**
 * Find links for topics using the Brave Search API
 * 
 * @param topics - Array of topics to search for
 * @param apiKey - Brave API key
 * @param domainsToAvoid - List of domains to avoid in search results
 * @returns Promise resolving to processed topics with links
 */
export const findLinksWithBrave = async (
  topics: any[],
  apiKey: string,
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links with Brave API for topics:', topics);
  console.log('Domains to avoid:', domainsToAvoid);
  
  try {
    const processedTopics: ProcessedTopic[] = [];
    
    // Process each topic
    for (const topic of topics) {
      console.log(`Searching Brave for topic: ${topic.topic}`);
      const formattedTopic = typeof topic === 'string' ? topic : topic.topic;
      
      // Call Brave Search API
      const searchResult = await searchBrave(formattedTopic, apiKey, domainsToAvoid);
      
      if (searchResult.links.length > 0) {
        processedTopics.push({
          topic: formattedTopic,
          context: typeof topic === 'string' ? '' : (topic.context || ''),
          links: searchResult.links
        });
      } else {
        console.log(`No links found for topic: ${formattedTopic}`);
      }
    }
    
    return { processedTopics, usedMockData: false };
  } catch (error) {
    console.error('Error finding links with Brave API:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

/**
 * Search Brave for a topic and return links
 * 
 * @param query - Search query
 * @param apiKey - Brave API key
 * @param domainsToAvoid - List of domains to avoid
 * @returns Promise resolving to search results
 */
async function searchBrave(query: string, apiKey: string, domainsToAvoid: string[] = []) {
  try {
    // Format the API URL with the query
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    
    // Make request to Brave Search API
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Brave search response:', data);
    
    // Extract and format links from the response
    const links = extractLinksFromBraveResponse(data, domainsToAvoid);
    return { links };
  } catch (error) {
    console.error('Error searching Brave:', error);
    return { links: [] };
  }
}

/**
 * Extract links from Brave Search API response
 * 
 * @param response - Brave Search API response
 * @param domainsToAvoid - List of domains to avoid
 * @returns Array of formatted links
 */
function extractLinksFromBraveResponse(response: any, domainsToAvoid: string[] = []) {
  try {
    if (!response || !response.web || !response.web.results || !Array.isArray(response.web.results)) {
      console.warn('Invalid Brave response format:', response);
      return [];
    }
    
    // Extract and format links
    const links = response.web.results
      .filter((result: any) => {
        if (!result.url) return false;
        
        // Check if the URL's domain should be avoided
        try {
          const url = new URL(result.url);
          const domain = url.hostname.replace('www.', '');
          return !domainsToAvoid.some(d => domain === d || domain.endsWith('.' + d));
        } catch (error) {
          console.warn('Invalid URL format:', result.url);
          return false;
        }
      })
      .map((result: any) => ({
        url: result.url,
        title: result.title || 'No title',
        description: result.description || 'No description'
      }));
    
    console.log('Extracted links from Brave response:', links);
    return links;
  } catch (error) {
    console.error('Error extracting links from Brave response:', error);
    return [];
  }
}
