import axios from 'axios';
import { ProcessedTopic } from '../types';
import { validateUrl } from './urlUtils';

// Sample quality mock topics when an API key isn't provided
const generateMockTopics = (transcript: string): string[] => {
  // Extract some plausible topics based on common patterns in podcasts
  const topics = [
    "Generative AI Applications",
    "Digital Transformation in Healthcare",
    "Harvard Business Review",
    "McKinsey Research on AI",
    "AI Ethics",
    "Future of Work",
    "AI in Drug Discovery",
    "Consumer-Centric Healthcare"
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
          url: "https://hbr.org/2023/01/how-generative-ai-is-changing-creative-work",
          title: "How Generative AI Is Changing Creative Work",
          description: "Harvard Business Review's analysis of generative AI's impact on creative professions and business operations."
        }
      ]
    },
    {
      topic: "Digital Transformation in Healthcare",
      context: "Highlighted the ongoing changes in healthcare due to digital technologies",
      links: [
        {
          url: "https://www.mckinsey.com/industries/healthcare/our-insights/the-future-of-healthcare-digital-transformation",
          title: "The Future of Healthcare: Digital Transformation",
          description: "McKinsey's insights on how digital transformation is reshaping healthcare delivery and patient engagement."
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
    },
    {
      topic: "McKinsey Research on AI",
      context: "Cited for insights on AI adoption across industries",
      links: [
        {
          url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/global-survey-the-state-of-ai-in-2023",
          title: "The State of AI in 2023",
          description: "McKinsey's comprehensive global survey on AI adoption, implementation challenges, and business impact."
        }
      ]
    },
    {
      topic: "AI Ethics",
      context: "Discussion about responsible AI development and governance frameworks",
      links: [
        {
          url: "https://www.nature.com/articles/s41586-023-06506-6",
          title: "Building human-centered AI systems",
          description: "Nature's analysis of developing AI systems that align with human values and ethical principles."
        }
      ]
    },
    {
      topic: "Future of Work",
      context: "How AI and automation are reshaping career paths and workplaces",
      links: [
        {
          url: "https://www.mckinsey.com/featured-insights/future-of-work",
          title: "Future of Work - McKinsey Insights",
          description: "McKinsey's research on how technology is transforming work, workforce needs, and workplace environments."
        }
      ]
    },
    {
      topic: "AI in Drug Discovery",
      context: "Exploration of AI's role in accelerating pharmaceutical development",
      links: [
        {
          url: "https://www.nature.com/articles/s41573-019-0024-x",
          title: "Artificial intelligence in drug discovery",
          description: "Nature Reviews Drug Discovery's comprehensive overview of AI applications in pharmaceutical research."
        }
      ]
    },
    {
      topic: "Consumer-Centric Healthcare",
      context: "The shift toward patient-centered care models and experiences",
      links: [
        {
          url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6685149/",
          title: "Patient-Centered Care: What It Means and How to Get There",
          description: "Research examining the implementation and impact of consumer-centric healthcare delivery models."
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
