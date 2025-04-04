
import { findLinksForTopics } from './linkFinder';
import { processTranscript } from './transcriptProcessor';
import { v4 as uuidv4 } from 'uuid';
import { LinkItem, ProcessedTopic, SearchApiType } from '../types';

/**
 * Test utility to isolate and test the link search functionality
 * 
 * @param topics - Array of topics to search links for
 * @param apiKey - API key
 * @param searchApi - Which search API to use
 * @returns Promise resolving to an array of LinkItem objects
 */
export const testLinkSearch = async (
  topics: string[],
  apiKey?: string,
  searchApi: SearchApiType = SearchApiType.OpenAI
): Promise<LinkItem[]> => {
  console.log('Testing link search for topics:', topics);
  console.log('Using search API:', searchApi);
  
  try {
    if (!apiKey) {
      console.error('No API key provided for testing');
      return [];
    }

    // Call findLinksForTopics directly with the provided topics
    const { processedTopics } = await findLinksForTopics(topics, apiKey, [], searchApi);
    
    console.log('Found processed topics:', processedTopics);
    
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
 * @param apiKey - API key
 * @param searchApi - Which search API to use
 * @returns Promise resolving to an array of LinkItem objects
 */
export const testFullProcess = async (
  transcript: string,
  apiKey?: string,
  searchApi: SearchApiType = SearchApiType.OpenAI
): Promise<{
  topics: string[],
  links: LinkItem[]
}> => {
  console.log('Testing full process with transcript length:', transcript.length);
  console.log('Using search API:', searchApi);
  
  try {
    if (!apiKey) {
      console.error('No API key provided for testing');
      return { topics: [], links: [] };
    }

    // First extract topics from the transcript
    const { topics } = await processTranscript(transcript, apiKey);
    
    console.log('Extracted topics:', topics);
    
    if (topics.length === 0) {
      console.warn('No topics were extracted from the transcript');
      return { topics: [], links: [] };
    }
    
    // Then find links for those topics
    const { processedTopics } = await findLinksForTopics(topics, apiKey, [], searchApi);
    
    console.log('Found processed topics:', processedTopics);
    
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
      links
    };
  } catch (error) {
    console.error('Error in full process test:', error);
    return {
      topics: [],
      links: []
    };
  }
};
