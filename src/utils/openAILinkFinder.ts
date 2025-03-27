
import { ProcessedTopic } from '../types';
import { makeInitialRequest, makeFollowUpRequest } from './openai/openAIRequests';
import { processAPIResponse } from './openai/openAIResponseProcessor';
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
    console.log('Sending request to OpenAI with web_search tool using responses API');
    
    // Make the initial request to OpenAI API
    const data = await makeInitialRequest(apiKey, prompt, domainsToAvoid);
    
    console.log('Received response from OpenAI:', data);
    
    // The Responses API returns a different structure
    if (!data || !data.output) {
      console.error('Invalid response format from OpenAI API:', data);
      return { processedTopics: [], usedMockData: false };
    }
    
    // Process output from the Responses API
    try {
      // The output array contains message objects
      const output = data.output;
      console.log('Processing output from Responses API:', output);
      
      // Extract all links from the output
      const processedTopics: ProcessedTopic[] = [];
      
      // Process each topic from our input
      for (const topic of topicsFormatted) {
        const topicName = topic.topic;
        const links = [];
        
        // Go through each output message looking for links related to this topic
        for (const message of output) {
          if (message.content) {
            // Try to extract URLs from the content
            const urlRegex = /https?:\/\/[^\s)]+/g;
            const urls = message.content.match(urlRegex) || [];
            
            // Create a basic link object for each URL found
            for (const url of urls) {
              // Try to extract a title from the context
              const titleMatch = message.content.match(new RegExp(`\\[([^\\]]+)\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`));
              const title = titleMatch ? titleMatch[1] : url;
              
              // Create a description from the surrounding text
              const contentFragments = message.content.split(url);
              let description = '';
              
              if (contentFragments.length > 1) {
                // Get text after the URL, limited to 150 chars
                description = contentFragments[1].slice(0, 150).trim();
                
                // Clean up markdown and punctuation at the start
                description = description.replace(/^[):\s\-\n]+/, '').trim();
                
                // If description is empty, try to get text before the URL
                if (!description && contentFragments[0]) {
                  // Get the last 150 chars before the URL
                  const beforeText = contentFragments[0].slice(-150).trim();
                  description = beforeText.replace(/[\s\-\n]+$/, '').trim();
                }
              }
              
              links.push({
                url,
                title: title || 'Link to ' + topicName,
                description: description || `Resource related to ${topicName}`
              });
            }
          }
        }
        
        if (links.length > 0) {
          processedTopics.push({
            topic: topicName,
            context: topic.context || '',
            links
          });
        }
      }
      
      console.log('Extracted links from Responses API:', processedTopics);
      return { processedTopics, usedMockData: false };
    } catch (error) {
      console.error('Error processing Responses API output:', error);
      return { processedTopics: [], usedMockData: false };
    }
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Re-export the processAPIResponse function
export { processAPIResponse };
