
import { ProcessedTopic } from '../types';

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
