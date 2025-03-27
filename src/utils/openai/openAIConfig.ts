
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

  return `Find high-quality links for the given topics. ${domainsToAvoidStr}`;
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
  const topicsJson = JSON.stringify(topicsFormatted);
  
  return `Find links for: ${topicsJson}. ${domainsToAvoid.length > 0 ? `Avoid these domains: ${domainsToAvoid.join(', ')}.` : ''}`;
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
