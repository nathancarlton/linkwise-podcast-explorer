
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
    
    // Responses API has a different structure
    if (!data || !data.choices || !data.choices[0]) {
      console.error('Invalid response format from OpenAI API:', data);
      return { processedTopics: [], usedMockData: false };
    }
    
    // The response object in Responses API
    const responseObject = data.choices[0];
    console.log('OpenAI response object:', responseObject);
    
    // For the Responses API, the content should be directly in the response object
    try {
      const content = responseObject.text || responseObject.message?.content || "{}";
      console.log('Processing content from response:', content);
      return await processAPIResponse(content, topicsFormatted, domainsToAvoid);
    } catch (error) {
      console.error('Error processing API response:', error);
      
      // Fallback to handling tool_calls if present
      const message = responseObject.message;
      if (message && message.tool_calls && message.tool_calls.length > 0) {
        console.log('Falling back to tool_calls processing method');
        // Handle tool calls and follow-up with additional messages
        const followUpData = await makeFollowUpRequest(message, prompt, apiKey, domainsToAvoid);
        console.log('Follow-up response data:', followUpData);
        
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
