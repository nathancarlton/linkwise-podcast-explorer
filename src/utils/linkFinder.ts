
import { ProcessedTopic, SearchApiType } from '../types';
import { findLinksWithOpenAI } from './openAILinkFinder';
import { findLinksWithBrave } from './braveLinkFinder';

/**
 * Find links for the extracted topics using the selected search API
 * 
 * @param topics - Array of topics to search links for
 * @param apiKey - API key for the selected service
 * @param domainsToAvoid - List of domains to avoid in search results
 * @param searchApi - Which search API to use (OpenAI or Brave)
 * @returns Promise resolving to processed topics with links and whether mock data was used
 */
export const findLinksForTopics = async (
  topics: any[], 
  apiKey?: string, 
  domainsToAvoid: string[] = [],
  searchApi: SearchApiType = SearchApiType.OpenAI
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  console.log('Domains to avoid:', domainsToAvoid);
  console.log('Using search API:', searchApi);
  
  if (!apiKey || apiKey.trim() === '') {
    console.error(`No valid API key provided for ${searchApi}. Cannot find links for topics.`);
    return { processedTopics: [], usedMockData: false };
  }
  
  // Validate OpenAI API key format
  if (searchApi === SearchApiType.OpenAI && (!apiKey.startsWith('sk-'))) {
    console.error('Invalid OpenAI API key format. Cannot find links for topics.');
    return { processedTopics: [], usedMockData: false };
  }
  
  try {
    // Use the appropriate API based on the user's selection
    if (searchApi === SearchApiType.Brave) {
      return await findLinksWithBrave(topics, apiKey, domainsToAvoid);
    } else {
      // Default to OpenAI
      return await findLinksWithOpenAI(topics, apiKey, domainsToAvoid);
    }
  } catch (error) {
    console.error(`Error finding links with ${searchApi}:`, error);
    return { processedTopics: [], usedMockData: false };
  }
};
