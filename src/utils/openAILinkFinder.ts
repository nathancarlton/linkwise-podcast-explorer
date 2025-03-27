
import { ProcessedTopic } from '../types';
import { makeInitialRequest } from './openai/openAIRequests';
import { buildUserPrompt } from './openai/openAIConfig';

/**
 * Use OpenAI to find links for topics
 * 
 * @param topics Array of topics to find links for
 * @param apiKey OpenAI API key
 * @param domainsToAvoid Domains to exclude from results
 * @returns Promise resolving to processed topics with links
 */
export const findLinksWithOpenAI = async (
  topics: any[],
  apiKey: string,
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Using OpenAI to find links for topics:', topics);
  
  try {
    // Format topics for the prompt
    const topicsArray = Array.isArray(topics) 
      ? topics 
      : [topics];
    
    const topicsFormatted = topicsArray.map(t => {
      if (typeof t === 'string') {
        return { topic: t };
      }
      return t;
    });
    
    console.log('Formatted topics:', topicsFormatted);
    
    // Build the user prompt for OpenAI
    const prompt = buildUserPrompt(topicsFormatted, domainsToAvoid);
    console.log('Sending request to OpenAI with web_search tool');
    
    // Make the initial request to OpenAI API
    const data = await makeInitialRequest(apiKey, prompt, domainsToAvoid);
    
    console.log('Received response from OpenAI:', data);
    
    if (!data || !data.output) {
      console.error('Invalid response format from OpenAI API:', data);
      return { processedTopics: [], usedMockData: false };
    }
    
    // Extract links from the content
    const processedTopics: ProcessedTopic[] = [];
    
    // Process each topic from our input
    for (const topic of topicsFormatted) {
      const topicName = topic.topic;
      const links = [];
      
      // Look for URLs in the response output
      for (const output of data.output) {
        if (output.type === 'message' && output.content && Array.isArray(output.content)) {
          // Process each content item
          for (const contentItem of output.content) {
            if (contentItem.type === 'text' && contentItem.text) {
              // Extract URLs with regex
              const urlRegex = /(https?:\/\/[^\s)">]+)/g;
              const urls = contentItem.text.match(urlRegex) || [];
              
              for (const url of urls) {
                // Extract title and description from nearby text
                let title = '';
                let description = '';
                
                // Use surrounding text for context
                const textParts = contentItem.text.split(url);
                const beforeUrl = textParts[0] || '';
                const afterUrl = textParts[1] || '';
                
                // Try to find a title from text before URL
                const titleRegex = /\*\*([^*]+)\*\*|"([^"]+)"|'([^']+)'|([A-Z][a-z]+ [A-Z][a-z]+)/;
                const titleMatch = beforeUrl.match(titleRegex);
                
                if (titleMatch) {
                  // Use the first non-undefined match group
                  title = titleMatch.slice(1).find(m => m !== undefined) || '';
                }
                
                // If no title found, try to extract from URL
                if (!title) {
                  try {
                    const urlObj = new URL(url);
                    const pathSegments = urlObj.pathname.split('/').filter(s => s);
                    if (pathSegments.length > 0) {
                      // Use last path segment
                      title = pathSegments[pathSegments.length - 1]
                        .replace(/-/g, ' ')
                        .replace(/\.(html|php|asp|jsp)$/, '')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    } else {
                      // Use hostname
                      title = urlObj.hostname.replace('www.', '');
                    }
                  } catch (e) {
                    title = topicName;
                  }
                }
                
                // Extract description from text after URL
                const descRegex = /[^.!?]+[.!?]/;
                const descMatch = afterUrl.match(descRegex);
                
                if (descMatch) {
                  description = descMatch[0].trim();
                } else {
                  // Use generic description
                  description = `Information about ${topicName}`;
                }
                
                links.push({
                  url,
                  title: title || `Link about ${topicName}`,
                  description: description
                });
              }
            }
          }
        }
      }
      
      // Add topic with links to processed topics
      if (links.length > 0) {
        processedTopics.push({
          topic: topicName,
          context: topic.context || '',
          links
        });
      }
    }
    
    console.log('Extracted links:', processedTopics);
    return { processedTopics, usedMockData: false };
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Export an empty function to satisfy imports
export const processAPIResponse = () => {};
