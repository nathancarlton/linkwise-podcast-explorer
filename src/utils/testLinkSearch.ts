
import { findLinksForTopics, processTranscript } from './transcriptAPI';
import { v4 as uuidv4 } from 'uuid';
import { LinkItem, ProcessedTopic } from '../types';

/**
 * Test utility to isolate and test the link search functionality
 * 
 * @param topics - Array of topics to search links for
 * @param apiKey - OpenAI API key
 * @param forceBypassCache - Flag to bypass cache (true by default)
 * @returns Promise resolving to an array of LinkItem objects
 */
export const testLinkSearch = async (
  topics: string[],
  apiKey?: string,
  forceBypassCache: boolean = true
): Promise<LinkItem[]> => {
  console.log('Testing link search for topics:', topics);
  
  try {
    // Call findLinksForTopics directly with the provided topics
    const { processedTopics, usedMockData } = await findLinksForTopics(topics, apiKey);
    
    console.log('Found processed topics:', processedTopics);
    console.log('Used mock data:', usedMockData);
    
    // Convert ProcessedTopic[] to LinkItem[] for easier viewing
    const links: LinkItem[] = [];
    
    processedTopics.forEach(topic => {
      if (topic.links && Array.isArray(topic.links)) {
        topic.links.forEach(link => {
          links.push({
            id: uuidv4(),
            topic: topic.topic,
            title: link.title,
            url: link.url,
            description: link.description,
            context: topic.context,
            checked: true
          });
        });
      }
    });
    
    console.log('Total links found:', links.length);
    return links;
  } catch (error) {
    console.error('Error testing link search:', error);
    return [];
  }
};

/**
 * Test utility to run the full process from transcript to links
 * 
 * @param transcript - Transcript text to process
 * @param apiKey - OpenAI API key
 * @param forceBypassCache - Flag to bypass cache (true by default)
 * @returns Promise resolving to an array of LinkItem objects
 */
export const testFullProcess = async (
  transcript: string,
  apiKey?: string,
  forceBypassCache: boolean = true
): Promise<{
  topics: string[],
  links: LinkItem[],
  usedMockData: boolean
}> => {
  console.log('Testing full process with transcript length:', transcript.length);
  
  try {
    // First extract topics from the transcript
    const { topics, usedMockData: usedMockForTopics } = await processTranscript(transcript, apiKey);
    
    console.log('Extracted topics:', topics);
    console.log('Used mock data for topics:', usedMockForTopics);
    
    // Then find links for those topics
    const { processedTopics, usedMockData: usedMockForLinks } = await findLinksForTopics(topics, apiKey);
    
    console.log('Found processed topics:', processedTopics);
    console.log('Used mock data for links:', usedMockForLinks);
    
    // Convert ProcessedTopic[] to LinkItem[] for easier viewing
    const links: LinkItem[] = [];
    
    processedTopics.forEach(topic => {
      if (topic.links && Array.isArray(topic.links)) {
        topic.links.forEach(link => {
          links.push({
            id: uuidv4(),
            topic: topic.topic,
            title: link.title,
            url: link.url,
            description: link.description,
            context: topic.context,
            checked: true
          });
        });
      }
    });
    
    console.log('Total links found:', links.length);
    
    // Return all the data for inspection
    return {
      topics,
      links,
      usedMockData: usedMockForTopics || usedMockForLinks
    };
  } catch (error) {
    console.error('Error in full process test:', error);
    return {
      topics: [],
      links: [],
      usedMockData: true
    };
  }
};
