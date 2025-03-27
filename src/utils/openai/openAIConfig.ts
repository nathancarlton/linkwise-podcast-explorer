
/**
 * Configuration and setup for OpenAI API requests
 */

/**
 * Build a system prompt for finding high-quality links
 * 
 * @param domainsToAvoid Domains to exclude from results
 * @returns System prompt string
 */
export const buildSystemPrompt = (domainsToAvoid: string[] = []): string => {
  const domainsToAvoidStr = domainsToAvoid.length > 0 
    ? `Avoid linking to these domains: ${domainsToAvoid.join(', ')}.` 
    : '';

  return `You are an assistant that finds high-quality, specific links for topics mentioned in podcasts.

Your task is to search for reliable, authoritative sources related to each topic and provide:
1. Only links that currently exist and are accessible
2. Content from established publications and trustworthy sources
3. Specific pages that directly address the topic (not just homepages)

For books, find official publisher or author pages.
${domainsToAvoidStr}

Use the search_web function to find information, then format your final response as a JSON object.`;
};

/**
 * Build a user prompt for finding links for topics
 * 
 * @param topicsFormatted Formatted topics for the prompt
 * @param domainsToAvoid Domains to exclude from results
 * @returns User prompt string
 */
export const buildUserPrompt = (
  topicsFormatted: any[],
  domainsToAvoid: string[] = []
): string => {
  const domainsToAvoidStr = domainsToAvoid.length > 0 
    ? `Avoid linking to these domains: ${domainsToAvoid.join(', ')}.` 
    : '';

  return `Find specific, high-quality links for these podcast topics: ${JSON.stringify(topicsFormatted)}. 
    
For each topic, provide 2-3 links to SPECIFIC SOURCES that address the exact context of the topic.
Focus on established publications and authoritative organizations.

For any books mentioned, find their publisher pages or author websites.
${domainsToAvoidStr}

For each link, include:
- The full URL (must be real and working)
- A clear title
- A brief description explaining the relevance to the topic`;
};

/**
 * Build a follow-up message to request quality links
 * 
 * @param domainsToAvoid Domains to exclude from results
 * @returns Follow-up message string
 */
export const buildFollowUpMessage = (domainsToAvoid: string[] = []): string => {
  return `Based on the search results, please provide me with 2-3 highly relevant links for each topic in the JSON format requested. Remember to avoid using links from: ${domainsToAvoid.join(', ')}.

MOST IMPORTANT: Only include links that are likely to be valid and accessible. Focus on established websites and publications.`;
};

/**
 * Get the headers for OpenAI API requests
 * 
 * @param apiKey OpenAI API key
 * @returns Headers object
 */
export const getOpenAIHeaders = (apiKey: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
};
