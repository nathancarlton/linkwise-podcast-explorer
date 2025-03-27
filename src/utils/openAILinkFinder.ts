
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
    
    // Build the user prompt for OpenAI
    const prompt = buildUserPrompt(topicsFormatted, domainsToAvoid);
    console.log('Sending request to OpenAI with web_search tool using responses API');
    
    // Make the initial request to OpenAI API
    const data = await makeInitialRequest(apiKey, prompt, domainsToAvoid);
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI API');
      return { processedTopics: [], usedMockData: false };
    }
    
    // Process the search results
    const message = data.choices[0].message;
    console.log('OpenAI response:', message);
    
    // The responses API handles web search differently than the chat completions API
    // The relevant links should already be in the message content
    try {
      const content = message.content || "{}";
      return await processAPIResponse(content, topicsFormatted, domainsToAvoid);
    } catch (error) {
      console.error('Error processing API response:', error);
      
      // If there are tool_calls in the response, fallback to the old method
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Handle tool calls and follow-up with additional messages
        const followUpData = await makeFollowUpRequest(message, prompt, apiKey, domainsToAvoid);
        
        if (!followUpData.choices || !followUpData.choices[0] || !followUpData.choices[0].message) {
          console.error('Invalid response format from OpenAI API follow-up');
          return { processedTopics: [], usedMockData: false };
        }
        
        const content = followUpData.choices[0].message.content;
        console.log('Follow-up response content:', content);
        
        return await processAPIResponse(content, topicsFormatted, domainsToAvoid);
      }
      
      return { processedTopics: [], usedMockData: false };
    }
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Re-export the processAPIResponse function
export { processAPIResponse };
