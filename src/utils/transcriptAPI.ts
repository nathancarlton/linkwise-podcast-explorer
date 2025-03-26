
import axios from 'axios';
import { ProcessedTopic } from '../types';
import { validateUrl } from './urlUtils';

// Sample quality mock topics when an API key isn't provided
const generateMockTopics = (transcript: string): string[] => {
  // Extract some plausible topics based on common patterns in podcasts
  const topics = [
    "Generative AI Applications",
    "Digital Transformation",
    "Healthcare Innovation",
    "AI Ethics",
    "Future of Work",
    "TechCrunch AI Coverage",
    "Harvard Business Review",
    "McKinsey Digital Research",
    "MIT Technology Review",
    "AI in Healthcare"
  ];
  
  return topics;
};

// Generate mock links when an API key isn't provided
const generateMockLinks = (topics: string[]): ProcessedTopic[] => {
  const mockTopics: ProcessedTopic[] = [
    {
      topic: "Generative AI Applications",
      context: "Discussion of how businesses are implementing generative AI for productivity gains",
      links: [
        {
          url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/tech-forward/generative-ai-a-creative-new-world",
          title: "Generative AI: A Creative New World",
          description: "McKinsey's comprehensive analysis of how generative AI is transforming business operations and creative workflows."
        }
      ]
    },
    {
      topic: "AI in Healthcare",
      context: "Exploring how AI is improving patient outcomes and healthcare operations",
      links: [
        {
          url: "https://www.nature.com/articles/s41746-020-00376-2",
          title: "Artificial intelligence in healthcare: transforming the practice of medicine",
          description: "Nature's in-depth review of AI applications in healthcare, from diagnostics to treatment planning."
        }
      ]
    },
    {
      topic: "Future of Work",
      context: "How AI and automation are reshaping career paths and workplaces",
      links: [
        {
          url: "https://hbr.org/2022/11/the-new-rules-of-work",
          title: "The New Rules of Work",
          description: "Harvard Business Review's analysis of how technological change is redefining work norms and career development."
        }
      ]
    },
    {
      topic: "AI Ethics",
      context: "Discussion about responsible AI development and governance frameworks",
      links: [
        {
          url: "https://www.ieee.org/about/corporate/governance/p7000.html",
          title: "IEEE Global Initiative on Ethics of AI Systems",
          description: "IEEE's framework for ethical considerations in autonomous and intelligent systems development."
        }
      ]
    },
    {
      topic: "TechCrunch AI Coverage",
      context: "Referenced as a source for staying current with AI industry developments",
      links: [
        {
          url: "https://techcrunch.com/category/artificial-intelligence/",
          title: "TechCrunch AI Coverage",
          description: "The latest news, analysis and developments in artificial intelligence from TechCrunch's editorial team."
        }
      ]
    },
    {
      topic: "Digital Transformation",
      context: "How organizations are implementing technology to reinvent business processes",
      links: [
        {
          url: "https://www.mckinsey.com/business-functions/mckinsey-digital/our-insights/the-digital-transformation-collection",
          title: "The Digital Transformation Collection",
          description: "McKinsey's comprehensive resource on digital transformation strategy and implementation across industries."
        }
      ]
    },
    {
      topic: "Career Development in Tech",
      context: "Advice for professionals navigating careers in rapidly evolving technology sectors",
      links: [
        {
          url: "https://www.forbes.com/sites/forbestechcouncil/2023/05/15/how-to-future-proof-your-career-in-tech/",
          title: "Future-Proofing Your Tech Career",
          description: "Expert advice from Forbes on building adaptable skills and navigating technological disruption in your career."
        }
      ]
    },
    {
      topic: "Harvard Business Review",
      context: "Referenced for research on business applications of artificial intelligence",
      links: [
        {
          url: "https://hbr.org/topic/artificial-intelligence",
          title: "HBR on Artificial Intelligence",
          description: "Harvard Business Review's collection of articles, research and case studies on AI implementation in business."
        }
      ]
    }
  ];
  
  return mockTopics;
};

