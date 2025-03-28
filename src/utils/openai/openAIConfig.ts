
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

  return `Find high-quality links for the given topics. For EACH topic, you MUST provide at least 2-3 different links from varied sources. 
  You MUST find at least one link for EVERY topic provided, without exception.
  Each link should include a clean, accurate description of the page content in plain text (no markdown).
  Each description should be one clear, concise sentence that summarizes what the user will find on the page.
  When possible, include the actual meta description from the page rather than generating one.
  ${domainsToAvoidStr}`;
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
  
  return `Find links for: ${topicsJson}. You MUST find at least 1-3 different links for EACH topic without exception. 
  For each topic, provide at least 2-3 different links from varied sources.
  Provide clean, concise descriptions in plain text (no markdown). Focus on extracting the actual page description 
  that clearly explains what information the page contains.
  ${domainsToAvoid.length > 0 ? `Avoid these domains: ${domainsToAvoid.join(', ')}.` : ''}`;
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
