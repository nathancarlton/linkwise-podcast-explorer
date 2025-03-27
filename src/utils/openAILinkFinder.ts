
import { ProcessedTopic } from '../types';
import { makeInitialRequest, makeFollowUpRequest } from './openai/openAIRequests';
import { processAPIResponse } from './openai/openAIResponseProcessor';
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
    
    // Process the response from the Responses API
    if (!data || !data.output) {
      console.error('Invalid response format from OpenAI API:', data);
      return { processedTopics: [], usedMockData: false };
    }
    
    // Process output from the Responses API
    try {
      // Get the output messages
      const output = data.output;
      console.log('Processing OpenAI response');
      
      // Extract links from the content
      const processedTopics: ProcessedTopic[] = [];
      
      // Process each topic from our input
      for (const topic of topicsFormatted) {
        const topicName = topic.topic;
        const links = [];
        
        // Look for URLs in the response content
        for (const message of output) {
          if (message.content) {
            // Extract URLs with regex
            const urlRegex = /(https?:\/\/[^\s)">]+)/g;
            const urls = message.content.match(urlRegex) || [];
            
            for (const url of urls) {
              // Try to find a title near the URL
              const beforeUrl = message.content.split(url)[0];
              const afterUrl = message.content.split(url)[1];
              
              // Look for potential title in markdown link format [Title](URL)
              let title = '';
              const titleRegex = /\[([^\]]+)\]\([^\)]*$/;
              const titleMatch = beforeUrl.match(titleRegex);
              
              if (titleMatch) {
                title = titleMatch[1];
              } else {
                // Try to get title from surrounding text
                const lines = message.content.split('\n');
                for (const line of lines) {
                  if (line.includes(url)) {
                    // Take line before URL or part of line before URL as title
                    const lineParts = line.split(url);
                    if (lineParts[0] && lineParts[0].trim()) {
                      title = lineParts[0].trim();
                      // Remove markdown formatting if any
                      title = title.replace(/^\s*[\*\-\d\.]+\s*/, '').trim();
                      title = title.replace(/\[|\]|\(|\)/g, '').trim();
                      break;
                    }
                  }
                }
              }
              
              // If no title found, use domain name
              if (!title) {
                try {
                  const urlObj = new URL(url);
                  title = `${urlObj.hostname} - iPhone Prices`;
                } catch (e) {
                  title = 'iPhone Price Link';
                }
              }
              
              // Extract a description from text after the URL
              let description = '';
              if (afterUrl) {
                // Take up to 150 chars after URL as description
                description = afterUrl.substring(0, 150).trim();
                // Clean up description, remove markdown, etc.
                description = description.replace(/^\s*[\*\-\d\.]+\s*/, '').trim();
                description = description.replace(/^\)/, '').trim();
              }
              
              if (!description && beforeUrl) {
                // Try to get description from before the URL
                const lines = beforeUrl.split('\n');
                if (lines.length > 0) {
                  description = lines[lines.length - 1].trim();
                }
              }
              
              // If still no description, create a generic one
              if (!description) {
                description = `Information about ${topicName}`;
              }
              
              links.push({
                url,
                title: title || `Link about ${topicName}`,
                description: description
              });
            }
          }
        }
        
        // If we found links for this topic, add it to processed topics
        if (links.length > 0) {
          processedTopics.push({
            topic: topicName,
            context: topic.context || '',
            links
          });
        }
      }
      
      console.log('Extracted links:', processedTopics);
      return { processedTopics, usedMockData: false };
    } catch (error) {
      console.error('Error processing OpenAI output:', error);
      return { processedTopics: [], usedMockData: false };
    }
  } catch (error) {
    console.error('Error finding links with OpenAI:', error);
    return { processedTopics: [], usedMockData: false };
  }
};

// Re-export the processAPIResponse function
export { processAPIResponse };
