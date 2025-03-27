
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
    
    // Process the response and extract links
    const processedTopics: ProcessedTopic[] = [];
    
    // Map topics to their processed results
    const topicMap = new Map();
    topicsFormatted.forEach(t => {
      topicMap.set(t.topic.toLowerCase(), {
        topic: t.topic,
        context: t.context || '',
        links: []
      });
    });
    
    // Find message outputs in the response
    for (const output of data.output) {
      if (output.type === 'message' && output.content && Array.isArray(output.content)) {
        for (const contentItem of output.content) {
          // Check for annotations which contain the URLs
          if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
            console.log('Found annotations:', contentItem.annotations);
            
            // Extract the full text for context
            const fullText = contentItem.text || '';
            
            // Process each annotation (URL)
            for (const annotation of contentItem.annotations) {
              if (annotation.type === 'url_citation' && annotation.url) {
                const url = annotation.url;
                let title = annotation.title || '';
                
                // If no title, try to extract from URL
                if (!title) {
                  try {
                    const urlObj = new URL(url);
                    title = urlObj.hostname.replace('www.', '');
                  } catch (e) {
                    title = 'Link';
                  }
                }
                
                // Extract description from surrounding text
                const startIndex = Math.max(0, annotation.start_index - 100);
                const endIndex = Math.min(fullText.length, annotation.end_index + 100);
                let description = fullText.substring(startIndex, endIndex).trim();
                
                // Shorten description if too long
                if (description.length > 200) {
                  description = description.substring(0, 197) + '...';
                }
                
                // Find which topic this link belongs to
                let matchedTopic = null;
                
                // First, try to find explicit topic mentions near the link
                for (const [topicKey, topicData] of topicMap.entries()) {
                  if (fullText.toLowerCase().includes(topicKey)) {
                    matchedTopic = topicData;
                    break;
                  }
                }
                
                // If no topic found, assign to the first topic (for single topic searches)
                if (!matchedTopic && topicMap.size > 0) {
                  matchedTopic = topicMap.values().next().value;
                }
                
                // Add the link to the matched topic
                if (matchedTopic) {
                  matchedTopic.links.push({
                    url,
                    title,
                    description
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Add topics with links to processed topics
    for (const topicData of topicMap.values()) {
      if (topicData.links.length > 0) {
        processedTopics.push(topicData);
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
