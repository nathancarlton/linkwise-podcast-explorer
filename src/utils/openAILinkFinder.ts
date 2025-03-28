
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
      topicMap.set(t.topic.toLowerCase().replace(/,$/, '').trim(), {
        topic: t.topic.replace(/,$/, '').trim(),
        context: t.context || '',
        links: []
      });
    });
    
    // Used to track already used URLs to prevent duplicates across all topics
    const usedUrls = new Set<string>();
    
    // Find message output in the response
    let messageContent = null;
    
    // Find message outputs in the response
    for (const output of data.output) {
      if (output.type === 'message' && output.content && Array.isArray(output.content)) {
        for (const contentItem of output.content) {
          if (contentItem.text) {
            messageContent = contentItem;
            break;
          }
        }
      }
    }
    
    if (!messageContent) {
      console.log('No message content found in the response');
      return { processedTopics: [], usedMockData: false };
    }
    
    const fullText = messageContent.text || '';
    const annotations = messageContent.annotations || [];
    
    console.log('Found annotations:', annotations);
    
    // If we have annotations, extract links for each topic
    if (annotations && annotations.length > 0) {
      // First, try to find topic sections in the text
      const topicSections: { [key: string]: { startIndex: number, endIndex: number } } = {};
      
      // Create a simple parser to identify topic sections
      const lines = fullText.split('\n');
      let currentTopic = '';
      let sectionStart = 0;
      
      // Look for topic headers in the text using various patterns
      const topicRegex = /\*\*(.*?):\*\*|\*\*\d+\.\s*(.*?)\*\*|^\d+\.\s*(.*?):|^\*\*(.*?)\*\*:|^([A-Za-z\s]+):/m;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(topicRegex);
        
        if (match) {
          // End previous section if any
          if (currentTopic) {
            topicSections[currentTopic.toLowerCase()] = {
              startIndex: sectionStart,
              endIndex: fullText.indexOf(line, sectionStart)
            };
          }
          
          // Extract topic name (could be in different capture groups)
          currentTopic = (match[1] || match[2] || match[3] || match[4] || match[5]).trim();
          sectionStart = fullText.indexOf(line);
          
          // Try to match with our topics
          for (const [topicKey, topicData] of topicMap.entries()) {
            if (currentTopic.toLowerCase().includes(topicKey.toLowerCase()) || 
                topicKey.toLowerCase().includes(currentTopic.toLowerCase())) {
              currentTopic = topicData.topic; // Use our exact topic name
              break;
            }
          }
        }
      }
      
      // End the last section
      if (currentTopic) {
        topicSections[currentTopic.toLowerCase()] = {
          startIndex: sectionStart,
          endIndex: fullText.length
        };
      }
      
      // If no sections found, try another approach with topic keywords
      if (Object.keys(topicSections).length === 0) {
        for (const topic of topicsFormatted) {
          const topicKeyword = topic.topic.toLowerCase().replace(/,$/, '').trim();
          const index = fullText.toLowerCase().indexOf(topicKeyword);
          
          if (index !== -1) {
            const nextTopicIndex = findNextTopicIndex(fullText, index + topicKeyword.length, topicsFormatted);
            
            topicSections[topicKeyword] = {
              startIndex: index,
              endIndex: nextTopicIndex !== -1 ? nextTopicIndex : fullText.length
            };
          }
        }
      }
      
      // Process annotations and assign to topics
      for (const annotation of annotations) {
        if (annotation.type === 'url_citation' && annotation.url) {
          // Extract annotation information
          const url = annotation.url;
          
          // Skip duplicate URLs across all topics
          if (usedUrls.has(url)) {
            continue;
          }
          
          // Get title from annotation metadata
          const title = annotation.title || extractTitleFromUrl(url);
          
          // Find which topic this annotation belongs to
          let foundTopic = null;
          
          // Try to match annotation with a topic section
          for (const [topicKey, section] of Object.entries(topicSections)) {
            if (annotation.start_index >= section.startIndex && annotation.start_index < section.endIndex) {
              // Find the matching topic in our map
              for (const [mapKey, topicData] of topicMap.entries()) {
                if (mapKey.includes(topicKey) || topicKey.includes(mapKey)) {
                  foundTopic = topicData;
                  break;
                }
              }
              
              if (foundTopic) break;
            }
          }
          
          // If no topic found by position, try to match by surrounding text
          if (!foundTopic) {
            const surroundingTextStart = Math.max(0, annotation.start_index - 200);
            const surroundingTextEnd = Math.min(fullText.length, annotation.end_index + 200);
            const surroundingText = fullText.substring(surroundingTextStart, surroundingTextEnd).toLowerCase();
            
            for (const [topicKey, topicData] of topicMap.entries()) {
              if (surroundingText.includes(topicKey.toLowerCase())) {
                foundTopic = topicData;
                break;
              }
            }
          }
          
          // If still no topic found, assign to the first topic as fallback
          if (!foundTopic && topicMap.size > 0) {
            foundTopic = topicMap.values().next().value;
          }
          
          // Extract description from the annotation
          let description = "";
          
          // Try to get description directly from the citation text
          if (annotation.text) {
            // Extract plain text description from surrounding context
            const contextStart = Math.max(0, annotation.start_index - 100);
            const contextEnd = Math.min(fullText.length, annotation.end_index + 150);
            const context = fullText.substring(contextStart, contextEnd);
            
            // Look for a sentence fragment containing a description
            // Try to find a standalone sentence before or after the URL
            const sentences = context.split(/[.!?]\s+/);
            
            // Find the most relevant sentence that doesn't contain markdown
            for (const sentence of sentences) {
              if (
                !sentence.includes('http') && 
                !sentence.includes('](') && 
                sentence.length > 15 && 
                !sentence.includes('*') &&
                !sentence.match(/^\s*\d+\.\s*/)
              ) {
                description = sentence.trim();
                if (description) break;
              }
            }
            
            // Fallback: use the annotation text itself and clean it
            if (!description && annotation.text) {
              description = annotation.text.replace(/\[|\]|\(|\)|http\S+/g, '').trim();
            }
          }
          
          // If we couldn't extract a clean description, use site name as fallback
          if (!description || description.length < 10 || description.includes('[') || description.includes(']')) {
            description = `Information about ${title} from ${extractDomainFromUrl(url)}`;
          }
          
          // Add link to the found topic
          if (foundTopic) {
            // Mark this URL as used
            usedUrls.add(url);
            
            foundTopic.links.push({
              url,
              title,
              description
            });
          }
        }
      }
      
      // Collect topics with links
      for (const topicData of topicMap.values()) {
        if (topicData.links.length > 0) {
          processedTopics.push(topicData);
        } else {
          // For topics with no links, add a placeholder link
          const topicName = topicData.topic;
          const placeholderUrl = `https://www.google.com/search?q=${encodeURIComponent(topicName)}`;
          
          topicData.links.push({
            url: placeholderUrl,
            title: `Search for ${topicName}`,
            description: `No specific resource found. Search for information about ${topicName}.`
          });
          
          processedTopics.push(topicData);
        }
      }
    }
    
    // If no links found through annotations, try to extract from full text
    if (processedTopics.every(topic => topic.links.length === 0)) {
      // Simple URL extraction using regex
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const foundUrls = fullText.match(urlRegex) || [];
      
      if (foundUrls.length > 0) {
        // Try to assign URLs to topics based on proximity
        for (const url of foundUrls) {
          // Skip if this URL has already been used
          if (usedUrls.has(url)) {
            continue;
          }
          
          const urlIndex = fullText.indexOf(url);
          let closestTopic = '';
          let minDistance = Number.MAX_SAFE_INTEGER;
          
          // Find the closest topic mention to this URL
          for (const topic of topicsFormatted) {
            const topicKeyword = topic.topic.toLowerCase().replace(/,$/, '').trim();
            const topicIndex = fullText.toLowerCase().indexOf(topicKeyword);
            
            if (topicIndex !== -1) {
              const distance = Math.abs(urlIndex - topicIndex);
              if (distance < minDistance) {
                minDistance = distance;
                closestTopic = topic.topic.replace(/,$/, '').trim();
              }
            }
          }
          
          // If we found a topic, add the link
          if (closestTopic) {
            const topicData = [...topicMap.values()].find(t => 
              t.topic.toLowerCase() === closestTopic.toLowerCase()
            );
            
            if (topicData) {
              // Mark this URL as used
              usedUrls.add(url);
              
              // Find surrounding text for description
              const contextStart = Math.max(0, urlIndex - 100);
              const contextEnd = Math.min(fullText.length, urlIndex + url.length + 100);
              const context = fullText.substring(contextStart, contextEnd);
              
              let description = "";
              // Try to extract a sentence that might be a description
              const sentences = context.split(/[.!?]\s+/);
              for (const sentence of sentences) {
                if (!sentence.includes('http') && 
                    !sentence.includes('](') && 
                    sentence.length > 15 && 
                    !sentence.includes('*')) {
                  description = sentence.trim();
                  if (description) break;
                }
              }
              
              if (!description) {
                description = `Information about ${extractDomainFromUrl(url)}`;
              }
              
              topicData.links.push({
                url,
                title: extractTitleFromUrl(url),
                description
              });
              
              // Add to processed topics if not already there
              if (!processedTopics.includes(topicData)) {
                processedTopics.push(topicData);
              }
            }
          }
        }
      }
    }
    
    // For topics with no links, add a placeholder Google search link
    for (const [topicKey, topicData] of topicMap.entries()) {
      // Check if this topic is already in processedTopics
      const existingTopic = processedTopics.find(pt => pt.topic.toLowerCase() === topicData.topic.toLowerCase());
      
      if (!existingTopic) {
        // Topic not found in processed topics, add it with a placeholder link
        const placeholderUrl = `https://www.google.com/search?q=${encodeURIComponent(topicData.topic)}`;
        
        processedTopics.push({
          topic: topicData.topic,
          context: topicData.context || '',
          links: [{
            url: placeholderUrl,
            title: `Search for ${topicData.topic}`,
            description: `Information about ${topicData.topic}`
          }]
        });
      } else if (existingTopic.links.length === 0) {
        // Topic found but has no links, add a placeholder link
        const placeholderUrl = `https://www.google.com/search?q=${encodeURIComponent(existingTopic.topic)}`;
        
        existingTopic.links.push({
          url: placeholderUrl,
          title: `Search for ${existingTopic.topic}`,
          description: `Information about ${existingTopic.topic}`
        });
      }
    }
    
    console.log('Extracted links:', processedTopics);
    return { processedTopics, usedMockData: false };
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Helper function to find the index of the next topic in the text
function findNextTopicIndex(text: string, startIndex: number, topics: any[]): number {
  let minIndex = -1;
  
  for (const topic of topics) {
    const topicKeyword = topic.topic.toLowerCase().replace(/,$/, '').trim();
    const index = text.toLowerCase().indexOf(topicKeyword, startIndex);
    
    if (index !== -1 && (minIndex === -1 || index < minIndex)) {
      minIndex = index;
    }
  }
  
  return minIndex;
}

// Helper function to extract a title from a URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix and extract domain
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return 'Link';
  }
}

// Helper function to extract a domain from a URL
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return 'website';
  }
}

// Export an empty function to satisfy imports
export const processAPIResponse = () => {};
