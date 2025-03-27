
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
  const domainsToAvoidStr = domainsToAvoid.length > 0 
    ? `Avoid these domains: ${domainsToAvoid.join(', ')}.` 
    : '';

  return `Find links for: ${JSON.stringify(topicsFormatted)}. ${domainsToAvoidStr}`;
};

/**
 * Build a follow-up message to request quality links
 * 
 * @param domainsToAvoid Domains to exclude from results
 * @returns Follow-up message string
 */
export const buildFollowUpMessage = (domainsToAvoid: string[] = []): string => {
  return `Provide links for the topics in JSON format. ${domainsToAvoid.length > 0 ? `Avoid: ${domainsToAvoid.join(', ')}.` : ''}`;
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
