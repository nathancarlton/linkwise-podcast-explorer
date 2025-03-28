
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

  return `Find REAL, existing high-quality links for the given topics. You MUST find at least ONE legitimate link for EVERY topic provided, without exception.
  For EACH topic, strive to provide 2-3 different links from varied sources if possible. 
  Links MUST be real, existing webpages. DO NOT hallucinate or fabricate URLs - only include links to real websites that exist.
  Each link MUST include a clean, accurate description of the page content in plain text (no markdown).
  Each description should be one clear, concise sentence that summarizes what the user will find on the page.
  
  IMPORTANT: If you absolutely cannot find a valid link for a topic, include a Google search URL for that topic.
  For example: "https://www.google.com/search?q=Topic+Name+Here"
  
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
  
  return `Find REAL, existing links for: ${topicsJson}. You MUST find at least ONE legitimate link for EVERY topic provided, without exception. 
  For each topic, strive to provide 2-3 different links from varied sources.
  Provide clean, concise descriptions in plain text (no markdown). Focus on extracting the actual page description 
  that clearly explains what information the page contains.
  
  Only provide links to REAL webpages. DO NOT hallucinate or fabricate URLs.
  
  CRITICAL: If you cannot find a real link for a topic, provide a fallback Google search URL for that topic.
  For example: "https://www.google.com/search?q=Topic+Name+Here"
  
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
