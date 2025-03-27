
/**
 * Functions for making requests to the OpenAI API
 */
import { getOpenAIHeaders, buildSystemPrompt, buildUserPrompt } from './openAIConfig';

/**
 * Make the initial OpenAI API request with web search
 * 
 * @param apiKey OpenAI API key
 * @param prompt User prompt
 * @param domainsToAvoid Domains to exclude from results
 * @returns Promise resolving to API response
 */
export const makeInitialRequest = async (
  apiKey: string,
  prompt: string,
  domainsToAvoid: string[] = []
): Promise<any> => {
  console.log('Making request to OpenAI Responses API with correct parameters');
  
  // Build the system prompt
  const systemPrompt = buildSystemPrompt(domainsToAvoid);
  console.log('System prompt:', systemPrompt);
  console.log('User prompt:', prompt);
  
  try {
    // Use the Responses API for web search
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ 
          type: "web_search_preview"
        }],
        input: prompt,
        instructions: systemPrompt,
        max_output_tokens: 2000 // Increased for multiple topics
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error making initial request to OpenAI:', error);
    throw error;
  }
};
