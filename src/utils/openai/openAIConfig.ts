
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

  return `Search the web to find high-quality links for each topic. Provide 2-3 specific links with full URL, title, and a brief description for each.
${domainsToAvoidStr}
Focus on authoritative sources that directly address the topic.`;
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

  return `Find 2-3 high-quality links for each of these topics: ${JSON.stringify(topicsFormatted)}. 
${domainsToAvoidStr}
For each link, include the full URL, a clear title, and a brief description explaining its relevance.`;
};

/**
 * Build a follow-up message to request quality links
 * 
 * @param domainsToAvoid Domains to exclude from results
 * @returns Follow-up message string
 */
export const buildFollowUpMessage = (domainsToAvoid: string[] = []): string => {
  return `Based on your search results, provide 2-3 high-quality links for each topic in JSON format. ${domainsToAvoid.length > 0 ? `Avoid links from: ${domainsToAvoid.join(', ')}.` : ''}`;
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
