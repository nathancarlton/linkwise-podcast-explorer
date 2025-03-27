
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
    
    // Prepare a clean user message with just the necessary information
    const userMessage = `Find specific, high-quality links for these podcast topics: ${JSON.stringify(topicsFormatted)}. 
    
For each topic, provide 2-3 links to SPECIFIC PAGES that address the exact context of the topic.
For any books mentioned, find their publisher pages or author websites, not retailer pages.
${domainsToAvoidStr}`;

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
            content: `You are an assistant that finds high-quality, specific, and authoritative links for topics mentioned in podcasts.

For each topic, find 2-3 highly relevant links to SPECIFIC PAGES:

Guidelines:
- Focus on quality and relevance over quantity
- Look for authoritative, reliable sources
- Ensure the links are to real, accessible content that actually exists
- Find official publisher pages for books, not just retail sites
- When books are mentioned, find the author's official site or publisher page for that specific book
- For each link, include the full URL, title, and a brief description
${domainsToAvoidStr}`
          },
          {
            role: 'user',
            content: userMessage
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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
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
      
      // Simulate web search results for now (would normally call an actual search API)
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
              content: userMessage
            },
            message,
            ...followUpMessages,
            {
              role: 'user',
              content: `Based on the search results, please provide me with 2-3 highly relevant links for each topic in the JSON format requested. Remember to avoid using links from: ${domainsToAvoid.join(', ')}.`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!followUpResponse.ok) {
        const errorData = await followUpResponse.json();
        console.error('OpenAI API error during follow-up:', errorData);
        return { processedTopics: [], usedMockData: false };
      }
      
      const followUpData = await followUpResponse.json();
      
      if (!followUpData.choices || !followUpData.choices[0] || !followUpData.choices[0].message) {
        console.error('Invalid response format from OpenAI API follow-up');
        return { processedTopics: [], usedMockData: false };
      }
      
      const content = followUpData.choices[0].message.content;
      console.log('Follow-up response content:', content);
      
      try {
        const parsedContent = JSON.parse(content);
        const formattedTopics = parsedContent.topics || [];
        
        if (formattedTopics.length === 0) {
          console.error('No processed topics found in API follow-up response');
          return { processedTopics: [], usedMockData: false };
        }
        
        // Validate and filter links
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
            
            try {
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
            } catch (urlError) {
              console.warn(`Invalid URL format: ${link.url}`);
              continue;
            }
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
        console.error('Error parsing follow-up API response:', parseError);
        return { processedTopics: [], usedMockData: false };
      }
    } else {
      // If no tool calls were made, try to extract links directly from the content
      try {
        const content = message.content || "{}";
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
        
        // Validate and filter links
        const verifiedTopics: ProcessedTopic[] = [];
        
        for (const topic of formattedTopics) {
          if (!topic || !topic.topic || !Array.isArray(topic.links)) {
            console.warn('Invalid topic object, skipping:', topic);
            continue;
          }
          
          const validLinks = [];
          
          for (const link of topic.links) {
            if (!link || !link.url) {
              console.warn('Invalid link object, skipping:', link);
              continue;
            }
            
            try {
              // Skip links from domains to avoid
              const linkDomain = new URL(link.url).hostname.replace('www.', '');
              const shouldSkip = domainsToAvoid.some(domain => 
                linkDomain === domain || linkDomain.endsWith('.' + domain)
              );
              
              if (shouldSkip) {
                console.warn(`Skipping link from domain to avoid: ${linkDomain}`);
                continue;
              }
              
              // Add to valid links (will be validated later)
              validLinks.push(link);
            } catch (urlError) {
              console.warn(`Invalid URL format: ${link.url}`);
              continue;
            }
          }
          
          if (validLinks.length > 0) {
            verifiedTopics.push({
              topic: topic.topic,
              context: topic.context,
              links: validLinks
            });
          }
        }
        
        // Now validate all URLs in parallel
        const validationPromises = [];
        
        for (const topic of verifiedTopics) {
          for (const link of topic.links) {
            validationPromises.push(
              validateUrl(link.url).then(isValid => ({
                topic,
                link,
                isValid
              }))
            );
          }
        }
        
        const validationResults = await Promise.all(validationPromises);
        
        // Rebuild the topics with only valid links
        const finalTopics: Record<string, ProcessedTopic> = {};
        
        validationResults.forEach(result => {
          const { topic, link, isValid } = result;
          
          if (isValid) {
            if (!finalTopics[topic.topic]) {
              finalTopics[topic.topic] = {
                topic: topic.topic,
                context: topic.context,
                links: []
              };
            }
            
            finalTopics[topic.topic].links.push(link);
          }
        });
        
        const processedTopics = Object.values(finalTopics)
          .filter(topic => topic.links.length > 0);
        
        return { processedTopics, usedMockData: false };
      } catch (error) {
        console.error('Error processing direct API response:', error);
        return { processedTopics: [], usedMockData: false };
      }
    }
  } catch (error) {
    console.error('Error finding links:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

/**
 * Helper function to extract links from text response when JSON parsing fails
 */
const extractLinksFromText = (text: string, topics: string[]): ProcessedTopic[] => {
  const extractedTopics: ProcessedTopic[] = [];
  
  // Simple regex to find URLs in text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlMatches = text.match(urlRegex) || [];
  
  if (urlMatches.length === 0) {
    return extractedTopics;
  }
  
  // Try to associate URLs with topics
  const topicParagraphs = text.split(/\n\n|\r\n\r\n/);
  
  for (const paragraph of topicParagraphs) {
    // Find which topic this paragraph is about
    const matchedTopic = topics.find(topic => 
      paragraph.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (!matchedTopic) continue;
    
    // Extract URLs from this paragraph
    const paragraphUrls = paragraph.match(urlRegex) || [];
    
    if (paragraphUrls.length === 0) continue;
    
    // Create links for this topic
    const links = paragraphUrls.map(url => {
      // Extract a title from the text around the URL
      const urlIndex = paragraph.indexOf(url);
      const surroundingText = paragraph.substring(
        Math.max(0, urlIndex - 50), 
        Math.min(paragraph.length, urlIndex + url.length + 50)
      );
      
      // Try to extract a sensible title
      let title = matchedTopic;
      const titleMatch = surroundingText.match(/["']([^"']+)["']/) || 
                         surroundingText.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
      
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      return {
        url,
        title: title || 'Related resource',
        description: 'Link related to ' + matchedTopic
      };
    });
    
    // Add to extracted topics
    extractedTopics.push({
      topic: matchedTopic,
      context: paragraph.substring(0, 150) + '...',
      links
    });
  }
  
  return extractedTopics;
};
