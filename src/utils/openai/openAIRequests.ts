
/**
 * Functions for making requests to the OpenAI API
 */
import { getOpenAIHeaders, buildSystemPrompt, buildUserPrompt, buildFollowUpMessage } from './openAIConfig';

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
        tools: [{ type: "web_search" }],
        input: prompt,
        instructions: systemPrompt
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

/**
 * Process search tool calls and make follow-up request
 * 
 * @param message OpenAI API response message
 * @param prompt Original user prompt
 * @param apiKey OpenAI API key
 * @param domainsToAvoid Domains to exclude from results
 * @returns Promise resolving to follow-up API response
 */
export const makeFollowUpRequest = async (
  message: any,
  prompt: string,
  apiKey: string,
  domainsToAvoid: string[] = []
): Promise<any> => {
  // Extract search queries and tool call IDs
  const searchQueries: string[] = [];
  const toolCallIds: string[] = [];
  
  for (const toolCall of message.tool_calls) {
    if (toolCall.function && toolCall.function.name === 'search_web') {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        searchQueries.push(args.query);
        toolCallIds.push(toolCall.id);
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }
  }
  
  // Simulate web search results
  const searchResults = await Promise.all(
    searchQueries.map(async (query) => {
      // In a real implementation, you would call an actual search API here
      return `Search results for: ${query}\n\nFound some relevant links for this topic.`;
    })
  );
  
  // Build follow-up messages with search results
  const followUpMessages = message.tool_calls.map((toolCall: any, index: number) => ({
    tool_call_id: toolCall.id,
    role: 'tool',
    name: 'search_web',
    content: searchResults[index] || 'No results found'
  }));
  
  console.log('Sending follow-up request to OpenAI');
  
  try {
    // For the follow-up request, use chat completions API
    // Important: We can't use JSON format with web search
    const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: getOpenAIHeaders(apiKey),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildSystemPrompt(domainsToAvoid) },
          { role: 'user', content: prompt },
          message,
          ...followUpMessages,
          { role: 'user', content: buildFollowUpMessage(domainsToAvoid) }
        ]
      })
    });
    
    if (!followUpResponse.ok) {
      const errorData = await followUpResponse.json();
      console.error('OpenAI API error during follow-up:', errorData);
      throw new Error(`OpenAI API error during follow-up: ${followUpResponse.status}`);
    }
    
    return await followUpResponse.json();
  } catch (error) {
    console.error('Error making follow-up request to OpenAI:', error);
    throw error;
  }
};
