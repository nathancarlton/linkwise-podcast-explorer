
import { ProcessedTopic } from '../types';
import { validateUrl } from './urlUtils';

/**
 * Find links for the extracted topics using OpenAI and web search functionality
 * 
 * @param topics - Array of topics to search links for
 * @param apiKey - OpenAI API key
 * @param domainsToAvoid - List of domains to avoid in search results
 * @returns Promise resolving to processed topics with links and whether mock data was used
 */
export const findLinksForTopics = async (
  topics: any[], 
  apiKey?: string, 
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  console.log('Domains to avoid:', domainsToAvoid);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
    console.error('No valid OpenAI API key provided. Cannot find links for topics.');
    return { processedTopics: [], usedMockData: false };
  }
  
  try {
    // Build the list of domains to avoid as a formatted string
    const domainsToAvoidStr = domainsToAvoid.length > 0 
      ? `Avoid linking to these domains: ${domainsToAvoid.join(', ')}.` 
      : '';
    
    // First, we'll use OpenAI to search for links for each topic
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
            content: `You are an assistant that finds high-quality, specific, and authoritative links for topics mentioned in podcasts.

For each topic, you'll use web search to find 2-3 highly relevant links to SPECIFIC PAGES:

Guidelines:
- Focus on quality and relevance over quantity
- Look for authoritative, reliable sources
- Ensure the links are to real, accessible content that actually exists
- Find official publisher pages for books, not just Amazon or Wikipedia links
- When books are mentioned, find the author's official site or publisher page for that specific book
- For each link, include the full URL, title, and a brief description
${domainsToAvoidStr}

Use your web search capability to find the most relevant information for each topic.`
          },
          {
            role: 'user',
            content: `Find specific, high-quality links for these podcast topics. For each topic, provide 2-3 links to SPECIFIC PAGES that address the exact context of the topic.

For any books mentioned, find their publisher pages or author websites, not retailer pages.
${domainsToAvoidStr}

Here are the topics: ${JSON.stringify(topics)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_web",
              description: "Search the web for information on a topic",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query"
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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return { processedTopics: [], usedMockData: false };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI API');
      return { processedTopics: [], usedMockData: false };
    }
    
    // Get the web search results from OpenAI
    const message = data.choices[0].message;
    
    // Process the search results to get the links
    let processedTopics: ProcessedTopic[] = [];
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Process the tool calls from OpenAI
      const toolCalls = message.tool_calls;
      
      // Now send another request to format the search results
      const formatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are an assistant that formats web search results into a structured JSON format for podcast topics. 
              Format the search results for each topic into a JSON array with this structure: 
              [{"topic": string, "context": string, "links": [{"url": string, "title": string, "description": string}]}]`
            },
            message,
            {
              role: 'user',
              content: `Based on the web search you performed, format the results into a JSON array with this structure: 
              [{"topic": string, "context": string, "links": [{"url": string, "title": string, "description": string}]}]
              
              The original topics were: ${JSON.stringify(topics)}
              
              For each topic, include 2-3 of the most relevant links from your search results. 
              For each link, include the full URL, the title of the page, and a brief description of why it's relevant.
              
              Return ONLY the JSON array.`
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!formatResponse.ok) {
        const errorData = await formatResponse.json();
        console.error('OpenAI API error during formatting:', errorData);
        return { processedTopics: [], usedMockData: false };
      }

      const formatData = await formatResponse.json();
      
      if (!formatData.choices || !formatData.choices[0] || !formatData.choices[0].message || !formatData.choices[0].message.content) {
        console.error('Invalid response format from OpenAI API during formatting');
        return { processedTopics: [], usedMockData: false };
      }
      
      try {
        const content = formatData.choices[0].message.content;
        console.log('Formatted API response:', content);
        
        const parsedContent = JSON.parse(content);
        
        // Support different response formats from the API
        const formattedTopics = Array.isArray(parsedContent) ? parsedContent : parsedContent.topics || [];
        
        if (formattedTopics.length === 0) {
          console.error('No processed topics found in API response');
          return { processedTopics: [], usedMockData: false };
        }
        
        // Validate and filter links to ensure they're high quality
        const verifiedTopics: ProcessedTopic[] = [];
        const validationPromises = [];
        
        for (const topic of formattedTopics) {
          if (!topic || !topic.topic || !Array.isArray(topic.links)) {
            console.warn('Invalid topic object, skipping:', topic);
            continue;
          }
          
          // Explicitly type the topic as ProcessedTopic to ensure TypeScript recognizes its structure
          const typedTopic = topic as ProcessedTopic;
          
          // Validate all links for a topic in parallel
          for (const link of typedTopic.links) {
            if (!link || !link.url) {
              console.warn('Invalid link object, skipping:', link);
              continue;
            }
            
            // Skip links from domains to avoid
            const linkDomain = new URL(link.url).hostname.replace('www.', '');
            const shouldSkip = domainsToAvoid.some(domain => 
              linkDomain === domain || linkDomain.endsWith('.' + domain)
            );
            
            if (shouldSkip) {
              console.warn(`Skipping link from domain to avoid: ${linkDomain}`);
              continue;
            }
            
            // Push the validation promise to our array
            validationPromises.push(
              validateUrl(link.url).then(isValid => {
                return {
                  topic: typedTopic,
                  link,
                  isValid
                };
              })
            );
          }
        }
        
        // Wait for all validation promises to resolve
        const validationResults = await Promise.all(validationPromises);
        
        // Group the validation results by topic
        const groupedResults: Record<string, ProcessedTopic> = {};
        
        validationResults.forEach(result => {
          const { topic, link, isValid } = result;
          
          if (isValid) {
            if (!groupedResults[topic.topic]) {
              groupedResults[topic.topic] = {
                topic: topic.topic,
                context: topic.context,
                links: []
              };
            }
            
            groupedResults[topic.topic].links.push(link);
          } else {
            console.warn(`Link validation failed for ${link.url}, excluding from results`);
          }
        });
        
        // Convert the grouped results to an array
        Object.values(groupedResults).forEach(groupedTopic => {
          if (groupedTopic.links.length > 0) {
            verifiedTopics.push(groupedTopic);
          }
        });
        
        return { processedTopics: verifiedTopics, usedMockData: false };
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return { processedTopics: [], usedMockData: false };
      }
    } else {
      console.error('No web search results found in OpenAI response');
      return { processedTopics: [], usedMockData: false };
    }
  } catch (error) {
    console.error('Error finding links:', error);
    return { processedTopics: [], usedMockData: false };
  }
};
