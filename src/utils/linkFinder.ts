
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
    
    // Use more reliable sources for links
    const prompt = `Find specific, high-quality links for these podcast topics: ${JSON.stringify(topicsFormatted)}. 
    
For each topic, provide 2-3 links to SPECIFIC, RELIABLE SOURCES that address the exact context of the topic.
Focus on established publications, educational institutions, and authoritative organizations.

Recommended sources:
- Harvard Business Review (hbr.org)
- MIT Technology Review (technologyreview.com)
- Nature.com
- NIH.gov or similar government health sites
- Educational institutions (.edu domains)
- Major news publications (NYTimes, WSJ, BBC)
- Professional organizations like IEEE or ACM

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
      return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from OpenAI API');
      return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
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
              content: prompt
            },
            message,
            ...followUpMessages,
            {
              role: 'user',
              content: `Based on the search results, please provide me with 2-3 highly relevant links for each topic in the JSON format requested. Remember to avoid using links from: ${domainsToAvoid.join(', ')}.

MOST IMPORTANT: Only include links that are likely to be valid and accessible. Focus on major, established websites and publications rather than speculative or hard-to-validate sources.`
            }
          ],
          response_format: { type: "json_object" }
        })
      });
      
      if (!followUpResponse.ok) {
        console.error('OpenAI API error during follow-up:', await followUpResponse.json());
        return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
      }
      
      const followUpData = await followUpResponse.json();
      
      if (!followUpData.choices || !followUpData.choices[0] || !followUpData.choices[0].message) {
        console.error('Invalid response format from OpenAI API follow-up');
        return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
      }
      
      const content = followUpData.choices[0].message.content;
      console.log('Follow-up response content:', content);
      
      try {
        const parsedContent = JSON.parse(content);
        const formattedTopics = parsedContent.topics || [];
        
        if (formattedTopics.length === 0) {
          console.error('No processed topics found in API follow-up response');
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
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
          
          // Create a new topic object with validated links
          const processedTopic: ProcessedTopic = {
            topic: typedTopic.topic,
            context: typedTopic.context || '',
            links: []
          };
          
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
                    topic: processedTopic,
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
          
          // Add the topic to our verified topics list
          if (typedTopic.links.length > 0) {
            verifiedTopics.push(processedTopic);
          }
        }
        
        // Wait for all validation promises to resolve
        const validationResults = await Promise.all(validationPromises);
        
        // Add validated links to the appropriate topics
        validationResults.forEach(result => {
          const { topic, link, isValid } = result;
          
          if (isValid) {
            topic.links.push(link);
          } else {
            console.warn(`Link validation failed for ${link.url}, excluding from results`);
          }
        });
        
        // Filter out topics without valid links
        const topicsWithLinks = verifiedTopics.filter(topic => topic.links.length > 0);
        
        // If we have no valid links, fall back to pre-defined links
        if (topicsWithLinks.length === 0) {
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
        }
        
        return { processedTopics: topicsWithLinks, usedMockData: false };
      } catch (parseError) {
        console.error('Error parsing follow-up API response:', parseError);
        return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
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
          
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
        }
        
        // Support different response formats from the API
        const formattedTopics = Array.isArray(parsedContent) ? parsedContent : parsedContent.topics || [];
        
        if (formattedTopics.length === 0) {
          console.error('No processed topics found in API response');
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
        }
        
        // Validate and filter links
        const verifiedTopics: ProcessedTopic[] = [];
        
        for (const topic of formattedTopics) {
          if (!topic || !topic.topic || !Array.isArray(topic.links)) {
            console.warn('Invalid topic object, skipping:', topic);
            continue;
          }
          
          const processedTopic: ProcessedTopic = {
            topic: topic.topic,
            context: topic.context || '',
            links: []
          };
          
          // Add valid links
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
              processedTopic.links.push(link);
            } catch (urlError) {
              console.warn(`Invalid URL format: ${link.url}`);
              continue;
            }
          }
          
          if (processedTopic.links.length > 0) {
            verifiedTopics.push(processedTopic);
          }
        }
        
        // If we have no topics with links, fall back to our hardcoded links
        if (verifiedTopics.length === 0) {
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
        }
        
        // Now validate all URLs in parallel
        const validationPromises = [];
        const topicsWithValidatedLinks: ProcessedTopic[] = [];
        
        for (const topic of verifiedTopics) {
          const processedTopic: ProcessedTopic = {
            topic: topic.topic,
            context: topic.context,
            links: []
          };
          
          topicsWithValidatedLinks.push(processedTopic);
          
          for (const link of topic.links) {
            validationPromises.push(
              validateUrl(link.url).then(isValid => ({
                topic: processedTopic,
                link,
                isValid
              }))
            );
          }
        }
        
        const validationResults = await Promise.all(validationPromises);
        
        // Add validated links to the appropriate topics
        validationResults.forEach(result => {
          const { topic, link, isValid } = result;
          
          if (isValid) {
            topic.links.push(link);
          } else {
            console.warn(`Link validation failed for ${link.url}, excluding from results`);
          }
        });
        
        // Filter out topics without valid links
        const finalTopics = topicsWithValidatedLinks.filter(topic => topic.links.length > 0);
        
        // If we still have no valid links, use fallback
        if (finalTopics.length === 0) {
          return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
        }
        
        return { processedTopics: finalTopics, usedMockData: false };
      } catch (error) {
        console.error('Error processing direct API response:', error);
        return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
      }
    }
  } catch (error) {
    console.error('Error finding links:', error);
    return { processedTopics: generateFallbackLinks(topicsFormatted), usedMockData: true };
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

/**
 * Generate fallback links when OpenAI or validation fails
 */
const generateFallbackLinks = (topics: any[]): ProcessedTopic[] => {
  const fallbackLinks: ProcessedTopic[] = [];
  
  // Map of reliable fallback links for common topic categories
  const fallbackMap: Record<string, Array<{url: string, title: string, description: string}>> = {
    'AI': [
      {
        url: 'https://ai.google/research/',
        title: 'Google AI Research',
        description: 'Research and publications on artificial intelligence from Google.'
      },
      {
        url: 'https://openai.com/research/',
        title: 'OpenAI Research',
        description: 'Latest research and papers on AI technologies and applications.'
      }
    ],
    'Healthcare': [
      {
        url: 'https://www.mayoclinic.org/digital-medicine',
        title: 'Mayo Clinic Digital Health',
        description: 'Information on digital technology in healthcare and medicine.'
      },
      {
        url: 'https://health.harvard.edu/blog/artificial-intelligence-in-health-care-202104222464',
        title: 'AI in Healthcare - Harvard Health',
        description: 'Exploration of AI applications in modern healthcare.'
      }
    ],
    'Business': [
      {
        url: 'https://hbr.org/topic/digital-transformation',
        title: 'Digital Transformation - Harvard Business Review',
        description: 'Articles about digital transformation in business and organizations.'
      },
      {
        url: 'https://sloanreview.mit.edu/big-ideas/artificial-intelligence-business-strategy/',
        title: 'AI and Business Strategy - MIT Sloan',
        description: 'Research on the intersection of AI and business strategy.'
      }
    ],
    'Cancer': [
      {
        url: 'https://www.cancer.gov/research/areas/ai',
        title: 'AI in Cancer Research - National Cancer Institute',
        description: 'Information on AI applications in cancer research and treatment.'
      },
      {
        url: 'https://www.mayoclinic.org/diseases-conditions/cancer/diagnosis-treatment/drc-20370594',
        title: 'Cancer Treatment - Mayo Clinic',
        description: 'Overview of cancer diagnosis and treatment approaches.'
      }
    ],
    'Marketing': [
      {
        url: 'https://hbr.org/topic/marketing',
        title: 'Marketing - Harvard Business Review',
        description: 'Articles and research on marketing strategies and trends.'
      },
      {
        url: 'https://www.thinkwithgoogle.com/',
        title: 'Think with Google',
        description: 'Marketing insights and digital trends from Google.'
      }
    ]
  };
  
  // Process each topic and assign relevant fallback links
  for (const topicObj of topics) {
    const topic = typeof topicObj === 'string' ? topicObj : topicObj.topic;
    const context = typeof topicObj === 'string' ? '' : (topicObj.context || '');
    
    // Find the most appropriate category for the topic
    let bestCategory = 'AI'; // Default category
    let bestScore = 0;
    
    for (const category of Object.keys(fallbackMap)) {
      // Calculate simple relevance score based on keyword presence
      let score = 0;
      if (topic.toLowerCase().includes(category.toLowerCase())) score += 3;
      if (context.toLowerCase().includes(category.toLowerCase())) score += 2;
      
      // Check for related keywords
      const relatedKeywords: Record<string, string[]> = {
        'AI': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'generative'],
        'Healthcare': ['health', 'medical', 'doctor', 'patient', 'hospital', 'clinical'],
        'Business': ['strategy', 'company', 'enterprise', 'leadership', 'executive', 'organization'],
        'Cancer': ['oncology', 'tumor', 'clinical trial', 'drug discovery', 'treatment'],
        'Marketing': ['sales', 'advertising', 'customer', 'brand', 'promotion', 'market']
      };
      
      for (const keyword of relatedKeywords[category] || []) {
        if (topic.toLowerCase().includes(keyword)) score += 1;
        if (context.toLowerCase().includes(keyword)) score += 0.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // Create processed topic with fallback links from the best category
    fallbackLinks.push({
      topic,
      context,
      links: fallbackMap[bestCategory]
    });
  }
  
  return fallbackLinks;
};
