
import { ProcessedTopic } from '../types';
import { extractLinksFromText } from './textExtractor';
import { validateTopicLinks } from './linkValidation';

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
    // Build the list of domains to avoid as a formatted string
    const domainsToAvoidStr = domainsToAvoid.length > 0 
      ? `Avoid linking to these domains: ${domainsToAvoid.join(', ')}.` 
      : '';
    
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
    
    const prompt = `Find specific, high-quality links for these podcast topics: ${JSON.stringify(topicsFormatted)}. 
    
For each topic, provide 2-3 links to SPECIFIC SOURCES that address the exact context of the topic.
Focus on established publications and authoritative organizations.

For any books mentioned, find their publisher pages or author websites.
${domainsToAvoidStr}

For each link, include:
- The full URL (must be real and working)
- A clear title
- A brief description explaining the relevance to the topic`;

    console.log('Sending request to OpenAI with web_search tool');
    
    // Using OpenAI API with web search capabilities
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an assistant that finds high-quality, specific links for topics mentioned in podcasts.

Your task is to search for reliable, authoritative sources related to each topic and provide:
1. Only links that currently exist and are accessible
2. Content from established publications and trustworthy sources
3. Specific pages that directly address the topic (not just homepages)

For books, find official publisher or author pages.
${domainsToAvoidStr}

Use the search_web function to find information, then format your final response as a JSON object.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_web",
              description: "Search the web for information relevant to the user's request",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to use"
                  }
                },
                required: ["query"]
              }
            }
          }
        ],
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.json());
      return { processedTopics: [], usedMockData: false };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI API');
      return { processedTopics: [], usedMockData: false };
    }
    
    // Process the search results
    const message = data.choices[0].message;
    console.log('OpenAI response:', message);
    
    // Check for tool_calls in the response
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Handle tool calls and follow-up with additional messages
      const searchQueries = [];
      const toolCallIds = [];
      
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
      
      // Simulate web search results (would normally call an actual search API)
      const searchResults = await Promise.all(
        searchQueries.map(async (query) => {
          // In a real implementation, you would call an actual search API here
          return `Search results for: ${query}\n\nFound some relevant links for this topic.`;
        })
      );
      
      // Build follow-up messages with search results
      const followUpMessages = message.tool_calls.map((toolCall, index) => ({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: 'search_web',
        content: searchResults[index] || 'No results found'
      }));
      
      // Send follow-up request with search results
      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an assistant that finds high-quality, specific, and authoritative links for topics mentioned in podcasts.
              
Format your response as a simple JSON with this exact structure:
{
  "topics": [
    {
      "topic": "The topic name",
      "context": "The context of the topic",
      "links": [
        {
          "url": "https://example.com/specific-page",
          "title": "Title of the webpage",
          "description": "Brief description of why this link is relevant"
        }
      ]
    }
  ]
}`
            },
            {
              role: 'user',
              content: prompt
            },
            message,
            ...followUpMessages,
            {
              role: 'user',
              content: `Based on the search results, please provide me with 2-3 highly relevant links for each topic in the JSON format requested. Remember to avoid using links from: ${domainsToAvoid.join(', ')}.

MOST IMPORTANT: Only include links that are likely to be valid and accessible. Focus on established websites and publications.`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!followUpResponse.ok) {
        console.error('OpenAI API error during follow-up:', await followUpResponse.json());
        return { processedTopics: [], usedMockData: false };
      }
      
      const followUpData = await followUpResponse.json();
      
      if (!followUpData.choices || !followUpData.choices[0] || !followUpData.choices[0].message) {
        console.error('Invalid response format from OpenAI API follow-up');
        return { processedTopics: [], usedMockData: false };
      }
      
      const content = followUpData.choices[0].message.content;
      console.log('Follow-up response content:', content);
      
      return await processAPIResponse(content, topicsFormatted, domainsToAvoid);
    } else {
      // If no tool calls were made, try to extract links directly from the content
      try {
        const content = message.content || "{}";
        return await processAPIResponse(content, topicsFormatted, domainsToAvoid);
      } catch (error) {
        console.error('Error processing direct API response:', error);
        return { processedTopics: [], usedMockData: false };
      }
    }
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

/**
 * Process API response and validate links
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
