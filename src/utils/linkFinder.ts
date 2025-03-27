
import { ProcessedTopic } from '../types';
import { generateFallbackLinks } from './fallbackLinks';
import { findLinksWithOpenAI } from './openAILinkFinder';

/**
 * Find links for the extracted topics using OpenAI and web search functionality
 * 
 * @param topics - Array of topics to search links for
 * @param apiKey - OpenAI API key
 * @param domainsToAvoid - List of domains to avoid in search results
 * @returns Promise resolving to processed topics with links and whether mock data was used
 */
export const findLinksForTopics = async (
  topics: any[], 
  apiKey?: string, 
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  console.log('Domains to avoid:', domainsToAvoid);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    console.error('No valid OpenAI API key provided. Cannot find links for topics.');
    return { processedTopics: [], usedMockData: false };
  }
  
  try {
    // Use OpenAI to find links for topics
    return await findLinksWithOpenAI(topics, apiKey, domainsToAvoid);
  } catch (error) {
    console.error('Error finding links:', error);
    // Use fallback links if there was an error
    const formattedTopics = Array.isArray(topics) 
      ? topics.map(t => typeof t === 'string' ? { topic: t } : t)
      : [typeof topics === 'string' ? { topic: topics } : topics];
    
    return { processedTopics: generateFallbackLinks(formattedTopics), usedMockData: true };
  }
};