// Process transcript and extract topics using OpenAI
export const processTranscript = async (transcript: string, apiKey?: string): Promise<{ topics: string[], usedMockData: boolean }> => {
  console.log('Processing transcript of length:', transcript.length);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No valid OpenAI API key provided, using mock data');
    const mockTopics = generateMockTopics(transcript);
    return { topics: mockTopics, usedMockData: true };
  }
  
  try {
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
            content: 'You are a podcast content analyzer that extracts meaningful, valuable topics with context from podcast transcripts. Focus on extracting 5-8 specific resources mentioned (books, websites, organizations) or key concepts that would be useful for listeners. For each topic, provide a brief context (20 words max) explaining why it\'s relevant to the conversation. Return ONLY a JSON array in this format: [{"topic": "specific resource name", "context": "brief explanation of why this is relevant"}]'
          },
          {
            role: 'user',
            content: `Extract 5-8 most valuable topics from this podcast transcript that listeners would want to learn more about. Focus on specific resources mentioned (books, websites, organizations) or key concepts. For each topic, provide a brief context (max 20 words) explaining what was discussed about this topic and why it's valuable:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      const mockTopics = generateMockTopics(transcript);
      return { topics: mockTopics, usedMockData: true };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenAI API');
      const mockTopics = generateMockTopics(transcript);
      return { topics: mockTopics, usedMockData: true };
    }
    
    try {
      const content = data.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      
      // Support both formats the API might return
      const topicsWithContext = parsedContent.topics || [];
      
      if (!Array.isArray(topicsWithContext) || topicsWithContext.length === 0) {
        console.error('No topics found in API response');
        const mockTopics = generateMockTopics(transcript);
        return { topics: mockTopics, usedMockData: true };
      }
      
      // Extract just the topic names for compatibility with existing code
      const topics = topicsWithContext.map(item => item.topic);
      
      console.log('Extracted topics with context:', topicsWithContext);
      return { topics, usedMockData: false };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      const mockTopics = generateMockTopics(transcript);
      return { topics: mockTopics, usedMockData: true };
    }
  } catch (error) {
    console.error('Error extracting topics:', error);
    // Fallback to mock data if API call fails
    const mockTopics = generateMockTopics(transcript);
    return { topics: mockTopics, usedMockData: true };
  }
};

// Find links for the extracted topics using OpenAI and search APIs
export const findLinksForTopics = async (topics: string[], apiKey?: string): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No valid OpenAI API key provided, using mock data');
    const mockTopics = generateMockLinks(topics);
    return { processedTopics: mockTopics, usedMockData: true };
  }
  
  try {
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
            content: 'You are an assistant that finds high-quality, specific, and authoritative links for topics mentioned in podcasts. For each topic, provide 1-2 highly relevant links with specific page URLs (not just homepage URLs), along with a brief context about what was discussed. Prioritize official sources, educational resources, and authoritative sites. Focus on finding specific pages related to the context, not just general homepages. Return ONLY a JSON array with this structure: [{"topic": string, "context": string, "links": [{"url": string, "title": string, "description": string}]}]'
          },
          {
            role: 'user',
            content: `Find specific, high-quality links for these podcast topics. For each topic, provide 1-2 links to SPECIFIC PAGES (not just homepages) that address the exact context of the topic. Use search engines to find current, working URLs for pages that specifically address each topic in its context: ${JSON.stringify(topics)}.`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      const mockTopics = generateMockLinks(topics);
      return { processedTopics: mockTopics, usedMockData: true };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenAI API');
      const mockTopics = generateMockLinks(topics);
      return { processedTopics: mockTopics, usedMockData: true };
    }
    
    try {
      const content = data.choices[0].message.content;
      console.log('Raw API response:', content);
      
      const parsedContent = JSON.parse(content);
      
      // Support different response formats from the API
      const processedTopics = parsedContent.topics || parsedContent.results || [];
      
      if (!Array.isArray(processedTopics) || processedTopics.length === 0) {
        console.error('No processed topics found in API response');
        const mockTopics = generateMockLinks(topics);
        return { processedTopics: mockTopics, usedMockData: true };
      }
      
      // Validate and filter links to ensure they're working
      const verifiedTopics: ProcessedTopic[] = [];
      
      for (const topic of processedTopics) {
        if (!topic || !topic.topic || !Array.isArray(topic.links)) {
          console.warn('Invalid topic object, skipping:', topic);
          continue;
        }
        
        const verifiedLinks = [];
        
        for (const link of topic.links) {
          if (!link || !link.url) {
            console.warn('Invalid link object, skipping:', link);
            continue;
          }
          
          try {
            // Perform server-side URL validation
            const isValid = await validateUrl(link.url);
            if (isValid) {
              verifiedLinks.push(link);
            } else {
              console.warn(`URL validation failed for ${link.url}, skipping`);
            }
          } catch (error) {
            console.warn(`Error validating URL ${link.url}, skipping:`, error);
          }
        }
        
        // Only add topics that have at least one valid link
        if (verifiedLinks.length > 0) {
          verifiedTopics.push({
            topic: topic.topic,
            context: topic.context,
            links: verifiedLinks
          });
        }
      }
      
      if (verifiedTopics.length === 0) {
        console.warn('No valid links found after verification, using mock data');
        const mockTopics = generateMockLinks(topics);
        return { processedTopics: mockTopics, usedMockData: true };
      }
      
      return { processedTopics: verifiedTopics, usedMockData: false };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      const mockTopics = generateMockLinks(topics);
      return { processedTopics: mockTopics, usedMockData: true };
    }
  } catch (error) {
    console.error('Error finding links:', error);
    // Fallback to mock data if API call fails
    const mockTopics = generateMockLinks(topics);
    return { processedTopics: mockTopics, usedMockData: true };
  }
};

// Mock functions for backward compatibility
export const mockProcessTranscript = async (transcript: string): Promise<string[]> => {
  return generateMockTopics(transcript);
};

export const mockFindLinksForTopics = async (topics: string[]): Promise<ProcessedTopic[]> => {
  return generateMockLinks(topics);
};
