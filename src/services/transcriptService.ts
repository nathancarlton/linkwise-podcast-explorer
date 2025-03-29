
import { processTranscript as processTranscriptUtil } from '../utils/transcriptProcessor';
import { findLinksForTopics } from '../utils/linkFinder';
import { SearchApiType } from '../types';

/**
 * Service for handling transcript processing operations
 */
export const transcriptService = {
  /**
   * Extract topics from a transcript
   * 
   * @param transcript - The transcript text
   * @param apiKey - OpenAI API key
   * @param topicCount - Number of topics to extract
   * @param topicsToAvoid - Topics to exclude
   * @returns Promise resolving to the extracted topics
   */
  extractTopics: async (
    transcript: string,
    apiKey: string,
    topicCount: number = 5,
    topicsToAvoid: string[] = []
  ) => {
    return await processTranscriptUtil(transcript, apiKey, topicCount, topicsToAvoid);
  },
  
  /**
   * Find links for topics
   * 
   * @param topics - Array of topics to find links for
   * @param apiKey - API key for the selected service
   * @param domainsToAvoid - Domains to exclude from results
   * @param searchApi - Which search API to use
   * @returns Promise resolving to processed topics with links
   */
  findLinks: async (
    topics: any[],
    apiKey: string,
    domainsToAvoid: string[] = [],
    searchApi: SearchApiType = SearchApiType.OpenAI
  ) => {
    return await findLinksForTopics(topics, apiKey, domainsToAvoid, searchApi);
  }
};
