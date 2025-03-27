
import { ProcessedTopic } from '../types';

/**
 * Helper function to extract links from text response when JSON parsing fails
 * 
 * @param text Text content to extract links from
 * @param topics List of topics to match with extracted links
 * @returns Array of ProcessedTopic objects with extracted links
 */
export const extractLinksFromText = (text: string, topics: string[]): ProcessedTopic[] => {
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
