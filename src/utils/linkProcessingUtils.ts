
import { v4 as uuidv4 } from 'uuid';
import { LinkItem, ProcessedTopic, TopicItem } from '@/types';

/**
 * Converts processed topics from the API into link items for the UI
 * 
 * @param processedTopics - Topics with links from the API
 * @param topicItems - Current topic items in the UI
 * @returns Array of link items for the UI
 */
export const processTopicsToLinkItems = (
  processedTopics: ProcessedTopic[], 
  topicItems: TopicItem[]
): LinkItem[] => {
  const linkItems: LinkItem[] = [];
  
  if (!processedTopics || !Array.isArray(processedTopics)) {
    console.error('Invalid processedTopics:', processedTopics);
    return [];
  }
  
  processedTopics.forEach((processedTopic: ProcessedTopic) => {
    // Skip if topic is undefined or links array is missing
    if (!processedTopic || !processedTopic.links || !Array.isArray(processedTopic.links)) {
      console.warn('Invalid topic object:', processedTopic);
      return;
    }
    
    const topicName = processedTopic.topic || 'Unknown Topic';
    const topicContext = processedTopic.context;
    
    processedTopic.links.forEach(link => {
      if (!link) {
        console.warn('Invalid link object, skipping');
        return;
      }
      
      console.log(`Adding link: ${link.title} - ${link.url}`);
      
      // Clean up title - remove redundant topic name from beginning of title
      let title = link.title || 'Untitled Link';
      
      // Check if title starts with the topic name
      if (title.toLowerCase() === topicName.toLowerCase() || 
          title.toLowerCase().startsWith(topicName.toLowerCase() + ' - ') || 
          title.toLowerCase().startsWith(topicName.toLowerCase() + ': ')) {
        // Remove topic name and any separator (like " - " or ": ")
        title = title.substring(topicName.length).replace(/^[\s-:]+/, '').trim();
      }
      
      // If title became empty after cleanup, use the original
      if (!title.trim()) {
        title = link.title || 'Untitled Link';
      }
      
      // Check if topic is enabled
      const topicEnabled = topicItems.find(t => t.topic === topicName)?.checked ?? true;
      
      linkItems.push({
        id: uuidv4(),
        topic: topicName,
        url: link.url || '#',
        title: title,
        context: topicContext,
        description: link.description || 'No description available',
        checked: topicEnabled, // Default to checked if topic is enabled
      });
    });
  });
  
  console.log(`Created ${linkItems.length} link items total`);
  return linkItems;
};
