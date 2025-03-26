
import { ProcessedTopic } from '../types';
import { isValidUrl } from './urlValidator';
import axios from 'axios';

// Process transcript and extract topics using OpenAI
export const processTranscript = async (transcript: string, apiKey?: string): Promise<{ topics: string[], usedMockData: boolean }> => {
  console.log('Processing transcript of length:', transcript.length);
  
  if (!apiKey || apiKey.trim() === '') {
    console.warn('No API key provided, using mock data');
    // If no API key or empty API key, return mock data for demonstration
    const mockTopics = await mockProcessTranscript(transcript);
    return { topics: mockTopics, usedMockData: true };
  }
  
  // Validate API key format
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.error('Invalid API key format');
    const mockTopics = await mockProcessTranscript(transcript);
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
            content: 'You are an assistant that extracts meaningful topics from podcast transcripts. Focus on extracting 5-10 specific resources mentioned in the transcript like books, websites, organizations, or key concepts that would be useful for the podcast audience. Return ONLY a JSON array of topic strings with no additional text.'
          },
          {
            role: 'user',
            content: `Extract 5-10 meaningful topics from this podcast transcript that would benefit the listeners. Focus on specific resources mentioned (books, websites, organizations) or key concepts. Prioritize resources that listeners might want to look up after the show:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      const mockTopics = await mockProcessTranscript(transcript);
      return { topics: mockTopics, usedMockData: true };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenAI API');
      const mockTopics = await mockProcessTranscript(transcript);
      return { topics: mockTopics, usedMockData: true };
    }
    
    try {
      const content = data.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      
      // Support both formats the API might return
      const topics = parsedContent.topics || [];
      
      if (!Array.isArray(topics) || topics.length === 0) {
        console.error('No topics found in API response');
        const mockTopics = await mockProcessTranscript(transcript);
        return { topics: mockTopics, usedMockData: true };
      }
      
      console.log('Extracted topics:', topics);
      return { topics, usedMockData: false };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      const mockTopics = await mockProcessTranscript(transcript);
      return { topics: mockTopics, usedMockData: true };
    }
  } catch (error) {
    console.error('Error extracting topics:', error);
    // Fallback to mock data if API call fails
    const mockTopics = await mockProcessTranscript(transcript);
    return { topics: mockTopics, usedMockData: true };
  }
};

// Server-side URL validation function
const validateUrl = async (url: string): Promise<boolean> => {
  try {
    if (!isValidUrl(url)) {
      return false;
    }
    
    // Use axios to check if the URL actually exists and returns a valid response
    const response = await axios.head(url, { 
      timeout: 5000,
      validateStatus: (status) => status < 400 // Consider any status less than 400 as valid
    });
    
    return true;
  } catch (error) {
    console.warn(`URL validation failed for ${url}:`, error);
    return false;
  }
};

// Find links for the extracted topics using OpenAI
export const findLinksForTopics = async (topics: string[], apiKey?: string): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  
  if (!apiKey || apiKey.trim() === '') {
    console.warn('No API key provided, using mock data');
    // If no API key or empty API key, return mock data for demonstration
    const mockTopics = await mockFindLinksForTopics(topics);
    return { processedTopics: mockTopics, usedMockData: true };
  }
  
  // Validate API key format
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.error('Invalid API key format');
    const mockTopics = await mockFindLinksForTopics(topics);
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
            content: 'You are an assistant that finds high-quality, authoritative links for topics mentioned in podcasts. For each topic, provide 1-3 high-quality links with titles and descriptions. For books, find publisher pages. For organizations, find official websites. Avoid Wikipedia, Amazon, and search results. Use real, working URLs that are directly related to the topic. Return ONLY a JSON array with the structure: [{"topic": string, "links": [{"url": string, "title": string, "description": string}]}]'
          },
          {
            role: 'user',
            content: `Find real, working links for these topics mentioned in a podcast: ${JSON.stringify(topics)}. For each topic, provide 1-3 reliable links with titles and descriptions. Prioritize official sources that are guaranteed to be working. Focus on well-known sites, not obscure domains that might be down. Make sure all URLs are valid, up-to-date and directly related to the topics.`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      const mockTopics = await mockFindLinksForTopics(topics);
      return { processedTopics: mockTopics, usedMockData: true };
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response format from OpenAI API');
      const mockTopics = await mockFindLinksForTopics(topics);
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
        const mockTopics = await mockFindLinksForTopics(topics);
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
            links: verifiedLinks
          });
        }
      }
      
      if (verifiedTopics.length === 0) {
        console.warn('No valid links found after verification, using mock data');
        const mockTopics = await mockFindLinksForTopics(topics);
        return { processedTopics: mockTopics, usedMockData: true };
      }
      
      return { processedTopics: verifiedTopics, usedMockData: false };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      const mockTopics = await mockFindLinksForTopics(topics);
      return { processedTopics: mockTopics, usedMockData: true };
    }
  } catch (error) {
    console.error('Error finding links:', error);
    // Fallback to mock data if API call fails
    const mockTopics = await mockFindLinksForTopics(topics);
    return { processedTopics: mockTopics, usedMockData: true };
  }
};

// Parse user-provided links in the format "topic: url"
export const parseUserProvidedLinks = (text: string): ProcessedTopic[] => {
  // Check if text contains the pattern of "topic: url"
  if (!text.includes(':')) {
    return [];
  }

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const topicMap = new Map<string, Set<string>>();
  
  // Extract topics and URLs
  lines.forEach(line => {
    const match = line.match(/^(.*?):\s*(https?:\/\/[^\s]+)$/);
    if (match) {
      const topic = match[1].trim();
      const url = match[2].trim();
      
      if (!topicMap.has(topic)) {
        topicMap.set(topic, new Set());
      }
      
      topicMap.get(topic)?.add(url);
    }
  });
  
  // Convert to ProcessedTopic format
  const processedTopics: ProcessedTopic[] = [];
  topicMap.forEach((urls, topic) => {
    const links = Array.from(urls).map(url => {
      // Generate a title based on URL and topic
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const path = urlObj.pathname.split('/').filter(Boolean).join(' ');
      const title = path 
        ? `${topic} - ${path.charAt(0).toUpperCase() + path.slice(1)}` 
        : `${topic} - Official Resource`;
      
      return {
        url,
        title,
        description: `Resource about ${topic} from ${domain}`,
      };
    });
    
    processedTopics.push({
      topic,
      links,
    });
  });
  
  return processedTopics;
};

// Mock implementation for fallback or demo purposes
const mockProcessTranscript = (transcript: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate finding topics in transcript
      // Detect book mentions, websites, organizations
      const lines = transcript.split('\n');
      const potentialTopics = new Set<string>();
      
      // Simple pattern matching for demonstration
      // Look for patterns like "book called X", "website Y", "organization Z"
      const patterns = [
        /book (?:called|titled|named) ["']([^"']+)["']/gi,
        /(?:website|site|blog) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:organization|foundation|association) (?:called|named) ["']?([A-Za-z0-9\s.]+)["']?/gi,
        /(?:I recommend|check out|visit) ["']?([A-Za-z0-9\s.]+\.[a-z]{2,})["']?/gi,
      ];
      
      // Process each line for mentions
      lines.forEach(line => {
        patterns.forEach(pattern => {
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
            if (match[1] && match[1].length > 3) {
              potentialTopics.add(match[1].trim());
            }
          });
        });
      });
      
      // If we don't find enough topics with pattern matching,
      // fallback to some simulated "important" phrases
      if (potentialTopics.size < 5) {
        // Extract nouns that appear frequently
        const words = transcript.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
        const wordFrequency: Record<string, number> = {};
        
        words.forEach(word => {
          if (!wordFrequency[word]) {
            wordFrequency[word] = 0;
          }
          wordFrequency[word]++;
        });
        
        // Get top words by frequency
        const topWords = Object.entries(wordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(entry => entry[0]);
          
        // Add them to potential topics
        topWords.forEach(word => potentialTopics.add(word.charAt(0).toUpperCase() + word.slice(1)));
      }
      
      // Select 5-10 topics
      const topics = [...potentialTopics].slice(0, Math.min(10, Math.max(5, potentialTopics.size)));
      
      console.log('Extracted topics:', topics);
      resolve(topics);
    }, 1500); // Simulate processing time
  });
};

// Enhanced mock function to generate links for topics with more reliable URLs
const mockFindLinksForTopics = (topics: string[]): Promise<ProcessedTopic[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processedTopics: ProcessedTopic[] = topics.map(topic => {
        // Generate 1-2 simulated links per topic
        const linkCount = Math.floor(Math.random() * 2) + 1;
        const links = [];
        
        const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
        
        if (topic.toLowerCase().includes('book') || topic.toLowerCase().includes('author')) {
          // Create a reliable book publisher link
          links.push({
            url: `https://www.penguinrandomhouse.com/books/search/book-title-${topicSlug}/`,
            title: `${topic}`,
            description: `The official information page for "${topic}", including author information, reviews, and where to purchase.`,
          });
        } else if (topic.toLowerCase().includes('university') || topic.toLowerCase().includes('college')) {
          // Create a reliable educational institution link
          const domain = topic.toLowerCase().includes('harvard') ? 'harvard.edu' : 
                        topic.toLowerCase().includes('stanford') ? 'stanford.edu' :
                        topic.toLowerCase().includes('mit') ? 'mit.edu' : 'edu';
          links.push({
            url: `https://www.${domain}/`,
            title: `${topic}`,
            description: `The official website of ${topic}, providing information about programs, faculty, and resources.`,
          });
        } else if (topic.toLowerCase().includes('newsletter')) {
          // Create a reliable newsletter link
          links.push({
            url: `https://www.substack.com/${topicSlug}`,
            title: `${topic}`,
            description: `Subscribe to ${topic}, delivering the latest insights and information to your inbox.`,
          });
        } else {
          // Create a generic but reliable link for other topics
          const reliableDomains = [
            { domain: 'forbes.com', path: 'business' },
            { domain: 'hbr.org', path: 'topic' },
            { domain: 'mckinsey.com', path: 'industries' },
            { domain: 'techcrunch.com', path: 'category' }
          ];
          
          const randomDomain = reliableDomains[Math.floor(Math.random() * reliableDomains.length)];
          
          links.push({
            url: `https://www.${randomDomain.domain}/${randomDomain.path}/${topicSlug}`,
            title: `${topic}`,
            description: `Learn more about ${topic} from this authoritative source, including detailed information and resources.`,
          });
        }
        
        return {
          topic,
          links,
        };
      });
      
      resolve(processedTopics);
    }, 1500); // Simulate processing time
  });
};
