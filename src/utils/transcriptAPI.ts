
import axios from 'axios';
import { ProcessedTopic } from '../types';
import { validateUrl } from './urlUtils';
import { mockProcessTranscript, mockFindLinksForTopics } from './mockTranscriptData';

// Process transcript and extract topics using OpenAI
export const processTranscript = async (transcript: string, apiKey?: string): Promise<{ topics: string[], usedMockData: boolean }> => {
  console.log('Processing transcript of length:', transcript.length);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No API key or invalid API key provided, using mock data');
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

// Find links for the extracted topics using OpenAI
export const findLinksForTopics = async (topics: string[], apiKey?: string): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Finding links for topics:', topics);
  
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-') || apiKey.length < 20) {
    console.warn('No API key or invalid API key provided, using mock data');
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
