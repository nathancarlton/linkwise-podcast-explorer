
import axios from 'axios';
import { ProcessedTopic } from '../types';
import { validateUrl } from './urlUtils';
import { mockProcessTranscript, mockFindLinksForTopics } from './mockTranscriptData';

// Process transcript and extract topics using OpenAI
export const processTranscript = async (transcript: string, apiKey?: string): Promise<{ topics: string[], usedMockData: boolean }> => {
  console.log('Processing transcript of length:', transcript.length);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No valid OpenAI API key provided, using mock data');
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
      const topicsWithContext = parsedContent.topics || [];
      
      if (!Array.isArray(topicsWithContext) || topicsWithContext.length === 0) {
        console.error('No topics found in API response');
        const mockTopics = await mockProcessTranscript(transcript);
        return { topics: mockTopics, usedMockData: true };
      }
      
      // Extract just the topic names for compatibility with existing code
      const topics = topicsWithContext.map(item => item.topic);
      
      console.log('Extracted topics with context:', topicsWithContext);
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

// Find links for the extracted topics using OpenAI and search APIs
export const findLinksForTopics = async (topics: string[], apiKey?: string): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No valid OpenAI API key provided, using mock data');
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
            context: topic.context,
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
