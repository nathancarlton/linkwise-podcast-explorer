
/**
 * Functions for processing OpenAI API responses
 */
import { ProcessedTopic } from '../../types';
import { extractLinksFromText } from '../textExtractor';
import { validateTopicLinks } from '../linkValidation';

/**
 * Process API response content and extract processed topics
 * 
 * @param content API response content
 * @param topicsFormatted Formatted topics array
 * @param domainsToAvoid Domains to exclude
 * @returns Promise resolving to processed topics with validated links
 */
export const processAPIResponse = async (
  content: string,
  topicsFormatted: any[],
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  try {
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response content:', parseError);
      
      // Try to extract URLs directly from the text if JSON parsing fails
      const topics = topicsFormatted.map(t => t.topic);
      const extractedTopics = extractLinksFromText(content, topics);
      
      if (extractedTopics.length > 0) {
        return { processedTopics: extractedTopics, usedMockData: false };
      }
      
      return { processedTopics: [], usedMockData: false };
    }
    
    // Support different response formats from the API
    const formattedTopics = Array.isArray(parsedContent) ? parsedContent : parsedContent.topics || [];
    
    if (formattedTopics.length === 0) {
      console.error('No processed topics found in API response');
      return { processedTopics: [], usedMockData: false };
    }
    
    // Create topic objects with validated links
    const processedTopics: ProcessedTopic[] = [];
    
    for (const topic of formattedTopics) {
      if (!topic || !topic.topic || !Array.isArray(topic.links)) {
        console.warn('Invalid topic object, skipping:', topic);
        continue;
      }
      
      const validatedLinks = await validateTopicLinks(topic, domainsToAvoid);
      
      if (validatedLinks.length > 0) {
        processedTopics.push({
          topic: topic.topic,
          context: topic.context || '',
          links: validatedLinks
        });
      }
    }
    
    // If we have no topics with valid links, return empty array
    if (processedTopics.length === 0) {
      return { processedTopics: [], usedMockData: false };
    }
    
    return { processedTopics, usedMockData: false };
  } catch (error) {
    console.error('Error processing API response:', error);
    return { processedTopics: [], usedMockData: false };
  }
};
