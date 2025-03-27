
import { ProcessedTopic } from '../types';
import { makeInitialRequest } from './openai/openAIRequests';
import { buildUserPrompt } from './openai/openAIConfig';

/**
 * Use OpenAI to find links for topics
 * 
 * @param topics Array of topics to find links for
 * @param apiKey OpenAI API key
 * @param domainsToAvoid Domains to exclude from results
 * @returns Promise resolving to processed topics with links
 */
export const findLinksWithOpenAI = async (
  topics: any[],
  apiKey: string,
  domainsToAvoid: string[] = []
): Promise<{ processedTopics: ProcessedTopic[], usedMockData: boolean }> => {
  console.log('Using OpenAI to find links for topics:', topics);
  
  try {
    // Format topics for the prompt
    const topicsArray = Array.isArray(topics) 
      ? topics 
      : [topics];
    
    const topicsFormatted = topicsArray.map(t => {
      if (typeof t === 'string') {
        return { topic: t };
      }
      return t;
    });
    
    console.log('Formatted topics:', topicsFormatted);
    
    // Build the user prompt for OpenAI
    const prompt = buildUserPrompt(topicsFormatted, domainsToAvoid);
    console.log('Sending request to OpenAI with web_search tool');
    
    // Make the initial request to OpenAI API
    const data = await makeInitialRequest(apiKey, prompt, domainsToAvoid);
    
    console.log('Received response from OpenAI:', data);
    
    if (!data || !data.output) {
      console.error('Invalid response format from OpenAI API:', data);
      return { processedTopics: [], usedMockData: false };
    }
    
    // Process the response and extract links
    const processedTopics: ProcessedTopic[] = [];
    
    // Map topics to their processed results
    const topicMap = new Map<string, ProcessedTopic>();
    topicsFormatted.forEach(t => {
      topicMap.set(t.topic.toLowerCase(), {
        topic: t.topic,
        context: t.context || '',
        links: []
      });
    });
    
    // Extract message content from output
    let fullText = '';
    let annotations: any[] = [];
    
    // Find message outputs in the response
    for (const output of data.output) {
      if (output.type === 'message' && output.content && Array.isArray(output.content)) {
        for (const contentItem of output.content) {
          // Check for annotations which contain the URLs
          if (contentItem.annotations && Array.isArray(contentItem.annotations)) {
            annotations = contentItem.annotations;
            fullText = contentItem.text || '';
            console.log('Found annotations:', annotations);
          }
        }
      }
    }
    
    // Process the full text to identify topic sections
    const topicSections: { [key: string]: { startIndex: number, endIndex: number } } = {};
    
    // Create a regex pattern for finding all topic headers in the text
    const allTopicsPattern = topicsFormatted.map(t => t.topic).join('|');
    const topicRegex = new RegExp(`(${allTopicsPattern})`, 'gi');
    
    // Find all topic mentions in the text
    let match;
    while ((match = topicRegex.exec(fullText)) !== null) {
      const matchedTopic = match[0].toLowerCase();
      const startIndex = match.index;
      
      // Find next topic mention or end of text
      topicRegex.lastIndex = startIndex + matchedTopic.length;
      const nextMatch = topicRegex.exec(fullText);
      const endIndex = nextMatch ? nextMatch.index : fullText.length;
      
      // Reset regex to look for next occurrence from the beginning
      if (nextMatch) topicRegex.lastIndex = 0;
      
      // Only add if topic is in our list
      for (const [topicKey] of topicMap.entries()) {
        if (matchedTopic.includes(topicKey)) {
          topicSections[topicKey] = {
            startIndex,
            endIndex
          };
          break;
        }
      }
    }
    
    // If no sections found (e.g., for single topic), use the entire text
    if (Object.keys(topicSections).length === 0 && topicMap.size > 0) {
      const firstTopic = topicsFormatted[0].topic.toLowerCase();
      topicSections[firstTopic] = { startIndex: 0, endIndex: fullText.length };
    }
    
    // Process annotations (URLs) and assign to topics based on position in text
    for (const annotation of annotations) {
      if (annotation.type === 'url_citation' && annotation.url) {
        const url = annotation.url;
        let title = annotation.title || '';
        
        // If no title, try to extract from URL
        if (!title) {
          try {
            const urlObj = new URL(url);
            title = urlObj.hostname.replace('www.', '');
          } catch (e) {
            title = 'Link';
          }
        }
        
        // Find which topic section this link belongs to
        let assignedTopic: ProcessedTopic | null = null;
        
        for (const [topicKey, section] of Object.entries(topicSections)) {
          // Check if annotation falls within a topic section
          if (annotation.start_index >= section.startIndex && annotation.start_index < section.endIndex) {
            const topic = topicMap.get(topicKey);
            if (topic) {
              assignedTopic = topic;
              break;
            }
          }
        }
        
        // If no topic found by position, try to match by content
        if (!assignedTopic) {
          // Extract surrounding text for context
          const startIndex = Math.max(0, annotation.start_index - 100);
          const endIndex = Math.min(fullText.length, annotation.end_index + 100);
          const surroundingText = fullText.substring(startIndex, endIndex).toLowerCase();
          
          for (const [topicKey, topic] of topicMap.entries()) {
            if (surroundingText.includes(topicKey)) {
              assignedTopic = topic;
              break;
            }
          }
          
          // If still no match, assign to first topic as fallback
          if (!assignedTopic && topicMap.size > 0) {
            assignedTopic = topicMap.values().next().value;
          }
        }
        
        // Extract description from surrounding text
        const startIndex = Math.max(0, annotation.start_index - 100);
        const endIndex = Math.min(fullText.length, annotation.end_index + 100);
        let description = fullText.substring(startIndex, endIndex).trim();
        
        // Shorten description if too long
        if (description.length > 200) {
          description = description.substring(0, 197) + '...';
        }
        
        // Add the link to the assigned topic
        if (assignedTopic) {
          assignedTopic.links.push({
            url,
            title,
            description
          });
        }
      }
    }
    
    // Add topics with links to processed topics
    for (const topicData of topicMap.values()) {
      // Only add topics with links
      if (topicData.links.length > 0) {
        processedTopics.push(topicData);
      }
    }
    
    // If some topics have no links, try to process the text manually
    if (processedTopics.length < topicsFormatted.length) {
      const sections = fullText.split(/\*\*\d+\.\s|\n\n\*\*|\n\*\*/); // Split by section headers
      
      for (const section of sections) {
        if (!section.trim()) continue;
        
        // Try to find a topic match for this section
        for (const [topicKey, topicData] of topicMap.entries()) {
          // Skip if this topic already has links
          if (topicData.links.length > 0) continue;
          
          if (section.toLowerCase().includes(topicKey)) {
            // Look for URL patterns in text
            const urlRegex = /https?:\/\/[^\s)]+/g;
            const foundUrls = section.match(urlRegex);
            
            if (foundUrls && foundUrls.length > 0) {
              for (const url of foundUrls) {
                // Create a title from the URL
                let title = '';
                try {
                  const urlObj = new URL(url);
                  title = urlObj.hostname.replace('www.', '');
                } catch (e) {
                  title = 'Link';
                }
                
                // Add link to this topic
                topicData.links.push({
                  url,
                  title,
                  description: section.substring(0, 200) + (section.length > 200 ? '...' : '')
                });
              }
              
              // Add to processed topics if links were found
              if (topicData.links.length > 0 && !processedTopics.includes(topicData)) {
                processedTopics.push(topicData);
              }
            }
          }
        }
      }
    }
    
    console.log('Extracted links:', processedTopics);
    return { processedTopics, usedMockData: false };
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Export an empty function to satisfy imports
export const processAPIResponse = () => {};
